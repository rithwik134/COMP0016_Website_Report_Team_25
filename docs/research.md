# Research

> [!DANGER]  
> needs some context / intro (brief!!!) relating the big picture of our project to the subsequent research areas.

> [!DANGER]  
> REVIEW OF ANOTHER SOFTWARE (existing similar solutions) is REQUIRED (at least one other)  
> also need technology review (review relevant technologies and tech stacks type kind stuff)
>
> NEEDS IEEE references (make sure links work and stuff)

## Hardware Research

### 1.1 Hardware Specification References

This research provides a technical breakdown of the hardware constants and energy-to-computation formulas used in the `hardwareConversion` module. The module facilitates energy-aware scheduling by converting physical power metrics into computational work units (FLOPS).

```cpp
--8<-- "PseudoCode/hardwareConversion.pseudo"
```

The scheduler utilizes specifications for two primary NVIDIA data center GPUs. The values in our `HW_LIB` are derived from official NVIDIA technical briefs.

#### **NVIDIA Tesla V100 (PCIe)**

* **TDP (250W):** The Thermal Design Power represents the maximum power the GPU is expected to consume under heavy workloads.
* **Performance (15.7 TFLOPS FP32):** Standard single-precision performance.
* **Reference:** [NVIDIA V100 Datasheet](https://images.nvidia.com/content/technologies/volta/pdf/volta-v100-datasheet-update-us-1165301-r5.pdf)

#### **NVIDIA A100 (SXM4)**

* **TDP (400W):** The SXM4 form factor allows for higher power delivery and thermal headroom compared to PCIe.
* **Performance (19.5 TFLOPS FP32):** Non-tensor core peak performance for standard FP32 operations.
* **Reference:** [NVIDIA A100 Datasheet](https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/a100/pdf/nvidia-a100-datasheet-us-nvidia-1758950-r4-web.pdf)

---

### 1.2 Explanation of Hardware Constants

| Constant | Value (Code) | Technical Justification |
| :--- | :--- | :--- |
| `FAN_SURGE_COEFF` | 2.5 | During the BIOS/POST phase, server fans typically spin up to 100% duty cycle to test hardware, consuming significantly more power than during steady-state operation. |
| `CONTAINER_LOAD_W` | 100W | Estimated overhead for the Host CPU, RAM, and NVMe drives when initializing a Docker/Apptainer container environment. |
| `TRANSFER_EFFICIENCY` | 0.45 | Data movement (loading models from disk to VRAM) is less power-intensive than active floating-point computation. We estimate power draw at 45% of peak TDP during I/O phases. |
| `effectiveness` | 0.95 | Real-world software overhead. Even highly optimized CUDA kernels rarely hit 100% of theoretical peak TFLOPS; 95% represents an "idealized" high-utilization scenario. |
| `sys_base` | 150-230W | Represents the "idling" power of the dual-socket server motherboard, fans, and idling CPUs that house the GPUs. |

---

### 1.3 Workload Scaling & Model Sizes

The `model_size` (GB) and `length` (minutes) parameters allow the scheduler to estimate the energy cost of specific AI workloads.

* **Average Model Sizes:**
  * **ResNet-50 / Computer Vision:** ~0.1 - 0.5 GB (Low transfer overhead).
  * **BERT-Base / Medium NLP:** ~0.4 - 1.0 GB.
  * **Llama-3-8B (Quantized):** ~5.0 - 8.0 GB.
  * **Large Language Models (LLMs):** 40GB+ (Significant `e_load` energy required).

* **Computational Translation:**
    The function `calculate_flo_per_kwh` translates physical energy into "Computational Currency":
    $$\text{FLO per kWh} = \text{Effectiveness} \times \frac{\text{TFLOPS} \times 10^{12} \times 3600}{\text{TDP} / 1000}$$
    This allows the scheduler to compare the "Green Efficiency" of different hardware generations.

---

### 1.4 Energy Calculation Methodology

The scheduler breaks down a job into three distinct energy phases:

#### **A. Startup Phase (`get_startup_energy_kwh`)**

Divided into the **BIOS Phase** (high fan usage) and **OS Phase** (base system + container initialization). This is a fixed cost regardless of the task length.

* *V100 Estimate:* ~0.02 - 0.04 kWh per boot.

#### **B. Model Loading Phase (`get_load_energy_kwh`)**

Calculates the energy used while the `bus_gbps` (PCIe Gen3 vs NVLink) transfers the model into VRAM.

* **Formula:** $\text{Power}_{\text{load}} \times (\text{Model Size} / \text{Bus Speed})$.

#### **C. Execution Phase (`get_workload_amount`)**

The active computation phase. The total "work" is defined as the total FLOPS capable of being produced during the requested `length` at full power.

### 1.5 Summary of Calculated Outputs

When `convertRawJobRequest` is called, it returns:

1. **Startup Overhead:** The energy "tax" of booting and loading the model, expressed in FLOPS.
2. **Workload Amount:** The total computational "budget" of the job.
3. **kWh per FLO:** The inverse efficiency, used to calculate the final carbon footprint or electricity cost of the specific hardware-workload pairing.

---

## Forecasting Model Research

This section presents the research behind our choice of production forecasting model for the Stats service. The forecasting system predicts carbon intensity (gCO2/kWh) for 5 UK regions, 7 days into the future at 30-minute intervals (336 steps per region per cycle). Through systematic experimentation across 18+ model architectures and 5 phases of refinement, we arrived at **RidgeFull** -- an enhanced Ridge regression model achieving MAE 24.88. For detailed experimental data, see the [AI Research Journal](dev-journal.md).

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

[1] P. Bauer, A. Thorpe, and G. Brunet, "The quiet revolution of numerical weather prediction," *Nature*, vol. 525, no. 7567, pp. 47--55, Sep. 2015, doi: 10.1038/nature14956.

