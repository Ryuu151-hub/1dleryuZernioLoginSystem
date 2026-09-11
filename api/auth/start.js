import { json, options, zernio } from "../_zernio.js";
import { getSession, setState } from "../_session.js";
import crypto from "node:crypto";

export default async function handler(req, res) {
  if (options(req,res)) return;
  if (req.method !== "GET") return json(res,405,{error:"Method not allowed"});

  try {
    let session = getSession(req);
    let profileId = session?.profileId;

    if (!profileId) {
      const internalName = `idleryu_${crypto.randomBytes(10).toString("hex")}`;
      const created = await zernio("/profiles", {
        method: "POST",
        body: JSON.stringify({
          name: internalName,
          description: "IDLERYU X TIKTOK user"
        })
      });
      profileId = created?.profile?._id;
      if (!profileId) throw new Error("Zernio did not return a profileId.");
    }

    const origin = process.env.APP_URL || `https://${req.headers.host}`;
    const redirect = `${origin.replace(/\/$/,"")}/api/auth/callback`;
    const state = crypto.randomBytes(24).toString("hex");
    setState(res, {state, profileId});

    const q = new URLSearchParams({
      profileId,
      redirect_url: redirect
    });

    const connected = await zernio(`/connect/tiktok?${q.toString()}`);
    return json(res,200,{authUrl:connected.authUrl});
  } catch (e) {
    return json(res,e.status || 500,{error:e.message || "Unable to start Zernio connection.",details:e.body});
  }
}
