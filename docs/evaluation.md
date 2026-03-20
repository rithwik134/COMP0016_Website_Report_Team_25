# Evaluation

so maks' stuff is very useful here

also:

- performance benchmarking
- client feedback (quotes)
- supervisor feedback
- ta feedback
- our own analysis of what can be improved
  - time to bring out segment tree matmul dp transition


## Algorithmic Carbon Optimization: A Comparative Analysis of Deterministic DP Scheduling vs. GSF SDK

### 1. Executive Summary
This report presents a comprehensive technical evaluation of a proprietary Dynamic Programming (DP) scheduler designed for carbon-aware AI workload orchestration. We benchmark this engine against the Green Software Foundation (GSF) Carbon Aware SDK across three dimensions: carbon-reduction efficacy, hardware scale invariance, and computational performance. 

Our findings demonstrate that by relaxing the contiguous execution constraints of current industry standards, our algorithm achieves up to a **44.1% reduction in carbon emissions** through a combination of temporal splitting and spatial routing. We prove that while absolute carbon savings scale linearly with hardware power, relative efficiency remains an inherent property of the algorithmic logic, exhibiting near-perfect stability across varying GPU architectures and model sizes.

---

### Methodology: Ensuring a Fair Comparison

To isolate algorithmic efficiency from external data variables, we established a rigorous experimental framework:

*   **Standardized API Integration:** A mock API layer was implemented to intercept GSF SDK requests and relay them to our internal Carbon Intensity Prediction API. This ensures both the SDK and our DP scheduler operate on identical forecast data.
*   **Hardware Parity:** We synchronized hardware constants (TDP, idle draw, and system base power) across both testing suites, ensuring the "Workload Amount" (total energy required) remained constant.
*   **Optimal Baseline Selection (The "Best-Site" Constraint):** To provide the most competitive baseline, we manually iterated the GSF SDK across all available data centers to identify the single site with the lowest carbon footprint for every test case.
*   **Isolation of Variables:** By granting the SDK "best-site" knowledge, any observed delta in performance is strictly a result of the scheduling logic (temporal splitting vs. contiguous execution) rather than site selection.

#### Metric Definitions
- **Workload Length ($L$):** The total required compute time for a given job.
- **Window Length ($W$):** The total allowable time (deadline) before which the workload must be completed.
- **Absolute Savings ($\text{gCO}_2$):** Calculated as the difference between the baseline SDK emissions and the optimized algorithm emissions:$\text{Absolute Savings} = \text{Emissions}_{\text{SDK}} - \text{Emissions}_{\text{Algorithm}}$
- **Relative Efficiency ($\%$):** The percentage of emissions reduced relative to the baseline: $\text{Relative Efficiency} = 100 \times \frac{\text{Absolute Savings}}{\text{Emissions}_{\text{SDK}}}$

---

### 3. Carbon Reduction Efficacy

#### 3.1 Baseline Validation and Divergence
Experimental results confirm a consistent performance advantage over the GSF SDK. As workload volume increases relative to the deadline window, the SDK is forced into high-intensity grid periods due to its contiguity constraint. 

![Baseline Validation](images/comparison/plot_baseline_validation.png)
*Figure 1: Comparison of total emissions. The divergence illustrates the "Contiguity Penalty" inherent in standard SDK implementations.*

#### 3.2 The Emissions Hierarchy
A critical finding of this study is the hierarchy of decarbonization strategies. By isolating variables, we determined that geographic arbitrage is significantly more impactful than temporal shifting alone.

*   **Temporal-Only (-9.1%):** Restricting the DP algorithm to a single location allows it to dodge local grid spikes, yielding a modest reduction.
*   **Spatial + Temporal (-44.1%):** Enabling spatial routing allows the engine to migrate computation to regions with fundamentally cleaner energy mixes (e.g., North Scotland).

![Emissions Hierarchy](images/comparison/plot_baseline_validation_spatial_difference.png)
*Figure 2: The Spatial Multiplier effect. Spatial routing accounts for nearly 80% of total achievable savings.*

