import crypto from "node:crypto";

const COOKIE = "idleryu_zernio_session";
const STATE_COOKIE = "idleryu_zernio_state";

function secret() {
  if (!process.env.SESSION_SECRET) throw new Error("Missing SESSION_SECRET");
  return process.env.SESSION_SECRET;
}

function sign(value) {
  return crypto.createHmac("sha256", secret()).update(value).digest("base64url");
}

function pack(payload) {
  const value = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${value}.${sign(value)}`;
}

function unpack(token) {
  try {
    const [value, sig] = String(token || "").split(".");
    if (!value || !sig) return null;
    const expected = sign(value);
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const data = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (data.exp && Date.now() > data.exp) return null;
    return data;
  } catch { return null; }
}

function cookies(req) {
  const out = {};
  for (const item of String(req.headers.cookie || "").split(";")) {
    const i = item.indexOf("=");
    if (i < 0) continue;
    out[item.slice(0,i).trim()] = decodeURIComponent(item.slice(i+1).trim());
  }
  return out;
}

function cookie(name, value, maxAge) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function getSession(req) {
  const token = cookies(req)[COOKIE];
  return unpack(token);
}

function addCookie(res, value) {
  const current = res.getHeader("Set-Cookie");
  if (!current) return res.setHeader("Set-Cookie", [value]);
  const list = Array.isArray(current) ? current.slice() : [String(current)];
  list.push(value);
  res.setHeader("Set-Cookie", list);
}

export function setSession(res, data) {
  addCookie(res, cookie(COOKIE, pack({...data, exp: Date.now()+30*24*60*60*1000}), 30*24*60*60));
}

export function clearSession(res) {
  addCookie(res, cookie(COOKIE, "", 0));
}

export function setState(res, data) {
  addCookie(res, cookie(STATE_COOKIE, pack({...data, exp: Date.now()+10*60*1000}), 600));
}

export function getState(req) {
  const token = cookies(req)[STATE_COOKIE];
  return unpack(token);
}

export function clearState(res) {
  addCookie(res, cookie(STATE_COOKIE, "", 0));
}

export function requireSession(req) {
  const session = getSession(req);
  if (!session?.profileId || !session?.accountId) {
    const error = new Error("Not connected to Zernio/TikTok.");
    error.status = 401;
    throw error;
  }
  return session;
}
