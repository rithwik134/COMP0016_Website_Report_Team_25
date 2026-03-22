# Evaluation

*TODO*

## Critical Evaluation of the Forecasting Model

An evaluation of the RidgeFull production model (MAE 24.88), the forecasting engine behind the Stats service. For context on terminology (lag features, Fourier harmonics, direct vs recursive forecasting, origin statistics, etc.), see the [Algorithms](algorithms.md) page.

### What the Model Does Well

**Feature engineering over model complexity.** RidgeFull proves that the
relationship between weather, time, and carbon intensity is fundamentally linear
once properly encoded. The 65-feature pipeline (Fourier harmonics, polynomial
horizon, engineered weather, interaction terms) gives a linear model access to
patterns that would otherwise require non-linear architectures. The result is a
24.6% improvement over the v1 Direct-Ridge (32.99 → 24.88 MAE) without changing the
model family.

**Production-grade characteristics.** Sub-second training, full determinism,
zero manual hyperparameters (RidgeCV auto-selects alpha), and a minimal
dependency footprint (scikit-learn only). These properties matter for a system
that retrains on every prediction cycle across multiple regions.

**Weather forecast integration.** Unlike the v1 Direct-Ridge (which used lag-1
weather observations for all horizon steps), RidgeFull uses per-horizon weather:
archive weather aligned to target timestamps during training, and Open-Meteo
forecast weather at inference. Each of the 336 horizon steps receives weather
for its specific future time. The 16 weather features (10 raw + 6 engineered)
capture the causal chain from weather to generation mix to carbon intensity.
Wind power (wind^3), solar clearness, pressure change, and wind ramp encode
domain-relevant physics that raw values miss. The weather ablation showed
Direct-Ridge gains −11.56 MAE from weather alone.

**Direct forecasting.** Predicting each of the 336 horizon steps independently
avoids the recursive error cascade that plagues tree-based and transformer
models over long horizons. This is why Ridge consistently outperforms more
complex recursive alternatives.

### Known Weaknesses

#### Regional Performance Disparity

The cross-region average MAE of 24.88 masks significant per-region variation.
The five regions fall into two distinct regimes:

| Regime              | Regions                             | Mean CI  | CV         | Character                  |
| ------------------- | ----------------------------------- | -------- | ---------- | -------------------------- |
| Southern/gas-heavy  | London, South East, South Yorkshire | 144–164 | 0.37–0.43 | Predictable daily patterns |
| Northern/wind-heavy | North West, North East              | 47–52   | 0.75–0.88 | Volatile, weather-driven   |

Northern regions have coefficients of variation nearly double that of southern
regions. The MLP experiments confirmed this split: it achieved 17–19 MAE on
northern regions but 34–41 on southern ones. A single linear model treats all
regions identically, but the underlying generative processes are different.
Wind-dominated regions are driven by stochastic weather events, while
gas-dominated regions follow more predictable demand-driven daily cycles.

#### Weather Forecast Accuracy at Long Horizons

While using per-horizon weather forecasts is an improvement over lag-1
observations, weather forecast accuracy itself degrades with horizon length.
Bauer et al. [1] report that as of 2013, anomaly correlation for numerical
weather prediction was near 98.5% at day 3, between 80–90% at day 5, and
around 70% at day 7. Since RidgeFull forecasts up to 7 days ahead, the weather
inputs for longer horizons carry substantially more error than those for shorter
horizons.

The model trains on archive (ground-truth) weather but predicts with forecast
weather, creating a train/test distribution mismatch that grows with horizon
distance. The learned weather-CI coefficients are calibrated for accurate weather
inputs, but receive increasingly noisy inputs at longer horizons. The model has
no mechanism to down-weight weather features when the underlying forecast is
uncertain.

**References**

[1] P. Bauer, A. Thorpe, and G. Brunet, "The quiet revolution of numerical weather prediction," *Nature*, vol. 525, no. 7567, pp. 47–55, Sep. 2015, doi: 10.1038/nature14956.

#### No Uncertainty Quantification

The model produces point forecasts with no confidence intervals. The data
analysis revealed that some time slots have week-to-week standard deviations
exceeding 100 gCO2/kWh (South East England, Thursday 05:30). The scheduler
currently treats all predictions as equally confident, which means it may
schedule workloads into time slots where the forecast is highly uncertain.

For a carbon-aware scheduler, knowing _how confident_ a prediction is matters as
much as the prediction itself. A workload shifted to a "predicted-green" slot
that turns out to be high-carbon is worse than no shifting at all.

#### Limited Seasonal Coverage

Training data spans approximately one year. The model
has seen one winter and one partial summer. Seasonal effects on carbon intensity
are significant — summer brings longer daylight hours (more solar generation),
different wind patterns, and lower heating demand. The model's seasonal features
(day-of-year Fourier harmonics) can only extrapolate from the single year of
data available.

#### Outlier Sensitivity

The data analysis identified substantial outlier counts in northern regions:
North East has 83 readings beyond 3-sigma (171+ gCO2/kWh), compared to just 1
for London. These outliers are typically caused by sudden wind drops or
interconnector failures — events that a linear model with smooth features
cannot anticipate. Ridge regression minimises squared error, so outliers
disproportionately influence the learned coefficients.

### Error Analysis

**Where the model fails hardest:**

1. **Regime transitions.** When carbon intensity shifts rapidly from a low-wind
   period to a high-wind period (or vice versa), the model's origin statistics
   (rolling means, trends) are backward-looking and slow to react. The `trend`
   feature (short/long MA difference) helps but has a 24-hour lag by
   construction.

2. **Early morning volatility.** The most volatile time slots across all regions
   cluster around 04:00–08:00 (South East: SD 100–104, London: SD 89). This is
   when overnight wind generation gives way to morning demand ramp-up, and the
   generation mix can shift rapidly. The model's Fourier harmonics capture the
   average pattern but not the variance.

3. **Extreme weather events.** Extended calm (low wind) periods produce
   sustained high carbon intensity that exceeds the model's training
   distribution. These events are rare in the training set but have outsized
   scheduling impact because they represent the worst-case carbon windows.
