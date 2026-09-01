// API de dados do Controle de Pagamentos (Sellmed).
// GET  -> devolve a lista de pagamentos salva no banco (array JSON).
// POST -> substitui a lista salva pelo corpo da requisição (array JSON).
//
// Usa um banco KV via REST (Upstash Redis, adicionado pelo painel do Vercel
// em Storage/Marketplace). As variáveis KV_REST_API_URL e KV_REST_API_TOKEN
// são injetadas automaticamente pelo Vercel quando o banco é conectado ao
// projeto — não é preciso configurar nada aqui.

const KEY = "sellmed_controle_pagamentos";

export default async function handler(req, res) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    res.status(500).json({
      error: "Banco de dados não configurado neste projeto Vercel. Adicione um banco KV (Storage > Marketplace > Redis/Upstash) e faça o redeploy."
    });
    return;
  }

  try {
    if (req.method === "GET") {
      const r = await fetch(`${url}/get/${KEY}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!r.ok) throw new Error(`KV respondeu ${r.status}`);
      const body = await r.json();
      let value = [];
      if (body && typeof body.result === "string") {
        try { value = JSON.parse(body.result); } catch (e) { value = []; }
      }
      res.status(200).json(value);
      return;
    }

    if (req.method === "POST") {
      const payload = JSON.stringify(req.body ?? []);
      const r = await fetch(`${url}/set/${KEY}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "text/plain" },
        body: payload
      });
      if (!r.ok) throw new Error(`KV respondeu ${r.status}`);
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: "Método não permitido" });
  } catch (err) {
    res.status(502).json({ error: "Falha ao acessar o banco de dados: " + err.message });
  }
}
