import { json, options, zernio } from "../_zernio.js";
import { requireSession } from "../_session.js";

export default async function handler(req,res) {
  if (options(req,res)) return;
  if (req.method !== "GET") return json(res,405,{error:"Method not allowed"});
  try {
    const s = requireSession(req);
    const info = await zernio(`/accounts/${encodeURIComponent(s.accountId)}/tiktok/creator-info?mediaType=video`, {method:"GET"});
    return json(res,200,info);
  } catch (e) {
    return json(res,e.status || 500,{error:e.message || "Unable to load creator info.",details:e.body});
  }
}
