// Integração do mapa com a sessão e os dados do Supabase.
(async function () {
  const db = window.auraDb;
  const sair = document.getElementById('btnSair');
  if (!db) {
    alert('Não foi possível conectar ao Supabase. Confira sua internet e recarregue a página.');
    location.replace('login.html');
    return;
  }
  const { data: { session }, error: sessionError } = await db.auth.getSession();
  if (sessionError || !session) {
    location.replace('login.html');
    return;
  }
  const user = session.user;
  const { data: perfil, error } = await db.from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (error) console.error('Erro ao carregar perfil:', error);
  const nome = document.getElementById('perfil-nome');
  const email = document.getElementById('perfil-email');
  const telefone = document.getElementById('perfil-telefone');
  const contatoNome = document.getElementById('perfil-contato-nome');
  const contatoTelefone = document.getElementById('perfil-contato-telefone');
  if (nome) nome.value = perfil?.full_name || user.user_metadata?.full_name || '';
  if (email) email.value = user.email || '';
  if (telefone) telefone.value = perfil?.phone || '';
  const exibicao = document.getElementById('nome-perfil-exibicao');
  if (exibicao) exibicao.textContent = perfil?.full_name || user.email || 'Minha conta AURA';
  const { data: contatos, error: contatoError } = await db.from('emergency_contacts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1);
  if (!contatoError && contatos?.length) {
    if (contatoNome) contatoNome.value = contatos[0].name || '';
    if (contatoTelefone) contatoTelefone.value = contatos[0].phone || '';
  }
  const formulario = document.getElementById('formulario-perfil');
  formulario?.addEventListener('submit', async () => {
    const mensagem = document.getElementById('mensagem-perfil');
    const { error: updateError } = await db.from('profiles').update({
      full_name: nome.value.trim(), phone: telefone.value.trim()
    }).eq('id', user.id);
    if (updateError) {
      mensagem.textContent = 'Não foi possível salvar seus dados na conta. ' + updateError.message;
      mensagem.classList.remove('sucesso');
      return;
    }
    const n = contatoNome.value.trim();
    const tel = contatoTelefone.value.trim();
    if (n && tel) {
      const { data: existente } = await db.from('emergency_contacts').select('id').eq('user_id', user.id).limit(1);
      let result;
      if (existente?.length) {
        result = await db.from('emergency_contacts').update({ name: n, phone: tel }).eq('id', existente[0].id);
      } else {
        result = await db.from('emergency_contacts').insert({ user_id: user.id, name: n, phone: tel });
      }
      if (result.error) {
        mensagem.textContent = 'Perfil salvo, mas houve um problema ao salvar o contato: ' + result.error.message;
        mensagem.classList.remove('sucesso');
        return;
      }
    }
    mensagem.textContent = 'Informações salvas na sua conta Aura.';
    mensagem.classList.add('sucesso');
  });
  sair?.addEventListener('click', async () => {
    sair.disabled = true;
    const { error: logoutError } = await db.auth.signOut();
    if (logoutError) { alert('Não foi possível sair. Tente novamente.'); sair.disabled = false; return; }
    location.replace('index.html?intro=0');
  });
})();
