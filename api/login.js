// Verifica usuario/senha e devolve um cookie de sessao assinado.

import { createSessionToken, SESSION_COOKIE_NAME, SESSION_TTL_SECONDS } from "../lib/session.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método não permitido" });
    return;
  }

  const adminUser = process.env.BASIC_AUTH_USER;
  const adminPass = process.env.BASIC_AUTH_PASS;
  const viewerUser = process.env.VIEWER_USER;
  const viewerPass = process.env.VIEWER_PASS;
  const secret = process.env.SESSION_SECRET;

  if (!adminUser || !adminPass || !secret) {
    res.status(500).json({ error: "Login não configurado neste projeto Vercel." });
    return;
  }

  const body = req.body || {};
  const user = String(body.user || "");
  const pass = String(body.pass || "");

  let role = null;
  if (user === adminUser && pass === adminPass) {
    role = "admin";
  } else if (viewerUser && viewerPass && user === viewerUser && pass === viewerPass) {
    role = "viewer";
  }

  if (!role) {
    res.status(401).json({ error: "Usuário ou senha incorretos." });
    return;
  }

  const token = await createSessionToken(secret, role, SESSION_TTL_SECONDS);
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${SESSION_TTL_SECONDS}; HttpOnly; Secure; SameSite=Lax`
  );
  res.status(200).json({ ok: true, role });
}
