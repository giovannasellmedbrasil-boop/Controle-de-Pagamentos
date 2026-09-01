# Controle de Pagamentos — Sellmed Brasil

App de controle de pagamentos com identidade visual da Sellmed, incluindo sincronização entre dispositivos via a API REST do Supabase, acessada por uma função serverless no Vercel.

## Publicação

O projeto está conectado ao repositório GitHub `Controle-de-Pagamentos` e importado no Vercel — todo `git push` para a branch `main` publica uma nova versão automaticamente.

## Como ativar/reativar a sincronização entre dispositivos

1. No painel do Vercel, abra o projeto → **Settings → Environment Variables**.
2. Adicione duas variáveis:
   - `SUPABASE_URL` — a URL do projeto Supabase (formato `https://<ref>.supabase.co`)
   - `SUPABASE_ANON_KEY` — a chave pública "anon" do projeto (Supabase → Settings → API → Project API keys → **anon public**). Essa chave é segura para expor — o acesso é controlado por Row Level Security no banco.
3. Salve, volte em **Deployments**, e clique em **Redeploy** no último deploy (para carregar as novas variáveis).
4. Abra o link do app em qualquer aparelho: o indicador no cabeçalho deve mostrar **"Sincronizado"**.

**Importante:** nunca coloque a **senha do banco** (connection string `postgresql://...`) nem a chave **service_role** em nenhum arquivo do projeto — só a chave `anon` é segura para isso.

## Login e senha para acessar o app

O site inteiro fica protegido por usuário e senha (o navegador mostra um popup de login nativo). Existem dois perfis:

- **Admin** (`BASIC_AUTH_USER` / `BASIC_AUTH_PASS`) — acesso completo: cria, edita, exclui e anexa comprovantes/NF.
- **Viewer** (`VIEWER_USER` / `VIEWER_PASS`) — somente visualização: vê todas as informações e pode abrir/baixar os comprovantes e recibos/NF já anexados, mas não pode criar, editar, excluir nem enviar novos arquivos.

1. No painel do Vercel, abra o projeto → **Settings → Environment Variables**.
2. Adicione as variáveis:
   - `BASIC_AUTH_USER` / `BASIC_AUTH_PASS` — login de administrador
   - `VIEWER_USER` / `VIEWER_PASS` — login de visualização
3. Salve e faça **Redeploy**.

Se `BASIC_AUTH_USER`/`BASIC_AUTH_PASS` não estiverem configuradas, o site fica bloqueado (por segurança, ele não libera acesso sem login definido). `VIEWER_USER`/`VIEWER_PASS` são opcionais — sem elas, só o login admin funciona.

**Limite de segurança:** a restrição do perfil viewer é aplicada na interface e no servidor (a API de gravação recusa qualquer alteração vinda de um login viewer). O upload de novos anexos, porém, vai direto do navegador para o Supabase Storage — nesse ponto específico a restrição é só de interface, não impede alguém tecnicamente capaz de forçar um upload pelas ferramentas do navegador. Para o uso normal (equipe do financeiro só consultando), isso não é um problema.

## Como funciona por baixo dos panos

- `middleware.mjs` — roda antes de qualquer requisição e exige usuário/senha (HTTP Basic Auth) via `BASIC_AUTH_USER` / `BASIC_AUTH_PASS`.
- `index.html` — o app (interface, tabela, formulário).
- `api/data.js` — função serverless que lê/grava os pagamentos na tabela `app_kv` do Supabase via API REST (PostgREST) — GET devolve a lista, POST substitui a lista.
- A tabela `app_kv` tem Row Level Security ativado, com uma política liberando leitura/escrita para a chave `anon`.
- Cada navegador também guarda uma cópia local (cache) dos dados, então o app continua funcionando mesmo se a internet cair — ele volta a sincronizar assim que a conexão retornar.
- Não há edição simultânea "ao vivo" (tipo Google Docs): quem salvar por último sobrescreve os dados. Para o uso normal (uma pessoa por vez editando pagamentos), isso não costuma ser um problema.
