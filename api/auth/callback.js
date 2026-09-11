import { json, options } from "../_zernio.js";
import { getState, setSession, clearState } from "../_session.js";

export default async function handler(req,res) {
  if (options(req,res)) return;
  if (req.method !== "GET") return json(res,405,{error:"Method not allowed"});

  const q = new URL(req.url, `https://${req.headers.host}`).searchParams;
  const profileId = q.get("profileId");
  const accountId = q.get("accountId");
  const username = q.get("username");
  const connected = q.get("connected");
  const error = q.get("error");

  const state = getState(req);
  clearState(res);

  if (error) {
    res.statusCode = 302;
    res.setHeader("Location", `/?error=${encodeURIComponent(error)}`);
    return res.end();
  }

  if (!state?.profileId || !profileId || state.profileId !== profileId || connected !== "tiktok" || !accountId) {
    res.statusCode = 302;
    res.setHeader("Location", "/?error=oauth_validation_failed");
    return res.end();
  }

  setSession(res,{profileId,accountId,username:username || ""});
  res.statusCode = 302;
  res.setHeader("Location", "/?connected=tiktok");
  res.end();
}
