import { json, options, zernio } from "../_zernio.js";
import { requireSession } from "../_session.js";

export default async function handler(req,res) {
  if (options(req,res)) return;
  if (req.method !== "POST") return json(res,405,{error:"Method not allowed"});
  try {
    requireSession(req);
    const {filename,contentType,size} = await import("../_zernio.js").then(m => m.body(req));
    if (!filename || contentType !== "video/mp4") return json(res,400,{error:"Only MP4 video uploads are supported."});
    if (!Number.isFinite(size) || size <= 0 || size > 5*1024*1024*1024) return json(res,400,{error:"Video must be between 1 byte and 5 GB."});
    const out = await zernio("/media/presign",{
      method:"POST",
      body:JSON.stringify({filename,contentType,size})
    });
    return json(res,200,out);
  } catch(e) {
    return json(res,e.status || 500,{error:e.message || "Unable to create upload URL.",details:e.body});
  }
}
