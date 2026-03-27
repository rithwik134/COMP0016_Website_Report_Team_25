# Research

To build a highly efficient, carbon-aware scheduling system, we had to address three interdependent technical domains: software architecture, hardware energy modeling, and environmental forecasting. Before implementation, it was critical to define these elements to avoid technical debt and ensure the final product could meet strict performance and accuracy requirements. This section details our comparative research into existing solutions, the justification for our C++ and microservices technology stack, and the empirical selection process for our carbon prediction model.

## Related Projects Review
To gather inspiration and understand the current industry standards, we analyzed the Green Software Foundation (GSF) Carbon Aware SDK [1]. Developed primarily by NTT Data in cooperation with other foundation members, this SDK is the current gold standard for carbon-aware scheduling and is used by numerous enterprises to reduce their emissions. The SDK is predominantly built using C# and the .NET framework. 

Their scheduling solution is relatively simple yet surprisingly effective: it selects a single continuous time interval of a requested length that offers the minimal average carbon intensity. If multiple data centers are provided, it selects the location with the best environmental outcome. However, we found this "single continuous interval" approach too restrictive for our specific use case. Research indicates that AI workloads are highly parallelizable [2]. This characteristic allows such workloads to be split into multiple discrete, continuous intervals, meaning the scheduling algorithm can be much more flexible and environmentally efficient than standard single-interval methods.

Additionally, the GSF SDK currently connects primarily to two carbon forecast providers (WattTime and Electricity Maps), which typically only allow scheduling windows of up to 48–72 hours [1]. We recognized an opportunity to improve this by integrating an extended forecasting model, giving our algorithm a longer time horizon to find optimal computing windows. Furthermore, since the GSF SDK inherently utilizes 5-minute time windows for its environmental telemetry, we adopted the same granularity to ensure industry alignment and maintain high-resolution scheduling accuracy.

## Technology Review & Algorithmic Considerations

### Workload Execution Overheads
During our research, we found that executing heavy AI workloads is not as simple as defining a start time. As detailed in cloud computing literature [3], instance provisioning involves a startup overhead. The user must define the hardware specifications, and the cloud provider requires time to spin up that specific instance before the workload can actually begin computing. We recognized that our scheduling algorithm needed to mathematically account for this startup penalty to reflect real-world execution accurately.

### Hardware Specifications and Energy-to-Computation Modeling
To make our scheduling algorithm truly energy-aware, we needed a methodology to translate physical power metrics into standard computational work units (FLOPS). We conducted extensive hardware research to define the constants and energy-to-computation formulas that would power our hardware conversion logic. 

We established baseline architectural profiles using official NVIDIA technical briefs for two primary data center GPUs:
- **NVIDIA Tesla V100 (PCIe)** (250W TDP, 15.7 TFLOPS FP32) [6]
- **NVIDIA A100 (SXM4)** (400W TDP, 19.5 TFLOPS FP32) [7]

Using these hardware baselines, we determined that our algorithm would need to break down any given job into three distinct energy phases:

1. **Startup Phase:** Expanding on our findings regarding execution overheads, we modeled the fixed energy cost of booting and initialization. This included a BIOS phase—where server fans surge to 100% duty cycle, consuming an estimated 2.5 times the steady-state power—and an OS phase.[8] We estimated the host CPU, RAM, and NVMe overhead for initializing a container environment (like Docker or Apptainer) at approximately 100W.[9]
2. **Model Loading Phase:** We recognized that moving data (loading models from disk to VRAM) is less power-intensive than active floating-point computation. We estimated the power draw during I/O phases to be roughly 45% of peak TDP.[10] We also noted that the duration of this phase would scale dynamically based on bus speeds (e.g., PCIe Gen3 vs. NVLink) and the specific AI workload—ranging from small Computer Vision models like ResNet-50 (~0.1 - 0.5 GB) to quantized models like Llama-3-8B (~5.0 - 8.0 GB), up to large language models exceeding 40GB.
3. **Execution Phase:** This represents the active computation phase. We established that base server idling power typically ranges between 150W and 230W.[11] Furthermore, because even highly optimized CUDA kernels rarely hit 100% of theoretical peak performance, we capped our real-world software effectiveness rate at 95% for our "idealized" high-utilization scenarios.[12]

