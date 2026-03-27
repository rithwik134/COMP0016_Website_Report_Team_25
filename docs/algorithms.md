# Algorithms

> [!DANGER]  
> need references

The core of the Carbon-Aware AI Agent is its **Spatio-Temporal Scheduler**, a high-performance C++ engine that solves a complex resource allocation problem to minimize the carbon footprint of AI workloads. To make the system accessible to AI engineers, the scheduler translates "natural" hardware specifications into the mathematical units serving as data to the DP engine, ensuring the final cost reflects real-world carbon emissions.

---

## The Scheduling Problem

Training and running large AI models consumes a massive amount of energy. However, these workloads often have inherent flexibility: they do not strictly need to run immediately, nor do they strictly need to run in a single location. By forecasting the carbon intensity of local energy grids, we can strategically route and pause work across different global data centers and time windows to take advantage of periods when the grid is "greenest" (e.g., when solar or wind generation is high).

However, fully exploiting this spatio-temporal flexibility presents significant algorithmic challenges:

1. **The Discontinuity Overhead:** Flexibility is not completely "free". Every time a compute cluster starts a new run, it must spend energy and time on operations that do not directly advance the mathematical task—such as spinning up the OS container, warming up the GPU, and transferring gigabytes of model weights into VRAM. If a generic scheduler fragments the job too much by constantly pausing and resuming to chase marginal carbon drops, these initialization overheads will rapidly negate any carbon benefits.
2. **Computational Hardness:** If we model this scheduling space continuously, allowing arbitrary workloads to shift smoothly across infinite fractions of time, the optimization becomes mathematically intractable (resembling a continuous non-linear knapsack problem with step-discontinuity penalties).

### Discretization and Formalization

To overcome the hardness of a continuous model while guaranteeing a globally optimal solution, we discretize the scheduling task. We model it as a constrained resource allocation problem over a discrete 2D surface of $m$ data center locations and $n$ time blocks. We also discretize the total requested workload into high-resolution uniform units (e.g., 10,000 levels). Because multi-day AI workloads are astronomically large, the rounding errors from this discretization are mathematically negligible, yet it transforms the continuous formulation into a deterministic state space solvable via **Dynamic Programming (DP)**.

To calculate the optimum, the scheduler relies on continuous external intelligence data streams for each location $k$ and time block $i$:

- **Carbon Intensity ($c_{k,i}$):** Forecasted gCO2/kWh.
- **Available Headroom ($h_{k,i}$):** The maximum physical compute capacity ($r_{k,i}$) minus the forecasted background load ($l_{k,i}$).

### The Objective Function

Minimize the total additional carbon cost incurred across all locations $k$ and time blocks $i$:

$$\text{Minimize } \sum_{k,i} [\text{Cost}_{k,i}(l_{k,i} + w_{k,i}) - \text{Cost}_{k,i}(l_{k,i})]$$

Where:

- $w_{k,i}$ is the workload allocated to location $k$ at time block $i$.
- $l_{k,i}$ is the existing background load.
- $\text{Cost}_{k,i}$ is a generic cost function ($w_{k,i} \times$ Carbon Intensity $c_{k,i} \times$ Energy Efficiency). One of the only mathematical assumptions the algorithm makes is that $\text{Cost}_{k,i}$ is **non-decreasing** with respect to load.

### Constraints

1. **Workload Completion**: $\sum_{k,i} w_{k,i} \ge W + (\text{starts}) \times P$
    - $W$ is the total required discrete work.
    - $\text{starts}$ is the number of times a location transitions from idle to active.
    - $P$ is the **Startup Penalty**. This deducts from the effective work to mathematically reflect the physical discontinuity overhead (e.g., loading weights into VRAM).
2. **Physical Bottleneck**: $w_{k,i} \le h_{k,i}$ (Allocation cannot exceed available headroom).
3. **Temporal Window**: All $w_{k,i}$ must fall between the earliest start and latest finish deadlines.

---

## The Spatio-Temporal DP Algorithm

To solve this efficiently across multiple data centers, the system employs a two-phase deterministic **Dynamic Programming (DP)** approach.

### Variables & Definitions

