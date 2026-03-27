# System Design

## Architecture

The Carbon-Aware AI Agent is composed of three decoupled components communicating over HTTP RESTful APIs. This microservices-oriented architecture maximizes modularity and allows independent development across appropriate technology stacks.

```mermaid
---
config:
  layout: elk
---
flowchart
 subgraph External_Group["External Data Sources"]
        Grid["Grid Carbon Intensity"]
        Weather["Weather Data"]
        DC_State["DC Load & Capacity"]
  end
 subgraph UI_Comp["UI Component"]
        UI_In["Input Handler"]
        UI_View["Dashboard / Visualizer"]
  end
 subgraph Sched_Comp["Scheduler Component"]
        Solver["<b>Logic Core</b><br>Constraint Solver"]
  end
 subgraph Stats_Comp["Stats Component"]
        Ingest["Data Ingestion"]
        DB[("History DB")]
        Forecast["Forecasting Engine"]
        Norm["Normalizer / API Interface"]
  end
 subgraph System["Software System"]
        UI_Comp
        Sched_Comp
        Stats_Comp
  end
    Ingest <-- Read/Write --> DB
    Ingest --> Forecast
    DB -. Historical Patterns .-> Forecast
    Forecast --> Norm
    User(("User")) -- Defines --> JobSpec["<b>Job Specification</b><br>-----------------------<br><b>Unit:</b> Functional Unit<br><b>Workload:</b> Estimated Qty<br><b>Constraints:</b> Earliest Start / Latest Finish<br><b>Reqs:</b> Throughput / Latency"]
    JobSpec -- Submits --> UI_In
    UI_In -- "1. Task Request" --> Solver
    Solver -. "4. Schedule Output" .-> UI_View
    UI_View -- Displays --> User
    Grid ==> Ingest
    Weather ==> Ingest
    DC_State ==> Ingest
    Solver -- "2. Query State" --> Norm
    Norm -. "3. Normalized Forecasts" .-> Solver

     Grid:::external
     Weather:::external
     DC_State:::external
     UI_In:::internal
     UI_View:::internal
     Solver:::internal
     Ingest:::internal
     DB:::database
     Forecast:::internal
     Norm:::internal
     User:::actor
     JobSpec:::dataNode
```

/// caption
System Architecture Diagram showing the flow of data between external providers and the core system components.
///

### Component Descriptions

| Component | Technology | Role |
|-----------|-----------|------|
| **UI** | Next.js 14 / React, shadcn/ui, Recharts, Leaflet | Server-side rendered web application. Provides the scheduling form, schedule result visualisation, global workload calendar, and data centre configuration page. Communicates with the Scheduler via REST. |
| **Scheduler** | C++23, Drogon HTTP framework, PostgreSQL | Stateless optimisation service. Receives job requests from the UI, fetches forecasts from Stats via parallel coroutine HTTP calls, runs the two-phase DP solver (see [Algorithms](algorithms.md)), persists results to PostgreSQL, and returns the optimised schedule. |
| **Stats** | Python 3.12, FastAPI, SQLite, scikit-learn | Data ingestion and forecasting service. Three background threads continuously collect carbon intensity data from the UK Carbon Intensity API, sync it into the serving database, and retrain a Ridge regression model per data centre every 30 minutes. Serves 7-day carbon intensity and load forecasts at 5-minute resolution to the Scheduler. |

### Stats Component — Internal Architecture

While the high-level architecture above shows the Stats component as a single block, its internal design involves a multi-stage data pipeline with two SQLite databases, three background threads, and an in-memory model cache. The diagram below details how external carbon and weather data flows through the service — from ingestion to trained model to cached forecast — before being served to the Scheduler via the REST API.

