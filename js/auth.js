// Login e cadastro: abas, máscaras, validação e conexão real com o Supabase.
(function () {
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const tabs = document.getElementById("tabs");
  const roles = ["usuaria", "empresa"];
  const toast = (m, ms) => window.auraToast(m, ms);

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

  // ---------- CNPJ: confere os dígitos verificadores ----------
  function cnpjValido(cnpj) {
    if (!/^\d{14}$/.test(cnpj) || /^(\d)\1{13}$/.test(cnpj)) return false;
    const calc = (len) => {
      let soma = 0, peso = len - 7;
      for (let i = 0; i < len; i++) { soma += Number(cnpj[i]) * peso--; if (peso < 2) peso = 9; }
      const r = soma % 11;
      return r < 2 ? 0 : 11 - r;
    };
    return calc(12) === Number(cnpj[12]) && calc(13) === Number(cnpj[13]);
  }

  // ---------- helpers ----------
  const soDigitos = (v) => (v || "").replace(/\D/g, "");
  const val = (form, name) => (form.elements[name]?.value || "").trim();

  function traduzErro(error) {
    const m = (error.message || "").toLowerCase();
    if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
    if (m.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar: procure a mensagem na sua caixa de entrada (e no spam).";
    if (m.includes("already registered") || m.includes("already been registered")) return "Este e-mail já está cadastrado. Tente entrar.";
    if (m.includes("database error saving new user")) return "Não foi possível criar a conta. Verifique se o CNPJ já foi cadastrado e se os dados estão corretos.";
    if (m.includes("rate limit") || m.includes("too many")) return "Muitas tentativas seguidas. Espere alguns minutos e tente de novo.";
    if (m.includes("not authorized")) return "O envio de e-mails de teste está limitado a e-mails autorizados no projeto.";
    if (m.includes("password")) return "A senha não atende aos requisitos (mínimo de 8 caracteres).";
    if (m.includes("fetch") || m.includes("network")) return "Sem conexão com o servidor. Verifique sua internet.";
    return "Algo deu errado: " + error.message;
  }

  function urlDe(pagina) {
    return /^https?:/.test(location.protocol) ? new URL(pagina, location.href).href : undefined;
  }

  async function comBotao(form, fn) {
    const btn = form.querySelector('button[type="submit"]');
    const texto = btn.textContent;
    btn.disabled = true; btn.textContent = "Aguarde…";
    try { await fn(); } catch (err) { console.error(err); toast(traduzErro(err)); }
    finally { btn.disabled = false; btn.textContent = texto; }
  }

  function semBanco() {
    if (window.auraDb) return false;
    toast("Não foi possível conectar ao servidor. Verifique sua internet e recarregue a página.");
    return true;
  }

  // ---------- CADASTRO ----------
  async function cadastrar(form) {
    const empresa = form.dataset.rolePanel === "empresa";
    const email = val(form, "email");
    const senha = form.elements.senha.value;
    let dados;

    if (empresa) {
      const cnpj = soDigitos(val(form, "cnpj"));
      if (!cnpjValido(cnpj)) { toast("CNPJ inválido. Confira os números."); return; }
      dados = {
        account_type: "business",
        full_name: val(form, "responsavel"),
        trade_name: val(form, "nome_fantasia"),
        cnpj,
        establishment_type: val(form, "tipo"),
        responsible_name: val(form, "responsavel"),
        phone: val(form, "telefone"),
        safe_zone_opt_in: form.elements.safe_zone.checked,
      };
    } else {
      dados = { account_type: "client", full_name: val(form, "nome"), phone: val(form, "telefone") };
    }

    const { data, error } = await window.auraDb.auth.signUp({
      email, password: senha,
      options: { data: dados, emailRedirectTo: urlDe("login.html") },
    });
    if (error) { toast(traduzErro(error), 7000); return; }

    // E-mail já existente: o Supabase devolve um usuário "vazio" (sem identities)
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      toast("Este e-mail já está cadastrado. Tente entrar.", 6000); return;
    }
    if (data.session) { location.href = "mapa.html"; return; }

    form.reset();
    toast("Conta criada! 🌸 Enviamos um e-mail de confirmação: abra-o e clique no link para ativar sua conta.", 9000);
  }

  // ---------- LOGIN ----------
  async function entrar(form) {
    const empresa = form.dataset.rolePanel === "empresa";
    const email = val(form, "email");
    const { data, error } = await window.auraDb.auth.signInWithPassword({ email, password: form.elements.senha.value });
    if (error) { toast(traduzErro(error)); return; }

    // Confere se a conta é do tipo da aba escolhida
    const { data: perfil } = await window.auraDb.from("profiles").select("account_type").eq("id", data.user.id).maybeSingle();
    const tipo = perfil?.account_type;
    if (tipo && (tipo === "business") !== empresa) {
      await window.auraDb.auth.signOut();
      toast(tipo === "business" ? "Esta conta é de empresa. Use a aba “Sou empresa”." : "Esta conta é de usuária. Use a aba “Sou usuária”.", 6000);
      return;
    }
    location.href = "mapa.html";
  }

  $$("form[data-auth]").forEach((form) => form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    if (semBanco()) return;
    comBotao(form, () => (form.dataset.auth === "cadastro" ? cadastrar(form) : entrar(form)));
  }));

  $$("[data-soon]").forEach((a) => a.addEventListener("click", (e) => {
    e.preventDefault();
    toast("Recuperação de senha ainda não está disponível.");
  }));
})();
