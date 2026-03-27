# Implementation

> [!DANGER]  
> signpost frameworks libraries used (explain why and **how** (do not storytell) they're used)  
> ensure all core sub-components and features are included. this is not a selective demonstration but must show everything.

This page details how the key features of the Carbon-Aware AI Agent were implemented, focusing on the technical translation from user requirements to algorithmic execution.

## UI-Backend Orchestration

The user interface facilitates this hardware-aware scheduling through a specialized form that guides users to provide valid infrastructure specifications. For a broader overview of the microservice architecture and component interactions that support this orchestration, see the [System Design](system-design.md) page.

### The Commitment–Cancel Workflow

To ensure consistency in a shared scheduling environment, the system employs a two-phase commitment flow:

1. **Phase 1**: Upon form submission, the scheduler computes the optimal path, **immediately persists it** to the database to "reserve" the capacity, and returns the result.
2. **Phase 2**: The user reviews the optimized schedule. If they reject it, a `DELETE` request is sent to release the reserved capacity.

### Natural Units in the UI

The UI (`SchedulingForm.tsx`) allows users to select from a predefined library of industry-standard GPUs. This ensures that the parameters sent to the backend are backed by verified hardware constants (TDP, TFLOPS), maintaining the integrity of the carbon intensity calculations.

---

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
--8<-- "PseudoCode/hardwareConversion.pseudo"
```

Further information on where we get the constants, and conversion rates can be found in [Research](research.md#11-hardware-specification-references) part of this report.

## The Cost Function (`LocationCost`)

The scheduler's core optimization loop minimizes a cost function that is physically grounded in carbon emissions.

```cpp
--8<-- "code/scheduler/src/SchedulerAlgo.hpp:81:91"
```

By multiplying the workload (FLO) by the hardware's energy efficiency (kWh/FLO) and the regional carbon intensity (gCO2/kWh), the algorithm ensures that every scheduling decision is directly optimized for the lowest possible greenhouse gas impact.

---

## Web API & Drogon Framework Integration

To expose the high-performance C++ scheduling engine as a RESTful web service without introducing cross-language latency penalties, the backend is built on **Drogon**, a C++14/20 asynchronous web framework. Drogon’s non-blocking, event-driven architecture pairs perfectly with our heavy use of C++20 coroutines, ensuring that the HTTP event loop remains responsive even when processing intensive DP calculations or fetching remote API data.

### Coroutine-Based Controllers

API endpoints are defined using `drogon::HttpController`. By utilizing routing macros (e.g., `ADD_METHOD_TO`), HTTP verbs and paths are mapped directly to class methods. Crucially, every handler returns a `drogon::Task<drogon::HttpResponsePtr>`, executing entirely as a coroutine. This guarantees that when a controller needs to interact with the database or the `SchedulingQueue`, it uses `co_await` to yield execution back to the Drogon thread pool, preventing thread starvation.

### Request Deserialization & Centralized Error Handling

To maintain strict type safety and separate HTTP parsing from core business logic, we heavily utilize Drogon’s `fromRequest<T>` template specialization. When an endpoint expects a payload, Drogon automatically calls our custom specialization to unpack the `HttpRequest`. For example, `fromRequest<scheduler::JobRequest>` parses the incoming JSON body, validates ISO-8601 timestamps, checks logical constraints (e.g., `latest_finish` must be after `earliest_start`), and performs the initial hardware metric conversions.

If any constraint is violated during this step, or if an issue arises deeper in the scheduling engine, the system relies on a suite of domain-specific C++ exceptions (`ValidationException`, `SchedulingException`, and `NetworkException`). To keep the core algorithms decoupled from HTTP transport logic, we avoid scattering repetitive `try/catch` blocks across every API controller. Instead, we leverage Drogon’s application-wide exception interception mechanism.

During server initialization, we override the framework's default behavior by injecting a custom lambda into `drogon::app().setExceptionHandler()`. When an exception bubbles up from deep within the coroutine stack, this centralized handler catches it, uses `dynamic_cast` to identify the specific domain error, and automatically maps it to the most semantically appropriate HTTP status code:

- **`ValidationException` $\rightarrow$ `422 Unprocessable Entity`**: Triggered during request deserialization if the payload is malformed or violates logical constraints (e.g., a time horizon in the past).
- **`SchedulingException` $\rightarrow$ `409 Conflict`**: Thrown when a request is perfectly formatted, but the physical system state cannot satisfy it (e.g., insufficient capacity, no available locations, or an infeasible workload constraint).
- **`NetworkException` $\rightarrow$ `503 Service Unavailable`**: Raised when the backend fails to connect to or fetch necessary predictions from the Python Forecasting API.

For any recognized exception, the handler constructs a standardized JSON payload (`{"error": "<message>"}`) and safely returns it to the user. If an unexpected `std::exception` occurs, the logic gracefully falls back to Drogon's default handler, returning a `500 Internal Server Error` and preserving the application's overall stability.

### The `Serializable` C++20 Concept

Returning complex, nested data structures from controllers back to the UI requires serializing C++ domain objects into JSON. Writing manual boilerplate for every struct is error-prone. To solve this, we designed a generic, concept-driven serialization interface leveraging C++20.

We define a custom `Serializable` concept that requires a type to have an `f_toJson` overload returning a `Json::Value`. By providing baseline overloads for primitive types (`std::integral`, `std::floating_point`), `std::string`, and standard library containers (`std::vector`, `std::map`, `std::optional`), the serialization process becomes recursive and automatic.

```cpp
template <typename T>
concept Serializable = requires(const T &obj) {
    { f_toJson(obj) } -> std::convertible_to<Json::Value>;
};
```

To invoke this cleanly across the codebase, we implemented a custom niebloid (a function object similar to a Customization Point Object) named `toJson`. In the controllers, serializing a complex database response is as simple as calling `toJson(result)`.

---

## Thread-Safe Request Serialization (`SchedulingQueue`)

A critical constraint of the Dynamic Programming (DP) engine is that it requires a strictly "frozen" snapshot of the system state—specifically current data center loads, capacity, and carbon forecasts—to ensure mathematical correctness. If multiple scheduling requests were processed concurrently, the first to complete would update the global infrastructure capacity, instantly invalidating the state used by the second calculation and resulting in over-provisioning or infeasible schedules.

To resolve this while maintaining a responsive, non-blocking user interface, we designed a **lock-free coroutine serialization queue**. Instead of relying on expensive, thread-blocking mutexes that could stall the server's HTTP event loop, requests are serialized entirely through atomic state machines and C++20/23 custom awaitables.

### The Custom Awaitable (`SchedulerTask`)

When a user submits a job via the UI, the HTTP handler encapsulates the request in a `SchedulerTask`—a custom awaitable object. Managing the lifecycle of this object across concurrent threads is notoriously difficult due to the "suspension race condition": the background worker might finish calculating the schedule *before* the HTTP handler has fully suspended, which would cause the continuation handle to be lost and deadlock the request.

To prevent this, `SchedulerTask` utilizes an internal lock-free state machine (`Pending`, `Suspended`, `Done`) orchestrated via `std::atomic<State>`.

- **Race-Free Suspension:** In `await_suspend`, the controller thread stores its continuation handle (`std::memory_order_release`) and attempts an atomic `compare_exchange_strong` to transition to `Suspended`. If the worker thread has already transitioned the state to `Done` (because the schedule computed instantly), the suspension is safely aborted and the result is returned immediately.
- **Safe Resumption:** Conversely, when the worker finishes, it calls `resume()`. It attempts to transition the state to `Done` using `std::memory_order_acq_rel`. If the controller thread hasn't finished suspending yet, the worker simply exits, leaving the controller thread to fetch the result instantly rather than waiting to be woken up.
- **Exception Propagation:** If the DP engine throws an error, the `std::exception_ptr` is captured lock-free and safely rethrown in `await_resume()`, ensuring standard C++ `try/catch` blocks in the HTTP handler work flawlessly across thread boundaries.

### Lock-Free Orchestration and Lost-Wakeup Prevention

To guarantee strict serialization of the DP algorithms without blocking, the system utilizes a `boost::lockfree::queue<SchedulerTask*>` mapped to a dedicated worker coroutine (`runTasks()`).

When `push_back` is called, the task is pushed onto the zero-contention queue, and an `std::atomic<bool> running` flag is evaluated. If the worker isn't running, it is dynamically spun up via `drogon::async_run`.

A critical concurrency edge-case occurs when the queue drains: if the worker thread reads an empty queue and sets `running = false` at the exact nanosecond a new request arrives, that new request might never be processed (a "lost wakeup"). To mitigate this, the queue implements a classic double-checked lock-free pattern using an atomic `queueSize` counter (`std::memory_order_release` / `std::memory_order_acquire`). After the worker shuts down, it verifies the counter; if a task slipped in, it atomically re-acquires the `running` lock and executes a `goto start;` jump, completely eliminating the race condition.

The elegance of this lock-free architecture is best demonstrated by the dual state machines handling both the controller task's suspension and the worker's lost-wakeup prevention loop:

```cpp
--8<-- "PseudoCode/schedulingQueue.pseudo"
```

### Asynchronous I/O Efficiency

Because the worker loop (`runTasks`) executes as a `drogon::Task<>` coroutine, it inherently supports asynchronous suspension. When the DP engine finishes and the system needs to persist the reservation to the database, the worker thread `co_await`s the I/O. The thread is immediately released back to the Drogon thread pool, ensuring that even under heavy serialization, the server's CPU threads are never held hostage by database latency.

### Future Parallelism

While requests are currently serialized strictly to maintain global state integrity, the introduction of hardware power constraints opens the possibility of running non-conflicting schedules in parallel. This architectural evolution and its trade-offs are explored further in the [Possible Extensions](possible-extensions.md#3-parallel-computation-of-schedules) section.

---

## C++ Performance & SIMD Vectorization

The mathematical optimization performed by the dynamic programming solver involves vast state spaces and transitions that must be evaluated under strict latency budgets (often sub-millisecond per location) to enable real-time UI interactivity. To achieve this, the scheduler engine is implemented in **C++23** with a strong focus on data-oriented design and hardware-level performance.

To understand the necessity of this optimization, we can evaluate the exact upper-bound time complexity $\mathcal{O}\big(m \cdot W \cdot (n \cdot H_{max} + W)\big)$ derived in the [Algorithms](algorithms.md#overall-algorithmic-complexity) section under a typical "worst-case" scheduling request:

- **Locations ($m = 5$)**: The system tracks 5 major data center regions in the UK.
- **Time Blocks ($n = 1728$)**: A maximum reasonable user forecasting horizon of 6 days (144 hours) mapped to 5-minute grid intervals.
- **Workload ($W = 10,000$)**: The maximum internal discretization resolution required to accurately schedule very large multi-day LLM training jobs without significant rounding errors.
- **Block Capacity ($H_{max} \approx 100$)**: The maximum number of effective work units a high-throughput GPU cluster can theoretically process in a single 5-minute window.

Plugging these reasonable upper bounds into the complexity formula yields roughly $m \cdot n \cdot W \cdot H_{max} \approx 8.6 \times 10^9$ operations for the temporal phase, and $m \cdot W^2 = 5 \times 10^8$ operations for the spatial merge. A standard scalar execution processing over **9 billion** state transitions would easily stall the UI for multiple seconds, defeating the goal of a real-time, interactive dashboard. Therefore, we decided on multiple optimizations.

### Profiling and Bottleneck Identification

Before initiating the hardware-level optimizations, we profiled the initial scalar implementation using Linux `perf` sampling at 997 Hz to identify exact execution bottlenecks. The hardware performance counters revealed three critical issues at the microarchitectural level:

1. **Cache Thrashing:** The L1 data cache miss rate was excessively high (approx. 25%). This was traced directly to the scattered memory access patterns of the Array of Structs (AoS) architecture during spatial merges.
2. **Instruction Throughput:** The DP hot-path accounted for over 60% of total CPU time, operating at a poor 0.85 instructions per cycle (IPC) due to complex scalar branching.
3. **Allocator Contention:** Dynamic memory allocations (`operator new`/`delete`) inside the innermost loops consumed roughly 22% of the execution time.

To visualize where these bottlenecks manifested in the call stack, we generated an interactive flame graph from the same profiling session. The graph reveals that while `calc_single` (the core DP solver) accounted for **\~90% of inclusive time**, only **\~42% was actual computation** — the rest was overhead from the naive data layout and allocation patterns:

[**Open Interactive Flame Graph — Before Optimization (Scalar Baseline)**](images/benchmarks/flamegraph_before.svg){ target="_blank" }
*Hover over frames for sample counts and self-percentages; click to zoom into a subtree; Ctrl+F to search. The wide bars under `calc_single` represent overhead that the optimizations below systematically eliminated.*

The flame graph exposed four dominant sources of overhead inside `calc_single`, each mapping directly to the hardware counter anomalies above:

| Overhead source | Inclusive % | Root cause |
|---|---|---|
| `operator new` / `operator delete` | **~22%** | MemoEntry vectors dynamically allocated and freed on every DP state transition |
| `MemoEntry::operator=` / `MemoEntry::MemoEntry` | **~7%** | AoS layout forces per-struct `memcpy` on every path-reconstruction update |
| `vector<MemoEntry>::_M_realloc_insert` | **~7%** | Inner-loop vectors repeatedly resized, triggering `memmove` bulk copies |
| `cost_lookup` → hash table | **~6%** | Cost function values recalculated via `std::unordered_map` lookup per transition |

These metrics directly dictated the sequence of our refactoring efforts: removing allocations, flattening memory structures, and finally applying SIMD. Each of the three optimizations below directly addresses one or more of these overhead categories.

### Memory Layout: From AoS to SoA

The initial implementation used an **Array of Structs (AoS)** approach to store the data necessary for path reconstruction. While intuitive, this was the primary driver of the 25% L1 cache miss rate identified during profiling — accessing one field of a `MemoEntry` loaded the entire struct into a cache line, evicting useful data. We refactored these structures into a **Struct of Arrays (SoA)** format.

By grouping similar data types (like allocation units and state flags) into contiguous memory blocks, we dramatically improved cache hit rates in the L1 and L2 caches. This directly eliminated the **~7% overhead** from `MemoEntry` struct copies visible in the flame graph — contiguous arrays of scalars no longer require per-element `memcpy`. While this cache-locality optimization only yielded approximately a 33% decrease in execution time in the best-case scenarios, it was a vital prerequisite for effective vectorization, as SIMD instructions require contiguous, aligned memory lanes to operate efficiently.

### Hot-Path & Allocation Refinement

To streamline the innermost loops and address the remaining non-computational overhead, we focused on two micro-optimizations:

1. **Precomputation**: We identified that cost function values were being recalculated across different branches — the **~6% `cost_lookup`** overhead in the flame graph. We implemented a precomputation step that stores these values in a local table, replacing expensive `std::unordered_map` hash-table lookups with constant-time memory indexing.
2. **Allocation Removal**: We eliminated the **\~22% `operator new` / `operator delete`** overhead by removing all dynamic memory allocations from the hot-path. The DP tables are now pre-allocated once using aligned memory (`posix_memalign`) and reused across iterations, completely eliminating the per-transition allocator overhead and the associated **\~7% vector reallocation** cost.

Together, these refinements removed approximately 35% of the baseline execution time that was spent entirely on memory management rather than useful computation.

### SIMD Vectorization & Branchless Logic

With the memory layout flattened and allocations removed, the remaining bottleneck was the poor 0.85 IPC caused by complex scalar branching in the DP state transitions. While modern compilers are adept at auto-vectorization, the data dependencies and branching within these transitions proved too complex for the compiler to optimize. To overcome this, we manually applied **AVX-512 SIMD (Single Instruction, Multiple Data)** intrinsics.

By leveraging the non-decreasing nature of our cost function, we implemented branchless logic that allows the CPU to process multiple floating-point DP states simultaneously. While we currently use 64-bit doubles to maintain high precision—processing 8 states per instruction—the engine is architected to support 32-bit floats, which could theoretically double this throughput.

The implementation of SIMD fundamentally changed the scaling behavior of the algorithm. While extremely large workloads still require significant compute time, this optimization ensures the dashboard remains fluid for typical usage. A rigorous empirical analysis of these improvements is provided in the [Evaluation](evaluation.md/#scheduling-algorithm-hardware-specific-optimizations) section.

```cpp
--8<-- "code/scheduler/src/SchedulerAlgo.hpp:131:179"
```

Complementing the SIMD core, the architecture utilizes C++23 coroutines alongside asynchronous I/O to fetch forecast data without blocking the computational threads.

## Custom Coroutine Concurrency: The Lock-Free `when_all`

While the SIMD engine processes DP states in microseconds, that speed is entirely bottlenecked if the scheduler stalls waiting for network I/O (e.g., sequentially fetching weather and carbon forecasts for 5 different UK regions from the Python backend). To prevent this HTTP latency from stacking linearly, we needed to fire off multiple requests concurrently and await them all simultaneously. Because neither the C++23 standard library nor the Drogon framework provide a production-ready `when_all` coroutine combinator, engineering a custom, thread-safe implementation became an absolute necessity.

Building a custom `when_all` awaitable in C++ requires navigating extremely low-level compiler mechanics. The primary difficulty lies in the "suspension race condition": if the spawned network requests execute synchronously or resolve faster than the parent coroutine can suspend, the parent’s continuation handle gets lost or overwritten, resulting in a permanent deadlock.

To solve this, our `scheduler::coro::when_all` implementation relies on a highly complex, lock-free state machine orchestrated through a shared `ResultContext`. Instead of relying on expensive mutexes, thread synchronization is handled entirely via `std::atomic` operations with strict memory orderings:

- **The Shared Context & Scope Guards:** When `when_all` is invoked, it allocates a shared `ResultContext` containing an atomic `remaining` counter initialized to the number of tasks. Each child task is wrapped in a generic lambda (`detail::wrap_task`) that uses a custom `ScopeGuard`. When a child coroutine finishes (or fails), the `ScopeGuard` destructor guarantees that `complete_one()` is called, which executes an atomic `fetch_sub(1, std::memory_order_acq_rel)`. The thread that drops this counter to `0` becomes responsible for waking up the parent.
- **Race-Free Suspension:** In the parent's `Awaiter::await_suspend`, the parent attempts to register its coroutine handle using an atomic `compare_exchange_strong` against an expected `NO_CONTINUATION` state. Meanwhile, if the children finish early, the final child thread will aggressively swap the context's handle to a `WAITING_CONTINUATION` sentinel pointer. If the parent's `compare_exchange` fails because the sentinel is already there, `await_suspend` returns `false`, safely aborting the parent's suspension entirely and allowing it to instantly fetch the results.
- **Lock-Free Exception Capturing:** Handling asynchronous failures across multiple threads without crashing the server required a dedicated three-state atomic machine (`NO_EXCEPTION`, `EXCEPTION_IN_PROGRESS`, `EXCEPTION_CAPTURED`). If one of the 5 regional forecast requests throws an error, the catch block attempts to transition the state to `IN_PROGRESS`. Because of the `compare_exchange` loop, only the *first* failing thread wins this race. The winner safely moves the `std::exception_ptr` into the shared context and transitions to `CAPTURED`. The parent then checks this state in `await_resume()` and rethrows the exception, aborting the remaining operations gracefully.
- **Variadic Metaprogramming:** To make the utility universally applicable across the codebase, the template metaprogramming heavily leverages C++20 concepts (`std::invocable`) and fold expressions. It dynamically resolves return types to support both homogeneous `std::vector<drogon::Task<T>>` arrays and heterogeneous variadic arguments `drogon::Task<Rets>...`, mapping results perfectly into a `std::tuple` or throwing them into `std::expected` monads depending on the `return_exceptions` template flag.

To illustrate how we resolve the suspension race condition without mutexes, here is the simplified lock-free logic of our custom awaiter:

```cpp
--8<-- "PseudoCode/when_all.pseudo"
```

Creating this foundational infrastructure was technically demanding, but it fundamentally bridges the gap between our I/O needs and our compute engine. It guarantees that the worker thread safely parallelizes network requests, avoids deadlocks, and ensures the ultra-fast SIMD scheduler is fed with external API data as rapidly as the physical network allows.

---

## Database Communication & Coroutine ORM

The system persists calculated schedules, data center capacity constraints, and carbon impacts into a **PostgreSQL** database. All database interactions are fully asynchronous and utilize Drogon's built-in Coroutine ORM alongside raw SQL queries for complex analytics.

### Code-Generated Models & DTO Mapping

To represent the database schema in C++, we use `drogon_ctl` to auto-generate ORM model classes (e.g., `JobModel`, `ImpactModel`, `TrivialJobModel`). However, to prevent these database-specific models—and their associated trantor time libraries—from leaking into the core scheduling logic, we implemented a strict Data Transfer Object (DTO) mapping layer.

The `scheduler::mappers` namespace houses symmetric `f_toDto` and `f_fromDto` functions. Leveraging C++20 ranges (`std::views::transform`) and function objects (`ToDtoFn`, `FromDtoFn`), arrays of internal domain objects (like `ScheduleBlock`) are elegantly projected into Drogon ORM models right before persistence, and vice versa upon retrieval.

### Transactional Integrity and High-Throughput Batching

Persisting a completed schedule involves writing a parent summary (the carbon impact) and potentially thousands of individual 5-minute execution blocks across multiple data centers. To guarantee ACID properties without blocking the server’s main event loop, we utilize `newTransactionCoro()`.

- **Asynchronous Batching**: For the high-resolution Blocks table, we utilize asynchronous batch inserts within the active transaction. By collapsing thousands of individual rows into a single multi-row SQL execution plan, we significantly reduce the overhead of the PostgreSQL query parser and eliminate the latency of multiple network round-trips. This ensures that even the most complex 7-day schedules are persisted with minimal I/O wait times.

- **Type-Safe Persistence with CoroMapper**: Queries and inserts are executed using `drogon::orm::CoroMapper<T>`, instantiated with the asynchronous transaction context. The ORM facilitates type-safe interaction by combining `drogon::orm::Criteria` objects. For example, filtering historical schedules by a specific data center and time frame is achieved by logically chaining criteria (e.g., `CompareOperator::GE` for start times) and passing them into `mapper.findBy()`.

- **Consistency**: The use of a unified transaction ensures that the relationship between a Job and its associated Impact and Block records remains atomic. If a database error occurs during a batch write, the entire operation is rolled back, preventing "orphaned" job summaries that lack corresponding execution data.

```cpp
auto fullCriteria = combineCriteria(
    jobTimestampAfterStartCriteria(start),
    jobTimestampBeforeEndCriteria(end),
    specificDatacenterCriteria(datacenter)
);
auto models = co_await context.jobsMapper.findBy(fullCriteria);
```

### Raw Asynchronous SQL

While the `CoroMapper` handles standard CRUD operations excellently, certain UI features—such as the dashboard's historical schedule summaries—require complex relational aggregations (e.g., `array_agg(DISTINCT j.location_id)`) that exceed the capabilities of the ORM. For these scenarios, the data access layer (in `Calendar.cpp`) falls back to `execSqlCoro`, executing raw SQL against the PostgreSQL instance asynchronously and mapping the generic result sets back into domain summaries.

---

## Forecasting Service (Stats Component)

The Stats service is a **FastAPI** application in Python, deployed on a dedicated **Oracle Cloud** instance, that continuously ingests carbon intensity data, trains a Ridge regression model per data center, and serves 7-day carbon intensity forecasts at 5-minute resolution to the C++ Scheduler via a REST API. For details on model selection and experimental comparison against alternative approaches, see the [Research — Forecasting Model Research](research.md#forecasting-model-research) page. The full experimental data is documented in the [AI Research Journal](dev-journal.md).

### Service Architecture {#deployment-performance-rationale}

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

- Populated by the Carbon Collector thread, which calls the UK Carbon Intensity API every 30 minutes
- On first startup, performs a **365-day backfill** to provide sufficient training history
- Stores raw readings (`carbon_readings`), region metadata (`regions`), and fuel-type generation mix (`generation_mix`)

**`cache.db`** — the serving database:

- `historical_data` — 30-minute carbon intensity readings, bulk-synced from `carbon_intensity.db` by the Carbon Sync thread
- `predictions` — JSON-serialized forecasts with TTL-based expiry (40 minutes), written by the Prediction Loop and read by API handlers
- `historical_cache` — pre-upsampled 5-minute data for the trailing 7 days, so API responses can stitch historical observations with forecast data without recomputing on every request
- `datacenters` — registry of all 14 UK data centers with active/inactive state, coordinates, and region mapping

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

Although the service runs three background threads concurrently (collector, sync, and prediction loop), the Prediction Loop itself processes data centres **sequentially** rather than spawning parallel threads per data centre. This is a deliberate constraint driven by memory: each data centre's cold-start training constructs a feature matrix of \~2 million rows × 65 columns, consuming approximately **1 GB of RAM**. Parallelising predictions across all 14 registered data centres would require up to 14 GB of concurrent memory, risking out-of-memory conditions on the deployment instance. Sequential processing caps peak memory to a single data centre's training footprint at any given time, and the [incremental training mechanism](#incremental-training-via-sufficient-statistics) ensures that after the initial cold start, each subsequent cycle's memory overhead is negligible (\~58 KB per new reading).

### Incremental Training via Sufficient Statistics

Training the Ridge model from scratch involves constructing a feature matrix from the entire historical series (\~17,500 rows for a year of 30-minute data, expanded to \~2 million training samples via the direct multi-step strategy described below). Rebuilding this matrix every 30 minutes would spike RAM usage to \~1 GB per datacenter — an unnecessary cost given that only one or two new readings arrive each cycle.

To avoid this, the service uses **incremental Ridge updates** based on cached sufficient statistics. Ridge regression has a closed-form solution:

$$\mathbf{w} = (\mathbf{X}^T\mathbf{X} + \alpha \mathbf{I})^{-1} \mathbf{X}^T\mathbf{y}$$

Crucially, the matrices $\mathbf{X}^T\mathbf{X}$ (the Gram matrix) and $\mathbf{X}^T\mathbf{y}$ are **additive** — they can be accumulated incrementally without storing the full training matrix. This means we can save these compact statistics after the initial training and update them with only the new data, then re-solve the tiny $65 \times 65$ linear system instantly.

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
2. **Warm update** (new data arrived, `n_train` increased): builds feature rows only for the new data points, transforms them using the frozen scaler, and accumulates them into the existing Gram matrix and cross-product. Re-solving the $65 \times 65$ system is instantaneous. For a single new 30-minute reading, this produces \~112 rows $\times$ 65 columns $\approx$ **58 KB** of new data — versus \~1 GB for a full rebuild.

This design ensures that after the one-time cold start, the service never rebuilds the full training matrix. Every subsequent 30-minute cycle processes only the incremental data, keeping peak memory usage low and retraining effectively instant.

### The Ridge Regression Predictor (`ridge_enhanced.py`)

#### Direct Multi-Step Forecasting

The predictor uses a **direct forecasting** strategy: rather than predicting one step ahead and iterating (which accumulates errors), it trains a single model that can predict the carbon intensity at *any* future time step given the current state. The forecast horizon is encoded as an input feature, so the model learns how prediction difficulty varies with distance from the origin.

Concretely, during training, the model sees examples of the form:

> *"Given that the historical series looks like **X** at origin time $t_0$, and we want to predict $h$ steps into the future, the carbon intensity at $t_0 + h$ is $y$."*

This is achieved by sliding over all valid origin points in the training history and, for each origin, generating training samples for every horizon $h \in [1, 336]$ (336 half-hours = 7 days). To keep the training matrix manageable, origins are subsampled by a factor of 3.

#### Feature Engineering (65 Features)

Each training sample is described by **65 engineered features** drawn from five groups:

**1. Temporal Features (22 features)** — Fourier-encoded cyclical time signals that capture periodic patterns in carbon intensity:

- 12 features for **hour-of-day**: $\sin$ and $\cos$ at harmonics $k = 1, \ldots, 6$ of $\frac{2\pi \cdot \text{hour}}{24}$. Higher harmonics capture sharper intra-day patterns (e.g., the evening peak) that a single sine wave would smooth over.
- 4 features for **day-of-week**: $\sin$ and $\cos$ at harmonics $k = 1, 2$ of $\frac{2\pi \cdot \text{dow}}{7}$. Captures the weekday/weekend demand cycle.
- 4 features for **day-of-year**: $\sin$ and $\cos$ at harmonics $k = 1, 2$ of $\frac{2\pi \cdot \text{doy}}{365.25}$. Captures seasonal variation (e.g., higher gas generation in winter).
- 1 **weekend flag**: binary indicator for Saturday/Sunday.
- 1 **night flag**: binary indicator for hours outside 06:00–22:00.

**2. Horizon Encoding (4 features)** — Tells the model how far into the future it is predicting:

- $h_{\text{norm}} = h / 336$ (linear)
- $h_{\text{norm}}^2$ (quadratic)
- $h_{\text{norm}}^3$ (cubic)
- $\log(1 + h) / \log(337)$ (logarithmic)

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

- 9 raw measurements: temperature, relative humidity, dewpoint, pressure, cloud cover, wind speed, wind gusts, solar radiation, precipitation
- Wind direction encoded as $\sin$ and $\cos$ components (avoids the 359°→0° discontinuity)
- 5 engineered derivatives:
  - **Wind power** ($\text{speed}^3 / 1000$) — proxy for wind generation potential (power scales cubically with speed)
  - **Wind ramp** (first difference of speed) — captures sudden changes in wind generation
  - **Pressure change** (first difference) — indicates incoming weather fronts
  - **Solar clearness** (radiation / 1000) — normalised solar availability
  - **Temperature deviation** (current temp minus 7-day rolling mean) — captures unusual temperature events

Weather data is fetched from the Open-Meteo Archive API for training and the Open-Meteo Forecast API for inference, then resampled from hourly to 30-minute resolution via linear interpolation. Historical weather is cached to disk (as pickled DataFrames) to avoid redundant API calls.

**5. Interaction Terms (10 features)** — Cross-products between feature groups that capture conditional relationships:

- `last_value × horizon` — how the current level modulates forecast uncertainty at distance
- `weekend × hour_sin`, `weekend × hour_cos` — weekend-specific daily patterns
- `hour_sin × wind_speed`, `hour_cos × wind_speed` — time-dependent wind effects
- `hour_sin × solar`, `hour_cos × solar` — time-dependent solar effects
- `wind_speed × solar` — combined renewable generation signal
- `temperature × hour_sin` — temperature-dependent demand patterns
- `last_value × wind_speed` — current carbon level modulated by wind availability

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