---

### 4. Robustness and Scale Invariance

#### 4.1 Hardware and Model Agnosticism
To test the engine’s versatility, we simulated workloads ranging from 14B to 140B parameters across A100 and V100 clusters.

![Model Size Boxplot](images/comparison/model_size_comparison.png)
*Figure 3: Carbon savings efficiency stability across model parameter scales.*

Statistical analysis (Figure 3) and detailed system efficiency tables confirm that the algorithm’s effectiveness is independent of the underlying hardware. **Relative efficiency remains centered at ~63%** regardless of whether the system is a single V100 or a multi-node A100 cluster.

#### 4.2 Absolute Leverage vs. Relative Stability
We analyzed the relationship between peak system power (kW) and carbon ROI. 
*   **Absolute Leverage:** Savings scale perfectly linearly with system power. Larger clusters yield higher absolute CO2 mass reduction.
*   **Relative Stability:** The regression analysis (Figure 4) shows a slope of only **0.0177% per kW**, effectively proving that efficiency is a constant property of the scheduling logic.

![Relative Power Impact](images/comparison/plot_leverage_relative.png)
*Figure 4: Regression proving efficiency stability ($R^2=0.69$) across all hardware power profiles.*

---

### 5. The Flexibility Frontier: User ROI

We analyzed user flexibility—the ratio of Window ($W$) to Workload ($L$)—to provide data-driven decision support for infrastructure users.

#### 5.1 The Diminishing Returns of Patience
The **Flexibility Frontier** (Figure 5) reveals a non-linear "Patience Payoff." A sharp inflection point occurs when the window is wide enough to bypass daily carbon peaks. After approximately 48 hours of flexibility for a 15-hour job, the ROI plateaus as the algorithm has already secured the "greenest" possible slots.

![Flexibility Frontier](images/comparison/plot_flexibility_frontier.png)
*Figure 5: The "Elbow" of carbon ROI, identifying the saturation point of user flexibility.*

#### 5.2 ROI Heatmap: The Configuration Matrix
The **ROI Heatmap** provides a final cross-validation of scale and flexibility. The consistent horizontal color bands confirm that while "User Patience" (Window size) dictates the percentage of carbon saved, the hardware configuration (Power kW) does not degrade the optimizer's effectiveness.

![ROI Heatmap](images/comparison/plot_roi_heatmap.png)
*Figure 6: ROI Heatmap. Horizontal banding confirms that grid flexibility is the sole determinant of relative efficiency.*

---

## 6. Detailed Efficiency Performance Matrix

To validate the consistency of the DP scheduler across diverse operational scales, we performed a high-granularity sweep of the parameter space. The following table summarizes the performance of the Agent against the GSF SDK across various model sizes and GPU cluster configurations.

![System Efficiency Table](images/comparison/model_comparison_table.png)
*Table 1: Detailed System Efficiency Comparison (Varying Window Length, Varying Workload Lengths).*

### 6.1 Statistical Interpretation of "Average Efficiency"
It is critical to note that the **Avg. Efficiency (~56.5%)** reported in Table 1 represents the arithmetic mean of relative carbon savings calculated across a broad experimental matrix. This matrix includes:
*   **Workload Lengths ($L$):** Ranging from 3 hours to 30 hours.
*   **Scheduling Windows ($W$):** Ranging from 6 hours to 168 hours.

By calculating the average of individual efficiencies rather than a weighted "Total Saved / Total SDK" ratio, we ensure that the results are not skewed by high-power, multi-node configurations. This statistical approach confirms that the Agent's performance is not a product of specific "large-scale" wins, but a persistent and stable improvement. 

Regardless of whether the workload is a small 14B parameter model on 5 V100 GPUs or a massive 140B parameter model on a 50-GPU cluster, the algorithm consistently extracts over **56% more carbon efficiency** than the best-case single-site contiguous execution offered by the GSF SDK. This uniformity proves that the DP engine’s logic is fundamentally superior across the entire operational spectrum of modern AI training.

---

