# Requirements

### Project Background

AI workloads (e.g., training large models, inference services) are resource-intensive and often deployed without sustainability considerations. As AI demand is rapidly rising, it becomes increasingly important we prioritise reducing carbon emissions for sustainable development of AI technologies. NTTData, as a Green Software Foundation (GSF) Steering Member, has been working towards providing a trusted ecosystem of people, standard, and tools for delivering green software.
As our client, NTTData assigned us the job of Investigating carbon‑aware scheduling within on‑premise and distributed datacentre environments. The aim is to make environmental performance a first‑class consideration in workload placement, using forecasted carbon‑intensity data and workload flexibility to shift execution toward cleaner periods and locations. By integrating prediction, scheduling, and impact reporting into a single system, the project provides a practical pathway for organisations to reduce emissions from AI operations without redesigning their existing pipelines.

### Project Goals

The overarching goal is to reduce the environmental impact of AI workloads by optimising when and where they run, while keeping the system realistic for real‑world deployment.
More specifically, the framework aims to:
- Minimise emissions by selecting execution windows and locations with lower carbon intensity.
- Enable carbon‑aware decisions using both forecasted and historical grid‑intensity data.
- Take advantage of workload flexibility by breaking parallelisable jobs into short, schedulable blocks.
- Evaluate results using recognised green‑software metrics, including the Software Carbon Intensity (SCI) methodology.
- Deliver an end‑to‑end system—covering prediction, scheduling, and results visualisation—that teams and organisations can adopt directly.

### Requirement Gathering
TO-DO

### Personas
To-DO

### Use Cases
TO-DO

### MoSCoW Requirments
#### Functional Requirements

Must Have

- Ingest AI workload parameters and generate valid schedules.
- Optimize scheduling across time and datacenter location to reduce emissions.
- Use carbon-intensity signals in scheduling decisions.
- Calculate and report emissions for optimized schedules.
- Provide API and UI outputs for scheduling and results.

Should Have

- Compare optimized schedules against a baseline to show savings.
- Split workloads into short execution blocks for finer optimization.
- Include datacenter-level operating factors in optimization decisions.
- Persist schedule history and enable previous-job review.
- Support configurable scheduling constraints and optimization settings.
- Handle incomplete upstream data with fallback behavior.

Could Have 

- Richer visual reporting for trends and per-job impact.
- Multi-objective readiness for carbon, timing, and operational trade-offs.
- Support dynamic datacenter options configured in the UI
- Generate own forecast of carbon intensity using factors that influence carbon intensity (e.g. - weather)

Won’t Have 

- Full cross-cloud autonomous orchestration and billing integration.
- Embodied carbon accounting of hardware lifecycle.

#### Non-Functional Requirements (MoSCoW)

Must Have

- Reliable execution of core scheduling and prediction flows.
- Accurate and consistent impact calculations.
- Clear and interpretable outputs for non-specialist users.
- Standards-aligned impact reporting using SCI-oriented principles.

Should Have

- Modular, testable architecture across services and UI.
- End-to-end traceability from workload input to impact output.
- Interactive performance for schedule generation and result display.
- Scalability for larger job volumes and longer planning horizons.
- Observability through logs and diagnostics.
- Reproducible outputs under fixed inputs and configuration.
- Robust input validation and safe API handling.
- Audit-friendly historical records for review and reporting.

Could Have (Completed Enhancements)

- Extended analytics views for stakeholder reporting.
- Configurability for organization-specific policy tuning.
- Readiness for broader enterprise integration paths.

Won’t Have (Current Scope)

- Formal enterprise-grade HA/SLA guarantees.
- Full IAM and compliance certification stack.
