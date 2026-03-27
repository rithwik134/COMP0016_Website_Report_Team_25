# COMP0016 Systems Engineering Project

## Carbon-Aware AI Workload Scheduler – Team 25

*Final Prototype Deliverables and Assessment*

---

## Abstract

**Problem:** Today, large‑scale AI workloads are usually scheduled to maximise speed or minimise cost, with little regard for the carbon intensity of the electricity powering the data centres that run them. As demand for computation keeps rising, the emissions associated with that electricity use become increasingly significant. The challenge is no longer just deciding whether a job can run, but choosing when and where it should run so that it uses cleaner energy.

**Solution:** Our approach is a carbon‑aware scheduler that makes decisions along two key dimensions: time and location. By combining carbon‑intensity forecasts with the ability to break workloads into smaller pieces, the system can place tasks into lower‑carbon windows and regions instead of treating all datacentres and time slots as interchangeable. Many AI workloads are naturally parallel, so splitting them into discrete chunks allows the scheduler to take advantage of predictable daily patterns—such as cleaner grids overnight—and geographic differences in energy sources. For details on how we selected and validated our forecasting model, see the [Forecasting Model Research](research.md#forecasting-model-research).

**Achievement & Impact:** The result is a full end‑to‑end platform that predicts carbon intensity, generates valid schedules, and demonstrates measurable reductions in emissions compared to running workloads without optimisation. It also produces impact estimates that align with existing reporting standards. Beyond the technical results, the project offers a practical, reusable method for organisations and individuals who want to reduce the environmental footprint of their AI operations without redesigning their workloads or investing in new hardware.

---

## Industry Validation: Redefining Carbon-Aware Computing

True innovation requires moving from passive consumer to visionary creator. Instead of simply integrating the Green Software Foundation (GSF) Carbon Aware SDK—the industry-standard toolset backed by global tech giants—we chose to challenge it. By engineering a ground-up alternative, this student-led project hasn't just reached technological parity; it has exposed a fundamental flaw in how the industry currently handles sustainable scheduling.

### The Breakthrough: A 56% Victory
As documented in our comparative analysis, our proprietary scheduling engine delivers an average **56.5% greater carbon reduction** than the official GSF SDK. 

We discovered that the established framework is bottlenecked by a "contiguity penalty"—forcing workloads to run in single, unbroken blocks. By tearing down this constraint and introducing intelligent temporal splitting combined with spatial routing (geographic arbitrage), our algorithm shatters the current benchmarks. We have proven, mathematically and practically, that current enterprise frameworks are leaving massive carbon savings on the table, regardless of the underlying hardware scale.

### The Spotlight: Championed by NTT DATA
Recognizing the disruptive potential of this independent breakthrough, our client, **NTT DATA**, has issued a formal invitation for our team to present our findings at an upcoming GSF weekly assembly. We have been granted an extraordinary 30-minute technical deep-dive—a coveted center-stage allocation strictly reserved for industry-shifting innovations that demand rigorous scrutiny. 

### Anticipating the Titans
We are currently preparing to stand before a steering committee of global innovators to defend our findings. This audience of industry leaders and architects is slated to include representatives from **Microsoft, Google, Intel, GitHub, NTT DATA, Accenture, Thoughtworks, Goldman Sachs, and UBS.**

This upcoming presentation is not a mere dissemination of academic research. The GSF is bringing us into the industry heartbeat because our algorithm represents a critical missing link in carbon-aware orchestration. This invitation stands as definitive validation that independent thinking and unconstrained engineering can systematically out-optimize the foundational software built by the tech industry's titans.

---

## Project Demo Video

*TODO: Embed 8-minute demo video*

---

## Development Team

<div class="grid cards authors" markdown>

- **Ken**

    ---

    balls

    [:octicons-mark-github-16: GitHub](https://github.com/akioweh)
    [:octicons-link-external-16: Website](https://akioweh.com)
    [:octicons-mail-16: Contact](mailto:0@akioweh.com)

- **Maks**

    ---

    balls

    [:octicons-mark-github-16: GitHub](https://github.com/akioweh)
    [:octicons-link-external-16: Website](https://akioweh.com)
    [:octicons-mail-16: Contact](mailto:0@akioweh.com)

- **Ali**

    ---

    ![Ali](images/ali.png)

    Market Microstructure and Machine Learning Researcher

    [:octicons-mark-github-16: GitHub](https://github.com/arjafree)
    [:octicons-link-external-16: Website](https://www.researchgate.net/profile/Ali-Raza-Jafree/research)
    [:octicons-mail-16: Contact](mailto:ali.jafree.24@ucl.ac.uk)

- **Rithwik**

    ---

    balls

    [:octicons-mark-github-16: GitHub](https://github.com/akioweh)
    [:octicons-link-external-16: Website](https://akioweh.com)
    [:octicons-mail-16: Contact](mailto:0@akioweh.com)

</div>

---

## Project Management

<iframe src="gantt-chart.html" width="100%" height="620" style="border:none;"></iframe>