- **$n, m$**: Number of time blocks ($n$) and available data center locations ($m$).
- **$W$**: Total requested workload, discretized into "effective work" units.
- **$h_{k,i}$**: Maximum available headroom at location $k$, block $i$. We let $H_{max}$ be the maximum headroom across any block.
- **$P$**: Startup penalty for non-contiguous execution, deducted from effective work to account for initialization overhead (e.g., loading weights).
- **$\text{C}_{k,i}(w)$**: The marginal carbon cost to compute $w$ work at location $k$, block $i$, derived from $\text{Cost}_{k,i}(l_{k,i} + w) - \text{Cost}_{k,i}(l_{k,i})$.

### Phase 1: Per-Location Temporal Optimization

For each data center $k \in [1, m]$, the algorithm computes the minimum cost for *all possible* effective workload amounts $w \in [0, W]$ over the $n$ blocks.

Let $DP[i][w][s]$ be the minimum cost to achieve exactly $w$ effective work in the first $i$ blocks at location $k$, ending in state $s \in \{0, 1\}$:

- **$s = 0$ (Active)**: Work was allocated in block $i$ ($w_i > 0$).
- **$s = 1$ (Idle)**: No work was allocated in block $i$ ($w_i = 0$).

**Transitions:**
For each block $i \in [1, n]$ and accumulated work $w \in [0, W]$, we evaluate the following allocation choices $w_i$ (where $h_i$ and $\text{C}_i$ are shorthands for $h_{k,i}$ and $\text{C}_{k,i}$):

1. **Become or Remain Idle ($w_i = 0$)**:
   $$ DP[i][w][1] = \min(DP[i-1][w][0], \ DP[i-1][w][1]) $$

2. **Extend Active Run ($w_i > 0$, previously Active $s=0$)**:
   For $w_i \in [1, \min(h_i, W - w)]$:
   $$ DP[i][w + w_i][0] = \min \left( DP[i][w + w_i][0], \ DP[i-1][w][0] + \text{C}_i(w_i) \right) $$

3. **Start New Run ($w_i > 0$, previously Idle $s=1$)**:
   Incurs the startup penalty $P$. For $w_i \in [\max(1, P - w), \min(h_i, W + P - w)]$:
   $$ DP[i][w + w_i - P][0] = \min \left( DP[i][w + w_i - P][0], \ DP[i-1][w][1] + \text{C}_i(w_i) \right) $$

**Complexity**: Traversing $n$ blocks and $W$ states, while evaluating up to $H_{max}$ allocation choices per state, yields a time complexity of $\mathcal{O}(n \cdot W \cdot H_{max})$ per location. This nested traversal is heavily parallelized using **AVX-512 SIMD** intrinsics.

### Phase 2: Multi-Location Spatial Routing

Once the optimal temporal schedules are pre-computed for all locations, the results are merged using a **Multiple Choice Knapsack** algorithm to find the global spatial optimum.

Let $CostTable_k[x]$ be the minimal cost to process exactly $x$ work at location $k$, extracted as $\min(DP_k[n][x][0], DP_k[n][x][1])$.
Let $M[k][w]$ be the minimum cost to achieve exactly $w$ work distributed across the first $k$ locations.

**Transitions:**
We merge locations sequentially. For each location $k \in [1, m]$ and required total work $w \in [0, W]$:
$$ M[k][w] = \min_{0 \le x \le w} \left( M[k-1][w - x] + CostTable_k[x] \right) $$

**Complexity**: Merging $m$ locations for up to $W$ workload requires testing combinations of $w - x$ and $x$, leading to $\mathcal{O}(m \cdot W^2)$.

### Overall Algorithmic Complexity

By combining Phase 1 and Phase 2, the exact upper-bound time complexity for the complete scheduler is:
$$ \mathcal{O}\big(m \cdot W \cdot (n \cdot H_{max} + W)\big) $$

#### The Resolution Inversion
A unique property of this discretization strategy is the Inverse Scaling of Latency - the algorithm scales inversely with the size of the physical workload ($T_{work}$). 

Firstly, let's define the discretization constant (resolution) of our algorithm as $R$.
Then, let the size of a single discrete work unit be defined as $e_{work} = \frac{T_{work}}{R}$. 
Then $$ W = \frac{T_{work}}{e_{work}} = \frac{T_{work} \cdot R}{T_{work}} = R $$ Thus, after the discretization the workload amount is fixed.
The discrete search space per time block, $H_{max}$, is dictated by the physical capacity divided by the unit size: 
$$ H_{max} = \frac{\text{Capacity}}{e_{work}} = \frac{\text{Capacity} \cdot R}{T_{work}} $$

