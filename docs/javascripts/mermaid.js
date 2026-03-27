document$.subscribe(function() {
  if (typeof mermaid !== "undefined") {
    mermaid.initialize({
      startOnLoad: false,
      theme: "default",
      securityLevel: "loose"
    });
    mermaid.run({
      nodes: document.querySelectorAll(".mermaid")
    });
  }
});
