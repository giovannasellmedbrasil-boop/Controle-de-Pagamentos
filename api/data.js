// API de dados do Controle de Pagamentos (Sellmed).
// GET  -> devolve a lista de pagamentos salva no banco (array JSON).
// POST -> substitui a lista salva pelo corpo da requisição (array JSON).
//
// Usa um banco Postgres (Supabase). A variável de ambiente DATABASE_URL
// (a connection string do Supabase) precisa estar configurada no projeto
// Vercel em Settings > Environment Variables.

const { Pool } = require("pg");

const KEY = "sellmed_controle_pagamentos";

let pool;
function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 1
    });
  }
  return pool;
}

module.exports = async function handler(req, res) {
  if (!process.env.DATABASE_URL) {
    res.status(500).json({
      error: "Banco de dados não configurado neste projeto Vercel. Adicione a variável DATABASE_URL (Settings > Environment Variables) e faça o redeploy."
    });
    return;
  }

  try {
    const db = getPool();

    if (req.method === "GET") {
      const r = await db.query(
        "select value from app_kv where key = $1",
        [KEY]
      );
      const value = r.rows.length ? r.rows[0].value : [];
      res.status(200).json(value);
      return;
    }

    if (req.method === "POST") {
      const payload = req.body ?? [];
      await db.query(
        `insert into app_kv (key, value, updated_at)
         values ($1, $2::jsonb, now())
         on conflict (key) do update set value = excluded.value, updated_at = now()`,
        [KEY, JSON.stringify(payload)]
      );
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: "Método não permitido" });
  } catch (err) {
    res.status(502).json({ error: "Falha ao acessar o banco de dados: " + err.message });
  }
};
