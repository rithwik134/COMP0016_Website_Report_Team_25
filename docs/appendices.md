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
Once "Configure Data Centers" is clicked on the sheduling form (number 4 from Figure 1), the user is redirected to this page:

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
User can submit a job to get a schedule by filling in all inputs that allign with industry standard noted in the Scheduling form.

![Filling in Scheduling form](images/user-manual/filling-scheduling-form.png)
/// caption
Filling in sheduling form to submit a job.
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
6. This shart shows information about the datacenter across the timeframe inputted by the user when scheduling the job. Each variable on the chart is labelled and displayed to make it easy for the user to observe the schedule and why the workload is placed where it is.

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
The user can see all scheduled jobs on each datacenter, being able to scroll between the timeframes of the earlies block of work scheduled to the latest one. These graphs use the same metrics as the ones showing a schedules result but includes a "Now" line that indictes the current time.

#### View Previous Jobs
Users are also given the option to see previous jobs they have run:

![Viewing Previous Jobs](images/user-manual/previous-jobs.png)
/// caption
Previous Jobs page, displays a summary of all previous jobs. Can be interacted with to bring up detailed view
///
The user can view all previous jobs through this page. It gives a quick summary about the length, which datacenters are used and statistics on the impact of the job. Interacting with a schedule brings up the Schedule Result page from Figure 4.

## Deployment Manual

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

## Development Blog

## Monthly Video

#### December

![type:video](https://www.youtube.com/embed/EflwW0_Eyvs)

#### January

![type:video](https://www.youtube.com/embed/Tz19r_5-SWo)

#### February

![type:video](https://www.youtube.com/embed/Q1OAhuAjo5o)

#### March

![type:video](https://www.youtube.com/embed/VwbRLEQ8Hww)
