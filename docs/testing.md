# Testing

> [!DANGER]  
> yap about hyper automation (manual testing bad)

## Testing Strategy

Our testing methodology follows a layered approach rooted in the **test pyramid** [1]: a broad base of fast, isolated unit tests, a middle tier of integration tests that verify component interactions, and a top layer of end-to-end and property-based tests that exercise the system as a whole. This structure ensures that defects are caught as early and as cheaply as possible, while still providing confidence that the integrated system behaves correctly.

Every test is **deterministic and repeatable**. The Scheduler tests run under the Boost.Test framework with CMake/CTest, the Stats service uses pytest, and the UI uses Playwright for end-to-end browser automation. Each suite can be executed with a single command (`ctest`, `uv run pytest`, or `npx playwright test`) and requires no manual setup beyond the standard build.

To catch memory errors and concurrency bugs that conventional tests miss, we compile the Scheduler under multiple **sanitizer configurations**: AddressSanitizer + UndefinedBehaviorSanitizer for memory safety, and ThreadSanitizer for data-race detection — each via a dedicated CMake preset. On the Stats side, we use **Schemathesis** for property-based API fuzzing, automatically generating thousands of request combinations from the OpenAPI specification to surface edge cases that hand-written tests would never cover.

The table below summarises the scope and tooling across both components:

| Layer | Scheduler (C++) | Stats (Python) | UI (Next.js / React) |
|---|---|---|---|
| **Unit** | Boost.Test — algorithm, deserialization, utilities, coroutines | pytest — ridge regression, DB CRUD, load predictor, data collectors | — |
| **Integration** | Full HTTP lifecycle via Drogon test server + MockCalendar | FastAPI `TestClient` with isolated temp databases | — |
| **End-to-End** | — | — | Playwright — 25 tests across 5 spec files (Chromium) |
| **Stress / Concurrency** | 30 000 concurrent coroutine requests; ThreadSanitizer preset | Background-loop resilience with mock sleep | — |
| **Property-based / Fuzzing** | — | Schemathesis + Hypothesis state-machine workflows | — |
| **Memory Safety** | ASan + UBSan CMake presets | — | — |

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
- **Datacenter mapping** — Predictions for datacenters are correctly resolved to valid UK Carbon Intensity API region IDs with valid coordinates.

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

## UI End-to-End Testing (Playwright)

The frontend is a Next.js/React application that serves as the primary user-facing interface for job submission, schedule visualisation, and data center governance. Because the UI orchestrates interactions across multiple backend services — form submissions trigger the C++ Scheduler, while calendar views consume Stats forecasts — defects at this layer directly impact the user experience. To ensure correctness across the full browser stack, we employ **Playwright** [3] for automated end-to-end testing against a live development server.

### Test Infrastructure

The test suite runs against a Chromium instance driven by Playwright, configured to target the Next.js development server on `localhost:3000`:

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

Each spec file targets a distinct page of the application, with `beforeEach` hooks navigating to the relevant route before every test. This ensures that each test starts from a clean page state, preventing inter-test coupling.

### Test Coverage by Page

The suite comprises **25 test cases** across **5 spec files**, organised by the UI workflow they exercise:

| Spec File | Page | Tests | Focus |
|---|---|---|---|
| `config-and-governance.spec.ts` | `/config` | 6 | Data center toggle state, map interaction, persistence |
| `scheduling-form.spec.ts` | `/` | 6 | Form inputs, validation, submission flow |
| `results-fidelity.spec.ts` | `/schedule/{id}` | 5 | Result tabs, metric cards, chart interactivity |
| `global-calendar.spec.ts` | `/workload-calendar` | 4 | Layer toggles, time reference, responsive layout |
| `job-history.spec.ts` | `/scheduled-jobs` | 4 | Job listing, navigation, empty state handling |

### Data Center Configuration & Map (`config-and-governance.spec.ts`)

These tests verify the governance page where administrators enable or disable data centers. The page features a Leaflet map with markers for each DC and a list of toggle switches that must stay synchronised:

```typescript
test('Toggle DC and Verify Change State', async ({ page }) => {
    const saveBtn = page.getByRole('button', { name: 'Save Configuration' });
    await expect(saveBtn).toBeDisabled();
    await page.getByRole('switch').first().click();
    await expect(saveBtn).toBeEnabled();
});

test('Zero-Active State Error Visibility', async ({ page }) => {
    const switches = await page.getByRole('switch', { checked: true }).all();
    for (const s of switches) { await s.click(); }
    await expect(
        page.getByText(/at least one data centre must be active/i)
    ).toBeVisible();
    await expect(
        page.getByRole('button', { name: 'Save Configuration' })
    ).toBeDisabled();
});
```

The suite validates:

- **Toggle–Save coupling** — the Save button remains disabled until a change is made, preventing no-op submissions.
- **Zero-active guard** — deactivating all data centers surfaces an error and disables saving, preventing the scheduler from receiving an empty location set.
- **Map–List synchronisation** — clicking a Leaflet marker highlights the corresponding list entry, and hovering renders a tooltip with the DC name.
- **Persistence handshake** — after saving, a confirmation toast ("Configuration saved") appears, verifying the round-trip to the Stats API.
- **Navigation** — the Back button returns to the home page.

