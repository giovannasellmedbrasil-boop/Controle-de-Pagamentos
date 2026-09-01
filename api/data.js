// API de dados do Controle de Pagamentos (Sellmed).
// GET  -> devolve a lista de pagamentos salva no banco (array JSON).
// POST -> substitui a lista salva pelo corpo da requisição (array JSON).
//
// Usa a API REST do Supabase (PostgREST) em vez de conexão direta Postgres —
// evita problemas de rede (IPv6) entre a Vercel e o banco. Variáveis usadas:
// SUPABASE_URL (ex: https://xxxx.supabase.co) e SUPABASE_ANON_KEY (chave
// pública "anon", segura para expor — protegida por Row Level Security).

const KEY = "sellmed_controle_pagamentos";

export default async function handler(req, res) {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    res.status(500).json({
      error: "Banco de dados não configurado neste projeto Vercel. Adicione SUPABASE_URL e SUPABASE_ANON_KEY (Settings > Environment Variables) e faça o redeploy."
    });
    return;
  }

  const headers = {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    "Content-Type": "application/json"
  };

  try {
    if (req.method === "GET") {
      const r = await fetch(
        `${url}/rest/v1/app_kv?key=eq.${encodeURIComponent(KEY)}&select=value`,
        { headers }
      );
      if (!r.ok) throw new Error(`Supabase respondeu ${r.status}: ${await r.text()}`);
      const rows = await r.json();
      const value = rows.length ? rows[0].value : [];
      res.status(200).json(value);
      return;
    }

    if (req.method === "POST") {
      if (req.headers["x-app-role"] !== "admin") {
        res.status(403).json({ error: "Este login tem acesso somente de visualização." });
        return;
      }
      const payload = req.body ?? [];
      const r = await fetch(`${url}/rest/v1/app_kv?on_conflict=key`, {
        method: "POST",
        headers: { ...headers, Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify([{ key: KEY, value: payload, updated_at: new Date().toISOString() }])
      });
      if (!r.ok) throw new Error(`Supabase respondeu ${r.status}: ${await r.text()}`);
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: "Método não permitido" });
  } catch (err) {
    res.status(502).json({ error: "Falha ao acessar o banco de dados: " + err.message });
  }
}
