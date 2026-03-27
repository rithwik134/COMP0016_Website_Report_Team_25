function renderKaTeX() {
  if (typeof renderMathInElement === 'function') {
    renderMathInElement(document.body, {
      delimiters: [
        {left: "$$", right: "$$", display: true},
        {left: "$", right: "$", display: false},
        {left: "\\(", right: "\\)", display: false},
        {left: "\\[", right: "\\]", display: true}
      ],
      throwOnError: false
    });
  } else if (typeof katex !== 'undefined') {
    var elements = document.getElementsByClassName("arithmatex");
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      var tex = el.textContent || el.innerText;
      if (tex.startsWith("\\(")) {
        katex.render(tex.slice(2, -2), el, { displayMode: false, throwOnError: false });
      } else if (tex.startsWith("\\[")) {
        katex.render(tex.slice(2, -2), el, { displayMode: true, throwOnError: false });
      }
    }
  }
}

document.addEventListener("DOMContentLoaded", renderKaTeX);
if (typeof document$ !== 'undefined') {
  document$.subscribe(renderKaTeX);
}
