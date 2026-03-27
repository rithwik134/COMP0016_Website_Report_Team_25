# Possible Extensions

### 1. Load Estimation from Data Centre Cost Signals

The current scheduler treats each data centre as equally available, with no awareness of how heavily loaded a facility is at any given time. In practice, data centre load significantly affects both queueing delays and the true carbon cost of a workload — a heavily loaded facility may need to spin up less efficient backup generators or draw disproportionately from peaking plants.

Most cloud providers do not publicly expose real-time load metrics or forecasts. However, all three major providers — AWS, Azure, and GCP — expose programmatic pricing APIs that can serve as a proxy for load:

- **AWS** publishes spot price history via the `DescribeSpotPriceHistory` EC2 API. Spot prices rise with demand, making them a direct signal of facility utilisation.
- **Azure** exposes spot and on-demand rates through its unauthenticated Retail Prices REST API (`prices.azure.com/api/retail/prices`), with eviction rate data providing an additional load indicator.
- **GCP** lists per-region SKU pricing through the Cloud Billing Catalog API (`cloudbilling.googleapis.com`). Although GCP spot prices are set rather than auctioned, they still vary by region and instance family.

A future version of the Stats service could periodically poll these APIs to build a per-region load estimate — for example, by tracking the ratio of current spot price to on-demand price over time. This time series could then be fed into the forecasting model alongside carbon intensity and weather features, giving the scheduler a more realistic picture of where and when workloads can actually be placed.

### 2. Cost-Aware Scheduling with User-Configurable Carbon–Cost Trade-Off

Building on the cost data described above, the scheduling algorithm itself could be extended to optimise across two objectives: carbon intensity and monetary cost. Currently the DP scheduler minimises total carbon emissions; a natural extension is to let the user specify a preference weight between carbon and cost, for example via a slider in the UI ranging from "minimise carbon" to "minimise cost."

Concretely, the scheduler's objective function would become a weighted combination:

$$\text{objective}(s) = \alpha \cdot \text{carbon}(s) + (1 - \alpha) \cdot \text{cost}(s)$$

where $\alpha \in [0, 1]$ is the user's preference and $s$ is a candidate schedule. At $\alpha = 1$ the behaviour is identical to the current system; at $\alpha = 0$ the scheduler acts as a pure cost optimiser. Intermediate values let organisations balance sustainability commitments against budget constraints.

This would also enable the system to present an **estimated cost** for each proposed schedule, giving users a concrete financial figure alongside the carbon saving. The on-demand pricing APIs listed above provide sufficient data to compute this estimate: the scheduler already knows the instance type, region, and duration of each workload slot, so multiplying by the published rate yields a cost projection.

### 3. Parallel Computation of Schedules

Following the transition to hardware-specific workload descriptions, each job request now carries a deterministic `max_power` constraint, correlated directly to the requested GPU architecture and cluster size. Because a workload's instantaneous power draw cannot mathematically exceed this value, we can establish a pessimistic lower bound for remaining data center capacity across any given time horizon. This unlocks the potential for the parallel computation of multiple scheduling requests.

Instead of strictly serializing the Dynamic Programming (DP) engine, we can implement an optimistic concurrency model. Before a schedule is computed, we subtract its `max_power` from the total available capacity across its entire requested time window. If the remaining capacity minimum over that window is strictly greater than the `max_power` of the next request in the queue, we can safely compute both schedules in parallel, mathematically guaranteeing that their optimal placements will not collide and violate physical infrastructure constraints.

#### Benefits

This improvement fundamentally shifts the system's scalability profile. By leveraging our lock-free architecture and simply scaling the underlying thread pool, the system could handle dozens of simultaneous scheduling requests. This maximizes computational throughput and ensures the orchestrator remains responsive under enterprise-scale loads without compromising the strict constraints of the physical data centers.

#### Implementation

To implement this feature, the `SchedulingQueue` would still orchestrate incoming requests, but it would now maintain a global, thread-safe data structure tracking the pessimistic lower bound of capacity at each time interval.

When a request reaches the front of the queue, the system checks if the minimum capacity across its time window accommodates its `max_power`. If it does, the compute thread is dispatched immediately. Once the DP engine completes the optimization, the system performs a **reconciliation** step: it releases the pessimistic `max_power` lock across the full window and deducts the precise load only at the specifically scheduled time blocks. This reconciliation frees up space for subsequent requests.

To achieve the necessary performance, this global capacity state can be managed using a **Segment Tree with Lazy Propagation** (Interval-Add / Interval-Min). This structure allows the engine to deduct `max_power` over large time windows and query the minimum available capacity in $\mathcal{O}(\log n)$ time, where $n$ is the number of 5-minute blocks in the forecast horizon.

### 4. Tropical Algebraic Scheduling (Rolling Segment Trees)

The current scheduler is optimized for batch processing of fixed-length windows. A powerful extension would be to refactor the core engine into a **Rolling-Window Segment Tree** based on **Tropical Geometry** (specifically the $(\min, +)$-semiring). This shift from iterative Dynamic Programming to algebraic tree structures enables real-time, streaming updates and queries with logarithmic complexity.

#### Derivation from Constraints

