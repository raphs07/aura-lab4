// Animação de abertura: flor desabrochando -> texto -> some e mostra o site.
// A linha do tempo está no CSS (.intro.play ...). Aqui só controlamos quando ela
// começa, quando termina e quando pular.
//
//   /           toca 1 vez por sessão do navegador
//   /?intro=1   força tocar de novo (bom para testar)
//   /?intro=0   pula
(function () {
  const intro = document.getElementById("intro");
  const body = document.body;
  if (!intro) return;

  const params = new URLSearchParams(location.search);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let seen = false;
  try { seen = sessionStorage.getItem("aura_intro_seen") === "1"; } catch (_) {}

  const force = params.get("intro") === "1";
  const skip = params.get("intro") === "0" || reduce || (seen && !force);

  let finished = false;
  function finish() {
    if (finished) return;
    finished = true;
    try { sessionStorage.setItem("aura_intro_seen", "1"); } catch (_) {}
    intro.remove();
    body.classList.remove("intro-pending"); // libera as animações de entrada do site
  }

  if (skip) { finish(); return; }

  // começa a animação
  requestAnimationFrame(() => intro.classList.add("play"));

  // fim da abertura: aos 4,6 s começa o fade-out (0,8 s)
  const outTimer = setTimeout(() => intro.classList.add("out"), 4600);
  intro.addEventListener("animationend", (e) => { if (e.animationName === "intro-out") finish(); });
  setTimeout(finish, 6000); // garantia

  document.getElementById("intro-skip").addEventListener("click", () => {
    clearTimeout(outTimer);
    intro.classList.add("out");
    setTimeout(finish, 850);
  });
})();
