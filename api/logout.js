import { SESSION_COOKIE_NAME } from "../lib/session.js";

export default async function handler(req, res) {
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`
  );
  res.status(200).json({ ok: true });
}
