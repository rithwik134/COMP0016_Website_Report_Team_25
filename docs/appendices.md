# Appendices

---

## User Manual

#### Using the Scheduling form

When you open up the site, you will be greeted by the scheduling form by default:

![Scheduling Form](images/user-manual/navigation-scheduling-form.png)
/// caption
Pages you can navigate to through the scheduling form.
///

1. Opens the scheduling form shown in Figure 1. Can be used to schedule a job
2. Opens the global workload page to see information on all active datacenters
3. Opens the previous jobs page to see list of previous jobs and its statistics.
4. Open the datacenter configuration page where the user can select which datacenters they want active during scheduling.

#### Configuring Active Datacenters

Once "Configure Data Centers" is clicked on the scheduling form (number 4 from Figure 1), the user is redirected to this page:

![Config Datacenters](images/user-manual/datacenter-config.png)
/// caption
Features of datacenter configuration page.
///

1. Hovering over a datacenter location on the map displays its information
2. Active datacenters are shown as black spots on the map, while inactive are shown as grey
3. Refresh button updates datacenter information fetched from the API. Only used if information sent from API changes.
4. Toggle to activate/deactivate datacenters that will be used in scheduling
5. "Save Configuration" persists active datacenters to be used for scheduling and redirects user back to Scheduling Form.

#### Submitting a Job

User can submit a job to get a schedule by filling in all inputs that align with industry standard noted in the Scheduling form.

![Filling in Scheduling form](images/user-manual/filling-scheduling-form.png)
/// caption
Filling in scheduling form to submit a job.
///

1. User has to choose job type between: Training, Inference, and Batch
2. User selects GPU Type. Currently, it presents a choice between: A100_SXM4 and V100_PCIE however the user can modify this through their own API.
3. User inputs estimated time of the job
4. User inputs how many active GPUs in processing
5. User inputs the Model VRAM Size needed for the workload
6. User inputs time constraints for the job. Includes the date and time.
7. User can select an active datacenter to schedule the entire job in (Only temporal optimisation). Default scheduling across all datacenters allow for greater savings.
8. Once all inputs have been filled in, user can press "Schedule Job" to receive an optimised schedule.

#### Viewing Scheduling Results

Once user has submitted a job, they can view the impact and statistics of the optimisation below:

![Viewing Optimised View](images/user-manual/optimised-view.png)
/// caption
Viewing Optimised schedule
///

1. User can go back to schedule another job, current job is persisted.
2. User can see environmental impact of scheduled job along with its percentage savings. Statistics are from industry standard metrics.
3. User can cancel the job, resulting in this schedule no longer being stored in the program.
4. User can switch between Optimised and Unoptimised views to compare schedules and impact. More on this view below.
5. User can navigate between each active datacenter to see its schedule. Any datacenter that the current job is scheduled in will be indicated in green to make it easier for the user to find.
6. This chart shows information about the datacenter across the timeframe inputted by the user when scheduling the job. Each variable on the chart is labelled and displayed to make it easy for the user to observe the schedule and why the workload is placed where it is.

The unoptimised view gives a way for the user to see the trivial schedule which most workloads are executed using. This can be used to compare to our optimised one and can be seen below:

![Viewing Unoptimised View](images/user-manual/unoptimised-view.png)
/// caption
Viewing Unoptimised schedule
///

1. User can view environmental impact of trivial schedule and compare to optimised values.
2. User can see graph of unoptimised schedule shown in orange.

#### Viewing Global Workload

The user can also see all scheduled jobs across all active datacenters in the global workload page shown below:

![Viewing Global Workload](images/user-manual/workload-calender.png)
/// caption
Global workload page, displays all scheduled jobs across active datacenters
///
The user can see all scheduled jobs on each datacenter, being able to scroll between the timeframes of the earliest block of work scheduled to the latest one. These graphs use the same metrics as the ones showing a schedule result but include a "Now" line that indicates the current time.