```mermaid
flowchart TB
    subgraph External["External APIs"]
        CI["UK Carbon Intensity API<br/><i>30-min regional readings</i>"]
        OM["Open-Meteo API<br/><i>Historical archive + 8-day forecast</i>"]
    end

    subgraph Threads["Background Threads (every 30 min)"]
        CC["Carbon Collector<br/><code>carbon_collector_loop</code>"]
        CS["Carbon Sync<br/><code>carbon_sync_loop</code>"]
        PL["Prediction Loop<br/><code>prediction_loop</code>"]
    end

    subgraph Storage["SQLite Databases"]
        CDB[("carbon_intensity.db<br/><i>Raw readings + generation mix</i>")]
        CACHE[("cache.db<br/><i>Predictions, historical data,<br/>datacenter registry</i>")]
    end

    MC["In-Memory Model Cache<br/><i>Trained Ridge model + scaler<br/>per datacenter</i>"]
    RE["ridge_enhanced.py<br/><i>Feature engineering + RidgeCV</i>"]

    subgraph API["REST API (FastAPI)"]
        EP1["GET /locations/{id}/metrics/<br/>forecast_carbon_intensity"]
        EP2["GET /locations/{id}/metrics/<br/>forecast_load"]
        EP3["GET /locations"]
    end

    SCHED["C++ Scheduler<br/><i>(consumer)</i>"]

    CI -->|"fetch every 30 min"| CC
    CC -->|"store readings"| CDB
    CDB -->|"bulk sync"| CS
    CS -->|"upsert into historical_data"| CACHE
    CACHE -->|"read training data"| PL
    PL -->|"invoke per DC"| RE
    OM -->|"fetch every 30 min<br/>(archive + forecast)"| RE
    RE -->|"train / cache hit"| MC
    MC -->|"predict"| RE
    RE -->|"save forecast JSON"| CACHE
    CACHE -->|"serve cached forecasts"| API
    API -->|"HTTP"| SCHED
```

/// caption
Internal architecture of the Stats component, showing the data pipeline from external API ingestion through model training and caching to forecast delivery.
///

