// Protege o site inteiro (pagina + api) com usuario e senha (HTTP Basic Auth).
// Credenciais ficam nas variaveis de ambiente BASIC_AUTH_USER / BASIC_AUTH_PASS
// (Vercel > Settings > Environment Variables) - nunca no codigo.

import { next } from "@vercel/functions";

function unauthorized() {
  return new Response("Autenticação necessária.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Controle de Pagamentos Sellmed", charset="UTF-8"'
    }
  });
}

export default function middleware(request) {
  const expectedUser = process.env.BASIC_AUTH_USER;
  const expectedPass = process.env.BASIC_AUTH_PASS;

  if (!expectedUser || !expectedPass) {
    return new Response(
      "Login não configurado neste projeto Vercel (faltam as variáveis BASIC_AUTH_USER / BASIC_AUTH_PASS).",
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization") || "";
  const match = authHeader.match(/^Basic\s+(.+)$/i);

  if (match) {
    let decoded = "";
    try {
      decoded = atob(match[1]);
    } catch (e) {
      decoded = "";
    }
    const sep = decoded.indexOf(":");
    const user = sep === -1 ? decoded : decoded.slice(0, sep);
    const pass = sep === -1 ? "" : decoded.slice(sep + 1);
    if (user === expectedUser && pass === expectedPass) {
      return next();
    }
  }

  return unauthorized();
}
