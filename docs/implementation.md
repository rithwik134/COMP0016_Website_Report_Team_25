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

- **Workload Amount (FLO)**: The total number of floating-point operations required for the task.
- **Max Load ($r$)**: The maximum FLO that can be processed in a single 5-minute block, restricted by the physical throughput of the requested cluster.
- **Startup Overhead ($P$)**: A comprehensive energy penalty calculated as:
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

The user interface facilitates this hardware-aware scheduling through a specialized form that guides users to provide valid infrastructure specifications. For a broader overview of the microservice architecture and component interactions that support this orchestration, see the [System Design](system-design.md) page.

### The Commitment–Cancel Workflow

To ensure consistency in a shared scheduling environment, the system employs a two-phase commitment flow:

1. **Phase 1**: Upon form submission, the scheduler computes the optimal path, **immediately persists it** to the database to "reserve" the capacity, and returns the result.
2. **Phase 2**: The user reviews the optimized schedule. If they reject it, a `DELETE` request is sent to release the reserved capacity.

### Natural Units in the UI

The UI (`SchedulingForm.tsx`) allows users to select from a predefined library of industry-standard GPUs. This ensures that the parameters sent to the backend are backed by verified hardware constants (TDP, TFLOPS), maintaining the integrity of the carbon intensity calculations.

---

## C++ Performance & SIMD Vectorization

The mathematical optimization performed by the dynamic programming solver involves vast state spaces and transitions that must be evaluated under strict latency budgets (often sub-millisecond per location) to enable real-time UI interactivity. To achieve this, the scheduler engine is implemented in **C++23** with a strong focus on data-oriented design and hardware-level performance.

To understand the necessity of this optimization, we can evaluate the exact upper-bound time complexity $\mathcal{O}\big(m \cdot W \cdot (n \cdot H_{max} + W)\big)$ derived in the [Algorithms](algorithms.md#overall-algorithmic-complexity) section under a typical "worst-case" scheduling request:

- **Locations ($m = 5$)**: The system tracks 5 major data center regions in the UK.
- **Time Blocks ($n = 1728$)**: A maximum reasonable user forecasting horizon of 6 days (144 hours) mapped to 5-minute grid intervals.
- **Workload ($W = 10,000$)**: The maximum internal discretization resolution required to accurately schedule very large multi-day LLM training jobs without significant rounding errors.
- **Block Capacity ($H_{max} \approx 100$)**: The maximum number of effective work units a high-throughput GPU cluster can theoretically process in a single 5-minute window.

Plugging these reasonable upper bounds into the complexity formula yields roughly $m \cdot n \cdot W \cdot H_{max} \approx 8.6 \times 10^9$ operations for the temporal phase, and $m \cdot W^2 = 5 \times 10^8$ operations for the spatial merge. A standard scalar execution processing over **9 billion** state transitions would easily stall the UI for multiple seconds, defeating the goal of a real-time, interactive dashboard.

While modern C++ compilers (using `-O3` and `-march=native`) are highly adept at auto-vectorizing simple loops, the data dependencies and branching within these DP state transitions proved too complex for the compiler to optimally vectorize. 

To overcome this bottleneck, we manually applied **AVX-512 SIMD (Single Instruction, Multiple Data)** intrinsics. This allows the CPU to process 16 separate 32-bit floating-point DP states simultaneously within a single instruction cycle. By effectively dividing the 9 billion operations by 16, the total vector instruction count drops to approximately $5.6 \times 10^8$. On a standard 4 GHz server core, this raw compute mathematically completes in less than 0.2 seconds, ensuring the scheduler maintains sub-second latencies even on extensive time horizons. The code snippet below demonstrates how the inner transition loop evaluates multiple state branches in parallel, calculating the optimal minimum cost transitions far faster than a standard scalar approach.

```cpp
--8<-- "code/scheduler/src/SchedulerAlgo.hpp:131:179"
```

Complementing the SIMD core, the architecture employs **lock-free queues** to manage incoming scheduling requests without thread contention, and utilizes C++23 coroutines alongside asynchronous I/O to fetch forecast data without blocking the computational threads. This ensures that the raw computational speed of the DP engine is never bottlenecked by API or database latency.

For a theoretical overview of the dynamic programming algorithm that these optimizations accelerate, see the [Algorithms](algorithms.md) page.

---

## Forecasting Service (Stats Component)

The forecasting service is implemented as a **FastAPI** application in Python, leveraging the **Direct-XGBoost** model. It performs the following steps:

1. **Data Ingestion**: Periodically fetches real-time regional carbon data and weather forecasts.
2. **Feature Engineering**: Generates cyclical time features and integrates 11 raw weather features from the Open-Meteo API.
3. **Inference**: Produces a 336-step forecast (7 days) for each of the 5 UK regions.
4. **API Delivery**: Exposes the forecasts via a REST API, which the C++ Scheduler consumes concurrently using asynchronous coroutines.

For details on the forecasting experiments and accuracy, see the [Algorithms](algorithms.md) page.