#### View Previous Jobs

Users are also given the option to see previous jobs they have run:

![Viewing Previous Jobs](images/user-manual/previous-jobs.png)
/// caption
Previous Jobs page, displays a summary of all previous jobs. Can be interacted with to bring up detailed view
///
The user can view all previous jobs through this page. It gives a quick summary about the length, which datacenters are used and statistics on the impact of the job. Interacting with a schedule brings up the Schedule Result page from Figure 4.

## Deployment Manual

The Carbon-Aware AI Workload Scheduler is designed for flexible deployment across local development environments and cloud infrastructure. We provide multiple containerized methods to handle dependencies and simplify the setup process.  
For general information, consult the documentation in the source repository.

### 1. Local Development (Docker Compose)

The easiest way to run the entire system is using Docker Compose. We provide two configurations depending on whether you want to run the Stats forecasting service locally or use our hosted API.

#### Basic Stack (Recommended for UI/Scheduler Dev)

This configuration starts the UI, Scheduler, and PostgreSQL database. It connects to our remote Stats API by default, reducing local resource consumption.

```bash
docker compose up --build
```

- **UI Dashboard**: [http://localhost:8080](http://localhost:8080)
- **Scheduler API**: [http://localhost:6970](http://localhost:6970)
- **Database**: `localhost:5433` (Internal: `5432`)

#### Full Stack (Local Stats API)

This starts all system components, including the Python-based Stats and Forecasting service. This is useful for testing changes to the forecasting models or when working offline.

```bash
docker compose -f docker-compose.yml -f docker-compose.full.yml up --build
```

#### Configuration

The system behavior can be tuned using environment variables in the `docker-compose` files:

| Variable | Description | Default |
| --- | --- | --- |
| `STATS_API_URL` | Endpoint for the Stats forecasting service | `http://140.238.79.139:5000` |
| `SCHEDULER_API_URL` | Endpoint for the C++ Scheduler service | `http://scheduler:6969` |
| `UI_HOST_PORT` | Public port for the UI dashboard | `8080` |
| `DB_HOST_PORT` | Public port for the PostgreSQL database | `5433` |

### 2. Docker Release Images

Ready-to-use, pre-compiled production images are published to the **GitHub Container Registry (GHCR)**. This allows you to run the stable version of the stack without needing to clone the source code or build the images locally.

To deploy using release images:

1. Download the `docker-compose.release.yml` file from the repository.
2. Run the following command:

```bash
docker compose -f docker-compose.release.yml up
```

### 3. VS Code Dev Containers

For developers who want to modify the source code but lack a local **C++23 compatible toolchain** or specific Python/Node.js environments, we provide a pre-configured **VS Code Dev Container**.

- **Environment**: Includes all necessary compilers (GCC/Clang), libraries (Boost, Drogon), and runtimes (Python 3.x, Node.js).
- **Setup**: Open the repository in VS Code and select "Reopen in Container" when prompted. This ensures a consistent development environment across all team members.

### 4. Cloud Deployment (Azure via Bicep)

The repository includes Infrastructure-as-Code (IaC) in the form of an Azure Bicep file (`code/infra/main.bicep`). This can be used to deploy a production-grade instance of the platform to Azure.

#### Architecture Overview

- **Orchestration**: UI and C++ Scheduler run as **Azure Container Apps (ACA)**.
- **Compute Profile**: The Scheduler scales well with high CPU counts for its Dynamic Programming engine. The Bicep configuration utilizes a **Dedicated D4 Workload Profile** (4 vCPUs) to ensure performance.
- **Database**: Utilizes **Azure Database for PostgreSQL - Flexible Server**.
- **Security**:
  - The environment is configured with internal ingress for the Scheduler (no public exposure).
  - Only the UI is exposed to the public internet via the ACA environment's load balancer.
  - All secrets (DB passwords, registry credentials) are managed via Azure Container App secrets.

#### Deployment Steps

To deploy the infrastructure, use the Azure CLI:

```bash
az deployment group create \
  --resource-group <your-resource-group> \
  --template-file code/infra/main.bicep \
  --parameters pgAdminPassword=<secure-password>
```

---

## Legal Issues and Processes

#### GDPR Compliance

The Carbon-Aware AI Workload Scheduler is designed with privacy in mind and adheres to the principles of the UK General Data Protection Regulation (UK GDPR). The system does not collect, store, or process any personal identifiable information (PII). Specifically:

- **No user authentication or accounts**: The UI allows job submission without login, registration, or any form of user identification.
- **No personal data collection**: Job configurations submitted through the interface contain only technical parameters (workload type, deadline, duration) — no personal data is attached or required.
- **Public data sources only**: The Stats forecasting service consumes data exclusively from public APIs — the [UK Carbon Intensity API](https://carbonintensity.org.uk/) and [Open-Meteo weather API](https://open-meteo.com/) — neither of which involves personal data.
- **No cookies or tracking**: The website and UI do not use cookies, analytics, or any client-side tracking mechanisms.
- **Session-only processing**: Job submissions are processed in-memory by the Scheduler and are not persisted beyond the user's session. No database of user activity exists.

Since the system does not handle personal data at any point in its pipeline, the six GDPR principles are addressed as follows:

| GDPR Principle | How It Is Addressed |
| --- | --- |
| **Lawfulness, Fairness, and Transparency** | Users are informed of the system's purpose. No personal data is collected or processed. |
| **Purpose Limitation** | Data consumed (carbon intensity, weather) is used solely for scheduling optimisation. |
| **Data Minimisation** | Only the minimum technical parameters required for scheduling are accepted as input. |
| **Storage Limitation** | No user data is persisted. Job configurations exist only in-memory during processing. |
| **Integrity and Confidentiality** | All inter-service communication occurs over HTTP between co-located containers. No sensitive data is transmitted. |
| **Accountability** | The source code is publicly available under the MIT License for inspection and audit. |

#### Privacy Statement

The Carbon-Aware AI Workload Scheduler does not collect, store, or share any personal data. No information is transmitted to third parties beyond the public API calls required for carbon intensity and weather data retrieval — these calls contain no user-identifying information.

The third-party services used by the system are:

- **UK Carbon Intensity API** — A free, public API provided by National Grid ESO. No API key or user data is required.
- **Open-Meteo Weather API** — A free, open-source weather API. Requests contain only geographic coordinates and weather parameters.

We reserve the right to update this privacy statement. Any changes will be reflected on this page.

#### Source Code License

The Carbon-Aware AI Workload Scheduler is released under the **MIT License**:

> MIT License
>
> Copyright (c) 2025 Yiqian (akioweh) Liu, Maksymilian (Maksiu) Sieklinski, Ali Raza (arjafree) Jafree, and Rithwik (rithwik134) Chokka
>
> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files, to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, subject to the conditions of the MIT License.

The full license text is available in the [project repository](https://github.com/akioweh/carbon-aware-ai-agents).

#### Terms of Use

- **No Warranty**: The software is provided "as is", without warranty of any kind, express or implied. The authors are not liable for any damages arising from the use of the software.
- **Limitation of Liability**: In no event shall the authors or copyright holders be liable for any claim, damages, or other liability arising from the use of the software.
- **Governing Law**: This project was developed as part of the UCL COMP0016 Systems Engineering module. Any legal inquiries should be directed through UCL.

*Last updated: March 2026*

## Monthly Video

#### December

![type:video](https://www.youtube.com/embed/EflwW0_Eyvs)

#### January

![type:video](https://www.youtube.com/embed/Tz19r_5-SWo)

#### February

![type:video](https://www.youtube.com/embed/Q1OAhuAjo5o)

#### March

![type:video](https://www.youtube.com/embed/VwbRLEQ8Hww)
