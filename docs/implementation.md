# Implementation

This page details how the key features of the Carbon-Aware AI Agent were implemented, focusing on the technical translation from user requirements to algorithmic execution.

## Hardware-Aware Workload Translation

A major challenge in carbon-aware scheduling is bridging the gap between an AI engineer's operational needs (e.g., "I need to train this 70B model for 10 hours on 8x A100s") and the scheduler's mathematical optimization engine.

### Natural Input Processing

The system provides a high-level abstraction layer that converts "natural" hardware metrics into Floating Point Operations (FLO) and energy profiles. This is implemented in the `HardwareConversion` utility in C++.

| Input Metric | Internal Mapping |
| :--- | :--- |
| **GPU Model** | Fetches TDP, Idle Power, and Peak TFLOPS from `HW_LIB`. |
| **GPU Count** | Scales the total power and throughput linearly. |
| **Model Size (GB)** | Determines the time and energy cost of model weight transfers. |
| **Runtime (Hrs)** | Used to calculate the total workload magnitude $W$. |

### Energy & Workload Modeling

The translation logic (`convertRawJobRequest`) calculates the following internal parameters for the DP engine:

* **Workload Amount (FLO)**: The total number of floating-point operations required for the task.
* **Max Load ($r_{i,j}$)**: The maximum FLO that can be processed in a single 5-minute block, restricted by the physical throughput of the requested cluster.
* **Startup Overhead ($P$)**: A comprehensive energy penalty calculated as:
    $$E_{startup} = E_{BIOS} + E_{OS} + E_{Transfer}$$
    Where $E_{Transfer}$ is derived from the **Model Size** and the **Bus Bandwidth** (PCIe/SXM) of the selected GPU architecture.

```cpp
--8<-- "code/scheduler/src/utils/HardwareConversion.cpp:17:42"
```

## The Cost Function (`LocationCost`)

The scheduler's core optimization loop minimizes a cost function that is physically grounded in carbon emissions.

```cpp
--8<-- "code/scheduler/src/SchedulerAlgo.hpp:81:91"
```

By multiplying the workload (FLO) by the hardware's energy efficiency (kWh/FLO) and the regional carbon intensity (gCO2/kWh), the algorithm ensures that every scheduling decision is directly optimized for the lowest possible greenhouse gas impact.

## UI-Backend Orchestration

The user interface facilitates this hardware-aware scheduling through a specialized form that guides users to provide valid infrastructure specifications.

### The Commitment–Cancel Workflow

To ensure consistency in a shared scheduling environment, the system employs a two-phase commitment flow:

1. **Phase 1**: Upon form submission, the scheduler computes the optimal path, **immediately persists it** to the database to "reserve" the capacity, and returns the result.
2. **Phase 2**: The user reviews the optimized schedule. If they reject it, a `DELETE` request is sent to release the reserved capacity.

### Natural Units in the UI

The UI (`SchedulingForm.tsx`) allows users to select from a predefined library of industry-standard GPUs. This ensures that the parameters sent to the backend are backed by verified hardware constants (TDP, TFLOPS), maintaining the integrity of the carbon intensity calculations.

---

## Forecasting Service (Stats Component)

The forecasting service is implemented as a **FastAPI** application in Python, leveraging the **Direct-XGBoost** model. It performs the following steps:

1. **Data Ingestion**: Periodically fetches real-time regional carbon data and weather forecasts.
2. **Feature Engineering**: Generates cyclical time features and integrates 11 raw weather features from the Open-Meteo API.
3. **Inference**: Produces a 336-step forecast (7 days) for each of the 5 UK regions.
4. **API Delivery**: Exposes the forecasts via a REST API, which the C++ Scheduler consumes concurrently using asynchronous coroutines.

For details on the forecasting experiments and accuracy, see the [Algorithms](algorithms.md) page.
