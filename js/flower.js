// A flor do Aura em SVG, gerada por JavaScript.
// Uso no HTML:  <div data-flower></div>   ou   <div data-flower="brand-flower"></div>
// (o elemento é trocado pelo <svg> da flor; o valor vira classe extra).
(function () {
  const NS = "http://www.w3.org/2000/svg";

  // 3 camadas de pétalas: rosa (grande), amarela (média, girada) e azul (pequena)
  const layers = [
    { cls: "p-pink",   cy: 58, rx: 19, ry: 41, offset: 0 },
    { cls: "p-yellow", cy: 70, rx: 14, ry: 30, offset: 22.5 },
    { cls: "p-blue",   cy: 82, rx: 9,  ry: 19, offset: 0 },
  ];

  function el(name, attrs) {
    const node = document.createElementNS(NS, name);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    return node;
  }

  function createFlower(extraClass) {
    const svg = el("svg", {
      class: ("flower " + (extraClass || "")).trim(),
      viewBox: "0 0 200 200",
      "aria-hidden": "true",
      focusable: "false",
    });

    layers.forEach((layer) => {
      const g = el("g", { class: "layer" });
      for (let i = 0; i < 8; i++) {
        const rot = el("g", { class: "rot" });
        rot.style.setProperty("--r", i * 45 + layer.offset + "deg");
        rot.style.setProperty("--i", i);
        rot.appendChild(el("ellipse", { class: "petal " + layer.cls, cx: 100, cy: layer.cy, rx: layer.rx, ry: layer.ry }));
        g.appendChild(rot);
      }
      svg.appendChild(g);
    });

    svg.appendChild(el("circle", { class: "core", cx: 100, cy: 100, r: 13 }));
    svg.appendChild(el("circle", { class: "core-dot", cx: 100, cy: 100, r: 6 }));
    return svg;
  }

  window.auraFlower = createFlower;
  document.querySelectorAll("[data-flower]").forEach((slot) => {
    slot.replaceWith(createFlower(slot.getAttribute("data-flower")));
  });
})();
