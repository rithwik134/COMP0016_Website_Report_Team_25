# Testing

## Testing Strategy

Our testing methodology follows a layered approach rooted in the **test pyramid** [1]: a broad base of fast, isolated unit tests, a middle tier of integration tests that verify component interactions, and a top layer of end-to-end and property-based tests that exercise the system as a whole. This structure ensures that defects are caught as early and as cheaply as possible, while still providing confidence that the integrated system behaves correctly.

Every test is **deterministic and repeatable**. The Scheduler tests run under the Boost.Test framework with CMake/CTest, while the Stats service uses pytest. Both suites can be executed with a single command (`ctest` or `uv run pytest`) and require no manual setup beyond the standard build.

To catch memory errors and concurrency bugs that conventional tests miss, we compile the Scheduler under multiple **sanitizer configurations**: AddressSanitizer + UndefinedBehaviorSanitizer for memory safety, and ThreadSanitizer for data-race detection — each via a dedicated CMake preset. On the Stats side, we use **Schemathesis** for property-based API fuzzing, automatically generating thousands of request combinations from the OpenAPI specification to surface edge cases that hand-written tests would never cover.

The table below summarises the scope and tooling across both components:

| Layer | Scheduler (C++) | Stats (Python) |
|---|---|---|
| **Unit** | Boost.Test — algorithm, deserialization, utilities, coroutines | pytest — ridge regression, DB CRUD, load predictor, data collectors |
| **Integration** | Full HTTP lifecycle via Drogon test server + MockCalendar | FastAPI `TestClient` with isolated temp databases |
| **Stress / Concurrency** | 30 000 concurrent coroutine requests; ThreadSanitizer preset | Background-loop resilience with mock sleep |
| **Property-based / Fuzzing** | — | Schemathesis + Hypothesis state-machine workflows |
| **Memory Safety** | ASan + UBSan CMake presets | — |

---

## Scheduler Testing (C++ / Boost.Test)

The Scheduler is the performance-critical core of the system — a C++23 service built on the Drogon framework that solves a dynamic-programming optimisation problem for every scheduling request. Bugs here directly affect carbon savings and system correctness, so the test suite is correspondingly rigorous: **7 test executables** covering 2 200+ lines of test code.

### Unit Tests

#### Scheduling Algorithm (`SchedulerAlgoTest.cpp`)

The DP algorithm is the heart of the system, so it receives the most thorough unit-test coverage. Tests use a `TestCost` helper struct that mirrors the real `LocationCost` interface while owning its data, avoiding dangling-reference issues in test code:

```cpp
struct TestCost {
    std::vector<double> capacities;
    std::vector<double> sci;

    auto operator[](int i) const {
        const auto g = sci.at(i);
        const auto c = capacities.at(i);
        return [g, c](double load) -> double {
            return (load / c) * std::max(g, 0.01);
        };
    }
};

static_assert(CostFunction<TestCost, double>);
```

The test suites verify core algorithmic properties:

- **Zero-work invariant** — requesting zero work must produce zero cost.
- **Work conservation** — the total allocated work always meets or exceeds the requested amount.
- **Monotonicity** — cost increases monotonically with workload volume.
- **Multi-location DP** — the optimiser correctly distributes work across locations and time slots, preferring slots with lower carbon intensity.
- **Capacity constraints** — allocation never exceeds the capacity at any slot.
- **Edge cases** — single time slot, uniform cost surfaces, extreme capacity ratios.

#### Request Deserialization (`ControllerDeserializationTest.cpp`)

These tests verify that HTTP JSON payloads are correctly parsed into `JobRequest` structs, including hardware-spec calculations (GPU TDP, system base power, workload amount derivation):

```cpp
BOOST_AUTO_TEST_CASE(valid_request_hardware_values) {
    Json::Value json;
    json["job_type"]        = "batch";
    json["gpu_type"]        = "A100_SXM4";
    json["gpu_count"]       = 2;
    json["model_size"]      = 20;
    json["length"]          = 30;
    json["earliest_start"]  = "2030-10-26T10:00:00Z";
    json["latest_finish"]   = "2030-10-26T12:00:00Z";

    auto req        = drogon::HttpRequest::newHttpJsonRequest(json);
    auto jobRequest = drogon::fromRequest<JobRequest>(*req);

    // A100_SXM4: tdp 400, sys 230.
    // 2 * 400 + 230 = 1030W = 1.03kW
    BOOST_CHECK_CLOSE(jobRequest.workload_amount, 6 * 2 * 5e15, 1e12);
}
```

The suite also tests error paths: missing JSON body, null fields, type mismatches, and invalid time windows — all of which must raise a `ValidationException` rather than crash.

#### Utilities and Coroutines

- **`UtilsTest.cpp`** — ISO 8601 timestamp parsing and serialization with round-trip validation across timezone formats (`Z`, `±HH:MM`, `±HHMM`, no offset) and decimal seconds.
- **`TimeGridderTest.cpp`** — Time discretisation into 5-minute buckets, validating `toIndex()` / `toIndexCeil()` / `toTimePoint()` conversions and custom resolutions.
- **`CoroTests.cpp`** — The `when_all` coroutine combinator with variadic success paths, mixed return types including `void`, and exception propagation via the `return_exceptions` flag.

