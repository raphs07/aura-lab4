// Cabeçalho comum a todas as páginas ("bem-vindo ao AURA" + Entrar / Cadastro).
// Uso no HTML:  <body data-page="home|login|cadastro"> ... <header data-site-header></header>
(function () {
  const slot = document.querySelector("[data-site-header]");
  if (!slot) return;
  const page = document.body.dataset.page;

  slot.className = "site-header reveal";
  slot.style.setProperty("--d", ".1s");
  slot.innerHTML = `
    <a class="brand" href="index.html?intro=0" aria-label="Aura – página inicial">
      <span data-brand-flower></span>
      <span class="brand-text"><small>bem-vindo ao</small><strong>AURA</strong></span>
    </a>
    <nav class="top-nav" aria-label="Principal">
      <a class="link ${page === "login" ? "on" : ""}" href="login.html">Entrar</a>
      <a class="btn btn-lamp ${page === "cadastro" ? "on" : ""}" href="cadastro.html">Cadastro</a>
    </nav>`;

  slot.querySelector("[data-brand-flower]").replaceWith(window.auraFlower("brand-flower"));
})();
