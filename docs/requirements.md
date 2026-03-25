# Requirements
---
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
We conducted a series of semi-structured interviews on potential users of the program to find the specific needs of our users.

=== "Autonomous Agent Developer"
	**Question:** Would you say the disaster drone algorithms are built with sustainability in mind?<br>
	**Answer:** No, usually the primary focus has always been on speed and reliability because these drones are used in life-saving situations like disaster response. Sustainability tends to take a back seat when performance is critical.

	**Question:** What challenges do you face in achieving sustainable practices while working on disaster drones?<br>
	**Answer:** Sustainability isn’t always a priority in fast-paced tech environments. Disaster scenarios need low-latency, high-GPU workloads, so balancing performance with environmental goals is tough. Plus, there aren’t many tools that make this easy.

	**Question:** If you could design the perfect solution, what would it look like?<br>
	**Answer:** I’d like a platform that helps me deploy workloads efficiently while showing real-time sustainability metrics-like carbon intensity and energy use. It would be ideal if I could see the impact and make informed choices without slowing down operations.

	**Question:** How do you personally measure success when balancing performance and sustainability?<br>
	**Answer:** For me, success means it operates like usual, like low latency for disaster response, while reducing energy consumption and carbon emissions as much as possible. Even small improvements matter. If I can deploy workloads that use fewer resources without compromising performance, that’s a win. I also look for transparency, having clear metrics on energy use and emissions helps me make informed decisions and track progress over time.
=== "AI Researcher"
    **Question:** What motivates you to focus on sustainability in AI? <br>
    **Answer:** AI workloads are incredibly resource intensive, training large models can consume thousands of kilowatt hours. I believe we have a responsibility to make this process more efficient and environmentally conscious.

    **Question:** What challenges do you face in achieving this? <br>
    **Answer:** The biggest challenge is the lack of standardised tools and benchmarks for sustainability. Most platforms prioritise speed and cost, not environmental impact. It’s hard to convince teams to adopt sustainability practices when they don’t see immediate benefits.

    **Question:** If you could design the perfect solution, what would it look like? <br>
    **Answer:** I like the idea of an intelligent system that optimises workload placement across cloud and on-prem environments based on real time carbon intensity and resource efficiency. It should provide transparent metrics like the SCI scores you mentioned and allow me to make trade offs without sacrificing performance.

    **Question:** Do you think the industry is moving toward sustainability? <br>
    **Answer:** Slowly, yes. There’s growing awareness, but use is uneven. We need more tools that make sustainability easy and measurable, so it becomes a natural part of AI development rather than something optional.

### Personas
Using the data collected, we created personas and scenarios for our target users.

![Persona 1, Tim Jackson. Junior Devops Technician of Autonomous Drones Company](images/persona-tim.png)
/// caption
Persona 1, Tim Jackson. Junior Devops Technician of Autonomous Drones Company
///
![Persona 2, Bob Lecun. AI Researcher and Developer](images/persona-bob.png)
/// caption
Persona 2, Bob Lecun. AI Researcher and Developer
///

Based on the surveys, personas, and early design discussions, our team identified several high-level requirements that shape the system:

1. **Optimise placement across multiple premises**: Existing carbon-aware tools typically optimise when a workload runs, but assume it will always run in a single datacentre. To achieve deeper carbon reductions, the system should consider both time and location. Allowing workloads to move between premises enables the scheduler to take advantage of cleaner regions rather than relying on the variability of a single site. This also requires accounting for practical overheads, such as the startup cost of launching a job in a new datacentre.
2. **Split workloads into smaller, schedulable blocks**: Many AI workloads are naturally parallelisable, which means they can be broken into smaller units without affecting correctness. By dividing jobs into short, discrete execution blocks, the scheduler gains far more flexibility to place work in low-carbon windows and distribute it across cleaner regions. This fine-grained structure is essential for achieving meaningful carbon savings rather than coarse, all-or-nothing shifts.
3. **Provide a clear comparison against an unoptimised schedule**: Users need to understand the impact of carbon-aware scheduling in real, tangible terms. The system should therefore generate both an optimised schedule and a baseline schedule that prioritises speed alone. The UI should present these side-by-side, along with intuitive metrics showing the carbon saved, so users can easily interpret the benefits of the optimisation.
4. **Ensure the system remains practical and deployable**: Carbon-aware scheduling must work within real operational constraints. The system should respect job deadlines, datacentre availability, and workload requirements, and it should integrate cleanly with existing pipelines. The goal is not to redesign how AI workloads are written, but to make smarter decisions about when and where they run.
5. **Support transparent, standards-aligned reporting**: To make the results meaningful and comparable, the system should produce impact estimates aligned with recognised green-software metrics (e.g., SCI). This ensures that organisations can trust and reuse the outputs in their own sustainability reporting.