### Integration Tests

#### Full HTTP Lifecycle (`SchedulerIntegrationTest.cpp`)

Integration tests spin up a real Drogon HTTP server on port 6969 using a global test fixture. The fixture loads a test configuration, registers exception handlers, seeds active datacenters via the Stats API, and cleans up the test database between runs:

```cpp
struct SchedulerGlobalFixture {
    SchedulerGlobalFixture() {
        if (std::filesystem::exists("scheduler_test.db"))
            std::filesystem::remove("scheduler_test.db");

        drogon::app().loadConfigFile("config.test.json");
        scheduler::exceptions::registerExceptionHandler();

        t = std::jthread([]() { drogon::app().run(); });

        // Wait for server, then seed datacenters
        // ...
        seedActiveDatacenters();
    }
    ~SchedulerGlobalFixture() { drogon::app().quit(); }
};
```

Tests then exercise the complete schedule lifecycle through real HTTP requests:

1. **POST `/api/schedules`** — submit a job and verify a `200 OK` response with a `schedule_id`.
2. **GET `/api/schedules/{id}`** — retrieve the schedule and verify it contains `scheduled_blocks` and `impact` fields.
3. **Parameter filtering** — query schedules by time range and location.

A **MockCalendar** replaces the production database layer with a thread-safe in-memory `std::map`, allowing integration tests to run without a real database while still exercising the full HTTP → controller → scheduler → persistence pipeline.

### Stress and Concurrency Tests (`SchedulingQueueTests.cpp`)

The scheduling queue processes requests concurrently via C++20 coroutines. These tests verify correctness under load:

```cpp
// High-volume success: 5 concurrent scheduling requests
BOOST_AUTO_TEST_CASE(test_queue_concurrency_success) {
    drogon::sync_wait([]() -> drogon::Task<void> {
        std::vector<drogon::Task<scheduler::SchedulerOutput>> tasks;
        for (auto i : std::views::iota(0, 5)) {
            tasks.push_back(
                scheduler::schedulingQueue
                    .computeSchedule<scheduler::Scheduler>(req));
        }
        auto results = co_await when_all(std::move(tasks));
        BOOST_CHECK_EQUAL(results.size(), 5);
        for (const auto &res : results)
            BOOST_CHECK(!res.blocks.empty());
    }());
}

// Exception resilience: 30,000 concurrent invalid requests
BOOST_AUTO_TEST_CASE(test_queue_concurrency_exceptions) {
    // ...
    auto results = co_await when_all<true>(std::move(tasks));
    BOOST_CHECK_EQUAL(results.size(), 30000);
    BOOST_CHECK_EQUAL(exception_count, 30000);
}
```

The second test fires **30 000 deliberately invalid requests** and confirms that every single one is gracefully caught — no crashes, no deadlocks, no lost responses.

### Sanitizer Presets

The CMake presets enable compilation under different sanitiser configurations:

| Preset | Sanitiser | Purpose |
|---|---|---|
| `debug-base` / `arch` | ASan + UBSan | Detect buffer overflows, use-after-free, undefined behaviour |
| `arch-tsan` | ThreadSanitizer | Detect data races in concurrent code paths |
| `arch-rel` / `release-base` | None (O3) | Performance regression testing |

Running the full test suite under ASan+UBSan and TSan ensures that the coroutine-heavy, multi-threaded scheduler is free of memory corruption and race conditions — classes of bug that are notoriously difficult to catch through conventional testing alone.

---

## Stats Testing (Python / pytest)

The Stats service is a FastAPI application providing carbon-intensity and load forecasts via a Ridge regression model. Its test suite comprises **11 test files** with **109 test functions** organised into logical modules.

### Test Isolation

All tests run against temporary SQLite databases created via pytest fixtures, ensuring complete isolation:

```python
@pytest.fixture
def tmp_db(tmp_path, monkeypatch):
    """Temporary cache.db with schema and seeded datacenters."""
    db_file = tmp_path / 'cache.db'
    monkeypatch.setattr('db_utils.DB_FILE', db_file)
    import db_utils
    db_utils.initialize_db()
    return db_file

@pytest.fixture
def client(tmp_db):
    """FastAPI TestClient wired to a temp DB (no background threads)."""
    test_app = FastAPI()
    test_app.include_router(router)
    return TestClient(test_app)
```

Each test receives a fresh database with a known schema and seeded datacenters. The `monkeypatch` fixture redirects the database file path at runtime, so tests never touch production data.

### Unit Tests

#### Ridge Regression Model (`test_ridge.py`)

These tests validate the RidgeFull carbon-intensity predictor — the statistical model that drives scheduling decisions:

