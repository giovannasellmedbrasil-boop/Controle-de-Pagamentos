// Sessao de login assinada (HMAC-SHA256), sem dependencias externas.
// Funciona tanto no runtime Edge (middleware) quanto no runtime Node
// (funcoes em /api), que expoem globalThis.crypto.subtle igualmente.

const encoder = new TextEncoder();

function bufferToHex(buf) {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmac(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return bufferToHex(sig);
}

export async function createSessionToken(secret, role, ttlSeconds) {
  const expires = Date.now() + ttlSeconds * 1000;
  const payload = role + "." + expires;
  const sig = await hmac(secret, payload);
  return payload + "." + sig;
}

export async function verifySessionToken(secret, token) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [role, expiresStr, sig] = parts;
  if (role !== "admin" && role !== "viewer") return null;
  const expires = Number(expiresStr);
  if (!expires || Date.now() > expires) return null;
  const expected = await hmac(secret, role + "." + expiresStr);
  if (expected !== sig) return null;
  return role;
}

export function getCookie(cookieHeader, name) {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.startsWith(name + "=")) {
      return decodeURIComponent(trimmed.slice(name.length + 1));
    }
  }
  return null;
}

export const SESSION_COOKIE_NAME = "sellmed_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 dias