The scheduling problem is defined by the objective of achieving $W$ effective work units while minimizing costs under the [Startup Penalty](algorithms.md#constraints) $P$. In a discrete time grid, we can model the system's state at any boundary as $s \in \{0, 1\}$, where $0$ is **Inactive** and $1$ is **Active**.

For a single time block $i$, we define the **Profile Matrix** $\mathcal{M}_i$ where $\mathcal{M}_i[u][v][w]$ is the minimum cost to transition from state $u$ to $v$ while performing exactly $w$ units of *effective* work. The constraints on $P$ are directly embedded into the matrix construction for each leaf:

- **Inactive to Active ($0 \to 1$):** Incurs the penalty. To achieve $w$ effective work, we must perform $w + P$ physical work. Thus, $\mathcal{M}_i[0][1][w] = \text{Cost}_i(w + P)$.
- **Active to Active ($1 \to 1$):** Continues the run. $\mathcal{M}_i[1][1][w] = \text{Cost}_i(w)$.
- **Ending in Inactive ($v = 0$):** Only possible if $w = 0$ (no work done). $\mathcal{M}_i[u][0][0] = 0$, and $\mathcal{M}_i[u][0][w] = \infty$ for $w > 0$.

By defining the composition of two adjacent matrices as a $(\min, +)$ convolution, we arrive at an associative operator:

$$
(\mathcal{M}_A \otimes \mathcal{M}_B)_{uv}(w) = \min_{k \in \{0,1\}} \min_{0 \le i \le w} \left(
\mathcal{M}_{A,uk}(i) + \mathcal{M}_{B,kv}(w-i) \right)
$$

Because this operation is associative, the entire scheduling problem—originally a linear recurrence—is lifted into a **Point Update Range Query (PURQ)** segment tree.

#### Implementation & Complexity

This algebraic refactoring fundamentally shifts the system's performance profile:

- **Iterative Segment Tree:** The system uses a non-recursive, array-based segment tree. A logical rolling window $[head, tail]$ is mapped modulo $N$ to the physical leaves. This allows the scheduler to "pop" the oldest forecast block ($head{++}$) and "push" a new one ($tail{++}$) in $O(\log N \cdot W^2)$ time by updating only the affected leaf and its ancestors.
- **Range Queries:** To find the optimal cost for any arbitrary window $[L, R]$, the tree identifies the $O(\log N)$ nodes covering the range and multiplies their matrices. The result is a single matrix representing the entire interval's cost curve, from which the answer for any $W$ is extracted in $O(1)$.
- **Transactional Batch Updates ($O(K + \log N)$):** When multiple blocks are modified (e.g., during a reservation), the tree can be updated in a single pass. By identifying all "dirty" leaves, sorting them, and propagating changes up the tree layer-by-layer, we avoid redundant recomputation of shared ancestors.
- **Path Reconstruction:** Finding the optimal schedule (the sequence of allocations) is achieved by backtracking through the tree. At each node, the engine identifies the intermediate state $k$ and the work-split $(i, w-i)$ that produced the optimal result, recursively descending to the leaves.

#### State Encoding and Incremental Efficiency

The most significant architectural advantage of this approach is that the Segment Tree **encodes the problem state** at every level of the temporal hierarchy. In the current iterative DP, every new scheduling request or data update (e.g., a change in forecast or a new reservation) requires a full linear re-traversal of the time horizon ($O(n)$). This leads to a massive amount of redundant computation, as the vast majority of the time-window remains unchanged between requests.

By contrast, the Segment Tree architecture ensures:

- **Zero Redundant Work:** Because each internal node stores the pre-computed **Profile Matrix** for its range, the system never re-solves the same sub-problem twice. A single update only invalidates the $O(\log N)$ nodes on the path to the root, leaving the rest of the pre-computed state intact.
- **Fast Schedule Generation:** Creating a new schedule for any arbitrary range $[L, R]$ becomes a simple tree query. Instead of running a fresh DP, the engine merely combines a small number of pre-existing matrices, making the system essentially "instantaneous" from a user perspective, regardless of the time-window's length.
- **Asynchronous Data Streams:** This efficiency allows the scheduler to ingest high-frequency data streams (e.g., real-time grid updates) without stalling. The system moves from being a "batch processor" that calculates everything from scratch to an incremental engine that maintains a globally optimal state at all times.

#### Theoretical Analysis & Complexity Scaling

This extension invites a significant leap in theoretical efficiency by exploiting the algebraic properties of the cost functions. The $(\min, +)$ convolution (or **Infimal Convolution**) is the tropical analog of the standard $(+, \times)$ convolution used in signal processing. While standard convolution is optimized from $O(W^2)$ to $O(W \log W)$ via the **Fast Fourier Transform (FFT)**, the $(\min, +)$ variant can be optimized to **$O(W)$** for convex sequences using the **Legendre-Fenchel Transform** (often referred to as the "Tropical Fourier Transform").

- **Final Complexity:** By combining the $O(\log N)$ tree traversal with an $O(W)$ convolution, the total scheduling complexity drops to **$O(\log N \cdot W)$**. This represents a fundamental shift from the current $O(n \cdot W^2)$ iterative DP.
- **Implications for High Resolution:** Current constraints limit the work resolution $W$ (e.g., 200–10,000) because of the quadratic cost of merges. Achieving linear complexity would allow the scheduler to scale to **massive resolutions ($W > 10^6$)**.
- **Maneuverability:** Higher resolutions enable the scheduler to exploit even the most minute, high-frequency fluctuations in carbon intensity that are currently "rounded away" during discretization. This would allow for the optimization of extremely complex, multi-resource AI workloads with sub-millisecond latencies, effectively moving the system from a batch scheduler to a real-time carbon-aware operating system kernel.