For a detailed explanation of the databases, caching strategy, retraining cadence, and the Ridge regression model itself, see [Implementation — Forecasting Service](implementation.md#stats-forecasting-service).

## Sequence Diagrams

Component interactions follow a RESTful request-response pipeline. Because the scheduling environment is shared, typical "preview" functions are susceptible to race conditions. To resolve this, the process uses a **Two-Phase Commit-Cancel** workflow.

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant UI as UI Component
    participant Sched as Scheduler
    participant Stats as Stats Component
    participant DB as Stats DB
    participant Ext as External Sources<br>(Grid, Cost, Weather)

    %% -- Phase 1: Background Ingestion Loop --
    note over Stats, Ext: Background Process
    loop Constant Data Ingestion
        Ext->>Stats: Raw Data (Costs, Weather, Grid)
        Stats->>DB: Persist History
        DB-->>Stats: Read Historical Patterns
        Stats->>Stats: Generate Forecasts & Normalize
    end

    %% -- Phase 2: User Action --
    note over U, Sched: Interactive Process
    U->>UI: Input Job Spec<br>(Units, Constraints, Reqs)

    %% UI to Scheduler
    UI->>Sched: POST /api/schedule<br>{ "job_spec": { ... } }
    activate Sched

    %% Scheduler needs context
    Sched->>Stats: GET /locations/{loc}/metrics/forecast_...
    activate Stats
    Stats-->>Sched: 200 OK <br>{ "forecast_data": { ... } }
    deactivate Stats

    %% Logic Calculation
    Sched->>Sched: Run Constraint Solver<br>(Job Spec + Forecast Context)

    %% Return Result
    Sched-->>UI: 200 OK<br>{ "schedule": { ... } }
    deactivate Sched

    UI->>U: Display Visualization & Schedule
```

/// caption
Sequence diagram showing the continuous ingestion pipeline and an interactive user scheduling request.
///

## Site Map

The UI is structured as a single-page dashboard with tab-based navigation. The diagram below shows the page hierarchy and the transitions between views.

```mermaid
flowchart TD
    Nav["Top Navigation Bar"]

    Nav --> SF["Scheduling Form<br/><i>Job type, GPU specs, time window</i>"]
    Nav --> GW["Global Workload<br/><i>Multi-DC calendar view</i>"]
    Nav --> SJ["Scheduled Jobs<br/><i>List of previous jobs</i>"]

    SF -->|"Configure Data Centres"| DC["Data Centre Configuration<br/><i>Map + toggle switches</i>"]
    DC -->|"Back / Save"| SF

    SF -->|"Schedule Job"| SR["Schedule Result<br/><i>Impact metrics, DC charts,<br/>optimised vs unoptimised</i>"]
    SR -->|"Schedule Another Job"| SF

    SJ -->|"Click job card"| SR
    SR -->|"Cancel Job"| SJ
```

/// caption
Site map showing page hierarchy and navigation flows.
///

| Page | Route | Purpose |
|------|-------|---------|
| Scheduling Form | `/` | Primary entry point. Users define hardware specs, time constraints, and submit jobs for optimisation. |
| Schedule Result | `/schedule/{id}` | Displays the optimised schedule with environmental impact metrics, per-DC workload charts, and optimised/unoptimised comparison toggle. |
| Global Workload | `/workload-calendar` | Multi-data-centre, multi-day calendar showing all scheduled workloads overlaid with carbon intensity, load, and capacity curves. |
| Scheduled Jobs | `/scheduled-jobs` | Paginated list of all previously submitted jobs with summary metrics and carbon savings badges. Clicking a card navigates to the Schedule Result page. |
| Data Centre Config | `/config` | Leaflet map of all 14 UK regions with toggle switches to enable/disable data centres for scheduling. Changes are persisted to the Stats API. |

## API Specification

The three components communicate exclusively over HTTP REST. The tables below document the inter-service contracts.

### Scheduler API (consumed by UI)

| Method | Endpoint | Request Body | Response | Description |
|--------|----------|-------------|----------|-------------|
| `POST` | `/api/schedules` | `JobRequest` JSON (job type, GPU type/count, model size, runtime, earliest start, latest finish) | `ScheduleResult` with schedule ID, impact metrics, and scheduled blocks | Submit a job for optimisation. The schedule is immediately persisted (Phase 1 of Commit-Cancel). |
| `GET` | `/api/schedules/{id}` | — | Full schedule with blocks and impact | Retrieve a previously computed schedule. |
| `GET` | `/api/schedules/{id}/trivial` | — | Trivial (unoptimised) schedule and impact | Retrieve the baseline contiguous schedule for comparison. |
| `GET` | `/api/schedules/summary` | Optional `start`, `end`, `location` query params | List of job summaries | List all scheduled jobs with summary metrics. |
| `DELETE` | `/api/schedules/{id}` | — | 204 No Content | Cancel a scheduled job and release reserved capacity (Phase 2 of Commit-Cancel). |

### Stats API (consumed by Scheduler and UI)

| Method | Endpoint | Response | Description |
|--------|----------|----------|-------------|
| `GET` | `/locations` | List of active data centres with IDs and coordinates | Returns only data centres currently enabled for scheduling. |
| `GET` | `/datacenters` | Full list of all 14 data centres with active state | Returns all registered data centres regardless of active status. |
| `PATCH` | `/datacenters/{id}` | Updated data centre record | Toggle a data centre's active/inactive state. |
| `GET` | `/locations/{id}/metrics/forecast_carbon_intensity` | Time series of carbon intensity (gCO2/kWh) at 5-min resolution | 7-day forecast stitching historical observations with predicted values. Accepts optional `start_time` and `end_time` query params. |
| `GET` | `/locations/{id}/metrics/forecast_load` | Time series of load at 5-min resolution | 7-day synthetic load forecast for the specified data centre. |
| `GET` | `/predictionWindow` | `{ "hours": 168 }` | Returns the current forecast window length. |

---

## Class Diagram — Scheduler Core

The Scheduler's internal architecture separates HTTP transport, business logic, and persistence into distinct layers. The diagram below shows the key classes and their relationships.

```mermaid
classDiagram
    class ScheduleController {
        +createSchedule(req) Task~HttpResponsePtr~
        +getSchedule(req, id) Task~HttpResponsePtr~
        +deleteSchedule(req, id) Task~HttpResponsePtr~
        +getSummary(req) Task~HttpResponsePtr~
    }

    class SchedulingQueue {
        -queue : lockfree::queue~SchedulerTask*~
        -running : atomic~bool~
        +pushBack(task) void
        -runTasks() Task~void~
    }

    class Scheduler {
        +computeSchedule(req) Task~SchedulerOutput~
        -fetchForecasts(locations) Task~ForecastData~
    }

    class SchedulerAlgo {
        +calcSingle(costs, W, P) CostTable
        +calcMulti(costTables, W) SpatialResult
    }

    class CalendarService {
        +persistSchedule(output) Task~void~
        +getSchedule(id) Task~ScheduleResult~
        +deleteSchedule(id) Task~void~
    }

    class JobRequest {
        +job_type : string
        +gpu_type : string
        +gpu_count : int
        +model_size : float
        +length : float
        +earliest_start : timepoint
        +latest_finish : timepoint
        +workload_amount : float
        +max_load : float
        +startup_overhead : float
    }

    class LocationCost {
        +carbon_intensity : vector~double~
        +capacity : vector~double~
        +kwh_per_flo : double
        +operator[](i) CostFn
    }

    ScheduleController --> SchedulingQueue : enqueues
    SchedulingQueue --> Scheduler : dispatches
    Scheduler --> SchedulerAlgo : invokes DP
    Scheduler --> CalendarService : persists results
    SchedulerAlgo --> LocationCost : evaluates cost
    ScheduleController ..> JobRequest : deserialises from HTTP
```

/// caption
Class diagram of the Scheduler component showing the separation between HTTP controllers, the lock-free scheduling queue, the DP algorithm, and the persistence layer.
///

---

## Design Patterns

1. **Two-Phase Commit-Cancel**: Solves concurrency issues by immediately persisting computed schedules (reserving resources). Users review the optimal placement and can optionally discard it via a `DELETE` request, meaning the view presented is fully guaranteed to represent reality if accepted.
2. **Stateless Optimization Engine**: Inside the Scheduler, the core logic is divorced from state. The optimizer only receives parameters (from APIs and databases) and returns a raw result without handling HTTP framing or ORM persistence. This ensures isolated execution and simplifies unit testing.
3. **Data Transfer Object (DTO) / Niebloid Pattern**: Strict typing boundaries are enforced. Internal allocation structures (`InternalBlock`) are isolated from persistence representations (`JobModel`) and external API responses (`ScheduleResult`). Isolated mapping objects resolve boundary serialization.
4. **Coroutine-based Concurrency**: The Scheduler handles high-throughput API integration via C++23 coroutines (`drogon::Task`), using a custom `when_all` implementation to await parallel HTTP calls to the Stats component without blocking OS threads.
5. **Repository Pattern**: External persistence interfaces, like the `CalendarService`, wrap Drogon's Object-Relational Mapping (ORM) to yield predictable transactions to the core logic layer.

## Data Storage & Schemas

Storage is decentralized into bounded contexts, matching the microservice strategy.

### 1. Stats Persistence

The Stats module utilizes two **SQLite** databases to separate write-heavy collection from read-heavy serving:

- **`carbon_intensity.db`** — Owned by the Carbon Collector thread. Stores raw 30-minute carbon intensity readings and generation mix data from the UK Carbon Intensity API. On first startup, performs a 365-day historical backfill.
- **`cache.db`** — The serving database. Contains synced historical data, cached forecast JSON (with 40-minute TTL expiry), pre-upsampled 5-minute historical data for the trailing 7 days, and the data centre registry (all 14 UK regions with active/inactive state and coordinates).

This separation ensures the collector can write freely without contending with API read traffic on the serving layer.

### 2. Scheduler Persistence

The Scheduler connects to a **PostgreSQL** cluster for persistent record-keeping. While the physical schema is normalized for the relational database, the semantic relationship centers on the concept of a **Scheduled Job** and its associated optimization plans.

```mermaid
erDiagram
    ScheduledJob {
        string id PK "Unique Schedule ID"
        string job_type "Job Category"
        float total_workload "Total Compute Units (FLO)"
    }
    Schedule {
        string strategy "Optimized vs Baseline"
    }
    EnvironmentalImpact {
        float carbon_intensity "Avg. gCO2/kWh"
        float total_emissions "Total gCO2"
        float total_energy "Total kWh"
    }
    WorkloadBlock {
        datetime timestamp "5-minute resolution"
        string location "Datacenter ID"
        float additional_load "Workload allocated to interval"
    }

    ScheduledJob ||--|| Schedule : "defines (optimized)"
    ScheduledJob ||--o| Schedule : "defines (baseline comparison)"
    Schedule ||--|| EnvironmentalImpact : "quantified by"
    Schedule ||--o{ WorkloadBlock : "composed of"
```

/// caption
Semantic Data Model showing the relationship between a high-level Job, its optimized/baseline schedules, and the atomic blocks that make them up.
///

The fundamental atomic unit is the **Workload Block**, representing a 5-minute slice of compute time. A complete **Schedule** is formed by a collection of these blocks distributed across time and space (datacenters). Each schedule is measured by its **Environmental Impact**, allowing the user to compare the carbon footprint of the solver's optimal placement against a trivial baseline.
