# COMP0016 Website Report - Team 25

## Project Context

This is a website report on a software project.
See [task_info.md](./task_info.md) for the requirements for the report, and
see [code/](./code/) for the source code of the project being reported on.

## Running (Serving the Website Locally)

This uses `mkdocs`.

### Using `uv`

1. Sync deps (also creates venv on first run!):

    ```bash
    uv sync
    ```

2. Serve:

    ```bash
    uv run mkdocs serve
    ```

### Using regular Python

1. Create a virtual environment and install dependencies:

    ```bash
    python -m venv .venv
    source .venv/bin/activate  # On Windows: . .venv\Scripts\activate
    pip install -e .
    ```

2. Serve:

    ```bash
    mkdocs serve
    ```

Note: `uv` uses Python 3.14; regular venv will use whatever system version you have,
but any modern-ish version should be fine.
