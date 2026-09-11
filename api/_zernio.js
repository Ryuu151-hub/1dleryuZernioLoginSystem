const BASE = "https://zernio.com/api/v1";

export function env(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export function json(res, status, body, extra = {}) {
  res.status(status);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  const allowedOrigin = process.env.ALLOWED_ORIGIN;
  if (allowedOrigin) res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (allowedOrigin) res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  for (const [k,v] of Object.entries(extra)) res.setHeader(k, v);
  res.end(JSON.stringify(body));
}

export function options(req, res) {
  if (req.method === "OPTIONS") { json(res, 204, {}); return true; }
  return false;
}

export async function zernio(path, init = {}) {
  const key = env("ZERNIO_API_KEY");
  const headers = new Headers(init.headers || {});
  headers.set("Authorization", `Bearer ${key}`);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const response = await fetch(`${BASE}${path}`, {...init, headers});
  const text = await response.text();
  let body = {};
  try { body = text ? JSON.parse(text) : {}; } catch { body = {raw: text}; }

  if (!response.ok) {
    const message = body?.error?.message || body?.error || body?.message || `Zernio request failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    error.body = body;
    throw error;
  }
  return body;
}

export async function body(req) {
  if (req.body && typeof req.body === "object") return req.body;
  let raw = "";
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}