- **Feature engineering** — Fourier temporal features have the correct shape (48 × 22) and all values lie in [−1, 1].
- **Prediction output** — The model produces exactly 2 016 data points (7 days × 24 hours × 60 min / 5 min), all clipped to the valid range [0, 500] gCO₂/kWh, at 5-minute intervals.
- **Data requirements** — Insufficient historical data raises a `ValueError` rather than producing garbage predictions.
- **Datacenter mapping** — All 5 active datacenters resolve to valid UK Carbon Intensity API region IDs with valid coordinates.

#### Database Operations (`test_db_utils.py` — 40 tests)

Comprehensive CRUD coverage organised into 6 test classes:

- **Schema initialisation** — all tables created, datacenters seeded, idempotent on re-run, WAL mode enabled.
- **Datacenter CRUD** — get all/active/by-ID, activate/deactivate, correct ordering.
- **Prediction cache** — save, retrieve, expiration, overwrite semantics.
- **Historical data** — single and bulk insert, time-range filtering, latest-timestamp queries, cleanup.
- **Carbon sync** — region-to-datacenter mapping, sync detection, data transfer.

#### Load Predictor (`test_load.py`)

Validates that synthetic load forecasts produce 2 016 five-minute data points with non-negative values, correct timestamp frequency, and custom start-time support.

#### Carbon Collector (`test_carbon_collector.py` — 19 tests)

Tests the data-collection layer that ingests readings from the UK Carbon Intensity API: schema creation, slot storage, duplicate handling, unknown-region skipping, and reading-count verification.

#### Background Loops (`test_background.py`)

The Stats service runs infinite background loops for prediction generation and carbon data sync. Testing infinite loops requires a controlled-exit strategy — we use a `_BreakLoop` exception injected via `monkeypatch` on `time.sleep`:

```python
class _BreakLoop(Exception):
    """Raised by mock sleep to exit infinite loops."""

class TestPredictionLoop:
    def test_single_successful_iteration(self, seeded_db, monkeypatch):
        monkeypatch.setattr(
            'background.time.sleep',
            MagicMock(side_effect=_BreakLoop),
        )
        # ... mock prediction generators ...
        with pytest.raises(_BreakLoop):
            background.prediction_loop()
```

Tests verify:

- A single iteration completes successfully.
- Load-prediction errors are caught gracefully (the loop continues).
- Carbon-intensity `ValueError`s are logged as warnings, not errors.
- An alert is triggered after a configurable failure threshold.
- The carbon-sync loop recovers from transient failures.

### Integration Tests (`test_routes.py`)

Using FastAPI's `TestClient`, these tests exercise every API endpoint:

| Endpoint | Tests | Validates |
|---|---|---|
| `GET /predictionWindow` | 1 | Returns 168-hour window |
| `GET /locations` | 2 | Non-empty list, active-only filtering |
| `GET /datacenters` | 2 | Full schema, all 14 records |
| `PATCH /datacenters/{id}` | 4 | Activate, deactivate, 404, missing body (422) |
| `GET /locations/{id}/metrics/forecast_load` | 5 | Success, time validation, error handling |
| `GET /locations/{id}/metrics/forecast_carbon_intensity` | 5 | Success, time validation, error handling |

### Property-Based API Fuzzing (Schemathesis)

The most distinctive part of our testing strategy is **automated property-based fuzzing** using Schemathesis [2]. Rather than writing individual test cases by hand, Schemathesis reads the OpenAPI specification and automatically generates thousands of valid and invalid request combinations:

```python
import schemathesis
from hypothesis import HealthCheck, settings

schema = schemathesis.openapi.from_url(
    'http://127.0.0.1:5000/openapi.json'
)

@settings(
    max_examples=10,
    suppress_health_check=[
        HealthCheck.filter_too_much,
        HealthCheck.too_slow,
    ],
)
class APIWorkflow(schema.as_state_machine()):
    pass

TestAPI = APIWorkflow.TestCase
```

The `as_state_machine()` call enables **stateful, link-following testing** — Schemathesis chains API calls together (e.g., create a resource, then query it) using OpenAPI link definitions, testing not just individual endpoints but multi-step workflows. This catches issues such as:

- Unexpected 500 errors on valid but unusual input combinations.
- Schema violations in response bodies.
- Broken invariants in stateful sequences (e.g., a resource that was created but cannot be retrieved).

---

## Cross-Component Integration

The Scheduler's `StatsAPIClientTest.cpp` tests verify HTTP communication with the Stats service as a live dependency. These tests call the real Stats API (configurable via the `STATS_API_URL` environment variable) and validate:

- **`getLocations()`** — returns a non-empty list with valid, unique IDs.
- **`getLoadForecast()`** — returns load time-series data with expected structure.
- **`getCarbonIntensity()`** — returns carbon-intensity forecasts within valid ranges.

This ensures that the contract between the two services — the JSON shapes, status codes, and error responses — is continuously verified, catching integration regressions that unit tests on either side would miss.

---

## References

[1] M. Fowler, "TestPyramid," *martinfowler.com*, 2012. [Online]. Available: https://martinfowler.com/bliki/TestPyramid.html

[2] D. Sverchkov, "Schemathesis: Property-based testing for API schemas," *GitHub*, 2023. [Online]. Available: https://github.com/schemathesis/schemathesis
