# IDLERYU X TIKTOK — Zernio OAuth Publisher

A Vercel-ready TikTok uploader based on the existing `combined_ui.html`.

## User flow

1. User opens the website.
2. User clicks **Continue with Zernio**.
3. Zernio OAuth connects the user's TikTok account.
4. User returns to the site — no API key is requested from the user.
5. User selects an MP4.
6. Existing 1dleryu MP4 patching runs locally in the browser.
7. User chooses caption, TikTok privacy, comments, Duet, Stitch and cover timestamp.
8. Browser asks the backend for a Zernio presigned upload URL.
9. Browser uploads the patched MP4 directly to Zernio storage.
10. Backend publishes the post to the connected TikTok account.

## Important architecture note

Zernio's OAuth connection is for connecting a social account to a Zernio profile; it is not a generic "Zernio login" identity provider. This repository therefore uses a stateless website session and Zernio profiles:

`website session -> Zernio profile -> connected TikTok account`

The server-side `ZERNIO_API_KEY` is never placed in `index.html` and never sent to the browser.

The repository intentionally avoids a database. The signed HttpOnly session stores the Zernio `profileId`, TikTok `accountId`, and username. For a larger production SaaS, add a real database/user system so sessions and ownership survive browser/device changes.

## Deploy on GitHub + Vercel

1. Create a new GitHub repository.
2. Upload all files from this folder.
3. Import the repository into Vercel.
4. Add these Vercel environment variables:

- `ZERNIO_API_KEY` — your Zernio server API key.
- `SESSION_SECRET` — a long random secret (32+ random bytes recommended).
- `APP_URL` — the exact backend Vercel URL, for example `https://your-backend.vercel.app`.
- `FRONTEND_URL` — the exact public website URL, for example `https://1dleryu.vercel.app`.
- `ALLOWED_ORIGIN` — the exact public website origin, normally the same value as `FRONTEND_URL`.

5. Redeploy.

## Zernio/TikTok setup

Your Zernio account needs access to the API and the TikTok connection flow. The TikTok connection must grant the scopes required for the desired action. Direct publishing requires TikTok's `video.publish` capability; draft delivery uses `video.upload`.

The backend calls:

- `GET /v1/connect/tiktok`
- `POST /v1/profiles`
- `GET /v1/accounts/{accountId}/tiktok/creator-info`
- `POST /v1/media/presign`
- `POST /v1/posts`

## No API key for website users

Users never type their Zernio API key into your website. Your server owns one Zernio API key and creates one Zernio profile per website user/session.

## Limitations

- This version is intentionally database-free. If the user clears cookies or changes devices, they may need to connect again.
- Direct TikTok posting can be limited by TikTok/Zernio posting capacity and account limits.
- TikTok requires `content_preview_confirmed` and `express_consent_given`.
- Never commit `.env` or a real Zernio API key to GitHub.
- Do not accept arbitrary `accountId` values from the browser; this backend takes the account ID from the signed session.

## References

Zernio docs:
- https://docs.zernio.com/guides/connecting-accounts
- https://docs.zernio.com/multi-tenant
- https://docs.zernio.com/guides/media-uploads
- https://docs.zernio.com/platforms/tiktok


## Reliable OAuth launch

The **Continue with Zernio** button does not use `fetch()` to start OAuth. It is a normal browser navigation to `/api/auth/start`. The backend creates the Zernio profile/state, asks Zernio for the authorization URL, and responds with an HTTP 302 redirect to Zernio. This avoids the most common CORS failure during the initial OAuth launch.

After Zernio redirects back to `/api/auth/callback`, the backend stores the signed session cookie and redirects the browser to `FRONTEND_URL`. The later session/creator/publish API calls may still use credentialed CORS when the frontend and backend are on different Vercel domains.
