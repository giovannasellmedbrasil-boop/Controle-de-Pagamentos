// Protege o site inteiro (pagina + api) com usuario e senha (HTTP Basic Auth).
// Suporta dois perfis:
//   - admin  (BASIC_AUTH_USER / BASIC_AUTH_PASS)   -> acesso completo
//   - viewer (VIEWER_USER / VIEWER_PASS)           -> somente visualização
// Credenciais ficam nas variaveis de ambiente (Vercel > Settings > Environment
// Variables) - nunca no codigo. O papel autenticado (admin/viewer) é
// repassado via header "x-app-role" para as funções seguintes (api/data.js,
// api/whoami.js) decidirem o que permitir.

import { next } from "@vercel/functions";

function unauthorized() {
  return new Response("Autenticação necessária.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Controle de Pagamentos Sellmed", charset="UTF-8"'
    }
  });
}

function parseBasicAuth(request) {
  const authHeader = request.headers.get("authorization") || "";
  const match = authHeader.match(/^Basic\s+(.+)$/i);
  if (!match) return null;
  let decoded = "";
  try {
    decoded = atob(match[1]);
  } catch (e) {
    return null;
  }
  const sep = decoded.indexOf(":");
  if (sep === -1) return { user: decoded, pass: "" };
  return { user: decoded.slice(0, sep), pass: decoded.slice(sep + 1) };
}

export default function middleware(request) {
  const adminUser = process.env.BASIC_AUTH_USER;
  const adminPass = process.env.BASIC_AUTH_PASS;
  const viewerUser = process.env.VIEWER_USER;
  const viewerPass = process.env.VIEWER_PASS;

  if (!adminUser || !adminPass) {
    return new Response(
      "Login não configurado neste projeto Vercel (faltam as variáveis BASIC_AUTH_USER / BASIC_AUTH_PASS).",
      { status: 500 }
    );
  }

  const creds = parseBasicAuth(request);
  let role = null;
  if (creds) {
    if (creds.user === adminUser && creds.pass === adminPass) {
      role = "admin";
    } else if (viewerUser && viewerPass && creds.user === viewerUser && creds.pass === viewerPass) {
      role = "viewer";
    }
  }

  if (!role) return unauthorized();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-app-role", role);
  return next({ request: { headers: requestHeaders } });
}
