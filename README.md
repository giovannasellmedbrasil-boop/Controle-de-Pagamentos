# Controle de Pagamentos — Sellmed Brasil

App de controle de pagamentos com identidade visual da Sellmed, incluindo sincronização entre dispositivos via um banco de dados no próprio Vercel.

## Como publicar (Vercel Drop)

1. Acesse **vercel.com/drop**.
2. Faça login (crie uma conta grátis se ainda não tiver).
3. Arraste esta pasta inteira ("Controle de Pagamentos - App", com o `index.html` e a pasta `api`) para a página.
4. Escolha o time/conta e um nome de projeto, ex: `controle-pagamentos-sellmed`.
5. Clique em **Deploy**. Você recebe um link público fixo.

Nesse primeiro deploy, o app já funciona — mas ainda **sem sincronizar entre aparelhos** (ele cai automaticamente em modo local, mostrando "Modo offline" no canto do cabeçalho). Para sincronizar de verdade, siga o passo abaixo.

## Como ativar a sincronização entre dispositivos

1. No painel do Vercel, abra o projeto que você acabou de criar.
2. Vá na aba **Storage**.
3. Clique em **Create Database** (ou "Marketplace Database Integrations") e escolha um banco **Redis** (ex: fornecido pela **Upstash** — tem plano gratuito).
4. Conecte esse banco ao projeto quando for perguntado (ele adiciona automaticamente as variáveis `KV_REST_API_URL` e `KV_REST_API_TOKEN` ao projeto).
5. Volte para a aba **Deployments** e clique em **Redeploy** no último deploy (para o projeto carregar as novas variáveis).
6. Pronto — abra o link do app em qualquer aparelho: o indicador no cabeçalho deve mostrar **"Sincronizado"**, e os lançamentos passam a ser os mesmos em todos os dispositivos.

## Como funciona por baixo dos panos

- `index.html` — o app (interface, tabela, formulário).
- `api/data.js` — uma função no próprio Vercel que lê/grava os pagamentos no banco Redis (GET devolve a lista, POST substitui a lista).
- Cada navegador também guarda uma cópia local (cache) dos dados, então o app continua funcionando mesmo se a internet cair — ele volta a sincronizar assim que a conexão retornar.
- Não há edição simultânea "ao vivo" (tipo Google Docs): quem salvar por último sobrescreve os dados. Para o uso normal (uma pessoa por vez editando pagamentos), isso não costuma ser um problema.
