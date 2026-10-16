// Login e cadastro (somente visual): abas, máscaras e validação. Nada é enviado.
(function () {
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const tabs = document.getElementById("tabs");
  const roles = ["usuaria", "empresa"];

  // ---------- abas usuária / empresa ----------
  function activate(role, updateUrl) {
    const idx = Math.max(0, roles.indexOf(role));
    tabs.dataset.active = idx;
    $$("[data-role]", tabs).forEach((b) => b.setAttribute("aria-selected", String(b.dataset.role === roles[idx])));
    $$("[data-role-panel]").forEach((f) => { f.hidden = f.dataset.rolePanel !== roles[idx]; });
    $$("[data-keep-role]").forEach((a) => { a.href = a.pathname + "?tipo=" + roles[idx]; });
    if (updateUrl) history.replaceState(null, "", "?tipo=" + roles[idx]);
  }
  $$("[data-role]", tabs).forEach((b) => b.addEventListener("click", () => activate(b.dataset.role, true)));
  activate(new URLSearchParams(location.search).get("tipo") || "usuaria", false);

  // ---------- mostrar/ocultar senha ----------
  $$(".pw-toggle").forEach((btn) => btn.addEventListener("click", () => {
    const input = btn.parentElement.querySelector("input");
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    btn.textContent = show ? "Ocultar" : "Mostrar";
    btn.setAttribute("aria-label", show ? "Ocultar senha" : "Mostrar senha");
  }));

  // ---------- máscaras ----------
  const masks = {
    cnpj: (v) => v.replace(/\D/g, "").slice(0, 14)
      .replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2"),
    phone: (v) => v.replace(/\D/g, "").slice(0, 11)
      .replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d{1,4})$/, "$1-$2"),
  };
  $$("[data-mask]").forEach((input) => input.addEventListener("input", () => {
    input.value = masks[input.dataset.mask](input.value);
  }));

  // ---------- confirmar senha ----------
  $$("[data-confirm]").forEach((input) => {
    const other = document.getElementById(input.dataset.confirm);
    const check = () => input.setCustomValidity(input.value && input.value !== other.value ? "As senhas não coincidem." : "");
    input.addEventListener("input", check);
    other.addEventListener("input", check);
  });

  // ---------- envio (simulado) ----------
  $$("form[data-demo]").forEach((form) => form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    window.auraToast("Protótipo visual: por enquanto nada é enviado nem salvo. A conta real vem na próxima etapa. 🌸");
  }));

  $$("[data-soon]").forEach((a) => a.addEventListener("click", (e) => {
    e.preventDefault();
    window.auraToast("Recuperação de senha ainda não está disponível neste protótipo.");
  }));
})();
