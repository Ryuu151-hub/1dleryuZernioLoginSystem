import { json, options, zernio, body } from "../_zernio.js";
import { requireSession } from "../_session.js";

export default async function handler(req,res) {
  if (options(req,res)) return;
  if (req.method !== "POST") return json(res,405,{error:"Method not allowed"});

  try {
    const s = requireSession(req);
    const input = await body(req);
    const {
      publicUrl, caption="", privacyLevel,
      allowComment=true, allowDuet=true, allowStitch=true,
      coverTimestampMs=0
    } = input;

    if (!publicUrl || !/^https:\/\//i.test(publicUrl)) return json(res,400,{error:"Invalid public media URL."});
    if (caption.length > 2200) return json(res,400,{error:"TikTok captions are limited to 2,200 characters."});
    if (!privacyLevel) return json(res,400,{error:"Choose a TikTok posting privacy level."});

    const creator = await zernio(`/accounts/${encodeURIComponent(s.accountId)}/tiktok/creator-info?mediaType=video`,{method:"GET"});
    const levels = creator?.privacyLevels || creator?.privacy_levels || [];
    if (levels.length && !levels.includes(privacyLevel)) {
      return json(res,400,{error:"That privacy level is not available for this TikTok account."});
    }

    const post = await zernio("/posts",{
      method:"POST",
      body:JSON.stringify({
        content: caption,
        mediaItems:[{url:publicUrl,type:"video"}],
        platforms:[{platform:"tiktok",accountId:s.accountId}],
        tiktokSettings:{
          privacy_level:privacyLevel,
          allow_comment:Boolean(allowComment),
          allow_duet:Boolean(allowDuet),
          allow_stitch:Boolean(allowStitch),
          content_preview_confirmed:true,
          express_consent_given:true,
          video_cover_timestamp_ms:Math.max(0,Number(coverTimestampMs)||0),
          draft:false
        },
        publishNow:true
      })
    });

    return json(res,200,post);
  } catch(e) {
    return json(res,e.status || 500,{error:e.message || "TikTok publish failed.",details:e.body});
  }
}
