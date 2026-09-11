import { options, zernio } from "../_zernio.js";
import { getSession, setState } from "../_session.js";
import crypto from "node:crypto";

function frontendUrl(path = "") {
  const base = process.env.FRONTEND_URL || process.env.APP_URL || `https://${process.env.VERCEL_URL || "localhost:3000"}`;
  return `${base.replace(/\/$/, "")}/${String(path).replace(/^\//, "")}`;
}

function redirect(res, location, status = 302) {
  res.statusCode = status;
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

  try {
    const session = getSession(req);

    // If this browser is already connected, don't start OAuth again.
    if (session?.profileId && session?.accountId) {
      return redirect(res, frontendUrl("?connected=tiktok"));
    }

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
    const callback = `${origin.replace(/\/$/, "")}/api/auth/callback`;

    // Bind the OAuth attempt to this browser session. Zernio supplies the
    // authorization URL; the browser is redirected there directly.
    const state = crypto.randomBytes(24).toString("hex");
    setState(res, { state, profileId });

    const q = new URLSearchParams({
      profileId,
      redirect_url: callback
    });

    const connected = await zernio(`/connect/tiktok?${q.toString()}`);
    if (!connected?.authUrl) throw new Error("Zernio did not return an authorization URL.");

    return redirect(res, connected.authUrl);
  } catch (e) {
    const target = frontendUrl(`?error=${encodeURIComponent(e.message || "Unable to start Zernio connection.")}`);
    return redirect(res, target, 302);
  }
}