### Scheduling Form (`scheduling-form.spec.ts`)

The scheduling form is the primary entry point for users submitting AI workloads. These tests exercise the form's input controls, validation logic, and submission flow:

```typescript
test('GPU Count Numeric Boundary', async ({ page }) => {
    await page.getByLabel('GPU Count').fill('999');
    await expect(page.getByLabel('GPU Count')).toHaveValue('999');
});

test('Form Validation Alert', async ({ page }) => {
    await page.getByLabel('GPU Count').fill('');
    await page.getByRole('button', { name: 'Schedule Job' }).click();
    await expect(page.locator('role=alert')).toBeVisible();
});
```

The suite validates:

- **Input state** — job type selection (`inference`/`batch`) updates the dropdown state; GPU count accepts large numeric values (boundary test at 999); preferred data center filter excludes the `none` sentinel.
- **Submission feedback** — clicking "Schedule Job" renders a loading spinner (`.animate-spin`), providing immediate visual feedback while the C++ Scheduler computes the optimal path.
- **Validation gates** — submitting with empty required fields surfaces a visible `role=alert` element, preventing malformed requests from reaching the backend.
- **Post-submission navigation** — after a successful schedule computation, the browser navigates to `/schedule/{id}`, confirming the full form → scheduler → results pipeline.

### Result Details & Analytics (`results-fidelity.spec.ts`)

Once a schedule is computed, the results page presents the optimised allocation alongside comparative analytics. These tests verify the interactive visualisation layer:

```typescript
test('Toggle Unoptimised vs Optimised Tab', async ({ page }) => {
    await page.goto('http://localhost:3000/schedule/test-id');
    await page.getByRole('button', { name: 'Unoptimised' }).click();
    await expect(
        page.locator('button[data-state="active"]')
    ).toContainText('Unoptimised');
});

test('Delete Confirmation Logic', async ({ page }) => {
    await page.goto('http://localhost:3000/schedule/test-id');
    await page.locator('.lucide-trash2').click();
    await expect(page.getByRole('alertdialog')).toBeVisible();
});
```

The suite validates:

- **Comparison tabs** — toggling between "Optimised" and "Unoptimised" views updates the active tab state, allowing users to compare carbon impact.
- **Metric card visibility** — key metrics ("Carbon Intensity", "Total Emissions") are rendered on page load.
- **Data center drill-down** — clicking a DC-specific tab sets `aria-selected="true"`, enabling per-region analysis.
- **Destructive action guard** — clicking the delete icon (trash) opens a confirmation `alertdialog` rather than immediately deleting, preventing accidental data loss.
- **Chart interactivity** — hovering over a Recharts surface renders a tooltip wrapper, confirming that the time-series visualisation is interactive.

### Global Workload Calendar (`global-calendar.spec.ts`)

The calendar page provides a multi-day, multi-region view of scheduled workloads overlaid with forecast data. Tests verify the data-layer controls and layout responsiveness:

- **Carbon-intensity layer** — toggling the "Carbon-Intensity" control renders exactly one Recharts line, confirming the overlay is activated.
- **Capacity layer** — enabling the "Capacity" overlay increases the rendered line count to two, verifying independent layer composition.
- **"Now" reference line** — a labelled reference line is always visible, anchoring the user's temporal context.
- **Responsive scroll** — the chart container uses `overflow-x-auto`, ensuring horizontal scrolling on smaller viewports without layout breakage.

### Historical Jobs & Navigation (`job-history.spec.ts`)

The job history page lists all previously scheduled workloads with their carbon savings. Tests exercise the listing, navigation, and edge cases:

```typescript
test('Savings Badge Rendering', async ({ page }) => {
    await expect(page.getByText(/% savings/i).first()).toBeVisible();
});

test('Job Card Click Navigation', async ({ page }) => {
    await page.locator('.bg-card').first().click();
    await expect(page).toHaveURL(/\/schedule\//);
});
```

The suite validates:

- **Savings badge** — each job card renders a "% savings" badge, making the carbon impact immediately visible in the listing.
- **Card navigation** — clicking a job card navigates to its detailed result page (`/schedule/{id}`), confirming the router integration.
- **Active tab highlighting** — the "Scheduled Jobs" navigation tab is visually highlighted (`bg-background`) when the page is active.
- **Empty state resilience** — when no jobs exist, the page renders a "No scheduled jobs found" fallback message rather than an empty or broken layout.

---

## References

[1] M. Fowler, "TestPyramid," *martinfowler.com*, 2012. [Online]. Available: <https://martinfowler.com/bliki/TestPyramid.html>

[2] D. Sverchkov, "Schemathesis: Property-based testing for API schemas," *GitHub*, 2023. [Online]. Available: <https://github.com/schemathesis/schemathesis>

[3] Microsoft, "Playwright: Fast and reliable end-to-end testing for modern web apps," *GitHub*, 2024. [Online]. Available: <https://github.com/microsoft/playwright>
