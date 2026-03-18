# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UCL COMP0016 Systems Engineering project report website for Team 25. This is the **website report** component (worth 40% of the grade) for the **Carbon-Aware AI Workload Scheduler** project (main repo: `/Users/alirazajafree/carbon-aware-ai-agents`).

The website documents the full project lifecycle: requirements, research, algorithms, UI design, system design, implementation, testing, evaluation, and appendices. It must be submitted as a **static site** (HTML/CSS/JS/images only) — examiners open `index.html` directly without installing anything. Hosted at `students.cs.ucl.ac.uk/2025/group25/` with a 500 MB space limit.

## The Project Being Reported On

The Carbon-Aware AI Workload Scheduler has three HTTP-connected components:
- **Scheduler** (C++23/Drogon): DP-based optimization engine allocating AI workloads to low-carbon time slots
- **Stats** (Python/FastAPI): Forecasting service using Ridge regression on UK Carbon Intensity API + Open-Meteo weather data
- **UI** (Next.js/React): Web interface for job submission and visualization

Data centers are dynamic — the Stats service exposes a `/locations` endpoint listing available locations. Currently 5 DCs mapped to UK Carbon Intensity API regions, but the full set of possible locations is any region supported by the UK Carbon Intensity API.

## Current Architecture — MkDocs

The site is built with **MkDocs** (Material theme). Content lives in Markdown files under `docs/`. The legacy `COMP0016_Website_Report/` directory contains an old Next.js/React scaffolding that is no longer used.

- **Config:** `mkdocs.yml` at the repo root
- **Source:** `docs/*.md` (one file per report section)
- **Images:** `docs/images/`
- **Build:** `mkdocs build` generates a self-contained static site in `site/`
- **Dev server:** `mkdocs serve` for local preview

### Build & Deploy

```bash
mkdocs build          # outputs to site/
# upload site/ contents to students.cs.ucl.ac.uk/2025/group25/
```

The built `site/` directory contains only HTML, CSS, JS, and images — examiners can open `site/index.html` directly. All internal links work as local files.

## Font

All text on the site must use **DejaVu Sans** — the default font used by matplotlib for plot labels and titles. This ensures visual consistency between the website text and any matplotlib-generated figures/charts embedded in the report. Apply this font globally via CSS (`font-family: 'DejaVu Sans', sans-serif`) and in the MkDocs theme configuration.

## Deployment Constraint

The PDF deliverables spec requires:
- Static website only (HTML, CSS, images) — the MkDocs build output satisfies this
- Examiners must not need to install anything — just open `index.html` from the built `site/` folder
- All internal links must work when opened as local files
- All pages must be reachable from the index page
- Hosted at UCL student servers with a 500 MB space limit

## Required Report Sections (from deliverables PDF)

Each page must include specific content per the marking criteria:
- **Home**: Abstract (problem/solution/impact), 8-min video, team bios with photos, Gantt chart
- **Requirements**: Partner intro, goals, requirement gathering methods, personas, use cases, MoSCoW tables (functional + non-functional)
- **Research**: Related project reviews, technology comparisons, technical decision summary, IEEE references
- **Algorithms**: Model descriptions, dataset, experiments with quantified results, plots/tables, discussion
- **UI Design**: Design principles, hand-drawn sketches, high-fidelity wireframes
- **System Design**: Architecture diagram, site map, sequence/class diagrams, data schema, APIs
- **Implementation**: Key feature descriptions with diagrams and code snippets
- **Testing**: Strategy, unit/integration/compatibility/performance/UAT with partner feedback
- **Evaluation**: Achievement table (MoSCoW status), known bugs, individual contribution tables (separate for system + website), critical evaluation, future work
- **Appendices**: User manual (with screenshots), deployment manual (step-by-step), legal/GDPR, dev blog link, monthly videos