Further conclusions are drawn in the MoSCoW requirements at the bottom of the page.

### Use Cases
The use case diagram below illustrates how different users interact with the carbon‑aware scheduling system. It highlights the core actions available to users, including submitting AI workloads, adjusting datacentre availability, and reviewing both optimised and baseline schedules. These interactions reflect the system’s goal of making carbon‑aware decision‑making accessible and intuitive. By combining workload submission, carbon‑intensity forecasting, and visual comparison tools, the platform supports a smooth end‑to‑end experience that helps users understand and reduce the environmental impact of their AI operations.

![Use Case Diagram for carbon-aware Scheduler](images/use-case-diagram.png)
/// caption
Use-Case Diagram for the program
///



### MoSCoW Requirements
#### Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| 1 | Ability to schedule a workload using specified parameters (e.g. total workload, deadline). | Must Have |
| 2 | Display information about emissions (e.g. total carbon emissions, SCI, electrical usage) after scheduling. | Must Have |
| 3 | Ability to view previously scheduled workloads. | Must Have |
| 4 | Ability to delete previously scheduled workloads. | Must Have |
| 5 | Graphically display when and where a workload is scheduled to run. | Should Have |
| 6 | Ability to view all workloads scheduled with the software simultaneously on a single graph. | Should Have |
| 7 | Provide information about carbon intensity at different times and datacentres, so users can evaluate the optimality of the schedule themselves. | Should Have |
| 8 | Provide the user with information about the maximum forecasting window. | Should Have |
| 9 | Provide the user with the percentage of carbon saved compared to a trivial schedule. | Should Have |
| 10 | Display maximum capacity and exogenous load at each datacentre, providing more insight to the user. | Could Have |
| 11 | Workload description and configuration using hardware-specific information (GPU type, model size, number of GPUs, duration). | Could Have |
| 12 | Allow modification of the available datacentre set to schedule on. | Could Have |
| 13 | Map presenting the geographical location of datacentres. | Could Have |
| 14 | Allow the user to visually compare a trivial schedule to the optimised schedule. | Could Have |
| 15 | Ability to run actual workloads on datacentres. | Won’t Have |
| 16 | Full IAM and compliance certification stack. | Won’t Have |

#### Non-Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| 1 | The forecasting service must predict carbon intensity and load served for the defined prediction window. | Must Have |
| 2 | The forecasting service must make predictions available for any time period within the prediction window. | Must Have |
| 3 | The forecasting service must support a prediction window length of at least 2 days. | Must Have |
| 4 | The scheduling engine must optimise workloads constrained by user specifications (e.g. total workload in kWh). | Must Have |
| 5 | The scheduling engine must account for both temporal and spatial optimisation. | Must Have |
| 6 | The scheduling engine must be deterministic, producing reproducible results. | Must Have |
| 7 | The forecasting service should fetch predicted and actual carbon intensity data from the Carbon Intensity API. | Should Have |
| 8 | The forecasting service should support live fetching and provision of data. | Should Have |
| 9 | The forecasting service should support a prediction window of at least 3 days. | Should Have |
| 10 | The scheduling engine should support additional optimisation constraints (startup overhead, datacentre capacity, exogenous load). | Should Have |
| 11 | The scheduling engine should calculate a trivial schedule for comparison. | Should Have |
| 12 | The scheduling engine should persist schedules and trivial schedules to the database to allow later retrieval. | Should Have |
| 13 | The forecasting service could support a prediction window of at least 7 days. | Could Have |
| 14 | The forecasting service could provide historical carbon intensity data up to a year back with high efficiency. | Could Have |
| 15 | The forecasting service could predict carbon intensity using a lightweight proprietary model. | Could Have |
| 16 | The forecasting service could provide capacity data for each datacentre. | Could Have |
| 17 | The forecasting service could support a prediction granularity of at least 5 minutes. | Could Have |
| 18 | The scheduling engine could allow workloads to be described using hardware specifics (GPU type, number of GPUs, workload duration, model size). | Could Have |
| 19 | The scheduling engine could improve algorithm efficiency to allow for quick schedule computation. | Could Have |
| 20 | The scheduling engine could ensure high and easy scalability with hardware (number of threads, vCPUs). | Could Have |
| 21 | The forecasting service will not support predictions for locations outside the United Kingdom. | Won’t Have |
| 22 | The forecasting service will not support a prediction window longer than 7 days. | Won’t Have |
| 23 | The scheduling engine will not execute actual workloads on datacentres. | Won’t Have |
| 24 | The scheduling engine will not support parallel computation of different scheduling requests. | Won’t Have |