By synthesizing these constants, we derived a core formula to translate physical energy into "Computational Currency":

$$\text{FLO per kWh} = \text{Effectiveness} \times \frac{\text{TFLOPS} \times 10^{12} \times 3600}{\text{TDP} / 1000}$$

Ultimately, this mathematical modeling ensured that before a single line of code was written, our system would have the theoretical framework to calculate the total computational "budget" of a job, the startup energy "tax" (expressed in FLOPS), and the specific green efficiency (kWh per FLO) of any hardware-workload pairing.

### Languages, Frameworks, and Architecture
After drafting the initial sketch of our algorithm, we realized it would be computationally exhaustive. We estimated that the system would need to perform approximately $10^{10}$ operations per request. There are only a handful of programming languages capable of executing this volume of computation in a reasonable timeframe. Because half of our team possesses advanced proficiency in C++, we selected it as the language for our core scheduling engine to maximize performance. 

For the extended forecasting component, Python was the preferred choice due to its dominant ecosystem of specialized data science libraries. It would allow us to utilize Pandas for high-performance manipulation of the 5-minute interval time-series data and NumPy for vectorized numerical operations, which ensure the preprocessing stage remained efficient despite the large data volume. To handle the actual predictive modeling, we could leverage Prophet because of its robustness in handling seasonal trends and missing data points in environmental telemetry. Additionally, we Scikit-learn provides evaluation metrics like Mean Absolute Error (MAE), which would allow us to validate the accuracy of our 7-day carbon intensity forecasts against historical benchmarks.

While Python has many well-known web frameworks, the choices for C++ are more specialized. We selected Drogon, a highly performant, non-blocking C++ web framework. Drogon utilizes modern C++20 features, such as coroutines, and provides excellent built-in support for databases and routing controllers. It was also specifically chosen because it consistently outperforms other C++ frameworks like Crow or Pistache in the TechEmpower Web Framework Benchmarks, often ranking among the top-performing frameworks globally [4]. 

To manage the dense data generated by 5-minute intervals across a 7-day forecast, we paired Drogon with **PostgreSQL**. We selected PostgreSQL for its robustness and superior ability to handle rapid batch inserts, a feature we identified as critical for maintaining low-latency performance when persisting large-scale, multi-interval schedules. [5]

Because our solution would rely on a mix of different languages, we opted for a microservices architecture communicating via standard HTTP REST APIs. We briefly considered alternative approaches, such as low-latency cross-process communication (IPC) or custom I/O protocols, but these would have introduced unnecessary complexity. Standard HTTP microservices keep the system decoupled, importantly allowing the Python prediction API to be hosted separately—meaning users can easily plug in their own prediction models if desired.

### Summary of Technical Decisions
Based on our research and project constraints, we finalized the following technical stack:   
-   **Core Algorithm Engine:** C++ (chosen for execution speed and handling high computational complexity).  
-   **C++ Web Framework:** Drogon (chosen for its non-blocking architecture, modern C++20 support, and high throughput).  
-   **Forecasting Service:** Python (chosen for its extensive statistical and machine learning libraries).  
-   **Frontend Interface:** React (chosen for dynamic component rendering and interactive data visualization).  
-   **System Architecture:** HTTP Microservices (chosen for ease of integration, separation of concerns, and API modularity).  
-   **Algorithmic Approach:** Multi-interval scheduling with startup-overhead awareness (chosen to capitalize on AI workload parallelization).  

