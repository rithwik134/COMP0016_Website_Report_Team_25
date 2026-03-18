# COMP0016 Website Report - Team 25

## How to Serve the Documentation

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
