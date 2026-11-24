# Aura Integrado

Este projeto mantém as telas públicas e o visual do `aura_js` e integra autenticação Supabase e o mapa do `AuraMapa`.

## Estrutura
- `index.html`, `cadastro.html`, `login.html`: telas originais do aura_js.
- `js/supabase-client.js` e `js/auth.js`: autenticação/cadastro via Supabase.
- `mapa.html`, `css/mapa.css`, `js/mapa.js`: mapa, pesquisa de endereços, rotas alternativas e relatos.
- `js/map-auth.js`: exige sessão ativa, carrega perfil/contato e permite sair.
- `backend/src`: servidor Java para servir o site e receber/consultar alertas.
- `aura-schema.sql`: estrutura de tabelas e políticas Supabase do projeto de autenticação.
- `dados/alertas.csv`: armazenamento local dos relatos recebidos pelo backend Java.

## Configuração Supabase
1. Abra o projeto Supabase utilizado anteriormente.
2. No SQL Editor, execute `aura-schema.sql` uma única vez (se as tabelas e políticas ainda não existirem).
3. Confirme em `js/supabase-client.js` que URL e chave publicável correspondem ao seu projeto. A chave publicável pode ficar no frontend; nunca coloque uma chave `service_role`/secret.
4. No Authentication, configure a URL de redirecionamento para o endereço local usado no teste, por exemplo `http://localhost:8080/login.html`.

## Como executar com o backend Java
É necessário ter JDK instalado. Abra o terminal na pasta raiz `Aura_Integrado` e execute:

```bash
mkdir -p build
javac -d build backend/src/Main.java backend/src/BancoDados.java
java -cp build Main
```

No Windows PowerShell, os comandos equivalentes são:

```powershell
New-Item -ItemType Directory -Force build
javac -d build backend/src/Main.java backend/src/BancoDados.java
java -cp build Main
```

Depois acesse `http://localhost:8080`. Use o servidor Java para que o envio/consulta dos relatos em `/api/alertas` funcione. Abrir por `file://` ou somente pelo Live Server não disponibiliza essa API.

## Recursos e limites desta versão
- Cadastro/login de usuária e empresa são autenticados pelo Supabase.
- Após entrar, a pessoa é direcionada ao mapa.
- O mapa usa Leaflet e OpenStreetMap; busca de endereços pelo Nominatim e rotas a pé pelo serviço Valhalla. Esses serviços dependem de internet e de disponibilidade externa.
- Relatos são gravados no CSV pelo backend Java com status `PENDENTE`; a consulta pública retorna somente relatos com status `APROVADO`. A aprovação precisa ser feita administrativamente no CSV nesta versão.
- O botão SOS apenas registra uma confirmação na tela; não chama polícia, bombeiros nem envia localização. Em emergência real, use os canais oficiais.
- O contato de emergência é armazenado na tabela `emergency_contacts`, mas não recebe notificações automáticas.

## Segurança
A chave Supabase presente no frontend deve ser apenas a chave publicável. As regras RLS do SQL controlam o acesso aos dados. Não publique credenciais secretas.
