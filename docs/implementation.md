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
--8<-- "PseudoCode/hardwareConversion.pseudo"
```
Further information on where we get the constants, and conversion rates can be found in [Research](research.md#11-hardware-specification-references) part of this report.

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

## Thread-Safe Request Serialization (`SchedulingQueue`)

A critical constraint of the Dynamic Programming (DP) engine is that it requires a strictly "frozen" snapshot of the system state—specifically current data center loads, capacity, and carbon forecasts—to ensure mathematical correctness. If multiple scheduling requests were processed concurrently, the first to complete would update the global infrastructure capacity, instantly invalidating the state used by the second calculation and resulting in over-provisioning or infeasible schedules.

To resolve this while maintaining a responsive, non-blocking user interface, we designed a **lock-free coroutine serialization queue**. Instead of relying on expensive, thread-blocking mutexes that could stall the server's HTTP event loop, requests are serialized entirely through atomic state machines and C++20/23 custom awaitables.

### The Custom Awaitable (`SchedulerTask`)
When a user submits a job via the UI, the HTTP handler encapsulates the request in a `SchedulerTask`—a custom awaitable object. Managing the lifecycle of this object across concurrent threads is notoriously difficult due to the "suspension race condition": the background worker might finish calculating the schedule *before* the HTTP handler has fully suspended, which would cause the continuation handle to be lost and deadlock the request.

To prevent this, `SchedulerTask` utilizes an internal lock-free state machine (`Pending`, `Suspended`, `Done`) orchestrated via `std::atomic<State>`. 
*   **Race-Free Suspension:** In `await_suspend`, the controller thread stores its continuation handle (`std::memory_order_release`) and attempts an atomic `compare_exchange_strong` to transition to `Suspended`. If the worker thread has already transitioned the state to `Done` (because the schedule computed instantly), the suspension is safely aborted and the result is returned immediately.
*   **Safe Resumption:** Conversely, when the worker finishes, it calls `resume()`. It attempts to transition the state to `Done` using `std::memory_order_acq_rel`. If the controller thread hasn't finished suspending yet, the worker simply exits, leaving the controller thread to fetch the result instantly rather than waiting to be woken up.
*   **Exception Propagation:** If the DP engine throws an error, the `std::exception_ptr` is captured lock-free and safely rethrown in `await_resume()`, ensuring standard C++ `try/catch` blocks in the HTTP handler work flawlessly across thread boundaries.

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
While requests are currently serialized strictly to maintain global state integrity, the introduction of hardware power constraints opens the possibility of running non-conflicting schedules in parallel. This architectural evolution and its trade-offs are explored further in the [Possible Extensions](extensions.md) section.

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

1.  **Cache Thrashing:** The L1 data cache miss rate was excessively high (approx. 25%). This was traced directly to the scattered memory access patterns of the Array of Structs (AoS) architecture during spatial merges.
2.  **Instruction Throughput:** The DP hot-path accounted for over 60% of total CPU time, operating at a poor 0.85 instructions per cycle (IPC) due to complex scalar branching.
3.  **Allocator Contention:** Dynamic memory allocations (`operator new`/`delete`) inside the innermost loops consumed roughly 22% of the execution time.

To visualize where these bottlenecks manifested in the call stack, we generated an interactive flame graph from the same profiling session. The graph reveals that while `calc_single` (the core DP solver) accounted for **~90% of inclusive time**, only **~42% was actual computation** — the rest was overhead from the naive data layout and allocation patterns:

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
2. **Allocation Removal**: We eliminated the **~22% `operator new` / `operator delete`** overhead by removing all dynamic memory allocations from the hot-path. The DP tables are now pre-allocated once using aligned memory (`posix_memalign`) and reused across iterations, completely eliminating the per-transition allocator overhead and the associated **~7% vector reallocation** cost.

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

*   **The Shared Context & Scope Guards:** When `when_all` is invoked, it allocates a shared `ResultContext` containing an atomic `remaining` counter initialized to the number of tasks. Each child task is wrapped in a generic lambda (`detail::wrap_task`) that uses a custom `ScopeGuard`. When a child coroutine finishes (or fails), the `ScopeGuard` destructor guarantees that `complete_one()` is called, which executes an atomic `fetch_sub(1, std::memory_order_acq_rel)`. The thread that drops this counter to `0` becomes responsible for waking up the parent.
*   **Race-Free Suspension:** In the parent's `Awaiter::await_suspend`, the parent attempts to register its coroutine handle using an atomic `compare_exchange_strong` against an expected `NO_CONTINUATION` state. Meanwhile, if the children finish early, the final child thread will aggressively swap the context's handle to a `WAITING_CONTINUATION` sentinel pointer. If the parent's `compare_exchange` fails because the sentinel is already there, `await_suspend` returns `false`, safely aborting the parent's suspension entirely and allowing it to instantly fetch the results.
*   **Lock-Free Exception Capturing:** Handling asynchronous failures across multiple threads without crashing the server required a dedicated three-state atomic machine (`NO_EXCEPTION`, `EXCEPTION_IN_PROGRESS`, `EXCEPTION_CAPTURED`). If one of the 5 regional forecast requests throws an error, the catch block attempts to transition the state to `IN_PROGRESS`. Because of the `compare_exchange` loop, only the *first* failing thread wins this race. The winner safely moves the `std::exception_ptr` into the shared context and transitions to `CAPTURED`. The parent then checks this state in `await_resume()` and rethrows the exception, aborting the remaining operations gracefully.
*   **Variadic Metaprogramming:** To make the utility universally applicable across the codebase, the template metaprogramming heavily leverages C++20 concepts (`std::invocable`) and fold expressions. It dynamically resolves return types to support both homogeneous `std::vector<drogon::Task<T>>` arrays and heterogeneous variadic arguments `drogon::Task<Rets>...`, mapping results perfectly into a `std::tuple` or throwing them into `std::expected` monads depending on the `return_exceptions` template flag.

To illustrate how we resolve the suspension race condition without mutexes, here is the simplified lock-free logic of our custom awaiter:

```cpp
--8<-- "PseudoCode/when_all.pseudo"
```

Creating this foundational infrastructure was technically demanding, but it fundamentally bridges the gap between our I/O needs and our compute engine. It guarantees that the worker thread safely parallelizes network requests, avoids deadlocks, and ensures the ultra-fast SIMD scheduler is fed with external API data as rapidly as the physical network allows.

---

## Forecasting Service (Stats Component)

The forecasting service is implemented as a **FastAPI** application in Python, leveraging the **Direct-XGBoost** model. It performs the following steps:

1. **Data Ingestion**: Periodically fetches real-time regional carbon data and weather forecasts.
2. **Feature Engineering**: Generates cyclical time features and integrates 11 raw weather features from the Open-Meteo API.
3. **Inference**: Produces a 336-step forecast (7 days) for each of the 5 UK regions.
4. **API Delivery**: Exposes the forecasts via a REST API, which the C++ Scheduler consumes concurrently using asynchronous coroutines.

For details on the forecasting experiments and accuracy, see the [Algorithms](algorithms.md) page.
