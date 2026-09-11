import { json, options } from "../_zernio.js";
import { clearSession } from "../_session.js";

export default async function handler(req,res) {
  if (options(req,res)) return;
  if (req.method !== "POST") return json(res,405,{error:"Method not allowed"});
  clearSession(res);
  return json(res,200,{ok:true});
}