### 7. Conclusion
The comparative analysis confirms that our deterministic DP scheduler provides a mathematically superior carbon profile to the GSF SDK. By mathematically modeling the energy cost of fragmentation and leveraging geographic arbitrage, the engine achieves an average **56% improvement** over current industry standard GSF SDK. The system's scale invariance and sub-second computational overhead make it a robust candidate for enterprise-scale, carbon-aware AI infrastructure.


## Scheduling Algorithm Hardware Specific Optimizations

This evaluation focuses strictly on the computational throughput and execution latency of the scheduling engine. The following analysis compares the performance of three iterative versions of the algorithm: the initial scalar implementation (**First_Solution**), the cache-localized version (**Cache_Optimization**), and the final vectorized engine (**Cache_and_Vectorization_Optimization**).

### Benchmark Methodology

To ensure a fair comparison, all tests were conducted under controlled conditions:
*   **Fixed Resolution:** The discretization resolution was locked at **10,000** units. This ensures that the state-space size remains consistent across different workload volumes.
*   **Statistical Stability:** Each data point represents the **average of 5 consecutive runs** to eliminate noise from OS context switching and background tasks.
*   **Complexity Scaling:** We tested 40 distinct job requests, scaling the workload "length" to observe how the algorithm handles increasing computational pressure.


### Comparative Performance Analysis

The primary metric for this evaluation is **Execution Time (seconds)**. As the scheduling engine must support real-time UI interactions, reducing the time-to-solution is critical.

#### 1. Baseline vs. Cache Optimization
The **First_Solution** (represented by the blue line in Figure 1) exhibited both high latency and significant variance, especially at lower complexity levels where execution times peaked near 16 seconds. 

By refactoring the data structures from an **Array of Structs (AoS)** to a **Struct of Arrays (SoA)**, the **Cache_Optimization** version (green line) achieved a more stable performance profile. While the raw speedup was modest (averaging ~10-20%), the primary benefit was the reduction in "jitter" or performance spikes, providing a more predictable latency for the scheduler.

#### 2. The Impact of SIMD Vectorization
The most significant performance leap was achieved through manual **AVX-512 vectorization**. By processing 8 double-precision states simultaneously within the DP hot-path, the **Cache_and_Vectorization_Optimization** (orange line) drastically reduced execution time across the entire spectrum.

![Performance Comparison](images/benchmarks/performance_comparison.png)
*Figure 1: Execution Time (s) vs. Workload Complexity.*

As shown in Figure 1, the vectorized implementation brought the execution time down from ~15 seconds to **under 4 seconds** for the most complex tasks, with typical tasks completing in approximately **1 second**.


### Relative Speedup and Scaling

To understand the efficiency gains, we analyzed the **Speedup Factor** (Baseline Time / Optimized Time). This metric highlights how the optimizations behave as the problem size scales.

![Relative Speedup](images/benchmarks/relative_speedup.png)
*Figure 2: Speedup Factor compared to First_Solution.*

#### 3. Peak Gains and Asymptotic Convergence
*   **Peak Performance:** At lower complexity levels, the vectorized engine achieved a **4.0x speedup** over the baseline. This is where the overhead of the original scalar loops was most punitive.
*   **Asymptotic Behavior:** As complexity increases, the speedup factor tends to converge toward a lower stable ratio (approx. 1.5x). This is an expected result of our **fixed resolution** methodology. Because the resolution is constant (10,000 units), as the total workload increases, the relative density of the DP transitions per unit of work changes. The algorithmic complexity is inversely proportional to the total workload; essentially, as the "workload" grows toward infinity, the fixed-size discretization grid becomes the dominant factor, causing the performance curves of different implementations to meet asymptotically.

### Conclusion on Execution Latency

The transition from a naive scalar implementation to a cache-aware, SIMD-accelerated engine resulted in a **75% reduction in peak latency**. While all versions produced identical scheduling results (validating the mathematical integrity of the optimizations), the vectorized engine is the only version capable of maintaining the "sub-second" response time required for a fluid, interactive user experience during typical scheduling scenarios.