If we substitute $W = R$ and this definition of $H_{max}$ into the standard Phase 1 complexity of $\mathcal{O}(n \cdot W \cdot H_{max})$, the real computational complexity for the temporal optimization becomes:
$$ \mathcal{O}\left( \frac{n \cdot R^2 \cdot \text{Capacity}}{T_{work}} \right) $$

Consequently, as the physical workload ($T_{work}$) increases, the number of discrete allocation choices per time block actually decreases. This results in an algorithm that executes faster as the problem size scales, reaching its computational peak when the workload is largest.

#### The Performance Floor
While Phase 1 complexity scales inversely with workload, the system maintains a deterministic performance floor defined by Phase 2 (Spatial Routing). Because the resolution is fixed at $W = R$, the complexity of Phase 2 becomes $\mathcal{O}(m \cdot R^2)$. Since Phase 2 is bounded by this fixed resolution, its execution time remains constant regardless of the physical job size, acting as the primary bottleneck for massive, global-scale AI workloads. Both the inverse latency and plateau as workload increases is clearly visible on [this graph.](images/benchmarks/performance_comparison.png)


## Conclusion: Maneuverability vs. Resolution
There is an inherent trade-off between execution speed and scheduling maneuverability. As physical workload ($T_{work}$) increases, the step size of each discrete unit grows, slightly reducing the scheduler’s ability to precisely maneuver the workload into small, marginal carbon-intensity fluctuations. 

However, for astronomically large AI workloads, these "maneuverability" losses are statistically negligible. Furthermore, because maneuverability is strictly correlated with the Resolution ($R$), the system can be arbitrarily scaled to maintain high precision for any workload size, provided the underlying hardware supports the corresponding increase in the $\mathcal{O}(R^2)$ memory and compute requirements.

For details on the technical implementation of the DP engine, including **AVX-512 Vectorization** and asynchronous optimizations, please refer to the [Implementation](implementation.md#hardware-level-optimizations-simd) page.

For experiments and performance comparison using this algorithm, compared the Greenness software foundation SDK [1], please refer to [evaluation.md](evaluation.md#algorithmic-carbon-optimization-a-comparative-analysis-of-deterministic-dp-scheduling-vs-gsf-sdk).

## Carbon Intensity Forecasting

The forecasting algorithm is what serves carbon intensity predictions to the scheduler. The stages of its development and in-depth research into the prediction method can be found at the [Forecasting Model Research](research.md#forecasting-model-research) and [AI Research Journal](dev-journal.md) pages respectively. The production model, **RidgeFull**, is an enhanced Ridge regression — a linear model with L2 regularisation that prevents overfitting by penalising large coefficients [2]. It operates on 65 engineered input features spanning five groups: temporal patterns (Fourier harmonics encoding hour-of-day, day-of-week, and day-of-year cycles), horizon encoding (polynomial and logarithmic terms describing how far ahead the prediction is), recent carbon intensity statistics (rolling means, lags, and trends), weather conditions (temperature, wind speed, solar radiation, cloud cover, and pressure from the Open-Meteo API), and cross-group interaction terms that let the linear model capture non-linear relationships. The model uses **direct forecasting** — each of the 336 horizon steps (7 days at 30-minute resolution) is predicted independently from historical data, rather than recursively feeding predictions back as inputs, which avoids the error compounding that degraded more complex models in our experiments.

### References

[1] Green Software Foundation, "Carbon Aware SDK Documentation," GitHub, 2023. [Online]. Available: [https://github.com/Green-Software-Foundation/carbon-aware-sdk](https://github.com/Green-Software-Foundation/carbon-aware-sdk). [Accessed: Mar. 2026].<br>
[2] A. E. Hoerl and R. W. Kennard, "Ridge regression: Biased estimation for nonorthogonal problems," *Technometrics*, vol. 12, no. 1, pp. 55–67, Feb. 1970, doi: [10.1080/00401706.1970.10488634](https://doi.org/10.1080/00401706.1970.10488634).
---
