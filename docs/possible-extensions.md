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

This would also enable the system to present an **estimated cost** for each proposed schedule, giving users a concrete financial figure alongside the carbon saving. The on-demand pricing APIs listed above provide sufficient data to compute this estimate: the scheduler already knows the instance type, region, and duration of each workload slot, so multiplying by the published rate yields a cost projection. For spot-based workloads the estimate would carry a confidence interval reflecting historical price volatility, which could be displayed in the UI as a cost range.