### References
[1] Green Software Foundation, "Carbon Aware SDK Documentation," GitHub, 2023. [Online]. Available: [https://github.com/Green-Software-Foundation/carbon-aware-sdk](https://github.com/Green-Software-Foundation/carbon-aware-sdk). [Accessed: Mar. 2026].  <br>
[2] P. Goyal et al., "Accurate, Large Minibatch SGD: Training ImageNet in 1 Hour," arXiv:1706.02677 [cs.CV], Jun. 2017. [Online]. 
Available: [https://doi.org/10.48550/arXiv.1706.02677](https://doi.org/10.48550/arXiv.1706.02677) <br>
[3] M. Mao and M. Humphrey, "A Performance Study on the VM Startup Time in the Cloud," in Proc. IEEE 5th Int. Conf. Cloud Comput. (CLOUD), 2012. [Online].
Available: [https://ieeexplore.ieee.org/document/6253534](https://ieeexplore.ieee.org/document/6253534) <br>
[4] TechEmpower, "Framework Benchmarks Round 19," TechEmpower Blog, May 2020. [Online]. Available: [https://www.techempower.com/benchmarks/#section=data-r19](https://www.techempower.com/benchmarks/#section=data-r19) <br>
[5] R. S. S. Kumar and S. M. Kumar, "Performance Analysis of PostgreSQL and MySQL Databases for Large Scale Data," in Proc. 2023 7th Int. Conf. Intell. Comput. Control Syst. (ICICCS), 2023. [Online]. Available: [https://www.mdpi.com/1999-5903/16/10/382](https://www.mdpi.com/1999-5903/16/10/382)
[6] NVIDIA Corp., "NVIDIA Tesla V100 GPU Accelerator Datasheet," 2020. [Online]. Available: [https://images.nvidia.com/content/technologies/volta/pdf/tesla-volta-v100-datasheet-letter-fnl-web.pdf](https://images.nvidia.com/content/technologies/volta/pdf/tesla-volta-v100-datasheet-letter-fnl-web.pdf)  
[7] NVIDIA Corp., "NVIDIA A100 Tensor Core GPU Datasheet," 2021. [Online]. Available: [https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/a100/pdf/nvidia-a100-datasheet-us-nvidia-1758950-r4-web.pdf](https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/a100/pdf/nvidia-a100-datasheet-us-nvidia-1758950-r4-web.pdf)  
[8] M. Ogle, T. Mottershead, Dell Technologies, "PowerEdge Server Power and Cooling Trends," Technical White Paper, 2023. [Online] Available: [https://www.delltechnologies.com/asset/en-ph/products/servers/industry-market/the-future-of-server-cooling-part-1.pdf](https://www.delltechnologies.com/asset/en-ph/products/servers/industry-market/the-future-of-server-cooling-part-1.pdf)  
[9] C. Centofanti, J. Santos, Venkateswarlu Gudepu, and Koteswararao Kondepu, “Impact of power consumption in containerized clouds: A comprehensive analysis of open-source power measurement tools,” Computer networks (1999), pp. 110371–110371, Mar. 2024, doi [Online] Available: [https://doi.org/10.1016/j.comnet.2024.110371](https://doi.org/10.1016/j.comnet.2024.110371.)  
[10] J. G. Koomey, "Estimating Total Power Consumption by Servers in the U.S. and the World," Stanford University Publication, 2021. [Online] Available: [https://www.researchgate.net/publication/228365136_Estimating_Total_Power_Consumption_by_Servers_in_the_US_and_the_World](https://www.researchgate.net/publication/228365136_Estimating_Total_Power_Consumption_by_Servers_in_the_US_and_the_World)  
[11] U.S. Environmental Protection Agency, "ENERGY STAR Program Requirements for Computer Servers," Version 3.0, 2023. [Online] Available: [https://www.energystar.gov/sites/default/files/2025-04/ENERGY%20STAR%20Version%204.0%20Computer%20Servers%20Final%20Specification.pdf](https://www.energystar.gov/sites/default/files/2025-04/ENERGY%20STAR%20Version%204.0%20Computer%20Servers%20Final%20Specification.pdf)  
[12] W. Luo et al., “Dissecting the NVIDIA Hopper Architecture through Microbenchmarking and Multiple Level Analysis,” arXiv.org, 2025. [https://arxiv.org/abs/2501.12084](https://arxiv.org/abs/2501.12084)  

---

## Forecasting Model Research

While the previously discussed C++ scheduling engine handles the workload distribution, its environmental effectiveness is strictly bound by the accuracy of the carbon data it consumes. Therefore, this section presents the research behind our choice of production forecasting model for the Stats service. The forecasting system predicts carbon intensity (gCO2/kWh) for 5 UK regions, 7 days into the future at 30-minute intervals (336 steps per region per cycle). Through systematic experimentation across 18+ model architectures and 5 phases of refinement, we arrived at **RidgeFull** enhanced Ridge regression model achieving an MAE of 24.88. For detailed experimental data, see the [AI Research Journal](dev-journal.md).

### 2.1 Key Concepts and Terminology

#### Direct vs Recursive Forecasting

There are two fundamentally different ways to produce multi-step forecasts:

* **Recursive forecasting**: Predict 30 minutes ahead, then feed that prediction back as input to predict 60 minutes ahead, and so on 336 times. The problem is **error compounding** -- if step 1 is slightly wrong, step 2 uses that wrong value as input, making it even more wrong, and the error snowballs over 336 steps. Tree-based models (XGBoost, CatBoost, LightGBM) and transformers were tested this way and suffered badly.

* **Direct forecasting** (what RidgeFull uses): Train a single model that takes the **horizon step number** as an input feature alongside all other features. To predict step 100, the model receives `h=100` as a feature and predicts directly from historical data -- it never uses its own past predictions as input. Each horizon step is independent, so errors at one step cannot affect others.

#### Feature Groups

The production model's 65 input features fall into five groups:

**Temporal features (22)** encode *when* the prediction target is. These use Fourier harmonics (pairs of sine and cosine waves at different frequencies) to represent cyclical time patterns. For example, `sin(2pi x hour/24)` and `cos(2pi x hour/24)` together encode the hour of day as a smooth cycle -- hour 23 is close to hour 0, not far away as it would be if encoded as a raw number. Six harmonics for hour-of-day capture increasingly fine-grained intra-day patterns (the 1st harmonic captures the broad day/night cycle; the 6th captures short patterns like the morning demand ramp). Also includes a weekend flag and a night flag.

**Horizon features (4)** encode *how far ahead* the prediction is. The raw horizon `h` is supplemented with `h²`, `h³`, and `log(h)`. This lets the model learn that forecast accuracy degrades non-linearly with distance -- quickly at first (hours 1--24) then more gradually (days 3--7).

**Origin statistics (13)** summarise *what carbon intensity has been doing recently* at the time the forecast is made. Features include the last reading, 24-hour and 7-day rolling statistics (mean, std, median, min, max), lag values at 24h and 7d offsets, a short-term trend indicator, and the historical average for the current half-hour slot.

**Weather features (16)** encode *weather conditions at the target time*. During training, these are actual historical weather from the Open-Meteo archive aligned to each target timestamp. During inference, these are Open-Meteo weather forecasts for each future horizon step. 10 raw features (temperature, humidity, dewpoint, pressure, cloud cover, wind speed, wind direction, wind gusts, solar radiation, precipitation) plus 6 engineered features: wind power (speed³), wind ramp, pressure change, solar clearness, temperature deviation, and wind direction sin/cos.

**Interaction features (10)** are products of features from different groups that let a linear model capture non-linear relationships. For example, `last_value x horizon` lets the model learn that a high current reading matters more for short-term predictions than long-term ones. `wind_speed x hour_sin` lets the model learn that wind has different effects at different times of day.

#### Other Key Terms

* **MAE (Mean Absolute Error)**: The primary accuracy metric. The average of |predicted - actual| across all predictions. An MAE of 24.88 means on average, predictions are ~25 gCO2/kWh away from the true value.
* **CV (Coefficient of Variation)**: Standard deviation divided by mean. Measures how volatile a region's carbon intensity is relative to its average.
* **StandardScaler**: Normalises each feature to have mean 0 and standard deviation 1. Without this, features with large absolute values (e.g., pressure ~1013 hPa) would dominate features with small values (e.g., wind_dir_sin in [-1, 1]).
* **RidgeCV**: Ridge regression with built-in cross-validation for the regularisation strength (alpha), removing the need for manual tuning.

### 2.2 Model Selection: Single Model Experiments

We conducted a systematic 5-phase search across 18+ model architectures. The key findings from each phase are summarised below.

#### Phase 1: Baseline Benchmark (18 Models)

A comprehensive comparison established Direct-Ridge as the initial production model at MAE 32.99, beating all 17 competitors on the full backfill training set (~83 days):

| Model | MAE | Notes |
| --------------- | ----- | -------------------------------- |
| Direct-Ridge | 32.99 | Winner -- simple, fast, accurate |
| Ridge | 33.04 | Near-identical to Direct-Ridge |
| Direct-XGBoost | 33.50 | Close third |
| Fourier | 35.78 | Pure periodic decomposition |
| Seasonal Naive | 42.20 | Repeat-last-week baseline |
| Transformer-10K | 42.44 | Best neural approach |
| SARIMAX | 64.32 | Classical time series |
| Holt-Winters | 93.14 | Worst performer |

![Phase 1 Benchmark Heatmap](images/stats-experiments/benchmarks/benchmark_heatmap_full_backfill.png)
/// caption
Phase 1 benchmark: per-region MAE heatmap across all 18 models.
///

#### Weather Feature Ablation

Weather features proved to be the single most impactful predictor category:

| Model | With Weather | No Weather | Delta |
| --------------- | ------------ | ---------- | ------ |
| Direct-Ridge | 32.99 | 44.54 | -11.56 |
| Ridge | 33.04 | 43.61 | -10.57 |
| Transformer-10K | 42.44 | 60.69 | -18.25 |
| CatBoost | 47.05 | 45.34 | +1.70 |
| LightGBM | 49.44 | 45.14 | +4.30 |

Direct models benefit most from weather because each horizon step receives its own weather input independently. Recursive tree models actually *worsen* with weather because lag-1 weather values become stale by step 10 of the 336-step recursive chain, yet the model still conditions on them for all remaining steps.

#### Phases 2--5: Iterative Improvement

Subsequent phases focused on closing the gap through better features and more data:

* **Phase 2 (Enhanced features)**: Sparse lags and weekly periodicity features improved boosting models by up to 20.9%.
* **Phase 3 (Residual targets)**: Predicting deviations from persistence helped high-variance models (RF, CatBoost) but not boosting models.
* **Phase 4 (Seasonal data)**: Full-year training data pushed CatBoost to MAE 31.63 -- the first model to beat Direct-Ridge.
* **Phase 5 (Weather enrichment)**: Extending from 3 to 11 raw weather features produced the top 5 results. Direct-XGBoost reached MAE 29.49.

![Weather Feature Comparison](images/stats-experiments/experiments/weather_comparison.png)
/// caption
Phase 5: weather enrichment gave every model a significant accuracy boost.
///

### 2.3 Ensemble Experiments and Final Model Selection

After Phase 5, we conducted a feature engineering overhaul (14 -> 65 features) and explored ensemble strategies combining Ridge, neural networks, and gradient boosting.

#### Feature Engineering Overhaul

The single largest improvement came from expanding the feature set:

| Feature Group | Old (14 features) | New (65 features) |
| ------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Temporal | 2 sin/cos pairs (hour, dow) | 22: 6 Fourier harmonics for hour, 2 for dow, 2 for doy, weekend flag, night flag |
| Horizon | 1 feature (h/336) | 4: h, h², h³, log(h) |
| Origin stats | 3 (last, mean, std) | 13: + median, min, max, 7-day stats, lag_24h, lag_7d, trend, same_hour_mean |
| Weather | 3 raw | 16: 10 raw + 6 engineered (wind_power, wind_ramp, pressure_change, solar_clearness, temp_deviation, wind_dir sin/cos) |
| Interactions | 0 | 10: last x horizon, weekend x hour, wind x hour, solar x hour, etc. |
| Preprocessing | None | StandardScaler + RidgeCV (8 alpha candidates) |

#### Individual Model Results on 65-Feature Set

| Model | AVG MAE | Time / Region |
| ----------------------------- | ----------- | ------------- |
| **RidgeFull** | **24.88** | < 1 sec |
| RidgeBase (no interactions) | 25.22 | < 1 sec |
| PyTorch MLP (2048,1024,512) | 27.30--28.20 | 3--5 min |
| LightGBM | 27.70--27.86 | 5--10 sec |
| Conditioned MLP (all regions) | 30.45 | 5+ min |

#### Ensemble Strategy Results

| Ensemble Strategy | Models Combined | AVG MAE |
| ----------------- | -------------------------------- | ----------- |
| Median ensemble | RidgeFull, RidgeBase, MLP, LightGBM | 24.85 |
| Val-weighted | RidgeFull, RidgeBase, MLP, LightGBM | 24.78--24.83 |
| Trimmed mean | RidgeFull, RidgeBase, MLP | 24.76--25.08 |

### 2.4 Why RidgeFull Over an Ensemble?

The best ensemble (median, MAE 24.85) improved over RidgeFull (24.88) by only **0.03 MAE** (0.1%). This marginal gain does not justify the added complexity:

* **4x model maintenance**: Four models to train, debug, and monitor instead of one.
* **MLP training latency**: 3--5 minutes per region, adding 15--25 minutes per prediction cycle for 5 regions.
* **Non-determinism**: The MLP component produces 2--5 MAE variation between runs.
* **Inconsistent improvement**: The ensemble sometimes hurts on specific regions where MLP or LightGBM pulls the aggregate away from Ridge's correct answer.

RidgeFull's sub-second training, full determinism, zero manual hyperparameters, and minimal dependencies make it the right choice for a production API that retrains on every 30-minute prediction cycle. This is especially important because the Stats service operates as a lightweight oracle server on shared infrastructure -- it must remain CPU-only and low-overhead to avoid competing for resources with the Scheduler and UI components. A model requiring GPU acceleration or multi-minute training cycles would be impractical in this deployment context.

![RidgeFull Actual vs Predicted](images/stats-experiments/analysis/ridgefull_actual_vs_predicted.png)
/// caption
RidgeFull production model: actual vs predicted carbon intensity across all regions.
///

### 2.5 Why Transformers Were Not Justified

Transformers consistently underperformed simpler models on this dataset:

| Model | Best MAE | Notes |
| --------------- | --------- | ---------------------------- |
| Transformer-10K | 40.28 | Best with small data (7-day) |
| Transformer-5K | 41.68 | Mid-training sweet spot |
| Chronos-Tiny | 43.26 | Zero-shot foundation model |
| N-BEATS | 62.60 | Direct multi-horizon |
| N-HiTS | 76.36 | Direct multi-horizon |

The reasons are structural: (1) the target is a single low-dimensional time series with strong regular periodicity easily captured by cyclical features; (2) the dataset (~4,000 training points) is insufficient for attention mechanisms; (3) 336-step recursive decoding compounds errors; and (4) the signal is fundamentally driven by weather, which simple linear models exploit more efficiently through direct feature engineering.

### 2.6 Future Directions

* **Weather forecast--training alignment**: Bridging the distribution gap between archive weather (training) and forecast weather (inference) via noise injection or training on historical forecasts.
* **Cross-region modelling**: Joint forecasting to capture spatial correlations (e.g., wind fronts moving from North to South).
* **Online learning**: Continuous model updates as new data arrives, adapting to regime changes faster than periodic retraining.
* **Additional exogenous features**: Gas prices, interconnector flows, or day-ahead market data as leading indicators.

### References

[13] P. Bauer, A. Thorpe, and G. Brunet, "The quiet revolution of numerical weather prediction," *Nature*, vol. 525, no. 7567, pp. 47--55, Sep. 2015, doi: 10.1038/nature14956.

