// Conexão com o Supabase.
// Estes dois valores são PÚBLICOS (feitos para ficar no navegador).
// A proteção dos dados é feita pelas regras RLS no banco.
// NUNCA coloque aqui a chave "secret" ou "service_role".
(function () {
  const SUPABASE_URL = "https://wjsqeeyzgwipssehonnw.supabase.co";
  const SUPABASE_KEY = "sb_publishable_W8xcnrr5jH_Pc-Ye0RsrPw_vMi_ngeX";

  if (!window.supabase || !window.supabase.createClient) {
    console.error("Biblioteca do Supabase não carregou (sem internet?).");
    window.auraDb = null;
    return;
  }
  window.auraDb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
})();
