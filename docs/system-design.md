# System Design

## Architecture

The Carbon-Aware AI Agent is composed of three decoupled components communicating over HTTP RESTful APIs. This microservices-oriented architecture maximizes modularity and allows independent development across appropriate technology stacks.

```mermaid
---
config:
  layout: elk
---
flowchart TB
 subgraph External_Group["External Data Sources"]
    direction LR
        Grid["Grid Carbon Intensity"]
        Weather["Weather Data"]
        DC_State["DC Load & Capacity"]
        Costs["<b>Cost Context</b><br>$$ per Compute Unit"]
  end
 subgraph UI_Comp["UI Component"]
    direction TB
        UI_In["Input Handler"]
        UI_View["Dashboard / Visualizer"]
  end
 subgraph Sched_Comp["Scheduler Component"]
    direction TB
        Solver["<b>Logic Core</b><br>Constraint Solver"]
  end
 subgraph Stats_Comp["Stats Component"]
    direction TB
        Ingest["Data Ingestion"]
        DB[("History DB")]
        Forecast["Forecasting Engine"]
        Norm["Normalizer / API Interface"]
  end
 subgraph System["Software System"]
    direction TB
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
    Costs ==> Ingest
    Solver -- "2. Query State" --> Norm
    Norm -. "3. Normalized Forecasts" .-> Solver

     Grid:::external
     Weather:::external
     DC_State:::external
     Costs:::external
     UI_In:::internal
     UI_View:::internal
     Solver:::internal
     Ingest:::internal
     DB:::database
     Forecast:::internal
     Norm:::internal
     User:::actor
     JobSpec:::dataNode
    classDef component fill:#e1bee7,stroke:#4a148c,stroke-width:2px
    classDef internal fill:#ffffff,stroke:#7b1fa2,stroke-width:1px
    classDef database fill:#fff9c4,stroke:#fbc02d,stroke-width:1px
    classDef actor fill:#ffffff,stroke:#000000,stroke-width:1px
    classDef external fill:#eeeeee,stroke:#999999,stroke-width:1px,stroke-dasharray: 4 4
    classDef dataNode fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
```
/// caption
System Architecture Diagram showing the flow of data between external providers and the core system components.
///

### Component Descriptions

- **UI Component**: A modern, server-side rendered web application built with Next.js. It acts as the primary human-computer interface, visualizing global data center states, plotting environmental metrics, and allowing users to submit task requests and analyze optimized schedules.
- **Scheduler Component**: The core logical computation engine written in C++23. Leveraging the Drogon HTTP framework, it acts as a stateless optimization service. It pulls telemetry and forecasts from the Stats module, runs a constraint solver based on Dynamic Programming (detailed in [Algorithms](./algorithms.md)), and determines the optimal workload distribution to minimize software carbon intensity.
- **Stats Component**: A Python-based FastAPI background service that acts as a uniform data interface. It continuously ingests, normalizes, and forecasts external information such as grid carbon intensity, baseline data center load, and regional weather.

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

For a detailed explanation of the databases, caching strategy, retraining cadence, and the Ridge regression model itself, see [Implementation — Forecasting Service](implementation.md#forecasting-service-stats-component).

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

The UI is structured as a unified dashboard tailored for geographic context and deep schedule insights. The primary navigation includes:

- **Datacenter Map**: A geographic visualization overlaying the positions of datacenters with hardware capacities and environmental metrics.
- **Workload Calendar**: A time-series grid showing both predicted baseline load across nodes and previously scheduled user workloads.
- **Scheduling Form**: Inputs for new job requirements (Workload type, computing amount, and chronological availability window).
- **Results & History View**: After successful scheduling, this displays the environmental impact metrics of the job compared to a non-optimized trivial placement, alongside historical logs of prior runs.

## Design Patterns

1. **Two-Phase Commit-Cancel**: Solves concurrency issues by immediately persisting computed schedules (reserving resources). Users review the optimal placement and can optionally discard it via a `DELETE` request, meaning the view presented is fully guaranteed to represent reality if accepted.
2. **Stateless Optimization Engine**: Inside the Scheduler, the core logic is divorced from state. The optimizer only receives parameters (from APIs and databases) and returns a raw result without handling HTTP framing or ORM persistence. This ensures isolated execution and simplifies unit testing.
3. **Data Transfer Object (DTO) / Niebloid Pattern**: Strict typing boundaries are enforced. Internal allocation structures (`InternalBlock`) are isolated from persistence representations (`JobModel`) and external API responses (`ScheduleResult`). Isolated mapping objects resolve boundary serialization.
4. **Coroutine-based Concurrency**: The Scheduler handles high-throughput API integration via C++23 coroutines (`drogon::Task`), using a custom `when_all` implementation to await parallel HTTP calls to the Stats component without blocking OS threads.
5. **Repository Pattern**: External persistence interfaces, like the `CalendarService`, wrap Drogon's Object-Relational Mapping (ORM) to yield predictable transactions to the core logic layer.

## Data Storage & Schemas

Storage is decentralized into bounded contexts, matching the microservice strategy.

### 1. Stats Persistence
The Stats module utilizes **SQLite** for rapid reading and writing of transient historical context. A background worker continuously writes synthetic or retrieved metrics to the local database, allowing the main web threads to handle GET requests instantly with negligible latency overhead.

### 2. Scheduler Persistence
The Scheduler connects to a **PostgreSQL** cluster for persistent record-keeping of jobs. The schema explicitly handles mapping a unified scheduled job to granular functional chunks. It records unoptimized variations to expose tangible ROI metrics for users.

```mermaid
erDiagram
    JOBS {
        uuid id PK
        string job_type
        float workload_amount
        datetime earliest_start
        datetime latest_finish
    }
    IMPACTS {
        uuid id PK
        uuid job_id FK
        float total_carbon
        float sci_score
    }
    BLOCKS {
        uuid id PK
        uuid impact_id FK
        string location
        datetime timestamp
        float additional_load
    }
    TRIVIAL_IMPACTS {
        uuid id PK
        uuid job_id FK
        float total_carbon
    }

    JOBS ||--o| IMPACTS : "produces optimized"
    JOBS ||--o| TRIVIAL_IMPACTS : "produces baseline"
    IMPACTS ||--o{ BLOCKS : "consists of"
```
/// caption
Entity-Relationship diagram of the Scheduler's relational PostgreSQL schema.
///

The fundamental atomic unit tracked across the pipeline is the **Workload Block**. It defines compute load spanning a specific 5-minute interval mapped to an explicit datacenter. The `Blocks` table unifies this to represent the overall schedule timeline dynamically evaluated by the algorithms.