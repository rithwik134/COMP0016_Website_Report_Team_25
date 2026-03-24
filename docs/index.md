# COMP0016 Systems Engineering Project

## Carbon-Aware AI Workload Scheduler – Team 25

*Final Prototype Deliverables and Assessment*

---

### Abstract

**Problem:** Today, large‑scale AI workloads are usually scheduled to maximise speed or minimise cost, with little regard for the carbon intensity of the electricity powering the data centres that run them. As demand for computation keeps rising, the emissions associated with that electricity use become increasingly significant. The challenge is no longer just deciding whether a job can run, but choosing when and where it should run so that it uses cleaner energy.

**Solution:** Our approach is a carbon‑aware scheduler that makes decisions along two key dimensions: time and location. By combining carbon‑intensity forecasts with the ability to break workloads into smaller pieces, the system can place tasks into lower‑carbon windows and regions instead of treating all datacentres and time slots as interchangeable. Many AI workloads are naturally parallel, so splitting them into discrete chunks allows the scheduler to take advantage of predictable daily patterns—such as cleaner grids overnight—and geographic differences in energy sources. 

**Achievement & Impact:** The result is a full end‑to‑end platform that predicts carbon intensity, generates valid schedules, and demonstrates measurable reductions in emissions compared to running workloads without optimisation. It also produces impact estimates that align with existing reporting standards. Beyond the technical results, the project offers a practical, reusable method for organisations and individuals who want to reduce the environmental footprint of their AI operations without redesigning their workloads or investing in new hardware.
 
---

### Project Demo Video

*TODO: Embed 8-minute demo video*

---

### Development Team

