# Implementation

> [!DANGER]  
> signpost frameworks libraries used (explain why and **how** (do not storytell) they're used)  
> ensure all core sub-components and features are included. this is not a selective demonstration but must show everything.

This page details how the key features of the Carbon-Aware AI Agent were implemented, focusing on the technical translation from user requirements to algorithmic execution.

## `scheduler`

`scheduler` is the C++ scheduling component that performs the computational optimization of distributing AI workloads across multiple data centers and time horizons to minimize carbon emissions, following the principles of carbon-aware computing \[4\] and utilizing metrics such as the Software Carbon Intensity (SCI) standard \[5\].
 The following sections trace the lifecycle of a scheduling workflow, request-to-response, highlighting design principles, interactions between sub-components, and engineering decisions made around specific constraints.

### 1. Request Ingress & Framework Selection

As documented in [System Design](system-design.md), the primary programmatic interface to the scheduler is its HTTP API. We required a robust networking solution that could handle high-resolution time-series data without introducing latency bottlenecks. While low-level networking libraries like `boost::asio` provide the necessary primitives for raw TCP communication, we opted for a high-level web framework to focus development effort on our core optimization logic rather than HTTP protocol parsing and session management.

#### The Drogon Framework

We selected [Drogon](https://github.com/drogonframework/drogon) because of its mature coroutine ecosystem—one of the few C++ libraries to provide first-class support for modern asynchronous I/O. Our choice was driven by several project-specific needs:

* **API Abstraction vs. Raw Networking**: While libraries such as `boost::asio` are excellent for general-purpose networking, Drogon's MVC structure allowed us to design a clean REST API using declarative routing and middleware, shielding our business logic from HTTP/1.1 protocol complexities.
* **Integrated Persistence Layer**: We leveraged Drogon's coroutine-aware PostgreSQL ORM (`CoroMapper`) to persist calculated schedules. This integration allowed us to execute thousands of batch inserts into the `jobs` table asynchronously, ensuring the persistence layer remains as non-blocking as the optimization engine itself.
* **Modern C++ Standards & Popularity**: Drogon's native support for C++20 allowed us to return `drogon::Task<T>` from our controllers, enabling us to `co_await` results from the `SchedulingQueue` without blocking the underlying event loop threads. As a widely used and mature framework, it provided a stable environment for implementing our critical backend services.

#### HTTP Controller

The `ScheduleController` defines API endpoints as C++20 coroutines. This design eliminates the "callback hell" typically associated with asynchronous C++ networking, allowing us to express the non-linear scheduling computation as sequential, procedural code. When a controller `co_await`s a result from the `SchedulingQueue`, it yields execution back to the framework's thread pool, preventing OS thread starvation.

#### Deserialization & Validation

A key design pattern was Drogon's request deserialization customization points: any type can be automatically deserialized from request data by specializing an appropriate override of the `fromRequest<T>` method. This allowed us to decouple HTTP parsing and validation from the controller logic.

For such a Data Transfer Object,

```cpp
struct JobRequest {
    double workload_amount;
    time_t earliest_start;
    // ...
};
```

We define a overload of `fromRequest(HttpRequest) -> JobRequest` with arbitrary logic:

```cpp
namespace drogon {
template <>
inline auto fromRequest(const HttpRequest &req) -> scheduler::JobRequest {
    const auto &json = *req.getJsonObject();
    // Perform type-safe validation & domain translation
    if (json["gpu_count"].asInt() <= 0) 
        throw ValidationException("Invalid GPU count");
    
    // Construct our DTO and return
    return JobRequest{ .workload_amount = ... };
}
}
```

...and by simply putting the `JobRequest` type into the parameter list of a controller method,
its endpoint will automatically accept and deserialize the relevant data:

```cpp
auto calculateSchedule(HttpRequestPtr, JobRequest req) -> Task<HttpResponsePtr> {
    // 'req' is already validated and ready for use
    ...
}
```

Not only does such a pattern reduce controller bloat by extracting deserialization and validation code out of the controller body, but as `fromRequest` can be defined anywhere (thanks to Argument-Dependent Lookup), it is always placed together with the definition of its struct to make future refactorings and extensions safer from "missed code".
Furthermore, unlike approaches like a `.validate()` instance method on the struct, this keeps the struct an aggregate (see the benefits described in [Aggregate Types](#aggregates))

#### Workload Parameter Normalization

A user-experience challenge was in bridging the gap between how AI engineers quantify workloads and how the scheduler operates on scalar quantities internally.
Users prefer to input workloads in _natural_ units, e.g., "I need to train this 70B parameter model for 10 hours on 16 H100 GPUs", but such data is unusable to the scheduler as model sizes and GPU specs wildly vary.
We needed a scientific model to unify such "natural" inputs into some standard unit. Our [Hardware Research](research.md#hardware-research) revealed such an common denominator: the measurement of compute in Floating Point Operations (FLOs).

We consequently implemented a Domain Model Translation (the `HardwareConversion` utility) layer that computes an accurate FLO measurement for any given natural input using GPU hardware specification.

Given a GPU model's throughput in FLOs per second (FLOPS), we can multiply by runtime to obtain an absolute FLO figure.
Together with Thermal Design Power (TDP) we can obtain an electrical efficiency in FLO/s/W, standardized as FLO/kWh.
In addition, the VRAM bus speed provides a rough estimate on costs to load and transfer models, affecting the Startup Penalty (a constraint of the [Algorithm](algorithms.md#constraints)).

| Natural Parameter | Effect on FLO |
| :--- | :--- |
| **GPU Model** | Determines peak FLOPS (linearly scales workload), idle power and TDP (inversely scales power efficiency), and bus speed (inversely scales model transfer costs) |
| **GPU Count** | Linearly scales max power and workload magnitude. |
| **Model Size (GB)** | Determines the time and energy cost of model weight transfers. |
| **Runtime (Hrs)** | Linearly scales the total workload magnitude. |

This ensures the optimization engine operates on universal metrics (Compute in FLO and Energy in kWh) without needing architecture-specific logic.

### 2. Concurrency & Queueing Logic

The scheduler requires a strictly "frozen" snapshot of infrastructure state (existing reservations and available capacity) to ensure mathematical correctness. Concurrent processing of two schedules would create a data race where multiple instances assume some same free capacity, leading to over-provisioning and infeasible deployment plans.

We resolved this by serializing individual scheduling computations through a **lock-free coroutine queue**. This architecture decouples the optimization hot-path from the HTTP event loop, allowing the system to process requests sequentially while remaining responsive to concurrent API traffic.

#### Design Rationale: Sequential Cooperative Scheduling

While the optimization engine is compute-intensive, the overall scheduling workflow is a mix of I/O-bound data fetching and CPU-bound calculation. By implementing scheduling tasks as C++20 coroutines, we achieved several architectural goals:

* **Cooperative Yielding**: Tasks can suspend during I/O boundaries (e.g., awaiting carbon forecasts or database snapshots), yielding the background thread to other queued tasks.
* **Zero-Lock Serialization**: The queue ensures that while multiple tasks can be "in-flight" (suspended awaiting data), only one coroutine instance enters the critical DP computation at a time. This guarantees a stable resource snapshot without the overhead of global mutexes.
* **Event Loop Integrity**: By offloading the queue to background worker threads, we ensure that 9-billion-transition optimizations never block the main HTTP event loop, preserving low-latency responses for other API endpoints.

#### The Producer-Consumer Pattern

We designed the `SchedulingQueue` as a bridge where the HTTP thread (the producer) pushes a `SchedulerTask` and immediately yields, while a background coroutine (the consumer) pops and executes them.

We designed the `SchedulingQueue` as a bridge where the HTTP thread (the producer) pushes a `SchedulerTask` and immediately yields, while a background coroutine (the consumer) pops and executes them.

```cpp
// 1. Controller pushes request to the queue
auto output = co_await schedulingQueue.computeSchedule<Scheduler>(job_request);

// 2. Queue wraps request in a task and yields execution
auto computeSchedule(const JobRequest &req) -> Task<SchedulerOutput> {
    auto task = make_shared<SchedulerTask>(make_unique<Sched>(...), req);
    push_back(task.get());
    co_return co_await *task; // Suspends until consumer resumes it
}
```

#### Lock-Free Concurrency & Lost-Wakeup Prevention

We utilized `boost::lockfree::queue` for zero-contention task storage. A dedicated background coroutine (`runTasks`) acts as the consumer. A critical concurrency edge-case occurs when the queue drains: the worker might flag itself as `running = false` at the exact nanosecond a new request arrives. We eliminated this "lost wakeup" race by implementing a robust double-checked atomic pattern:

```cpp
auto runTasks() -> Task<> {
start:
    while (Q.pop(task)) { ... } // Process all available tasks

    running.store(false, memory_order_release);

    // Double-check: did a task arrive during the store?
    if (queueSize.load(memory_order_acquire) > 0) {
        if (running.compare_exchange_strong(expected_false, true)) {
            goto start; // Safely resume processing
        }
    }
}
```

#### C++20 Coroutine State Machine (`SchedulerTask`)

To coordinate results across thread boundaries, we developed `SchedulerTask`, a custom awaitable utilizing a lock-free state machine (`Pending`, `Suspended`, `Done`).

Managing its lifecycle is challenging due to the "suspension race condition": the worker might finish calculating before the HTTP thread has fully suspended. We solved this by using an atomic `compare_exchange_strong` in `await_suspend`.

```cpp
auto await_suspend(coroutine_handle<> handle) {
    taskHandle.store(handle, memory_order_release);
    auto expected = State::Pending;
    // If worker already set state to Done, return false to abort suspension
    return state.compare_exchange_strong(expected, State::Suspended, memory_order_acq_rel);
}

auto resume() {
    auto expected = State::Pending;
    // If state is still Pending, worker finished before suspension
    if (state.compare_exchange_strong(expected, State::Done, memory_order_acq_rel))
        return;

    // Otherwise, resume the suspended HTTP thread
    taskHandle.load(memory_order_acquire).resume();
}
```

This guarantees that the continuation handle is never lost and ensures immediate response hand-off once computation completes.

### 3. Orchestration & Data Integration

Scheduling bridges I/O-bound data fetching with CPU-intensive optimization. `SchedulerBase` implements the execution lifecycle as a chain of **cooperative coroutines** rather than a traditional thread-per-request model, allowing us to manage complex data gathering while maintaining the strict serialization required by the engine.

#### Non-Virtual Interface (NVI) Pattern

We enforced a standard execution template across all implementations using the **Non-Virtual Interface (NVI)** pattern. This ensures that validation and data orchestration are centralized in the base class rather than being duplicated across subclasses.

```cpp
// 1. Public non-virtual interface for eager validation
auto SchedulerBase::scheduleJob(JobRequest job) -> Task<SchedulerOutput> {
    // Eagerly reject invalid requests before they enter the queue
    if (job.workload_amount < 0.) throw ValidationException(...);
    
    // 2. Delegate to the implementation-specific solver
    return doScheduleJob(std::move(job));
}
```

This pattern provides a stable entry point for the `SchedulingQueue` while guaranteeing that all scheduling requests (DP or baseline) undergo identical constraint checks.

#### Concurrent Data Fetching

Before triggering the solver, `SchedulerBase` harmonizes internal and external state via the `fetch_data` coroutine. We parallelized these disparate I/O sources using our custom `when_all` combinator (discussed in a later section) to minimize total latency:

```cpp
// getAllDatacenters() and calendar::get() run in parallel
const auto [locations, existing_schedule] = co_await coro::when_all(
    stats_api.getAllDatacenters(job.preferred_datacenter, interval),
    calendar::get(time_start, time_end)
);
```

#### Temporal Alignment (`TIME_GRIDDER`)

The optimization algorithm operates on dense arrays where each index represents a discrete time interval. While external data points are associated with explicit timestamps, using these directly in the scheduling engine would be computationally inefficient and prone to alignment errors.

We implemented `TIME_GRIDDER` as a global singleton instance to provide a consistent mapping between real-world timestamps and integer indices. By using the Unix epoch as a universal "alignment" point, the utility ensures that every 5-minute interval is anchored identically across the entire system. This eliminates ambiguity in how the grid aligns with real time, allowing the scheduler to reliably transform `std::chrono::time_point` values into constant-time array offsets while maintaining strict temporal synchronization between disparate data sources.

### 4. The Optimization Engine (`SchedulerAlgo`)

The engine core implements a custom Dynamic Programming (DP) algorithm designed to minimize carbon emissions across distributed infrastructure. While the [Algorithms](algorithms.md) page provides a formal mathematical definition of the [Objective Function](algorithms.md#the-objective-function) and its [Constraints](algorithms.md#constraints), this section details the technical implementation required to realize that theory at scale.

#### Real-World Discretization

The scheduling problem is theoretically continuous, but we realize it as a deterministic state space by discretizing all physical quantities. We transform the requested workload into high-resolution discrete units (default 10,000 levels). This discretization is critical because the continuous version of the problem—resembling a non-linear knapsack problem with step-discontinuity penalties—is mathematically intractable \[1\]. By mapping the request to a discrete 2D grid of $m$ locations and $n$ time blocks, we ensure the global optimum is computationally reachable through Dynamic Programming transitions \[2\].

To understand the scale of this task, we evaluate the exact upper-bound time complexity $\mathcal{O}\big(m \cdot W \cdot (n \cdot H_{max} + W)\big)$ under a typical "worst-case" request:

* **Locations ($m = 5$)**: 5 UK regions.
* **Time Blocks ($n = 1728$)**: A 6-day (144-hour) horizon at 5-minute intervals.
* **Workload ($W = 10,000$)**: High-resolution discretization for large training jobs.
* **Block Capacity ($H_{max} \approx 100$)**: Maximum throughput per 5-minute window.

Plugging these bounds into the formula yields roughly $8.6 \times 10^9$ operations for the temporal phase. A standard scalar execution processing over **9 billion state transitions** would stall the UI for multiple seconds, defeating the goal of a real-time, interactive dashboard.

#### Layered Dynamic Programming

To manage this high-dimensional state space, the solver is partitioned into two distinct stages:

| Phase | Scope | Algorithm |
| :--- | :--- | :--- |
| **Temporal (`calc_single()`)** | Single Datacenter | 2D DP solving a **resource allocation** problem while enforcing the $P$ penalty. |
| **Spatial (`calc_multiple()`)** | Multi-Region | Solves a **Multiple-Choice Knapsack Problem** to distribute the total workload across regional cost curves. |

This decomposition allows us to isolate the most compute-intensive logic (`calc_single`) and apply targeted hardware optimizations to it, while the spatial phase focuses on aggregating results from multiple regions.

#### Effective Work Transformation

To enforce the [Startup Penalty](algorithms.md#constraints) $P$ without increasing the DP dimensionality, we implemented an **Effective Work** transformation inside the temporal phase. Instead of tracking the number of "starts" as a separate state variable, we adjust the workload increment during transitions:
$$\sum w_i - k \cdot P \geq W$$
where $k$ is the number of contiguous execution runs. By defining the DP state $dp[i][w][state]$ around this effective work $w$, the engine naturally penalizes non-contiguous allocations during the single-location temporal phase without the exponential complexity of an additional state dimension.

#### Profiling and Bottleneck Identification

We profiled the initial scalar implementation using Linux `perf` sampling at 997 Hz to identify microarchitectural bottlenecks. Hardware performance counters revealed three critical issues:

1. **Cache Thrashing**: An L1 data cache miss rate of ~25% caused by scattered memory access patterns.
2. **Instruction Throughput**: A poor 0.85 instructions per cycle (IPC) in the DP hot-path due to complex scalar branching.
3. **Allocator Contention**: Dynamic memory allocations (`operator new`/`delete`) inside the innermost loops consumed roughly 22% of total execution time.

Interactive flame graphs localized these overheads, revealing that while `calc_single` accounted for ~90% of inclusive execution time, only ~42% was actual computation—the rest was management overhead from naive data layouts and repetitive allocation patterns.

[**Open Interactive Flame Graph — Scalar Baseline (Before Optimization)**](images/benchmarks/flamegraph_before.svg){ target="_blank" }  
Hover over frames to see sample counts and self-percentages.  
Click to zoom into a specific subtree (e.g., `calc_single`).  
Ctrl+F to search for specific symbols (e.g., `operator new`).  

The profiling session exposed four dominant sources of overhead inside the DP hot-path:

| Overhead source | Inclusive % | Root cause |
|---|---|---|
| `operator new` / `operator delete` | **~22%** | `MemoEntry` vectors dynamically allocated/freed on every DP state transition. |
| `MemoEntry::operator=` / `MemoEntry::MemoEntry` | **~7%** | AoS layout forced per-struct `memcpy` on every path-reconstruction update. |
| `vector<MemoEntry>::_M_realloc_insert` | **~7%** | Inner-loop vectors repeatedly resized, triggering `memmove` bulk copies. |
| `cost_lookup` (hash table) | **~6%** | Cost values recalculated via `std::unordered_map` lookup per transition. |

These metrics directly dictated the sequence of our refactoring efforts: removing allocations, flattening memory structures, and finally applying SIMD. Each of the three optimizations below directly addresses one or more of these overhead categories.

#### Hardware-Level Optimizations (SIMD)

We eliminated the latencies identified during profiling through targeted instruction-level engineering, focusing on the `calc_single` hot-path:

* **Hot-Path Refinement (Removing Allocations)**: We eliminated allocator overhead by removing all dynamic memory allocations from the hot-path. DP tables are pre-allocated once using aligned memory and reused across transitions, removing the **22%** `operator new` cost and associated `vector` reallocations. Additionally, we replaced expensive `std::unordered_map` cost lookups with constant-time memory indexing.
* **Flattening Memory Structures (SoA)**: We refactored memoization tables from an **Array of Structs (AoS)** to **Struct of Arrays (SoA)**. By grouping fields (such as `costs` and `parents`) into contiguous memory, we reduced L1 cache misses by **~25%**, as the CPU no longer loads irrelevant reconstruction metadata (parents) during the primary cost-update cycles.
* **SIMD Vectorization & Branchless Logic**: To improve instruction throughput, we manually vectorized the innermost DP transition loop using **AVX2 and AVX512 intrinsics**. By leveraging the non-decreasing nature of our cost function, we implemented branchless logic that allows the CPU to process 8 floating-point states per instruction cycle.

```cpp
// SIMD vectorized transition: 8 floating-point ops per cycle
const auto add_cost = _mm512_loadu_pd(&cost_table[wi]);
const auto new_cost = _mm512_add_pd(prevxV, add_cost);
const auto row0V = _mm512_loadu_pd(&row0[targetRowIndex]);

// Branchless update using mask-based stores
const auto mmask = _mm512_cmp_pd_mask(new_cost, row0V, _CMP_LT_OS);
if (mmask) {
    _mm512_mask_storeu_pd(&row0[targetRowIndex], mmask, new_cost);
    _mm256_mask_storeu_epi32(&memo_entry.alloc[targetRowIndex], mmask, wiV);
}
```

* **Aligned Allocation**: We utilized `boost::alignment::aligned_allocator` to ensure DP vectors are boundary-aligned with the 64-byte width of AVX512 registers, avoiding the performance penalties of unaligned memory access.

The combined impact of these optimizations can be seen in the improved instruction throughput and eliminated memory overhead:

[**Open Interactive Flame Graph — Optimized Implementation (After Optimization)**](images/benchmarks/flamegraph_after.svg){ target="_blank" }

#### Parallel Execution Strategy

The scheduler's two-phase design was specifically architected to minimize synchronization overhead by isolating independent computation blocks. We performed a **data dependency chain analysis** to identify opportunities for concurrent execution:

* **Regional Independence**: Each instance of `calc_single()` operates on a strictly local dataset (one datacenter's load, capacity, and carbon forecasts). Because these computations share no mutable state, they are "embarrassingly parallel." We utilize `std::async` to trigger regional solvers concurrently, achieving near-linear speedup relative to the number of data centers.
* **Row-Wise Spatial Parallelism**: In the spatial (multi-region) phase, we identified that while updates to a single DP state $dp[w]$ depend on the previous regional row, updates _across_ different workload levels $w$ within the same row are independent. This allows us to parallelize the inner-loop updates across the workload dimension $W$ (10,000 discrete levels).

We implemented these patterns using modern C++ **execution policies** (`std::execution::par_unseq`):

```cpp
// Parallel row-wise update of the knapsack DP table
for_each(execution::par_unseq, w_range.begin(), w_range.end(),
         [&](const auto w) {
             for (const auto k : views::iota(0, w + 1)) {
                 // ... update next_dp[w] with min cost
             }
         });
```

By leveraging `std::execution`, we realized several engineering benefits:

1. **Standardization**: We avoid vendor-specific lock-in (like OpenMP or Cilk), ensuring the codebase remains compliant with the ISO C++ standard and portable across modern toolchains.
2. **Declarative Optimization**: The declarative nature of execution policies allows the compiler and runtime (such as **Intel oneTBB**) to autonomously determine the optimal thread distribution and vectorization strategy based on the target hardware's microarchitecture.
3. **Code Expressiveness**: Moving from manual thread management to standard algorithms significantly improves code readability, clearly expressing the _intent_ of parallelism rather than the _mechanics_ of worker-thread orchestration.

This approach reduces manual data-flow management and ensures that the merge phase scales effectively with high discretization resolutions.

### 5. Persistence & Global State (`Calendar`)

After the engine computes the optimal workload distribution, the results must be persisted to provide a consistent view of future resource availability. We utilize a PostgreSQL database as the authoritative source of "Infrastructure State." The `Calendar` sub-system manages all interactions with the backend, ensuring that every scheduling decision is backed by a persistent resource reservation.

#### The Data Mapper Pattern

To maintain a clean separation of concerns, the core scheduling engine operates purely on `InternalBlock` aggregate types—lightweight structs devoid of database IDs or persistence logic. We implemented a **Data Mapper layer** in the `mappers` namespace to handle transformations between internal domain objects and Drogon ORM models.

```cpp
// Transform internal blocks into database-ready models using ranges
for (auto&& jobModel : output.blocks | views::transform(mappers::toDto.withImpactId(impactId))) {
    co_await context.jobsMapper.insert(jobModel);
}
```

This decoupling allowed us to iterate on the optimization algorithm independently of the database schema, ensuring that persistence logic never leaked into the mathematical solver.

#### Transactional Integrity

We leveraged Drogon's asynchronous transaction API (`newTransactionCoro()`) to ensure the integrity of our multi-table persistence. When a job is accepted, the system must write both a high-level `ImpactModel` and thousands of individual 5-minute `JobModel` execution blocks.

By executing these inside an atomic transaction, we guarantee that no "orphaned" impacts are created if a network failure occurs mid-write. This ACID-compliant approach maintains the consistency of the global capacity snapshot used by subsequent scheduling requests.

#### Comparative Evaluation

To quantify the environmental benefit of our optimization, the system calculates a baseline via the `TrivialScheduler`. This schedules the job at the earliest possible window without carbon awareness. We persist both results to the database, enabling the UI to render a direct side-by-side comparison of the emissions saved.

### 6. Data Structure Design

We optimized internal data structures to prioritize memory density, type safety, and thread-safe value semantics.

#### Aggregate Types & PODs {: #aggregates}

We modelled system entities—such as `JobRequest` and `ScheduleSummary`—as **Aggregate Types** and **Plain Old Data (POD)**. This design guarantees zero-overhead object passing and dense memory layouts. We utilized modern C++ **designated initializer lists** to ensure objects are constructed in a single, type-safe expression:

```cpp
// Explicit construction via nested designated initializers
auto summary = scheduler::ScheduleSummary{
    .scheduleId = schedule_id,
    .impact = {
        .carbon_intensity = 152.5,
        .total_emissions = 1200.0,
        .total_electricity = 7800.0
    },
    .startTime = "2024-03-27T10:00:00Z",
    .locations = {"UK-North", "UK-South"},
    .totalLoad = 500000.0,
    .blockCount = 48
};
```

This pattern eliminates "partially initialized" states and provides explicit named-parameter semantics, which significantly reduces field-assignment errors compared to traditional constructor or setter patterns.

#### Move Semantics & Efficiency

The system strictly enforces **Move Semantics** to eliminate redundant copies of large data structures, which is critical when handling multi-day scheduling results containing thousands of intervals.

For instance, the `SchedulerBase::fetch_data` method constructs regional load and capacity vectors locally and then "moves" them into the final `SchedulerData` object using `std::move`. This ensures that the underlying memory is transferred rather than copied, reducing the overhead of data ingestion:

```cpp
// Moving large time-series vectors into the collection
data.loads_f.push_back(std::move(load));
data.capacities_f.push_back(std::move(capacity));
data.carbon_intensities_f.push_back(std::move(carbon_intensity));
```

Similarly, the `SchedulingQueue` uses move semantics to return computed results from the background worker thread to the awaiting HTTP handler, ensuring that the transition from calculation to response delivery is as thin as possible.

#### Recursive Serialization via Niebloids

To avoid repetitive boilerplate code for JSON serialization, we implemented a concept-driven **niebloid** pattern. By defining a custom `Serializable` concept and a `toJson` function object, we enabled recursive serialization of complex nested containers (e.g., `std::vector<T>`, `std::optional<T>`).

```cpp
// 1. Customization point discovers overloads via ADL
template <typename T>
concept Serializable = requires(const T &obj) {
    { f_toJson(obj) } -> std::convertible_to<Json::Value>;
};

// 2. Niebloid function object for recursive discovery
inline constexpr struct {
    auto operator()(const Serializable auto &obj) const {
        return f_toJson(obj);
    }
} toJson{};

// 3. Recursive overload for STL containers
template <Serializable T>
auto f_toJson(const std::vector<T> &vec) -> Json::Value {
    auto res = Json::Value(Json::arrayValue);
    for (const auto &elem : vec) res.append(toJson(elem)); // Recurse
    return res;
}
```

This architecture allows new domain structs to become serializable simply by providing a symmetric `f_toJson` free function, which the `toJson` niebloid automatically discovers through Argument-Dependent Lookup (ADL).

### 7. Core Utilities (`scheduler::coro`)

The scheduler relies on custom asynchronous primitives to coordinate complex I/O operations. The most critical utility is our **Lock-Free `when_all` Combinator**, which we developed to parallelize regional forecast fetching across the Stats API and database.

#### Thread Coordination & Race Prevention

Coordinate results from multiple background worker threads required a robust, lock-free state machine. Our `when_all` implementation utilizes a shared `ResultContext` to manage task lifecycles:

```cpp
// Lock-free completion logic
void complete_one() {
    // 1. Atomically decrement task counter
    if (remaining.fetch_sub(1, memory_order_acq_rel) != 1)
        return; // Other tasks still in-flight

    // 2. The final task atomically exchanges the continuation handle
    auto old_handle = continuation.exchange(WAITING_CONTINUATION, memory_order_acq_rel);

    // 3. Resume the parent coroutine if it has already suspended
    if (old_handle != NO_CONTINUATION)
        old_handle.resume();
}
```

* **Suspension Bypassing**: We implemented an atomic `continuation` state to handle "fast-path" cases where all children finish before the parent coroutine can even suspend. In these instances, the parent detects the `WAITING_CONTINUATION` state and bypasses the suspension overhead entirely.

#### Generic Metaprogramming

We utilized **C++20 Concepts** and **Fold Expressions** to allow the combinator to accept heterogeneous task types. It dynamically resolves return types to package results into an `std::tuple` or an `std::vector`, providing a type-safe interface for concurrent operations.

#### Atomic Exception Capture

To handle network failures robustly, we implemented a lock-free exception capture mechanism using an atomic three-state flag (`NO_EXCEPTION`, `IN_PROGRESS`, `CAPTURED`). If multiple asynchronous operations fail simultaneously, only the first thread wins the atomic race to move its `std::exception_ptr` into the shared context, ensuring that the parent coroutine rethrows the first encountered error for clean abortion.

## `stats` (Forecasting Service)

The Stats service is a **FastAPI** application in Python, deployed on a dedicated **Oracle Cloud** instance, that continuously ingests carbon intensity data, trains a Ridge regression model \[3\] per data center, and serves 7-day carbon intensity forecasts at 5-minute resolution to the C++ Scheduler via a REST API.
 For details on model selection and experimental comparison against alternative approaches, see the [Research — Forecasting Model Research](research.md#forecasting-model-research) page. The full experimental data is documented in the [AI Research Journal](dev-journal.md).

### Service Architecture {#deployment-performance-rationale}

The Stats service is implemented using **FastAPI**. We selected this framework for its high-throughput asynchronous execution (utilizing the Starlette ASGI toolkit) and its native integration with **Pydantic** for schema validation. This architectural choice mirrors the type-safety and non-blocking I/O goals of our C++ backend, allowing the Python forecasting layer to remain responsive even during intensive model retraining cycles.

The service is structured around three background threads that operate on two SQLite databases, with an in-memory model cache sitting between the data layer and the API layer. A detailed architectural diagram of this pipeline is provided in [System Design — Stats Component](system-design.md#stats-component-internal-architecture).

Deploying the Stats service on a separate Oracle Cloud instance prevents its heavy Python workloads — year-long time series processing, multi-million-row feature matrices during cold-start training — from bottlenecking the latency-sensitive C++ Scheduler. This separation keeps the Scheduler's host free for SIMD-optimised DP computation while the Stats service scales independently, communicating over HTTP as described in [System Design](system-design.md).

### External Data Sources & Sampling Interval

The service consumes two external APIs:

| API | Data Provided | Granularity | Role |
|:----|:-------------|:------------|:-----|
| **UK Carbon Intensity API** | Regional carbon intensity (gCO₂/kWh) for 14 UK regions | **30-minute slots** | Training labels — the values the model learns to predict |
| **Open-Meteo Archive API** | Historical hourly weather (temperature, wind, solar, pressure, etc.) | Hourly (resampled to 30 min) | Training features — weather conditions that correlate with carbon intensity |
| **Open-Meteo Forecast API** | 8-day weather forecast | Hourly (resampled to 30 min) | Inference features — future weather used when generating predictions |

All internal data is stored and processed at **30-minute intervals** because this is the finest granularity the UK Carbon Intensity API provides. The final 7-day forecast is interpolated to 5-minute resolution (2,016 data points) before being served to the Scheduler, which operates on a 5-minute time grid.

### Data Pipeline & Storage

The service uses **two SQLite databases** with distinct responsibilities:

**`carbon_intensity.db`** — the collector-managed raw store:

* Populated by the Carbon Collector thread, which calls the UK Carbon Intensity API every 30 minutes
* On first startup, performs a **365-day backfill** to provide sufficient training history
* Stores raw readings (`carbon_readings`), region metadata (`regions`), and fuel-type generation mix (`generation_mix`)

**`cache.db`** — the serving database:

* `historical_data` — 30-minute carbon intensity readings, bulk-synced from `carbon_intensity.db` by the Carbon Sync thread
* `predictions` — JSON-serialized forecasts with TTL-based expiry (40 minutes), written by the Prediction Loop and read by API handlers
* `historical_cache` — pre-upsampled 5-minute data for the trailing 7 days, so API responses can stitch historical observations with forecast data without recomputing on every request
* `datacenters` — registry of all 14 UK data centers with active/inactive state, coordinates, and region mapping

The separation exists so the collector can write freely without contending with API read traffic, and so the serving layer has a self-contained database it can query without touching the collector's write path.

### Background Threads & Retraining Cadence

Three daemon threads run continuously after startup:

| Thread | Interval | Purpose |
|:-------|:---------|:--------|
| **Carbon Collector** | 30 min | Fetches the latest carbon readings from the UK Carbon Intensity API and inserts them into `carbon_intensity.db` |
| **Carbon Sync** | 30 min | Bulk-upserts new readings from `carbon_intensity.db` into the `historical_data` table in `cache.db` |
| **Prediction Loop** | 30 min | For each registered datacenter: retrains (or cache-hits) the Ridge model, generates a 7-day forecast, and writes it to the `predictions` table |

The 30-minute cycle aligns with the API's publication schedule — new carbon data arrives every 30 minutes, so retraining more frequently would produce identical models. The prediction cache TTL is set to 40 minutes, ensuring that a fresh forecast is always available before the previous one expires.

### Sequential Prediction Processing

Although the service runs three background threads concurrently (collector, sync, and prediction loop), the Prediction Loop itself processes data centres **sequentially** rather than spawning parallel threads per data centre. This is a deliberate constraint driven by memory: each data centre's cold-start training constructs a feature matrix of ~2 million rows × 65 columns, consuming approximately **1 GB of RAM**. Parallelising predictions across all 14 registered data centres would require up to 14 GB of concurrent memory, risking out-of-memory conditions on the deployment instance. Sequential processing caps peak memory to a single data centre's training footprint at any given time, and the [incremental training mechanism](#incremental-training-via-sufficient-statistics) ensures that after the initial cold start, each subsequent cycle's memory overhead is negligible (~58 KB per new reading).

### Incremental Training via Sufficient Statistics

Training the Ridge model from scratch involves constructing a feature matrix from the entire historical series (~17,500 rows for a year of 30-minute data, expanded to \~2 million training samples via the direct multi-step strategy described below). Rebuilding this matrix every 30 minutes would spike RAM usage to \~1 GB per datacenter — an unnecessary cost given that only one or two new readings arrive each cycle.

To avoid this, the service uses **incremental Ridge updates** based on cached sufficient statistics. Ridge regression has a closed-form solution:

$$\mathbf{w} = (\mathbf{X}^T\mathbf{X} + \alpha \mathbf{I})^{-1} \mathbf{X}^T\mathbf{y}$$

Crucially, the matrices $\mathbf{X}^T\mathbf{X}$ (the Gram matrix) and $\mathbf{X}^T\mathbf{y}$ are **additive** — they can be accumulated incrementally without storing the full training matrix. This means we can save these compact statistics after the initial training and update them with only the new data, then re-solve the 65 $\times$ 65 linear system with negligible latency.

Each datacenter's model state is stored in an in-memory dictionary containing:

| Cached Statistic | Shape | Purpose |
|:-----------------|:------|:--------|
| `XtX` | $(65, 65)$ | Gram matrix in scaled space |
| `Xty_raw` | $(65,)$ | Cross-product $\mathbf{X}^T\mathbf{y}$ |
| `scaler` | `StandardScaler` | Feature normaliser, frozen after cold start |
| `alpha` | scalar | Regularisation strength from initial `RidgeCV` |
| `coef`, `intercept` | $(65,)$, scalar | Current model parameters |
| `n_train` | int | Number of training points at last update |

The prediction cycle works in two modes:

1. **Cold start** (first run per datacenter): builds the full ~2M-row feature matrix, fits `RidgeCV` to select $\alpha$, and caches the sufficient statistics and scaler. This runs under a threading lock with a double-check pattern to prevent duplicate work across threads.
2. **Warm update** (new data arrived, `n_train` increased): builds feature rows only for the new data points, transforms them using the frozen scaler, and accumulates them into the existing Gram matrix and cross-product. Re-solving the $65 \times 65$ system is computationally efficient. For a single new 30-minute reading, this produces ~112 rows $\times$ 65 columns $\approx$ **58 KB** of new data — versus ~1 GB for a full rebuild.

This design ensures that after the one-time cold start, the service never rebuilds the full training matrix. Every subsequent 30-minute cycle processes only the incremental data, keeping peak memory usage low and retraining effectively real-time.

### The Ridge Regression Predictor (`ridge_enhanced.py`)

#### Direct Multi-Step Forecasting

The predictor uses a **direct forecasting** strategy: rather than predicting one step ahead and iterating (which accumulates errors), it trains a single model that can predict the carbon intensity at _any_ future time step given the current state. The forecast horizon is encoded as an input feature, so the model learns how prediction difficulty varies with distance from the origin.

Concretely, during training, the model sees examples of the form:

> _"Given that the historical series looks like **X** at origin time $t_0$, and we want to predict $h$ steps into the future, the carbon intensity at $t_0 + h$ is $y$."_

This is achieved by sliding over all valid origin points in the training history and, for each origin, generating training samples for every horizon $h \in [1, 336]$ (336 half-hours = 7 days). To keep the training matrix manageable, origins are subsampled by a factor of 3.

#### Feature Engineering (65 Features)

Each training sample is described by **65 engineered features** drawn from five groups:

**1. Temporal Features (22 features)** — Fourier-encoded cyclical time signals that capture periodic patterns in carbon intensity:

* 12 features for **hour-of-day**: $\sin$ and $\cos$ at harmonics $k = 1, \ldots, 6$ of $\frac{2\pi \cdot \text{hour}}{24}$. Higher harmonics capture sharper intra-day patterns (e.g., the evening peak) that a single sine wave would smooth over.
* 4 features for **day-of-week**: $\sin$ and $\cos$ at harmonics $k = 1, 2$ of $\frac{2\pi \cdot \text{dow}}{7}$. Captures the weekday/weekend demand cycle.
* 4 features for **day-of-year**: $\sin$ and $\cos$ at harmonics $k = 1, 2$ of $\frac{2\pi \cdot \text{doy}}{365.25}$. Captures seasonal variation (e.g., higher gas generation in winter).
* 1 **weekend flag**: binary indicator for Saturday/Sunday.
* 1 **night flag**: binary indicator for hours outside 06:00–22:00.

**2. Horizon Encoding (4 features)** — Tells the model how far into the future it is predicting:

* $h_{\text{norm}} = h / 336$ (linear)
* $h_{\text{norm}}^2$ (quadratic)
* $h_{\text{norm}}^3$ (cubic)
* $\log(1 + h) / \log(337)$ (logarithmic)

The polynomial and logarithmic encodings allow the model to learn non-linear degradation of prediction confidence with increasing horizon.

**3. Origin Summary Statistics (13 features)** — A statistical snapshot of the carbon intensity series at the origin point, computed via rolling windows:

| Feature | Window | Description |
|:--------|:-------|:------------|
| `last_value` | — | The most recent carbon intensity reading |
| `mean_24h`, `std_24h`, `median_24h`, `min_24h`, `max_24h` | 48 steps (24h) | Distribution of the last 24 hours |
| `mean_7d`, `std_7d` | 336 steps (7d) | Longer-term average and variability |
| `last_diff` | — | First difference (rate of change) |
| `trend` | 24 vs 48 steps | Slope between short and long moving averages |
| `lag_24h`, `lag_7d` | — | Values exactly 24h and 7d ago (same time yesterday / last week) |
| `same_hour_mean` | All history | Running mean of all past values at the same half-hour slot |

These features give the model a rich characterisation of "where the series is right now" — its level, volatility, trend, and historical norms for the current time of day.

**4. Weather Features (16 features)** — Retrieved from Open-Meteo and aligned to the target timestamp:

* 9 raw measurements: temperature, relative humidity, dewpoint, pressure, cloud cover, wind speed, wind gusts, solar radiation, precipitation
* Wind direction encoded as $\sin$ and $\cos$ components (avoids the 359°→0° discontinuity)
* 5 engineered derivatives:
  * **Wind power** ($\text{speed}^3 / 1000$) — proxy for wind generation potential (power scales cubically with speed)
  * **Wind ramp** (first difference of speed) — captures sudden changes in wind generation
  * **Pressure change** (first difference) — indicates incoming weather fronts
  * **Solar clearness** (radiation / 1000) — normalised solar availability
  * **Temperature deviation** (current temp minus 7-day rolling mean) — captures unusual temperature events

Weather data is fetched from the Open-Meteo Archive API for training and the Open-Meteo Forecast API for inference, then resampled from hourly to 30-minute resolution via linear interpolation. Historical weather is cached to disk (as pickled DataFrames) to avoid redundant API calls.

**5. Interaction Terms (10 features)** — Cross-products between feature groups that capture conditional relationships:

* `last_value × horizon` — how the current level modulates forecast uncertainty at distance
* `weekend × hour_sin`, `weekend × hour_cos` — weekend-specific daily patterns
* `hour_sin × wind_speed`, `hour_cos × wind_speed` — time-dependent wind effects
* `hour_sin × solar`, `hour_cos × solar` — time-dependent solar effects
* `wind_speed × solar` — combined renewable generation signal
* `temperature × hour_sin` — temperature-dependent demand patterns
* `last_value × wind_speed` — current carbon level modulated by wind availability

#### Training & Inference

**Initial training** (cold start) is deterministic and fast (under 1 second). The 65-feature matrix is standardised using `StandardScaler` (zero mean, unit variance), then passed to `RidgeCV` — a Ridge regression with built-in leave-one-out cross-validation over 8 regularisation strengths $\alpha \in \{0.01, 0.1, 0.5, 1, 5, 10, 50, 100\}$. `RidgeCV` automatically selects the $\alpha$ that minimises the cross-validated error, balancing model complexity against overfitting. After this initial fit, the sufficient statistics and scaler are frozen and cached as described in the [incremental training](#incremental-training-via-sufficient-statistics) section above — subsequent cycles only process new data.

**Inference** applies the frozen scaler to the test features (built from the forecast timestamps and current weather forecast), multiplies by the cached coefficient vector, and clips predictions to the physical range $[0, 500]$ gCO₂/kWh. The raw 336-step forecast at 30-minute resolution is then resampled to 5-minute resolution via linear interpolation, yielding 2,016 data points covering the next 7 days.

### REST API

The Stats service exposes the following endpoints, consumed by the C++ Scheduler and the Next.js UI:

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `GET` | `/locations` | Lists active data centers (visible to the Scheduler) |
| `GET` | `/datacenters` | Lists all data centers with coordinates and active state |
| `PATCH` | `/datacenters/{id}` | Toggles a data center's active state |
| `GET` | `/locations/{id}/metrics/forecast_carbon_intensity` | 7-day carbon intensity forecast (historical + predicted, 5-min resolution) |
| `GET` | `/locations/{id}/metrics/forecast_load` | 7-day load forecast (synthetic, 5-min resolution) |
| `GET` | `/predictionWindow` | Returns the forecast window length (168 hours) |

Forecast endpoints accept optional `start_time` and `end_time` query parameters (ISO 8601). Responses stitch together historical observations (`is_forecast: false`) with predicted values (`is_forecast: true`), giving the Scheduler and UI a seamless time series across the boundary.

## References

\[1\] S. Martello and P. Toth, _Knapsack Problems: Algorithms and Computer Implementations_. Chichester, UK: John Wiley & Sons, 1990.  
\[2\] R. Bellman, _Dynamic Programming_. Princeton, NJ, USA: Princeton University Press, 1957.  
\[3\] A. E. Hoerl and R. W. Kennard, "Ridge Regression: Biased Estimation for Nonorthogonal Problems," _Technometrics_, vol. 12, no. 1, pp. 55-67, 1970.  
\[4\] A. Radovanovic et al., "Advancing Carbon-Aware Data Centers," Google, Tech. Rep., 2021.  
\[5\] Green Software Foundation, "Software Carbon Intensity (SCI) Standard," v1.0, 2022.  
