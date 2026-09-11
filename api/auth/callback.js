import { options } from "../_zernio.js";
import { getState, setSession, clearState } from "../_session.js";

function frontendUrl(query = "") {
  const base = process.env.FRONTEND_URL || process.env.APP_URL || `https://${process.env.VERCEL_URL || "localhost:3000"}`;
  return `${base.replace(/\/$/, "")}/${query ? `?${query.replace(/^\?/, "")}` : ""}`;
}

function redirect(res, location) {
  res.statusCode = 302;
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Location", location);
  return res.end();
}

export default async function handler(req, res) {
  if (options(req, res)) return;
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.setHeader("Allow", "GET, OPTIONS");
    return res.end("Method not allowed");
  }

  const q = new URL(req.url, `https://${req.headers.host}`).searchParams;
  const profileId = q.get("profileId");
  const accountId = q.get("accountId");
  const username = q.get("username");
  const connected = q.get("connected");
  const error = q.get("error") || q.get("error_description");

  const state = getState(req);
  clearState(res);

  if (error) {
    return redirect(res, frontendUrl(`error=${encodeURIComponent(error)}`));
  }

  if (!state?.profileId || !profileId || state.profileId !== profileId || connected !== "tiktok" || !accountId) {
    return redirect(res, frontendUrl("error=oauth_validation_failed"));
  }

  setSession(res, { profileId, accountId, username: username || "" });
  return redirect(res, frontendUrl("connected=tiktok"));
}