<section class="team-section" aria-label="Development Team">
	<div class="team-grid">
		<article class="team-card">
			<div class="team-photo-placeholder" role="img" aria-label="Member 1 photo placeholder">Photo</div>
			<div class="team-details">
				<h4 class="team-name">Member 1 Name</h4>
				<p class="team-course">Course: [Course Name]</p>
				<p class="team-contribution">Project Contribution: [Part of Project]</p>
			</div>
			<div class="team-links">
				<a class="team-link-icon" href="mailto:member1@ucl.ac.uk" aria-label="Email Member 1">
					<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
						<path d="M2 5h20v14H2V5zm10 7L4 7v10h16V7l-8 5z" />
					</svg>
				</a>
				<a class="team-link-icon" href="https://github.com/member1" target="_blank" rel="noopener noreferrer" aria-label="GitHub profile for Member 1">
					<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
						<path d="M12 .5C5.65.5.5 5.65.5 12A11.5 11.5 0 0 0 8.36 22.6c.58.1.79-.25.79-.56v-2.1c-3.19.7-3.86-1.37-3.86-1.37-.52-1.33-1.27-1.68-1.27-1.68-1.04-.71.08-.69.08-.69 1.15.08 1.75 1.18 1.75 1.18 1.02 1.75 2.68 1.24 3.33.95.1-.74.4-1.24.73-1.52-2.55-.29-5.22-1.27-5.22-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.45.11-3.02 0 0 .96-.31 3.15 1.17a10.92 10.92 0 0 1 5.73 0c2.19-1.48 3.15-1.17 3.15-1.17.62 1.57.23 2.73.11 3.02.73.8 1.18 1.82 1.18 3.07 0 4.4-2.67 5.37-5.23 5.66.41.35.78 1.04.78 2.1v3.11c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
					</svg>
				</a>
				<a class="team-link-icon" href="https://www.linkedin.com/in/member1" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn profile for Member 1">
					<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
						<path d="M4.98 3.5C4.98 4.88 3.86 6 2.48 6S0 4.88 0 3.5 1.12 1 2.48 1s2.5 1.12 2.5 2.5zM.26 8h4.45v14H.26V8zM8 8h4.27v1.91h.06c.59-1.12 2.04-2.3 4.2-2.3 4.49 0 5.32 2.96 5.32 6.82V22h-4.45v-6.73c0-1.61-.03-3.68-2.24-3.68-2.24 0-2.58 1.75-2.58 3.57V22H8V8z" />
					</svg>
				</a>
			</div>
		</article>

		<article class="team-card">
			<div class="team-photo-placeholder" role="img" aria-label="Member 2 photo placeholder">Photo</div>
			<div class="team-details">
				<h4 class="team-name">Member 2 Name</h4>
				<p class="team-course">Course: [Course Name]</p>
				<p class="team-contribution">Project Contribution: [Part of Project]</p>
			</div>
			<div class="team-links">
				<a class="team-link-icon" href="mailto:member2@ucl.ac.uk" aria-label="Email Member 2">
					<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
						<path d="M2 5h20v14H2V5zm10 7L4 7v10h16V7l-8 5z" />
					</svg>
				</a>
				<a class="team-link-icon" href="https://github.com/member2" target="_blank" rel="noopener noreferrer" aria-label="GitHub profile for Member 2">
					<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
						<path d="M12 .5C5.65.5.5 5.65.5 12A11.5 11.5 0 0 0 8.36 22.6c.58.1.79-.25.79-.56v-2.1c-3.19.7-3.86-1.37-3.86-1.37-.52-1.33-1.27-1.68-1.27-1.68-1.04-.71.08-.69.08-.69 1.15.08 1.75 1.18 1.75 1.18 1.02 1.75 2.68 1.24 3.33.95.1-.74.4-1.24.73-1.52-2.55-.29-5.22-1.27-5.22-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.45.11-3.02 0 0 .96-.31 3.15 1.17a10.92 10.92 0 0 1 5.73 0c2.19-1.48 3.15-1.17 3.15-1.17.62 1.57.23 2.73.11 3.02.73.8 1.18 1.82 1.18 3.07 0 4.4-2.67 5.37-5.23 5.66.41.35.78 1.04.78 2.1v3.11c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
					</svg>
				</a>
				<a class="team-link-icon" href="https://www.linkedin.com/in/member2" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn profile for Member 2">
					<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
						<path d="M4.98 3.5C4.98 4.88 3.86 6 2.48 6S0 4.88 0 3.5 1.12 1 2.48 1s2.5 1.12 2.5 2.5zM.26 8h4.45v14H.26V8zM8 8h4.27v1.91h.06c.59-1.12 2.04-2.3 4.2-2.3 4.49 0 5.32 2.96 5.32 6.82V22h-4.45v-6.73c0-1.61-.03-3.68-2.24-3.68-2.24 0-2.58 1.75-2.58 3.57V22H8V8z" />
					</svg>
				</a>
			</div>
		</article>

		<article class="team-card">
			<div class="team-photo-placeholder" role="img" aria-label="Member 3 photo placeholder">Photo</div>
			<div class="team-details">
				<h4 class="team-name">Member 3 Name</h4>
				<p class="team-course">Course: [Course Name]</p>
				<p class="team-contribution">Project Contribution: [Part of Project]</p>
			</div>
			<div class="team-links">
				<a class="team-link-icon" href="mailto:member3@ucl.ac.uk" aria-label="Email Member 3">
					<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
						<path d="M2 5h20v14H2V5zm10 7L4 7v10h16V7l-8 5z" />
					</svg>
				</a>
				<a class="team-link-icon" href="https://github.com/member3" target="_blank" rel="noopener noreferrer" aria-label="GitHub profile for Member 3">
					<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
						<path d="M12 .5C5.65.5.5 5.65.5 12A11.5 11.5 0 0 0 8.36 22.6c.58.1.79-.25.79-.56v-2.1c-3.19.7-3.86-1.37-3.86-1.37-.52-1.33-1.27-1.68-1.27-1.68-1.04-.71.08-.69.08-.69 1.15.08 1.75 1.18 1.75 1.18 1.02 1.75 2.68 1.24 3.33.95.1-.74.4-1.24.73-1.52-2.55-.29-5.22-1.27-5.22-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.45.11-3.02 0 0 .96-.31 3.15 1.17a10.92 10.92 0 0 1 5.73 0c2.19-1.48 3.15-1.17 3.15-1.17.62 1.57.23 2.73.11 3.02.73.8 1.18 1.82 1.18 3.07 0 4.4-2.67 5.37-5.23 5.66.41.35.78 1.04.78 2.1v3.11c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
					</svg>
				</a>
				<a class="team-link-icon" href="https://www.linkedin.com/in/member3" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn profile for Member 3">
					<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
						<path d="M4.98 3.5C4.98 4.88 3.86 6 2.48 6S0 4.88 0 3.5 1.12 1 2.48 1s2.5 1.12 2.5 2.5zM.26 8h4.45v14H.26V8zM8 8h4.27v1.91h.06c.59-1.12 2.04-2.3 4.2-2.3 4.49 0 5.32 2.96 5.32 6.82V22h-4.45v-6.73c0-1.61-.03-3.68-2.24-3.68-2.24 0-2.58 1.75-2.58 3.57V22H8V8z" />
					</svg>
				</a>
			</div>
		</article>

		<article class="team-card">
			<div class="team-photo-placeholder" role="img" aria-label="Member 4 photo placeholder">Photo</div>
			<div class="team-details">
				<h4 class="team-name">Member 4 Name</h4>
				<p class="team-course">Course: [Course Name]</p>
				<p class="team-contribution">Project Contribution: [Part of Project]</p>
			</div>
			<div class="team-links">
				<a class="team-link-icon" href="mailto:member4@ucl.ac.uk" aria-label="Email Member 4">
					<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
						<path d="M2 5h20v14H2V5zm10 7L4 7v10h16V7l-8 5z" />
					</svg>
				</a>
				<a class="team-link-icon" href="https://github.com/member4" target="_blank" rel="noopener noreferrer" aria-label="GitHub profile for Member 4">
					<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
						<path d="M12 .5C5.65.5.5 5.65.5 12A11.5 11.5 0 0 0 8.36 22.6c.58.1.79-.25.79-.56v-2.1c-3.19.7-3.86-1.37-3.86-1.37-.52-1.33-1.27-1.68-1.27-1.68-1.04-.71.08-.69.08-.69 1.15.08 1.75 1.18 1.75 1.18 1.02 1.75 2.68 1.24 3.33.95.1-.74.4-1.24.73-1.52-2.55-.29-5.22-1.27-5.22-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.45.11-3.02 0 0 .96-.31 3.15 1.17a10.92 10.92 0 0 1 5.73 0c2.19-1.48 3.15-1.17 3.15-1.17.62 1.57.23 2.73.11 3.02.73.8 1.18 1.82 1.18 3.07 0 4.4-2.67 5.37-5.23 5.66.41.35.78 1.04.78 2.1v3.11c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
					</svg>
				</a>
				<a class="team-link-icon" href="https://www.linkedin.com/in/member4" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn profile for Member 4">
					<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
						<path d="M4.98 3.5C4.98 4.88 3.86 6 2.48 6S0 4.88 0 3.5 1.12 1 2.48 1s2.5 1.12 2.5 2.5zM.26 8h4.45v14H.26V8zM8 8h4.27v1.91h.06c.59-1.12 2.04-2.3 4.2-2.3 4.49 0 5.32 2.96 5.32 6.82V22h-4.45v-6.73c0-1.61-.03-3.68-2.24-3.68-2.24 0-2.58 1.75-2.58 3.57V22H8V8z" />
					</svg>
				</a>
			</div>
		</article>
	</div>
</section>

---

### Project Management

*TODO: Gantt chart*
