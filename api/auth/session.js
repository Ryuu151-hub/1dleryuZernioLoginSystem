import { json, options } from "../_zernio.js";
import { requireSession } from "../_session.js";

export default async function handler(req,res) {
  if (options(req,res)) return;
  if (req.method !== "GET") return json(res,405,{error:"Method not allowed"});
  try {
    const s = requireSession(req);
    return json(res,200,{connected:true,account:{accountId:s.accountId,username:s.username,profileId:s.profileId}});
  } catch (e) {
    return json(res,401,{connected:false,error:e.message});
  }
}
