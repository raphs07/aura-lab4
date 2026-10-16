// Cartões estilo slide: o da frente sobe e sai, o próximo ocupa o lugar.
(function () {
  const cards = [...document.querySelectorAll("#deck .card")];
  const dots = [...document.querySelectorAll("#dots i")];
  if (!cards.length) return;

  let index = 0;

  function render() {
    cards.forEach((card, k) => {
      const pos = k - index;                       // <0 já passou, 0 = frente
      card.dataset.pos = pos < 0 ? -1 : Math.min(pos, 2);
      const active = pos === 0;
      card.toggleAttribute("inert", !active);      // só o da frente recebe foco/clique
      card.setAttribute("aria-hidden", String(!active));
    });
    dots.forEach((d, k) => d.classList.toggle("on", k === index));
  }

  function go(delta) {
    const next = Math.max(0, Math.min(cards.length - 1, index + delta));
    if (next !== index) { index = next; render(); }
  }

  document.querySelectorAll("[data-next]").forEach((b) => b.addEventListener("click", () => go(1)));

  // teclado: setas também navegam
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") go(1);
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") go(-1);
  });

  render();
})();
