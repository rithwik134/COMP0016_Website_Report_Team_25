# COMP0016 Systems Engineering Project

## Carbon-Aware AI Workload Scheduler – Team 25

*Final Prototype Deliverables and Assessment*

---

### Abstract

**Problem:** Today, large‑scale AI workloads are usually scheduled to maximise speed or minimise cost, with little regard for the carbon intensity of the electricity powering the data centres that run them. As demand for computation keeps rising, the emissions associated with that electricity use become increasingly significant. The challenge is no longer just deciding whether a job can run, but choosing when and where it should run so that it uses cleaner energy.

**Solution:** Our approach is a carbon‑aware scheduler that makes decisions along two key dimensions: time and location. By combining carbon‑intensity forecasts with the ability to break workloads into smaller pieces, the system can place tasks into lower‑carbon windows and regions instead of treating all datacentres and time slots as interchangeable. Many AI workloads are naturally parallel, so splitting them into discrete chunks allows the scheduler to take advantage of predictable daily patterns—such as cleaner grids overnight—and geographic differences in energy sources. For details on how we selected and validated our forecasting model, see the [Forecasting Model Research](research.md#forecasting-model-research).

**Achievement & Impact:** The result is a full end‑to‑end platform that predicts carbon intensity, generates valid schedules, and demonstrates measurable reductions in emissions compared to running workloads without optimisation. It also produces impact estimates that align with existing reporting standards. Beyond the technical results, the project offers a practical, reusable method for organisations and individuals who want to reduce the environmental footprint of their AI operations without redesigning their workloads or investing in new hardware.

---

### Project Demo Video

*TODO: Embed 8-minute demo video*

---

### Development Team

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

    balls

    [:octicons-mark-github-16: GitHub](https://github.com/akioweh)
    [:octicons-link-external-16: Website](https://akioweh.com)
    [:octicons-mail-16: Contact](mailto:0@akioweh.com)

- **Rithwik**

    ---

    balls

    [:octicons-mark-github-16: GitHub](https://github.com/akioweh)
    [:octicons-link-external-16: Website](https://akioweh.com)
    [:octicons-mail-16: Contact](mailto:0@akioweh.com)

</div>

---

### Project Management

<iframe src="gantt-chart.html" width="100%" height="620" style="border:none;"></iframe>
