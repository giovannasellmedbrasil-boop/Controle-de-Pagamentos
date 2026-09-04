// Protege o site inteiro (pagina + api) com uma tela de login propria
// (usuario e senha), em vez do popup nativo do navegador.
//
// Fluxo: sem sessao valida -> serve a pagina de login (para navegacao) ou
// 401 JSON (para chamadas de api). O login em si acontece em /api/login,
// que verifica usuario/senha contra as variaveis de ambiente e devolve um
// cookie de sessao assinado. Esta middleware so LE esse cookie e injeta o
// papel (admin/viewer) no header "x-app-role" para as funcoes seguintes.

import { next } from "@vercel/functions";
import { verifySessionToken, getCookie, SESSION_COOKIE_NAME } from "./lib/session.js";

function loginPage(errorMessage) {
  const errorHtml = errorMessage
    ? '<div class="error" id="err">' + errorMessage + "</div>"
    : '<div class="error" id="err"></div>';
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Login — Controle de Pagamentos Sellmed</title>
<style>
  :root{--navy-900:#0e2049;--navy-700:#1c3f86;--teal-600:#1c93a8;--bg:#f4f6fa;--surface:#fff;--border:#dde2ec;--ink:#152142;--ink-mut:#68708a;}
  @media (prefers-color-scheme: dark){
    :root{--bg:#0a1226;--surface:#121b39;--border:#26315c;--ink:#eef1fb;--ink-mut:#8b93b8;}
  }
  *{box-sizing:border-box;}
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg);font-family:Calibri,Carlito,"Segoe UI",system-ui,-apple-system,sans-serif;padding:16px;}
  .card{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:36px 32px;max-width:360px;width:100%;box-shadow:0 8px 28px -12px rgba(15,32,73,.25);}
  .brand{text-align:center;margin-bottom:24px;}
  .brand .name{font-size:22px;font-weight:800;background:linear-gradient(120deg,var(--navy-900),var(--teal-600));-webkit-background-clip:text;background-clip:text;color:transparent;letter-spacing:.5px;}
  .brand .tag{font-size:12px;color:var(--ink-mut);margin-top:2px;}
  label{display:block;font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:.3px;color:var(--ink-mut);margin:0 0 5px;}
  input{width:100%;padding:10px 12px;border-radius:8px;border:1px solid var(--border);font:inherit;margin-bottom:14px;background:var(--bg);color:var(--ink);}
  button{width:100%;padding:11px;border:none;border-radius:9px;background:var(--teal-600);color:#fff;font:inherit;font-weight:700;cursor:pointer;}
  button:hover{filter:brightness(1.08);}
  button:disabled{opacity:.6;cursor:default;}
  .error{background:#fdecea;color:#c0392b;font-size:12.5px;padding:9px 11px;border-radius:8px;margin-bottom:14px;display:none;}
  .error:not(:empty){display:block;}
</style>
</head>
<body>
  <div class="card">
    <div class="brand"><div class="name">SELLMED BRASIL</div><div class="tag">Controle de Pagamentos</div></div>
    ${errorHtml}
    <form id="f">
      <label for="u">Usuário</label>
      <input type="text" id="u" name="u" autocomplete="username" required autofocus>
      <label for="p">Senha</label>
      <input type="password" id="p" name="p" autocomplete="current-password" required>
      <button type="submit" id="btn">Entrar</button>
    </form>
  </div>
<script>
document.getElementById('f').addEventListener('submit', function(e){
  e.preventDefault();
  var err = document.getElementById('err');
  var btn = document.getElementById('btn');
  err.textContent = '';
  btn.disabled = true;
  btn.textContent = 'Entrando…';
  fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user: document.getElementById('u').value, pass: document.getElementById('p').value })
  }).then(function(r){
    return r.json().then(function(data){ return { ok: r.ok, data: data }; });
  }).then(function(res){
    if(res.ok){
      window.location.reload();
    } else {
      err.textContent = (res.data && res.data.error) || 'Usuário ou senha incorretos.';
      btn.disabled = false;
      btn.textContent = 'Entrar';
    }
  }).catch(function(){
    err.textContent = 'Erro de conexão. Tente novamente.';
    btn.disabled = false;
    btn.textContent = 'Entrar';
  });
});
</script>
</body>
</html>`;
}

export default async function middleware(request) {
  const adminUser = process.env.BASIC_AUTH_USER;
  const adminPass = process.env.BASIC_AUTH_PASS;
  const sessionSecret = process.env.SESSION_SECRET;

  if (!adminUser || !adminPass || !sessionSecret) {
    return new Response(
      "Login não configurado neste projeto Vercel (faltam BASIC_AUTH_USER / BASIC_AUTH_PASS / SESSION_SECRET).",
      { status: 500 }
    );
  }

  const url = new URL(request.url);

  if (url.pathname === "/api/login" || url.pathname === "/api/logout") {
    return next();
  }

  const token = getCookie(request.headers.get("cookie"), SESSION_COOKIE_NAME);
  const role = await verifySessionToken(sessionSecret, token);

  if (!role) {
    if (url.pathname.startsWith("/api/")) {
      return new Response(JSON.stringify({ error: "Não autenticado." }), {
        status: 401,
        headers: { "content-type": "application/json" }
      });
    }
    return new Response(loginPage(""), {
      status: 401,
      headers: { "content-type": "text/html; charset=utf-8" }
    });
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-app-role", role);
  return next({ request: { headers: requestHeaders } });
}
