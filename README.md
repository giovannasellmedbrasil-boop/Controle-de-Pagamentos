# Controle de Pagamentos — Sellmed Brasil

App de controle de pagamentos com identidade visual da Sellmed, incluindo sincronização entre dispositivos via um banco de dados Postgres (Supabase) acessado por uma função serverless no Vercel.

## Publicação

O projeto está conectado ao repositório GitHub `Controle-de-Pagamentos` e importado no Vercel — todo `git push` para a branch `main` publica uma nova versão automaticamente.

## Como ativar/reativar a sincronização entre dispositivos

1. No painel do Vercel, abra o projeto.
2. Vá em **Settings → Environment Variables**.
3. Adicione uma variável chamada `DATABASE_URL`, com o valor sendo a connection string do banco Postgres do Supabase (Supabase → seu projeto → Settings → Database → Connection string).
4. Salve, volte em **Deployments**, e clique em **Redeploy** no último deploy (para carregar a nova variável).
5. Abra o link do app em qualquer aparelho: o indicador no cabeçalho deve mostrar **"Sincronizado"**, e os lançamentos passam a ser os mesmos em todos os dispositivos.

**Importante:** a connection string do Supabase contém a senha do banco — nunca cole ela em nenhum arquivo do projeto/repositório (ele é público). Ela deve ficar só na aba de Environment Variables do Vercel, que é criptografada e não vai para o GitHub.

## Como funciona por baixo dos panos

- `index.html` — o app (interface, tabela, formulário).
- `api/data.js` — função serverless que lê/grava os pagamentos na tabela `app_kv` do Postgres (GET devolve a lista, POST substitui a lista).
- `package.json` — declara a dependência `pg` (driver Postgres), instalada automaticamente pelo Vercel a cada deploy.
- Cada navegador também guarda uma cópia local (cache) dos dados, então o app continua funcionando mesmo se a internet cair — ele volta a sincronizar assim que a conexão retornar.
- Não há edição simultânea "ao vivo" (tipo Google Docs): quem salvar por último sobrescreve os dados. Para o uso normal (uma pessoa por vez editando pagamentos), isso não costuma ser um problema.
