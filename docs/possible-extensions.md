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

The current scheduler is optimized for batch processing of fixed-length windows. A powerful extension would be to refactor the core engine into a **Rolling-Window Segment Tree** based on **Tropical Geometry** (specifically the $(\min, +)$-semiring). This shift from iterative Dynamic Programming to algebraic tree structures would enable real-time, streaming updates and queries with logarithmic complexity.

#### Abstract Algebra Context

The scheduling problem with non-decreasing costs and startup penalties can be modeled as a path-finding problem in a specific algebraic structure. By defining a **Profile Matrix** ($\mathcal{M}$) where entries $f_{uv}(w)$ represent the minimum cost to perform work $w$ starting in state $u$ and ending in state $v$, we can treat the composition of time intervals as a matrix multiplication over the $(\min, +)$ semiring:

$$
\mathcal{M} = \begin{bmatrix} f_{00}(w) & f_{01}(w) \\ f_{10}(w) & f_{11}(w)
\end{bmatrix}
$$

The operation to merge two adjacent time intervals (Interval $A$ followed by Interval $B$) is equivalent to a $(\min, +)$ convolution:

$$
(A \otimes B)_{uv}(w) = \min_{k \in \{0,1\}} \min_{0 \le i \le w} \left(
A_{uk}(i) + B_{kv}(w-i) \right)
$$

Because this operation is associative, the entire time horizon can be represented as a Segment Tree where each node stores a Profile Matrix.

#### Complexity and Efficiency

- **Logarithmic Scaling:** In the current DP implementation, querying a range or updating a single block's load requires a linear pass over the time horizon ($O(n \cdot W^2)$). By lifting this logic into a Segment Tree, both Point Updates (modifying a forecast) and Range Queries (finding the optimal cost for any arbitrary window) are reduced to $O(\log n \cdot W^2)$, where $n$ is the number of blocks and $W$ is the work resolution.
- **Rolling Window Streaming:** Using a logical circular buffer mapped to the tree's leaves, the scheduler can handle an infinite stream of data by only updating the "tail" and "head" nodes as time progresses. This allows the system to maintain a fixed-size window (e.g., 56 days) with minimal recomputation latency.
- **Efficient Reservations:** The "Solve-Commit" pattern (reserving resources) can be optimized to $O((K + \log n) \cdot W^2)$, where $K$ is the number of blocks modified. This allows for transactional updates that only affect the necessary branches of the tree.

#### Theoretical Analysis

This extension invites further optimization through the study of the cost functions' algebraic properties. If the carbon cost functions are convex, the $(\min, +)$ convolution can be computed in $O(W)$ time using the **Legendre-Fenchel Transform** or the **SMAWK algorithm**. This would represent a significant leap in theoretical efficiency, effectively applying a $(\min, +)$-analog of the Fast Fourier Transform. This would make the scheduler capable of handling extremely high-resolution workloads that are currently computationally prohibitive.
