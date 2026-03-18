# Style Guidelines

- **No Manual Heading Numbering**: Do not manually number Markdown headings (e.g., use `## Heading` instead of `## 1. Heading`).
- **Automatic Figure Numbering**: Use the `/// caption` block syntax immediately following an image. This uses the `pymdownx.blocks.caption` extension for automatic numbering and semantic HTML.
    Example:

    ```markdown
    ![Alt text](path/to/image.png)
    /// caption
    My caption here
    ///
    ```
