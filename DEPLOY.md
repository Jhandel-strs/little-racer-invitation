# Invitation, RSVP, and birthday wishes deployment

The app stores invitation edits and uploaded photos in Google Drive, plus RSVP responses and birthday wishes in Google Sheets. This keeps those records when changing hosting providers.

## Set up the RSVP sheet

1. Create a Google Sheet in the account where you want to receive responses.
2. In that sheet, open **Extensions → Apps Script**.
3. Replace the sample code with the contents of `GoogleSheetsRSVP.gs`, then save.
4. In the function menu, choose `initialize` and click **Run**. Approve Google's authorization prompts for Sheets and Drive. This creates a private Drive file for invitation settings.
5. In **Project Settings → Script Properties**, add `RSVP_READ_KEY` with a long random value (at least 32 characters). Keep this value private.
6. Choose **Deploy → New deployment → Web app** for first-time setup. If this web app already exists, choose **Deploy → Manage deployments**, edit the active deployment, and select **New version**.
7. Set **Execute as** to your account and **Who has access** to anonymous **Anyone** access, then deploy. This is not the same as **Anyone with a Google account**, which requires sign-in. If anonymous access is missing from a Workspace account, use a personal Google account for the script or ask the Workspace administrator to allow anonymous Apps Script web apps.
8. Copy the web app URL that ends in `/exec`. Opening it should say the guestbook service is ready; this only confirms the GET health page works, not that RSVP and wish POST requests can access the spreadsheet.

Keep the spreadsheet private. The invitation settings file in Drive is private; uploaded invitation photos are shared by link so they can appear on the public invitation. Guests can submit RSVPs and wishes; the script only returns private invitation settings and response lists when the `RSVP_READ_KEY` is supplied by the signed-in admin server.

## Deploy the invitation on Vercel for free

1. Import this GitHub repository into Vercel and keep the detected Vite framework and the repository root as the project root. The included `vercel.json` builds the site and routes all `/api/...` calls to the Express function before applying the SPA fallback.
2. In **Project Settings → Environment Variables**, set `ADMIN_BOOTSTRAP_PASSWORD` to a unique password of at least 12 characters. The admin username is `admin`.
3. Add `ADMIN_SESSION_SECRET` with a random value of at least 32 characters. Generate one locally with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.
4. Set `RSVP_SCRIPT_URL` to the same Apps Script `/exec` URL used on Render.
5. Set `RSVP_SHEET_READ_KEY` to the same private value used on Render and as the Apps Script `RSVP_READ_KEY` property. Do not put these secrets in source code or expose them as `VITE_` variables.
6. Set the non-secret build variable `VITE_MAX_IMAGE_UPLOAD_MB` to `4`. Vercel limits function request bodies to 4.5 MB, so the app caps uploaded files below that limit.
7. Apply the environment variables to **Production** (and Preview if desired), then deploy. Vercel will assign a free `*.vercel.app` address. The existing `*.onrender.com` address belongs to Render and cannot be transferred; using a custom address requires owning a domain.
8. Test the public invitation, admin sign-in, a draft save, image upload, RSVP, and birthday wish. Confirm the new RSVP and wish appear in the existing private Google Sheet before sharing the Vercel link.

On Vercel, the admin password is configured in the `ADMIN_BOOTSTRAP_PASSWORD` environment variable rather than changed in the dashboard. To rotate it, update that variable and redeploy; existing admin sessions are invalidated. `ADMIN_SESSION_SECRET` signs short-lived admin sessions and must remain private.

## Deploy the invitation on Render

1. Connect the private GitHub repository to Render and create a **Blueprint** from `render.yaml`.
2. Set `ADMIN_BOOTSTRAP_PASSWORD` to a unique password of at least 12 characters. The username is `admin`; do not use `admin` or `1111` as the password because they are easy to guess and may be flagged as compromised.
3. Set `RSVP_SCRIPT_URL` to the Apps Script `/exec` URL.
4. Set `RSVP_SHEET_READ_KEY` to the exact same value as the Apps Script `RSVP_READ_KEY` property.
5. Deploy and open the new Web Service URL. Sign in at `/admin`; the **RSVPs & Guests** tab shows the responses, and **Refresh** loads the latest replies. Invitation edits and uploaded images are saved to Google Drive, so they survive free-service restarts and redeploys. Submit one test RSVP and confirm it appears in both the dashboard and private sheet before sharing the invitation.

## If the `/exec` page is ready but RSVP or wishes return HTTP 401

In Apps Script, open **Deploy → Manage deployments**, edit the active web app deployment, set **Execute as** to **Me** and **Who has access** to anonymous **Anyone** access, then deploy the new version. Copy that deployment's `/exec` URL into your hosting provider's `RSVP_SCRIPT_URL` environment variable and redeploy the app. A new Apps Script deployment can have a different URL, so the configured value must match the active deployment exactly. `Anyone with a Google account` still requires a Google sign-in and cannot be called anonymously by the app. If anonymous access is not offered, the Workspace administrator is restricting it; deploy the script from a personal Google account or ask the administrator to allow anonymous Apps Script web apps.

To recover admin access, change `ADMIN_BOOTSTRAP_PASSWORD` in the Render service environment to a new private value and redeploy. The service rotates the admin password to that value and clears existing admin sessions. The username remains `admin`.

The Render Free Web Service may take about a minute to wake after 15 minutes without visitors. Its local files reset when it spins down or redeploys, so RSVP responses and birthday wishes go to Google Sheets, while invitation settings and uploaded photos go to Google Drive. Sheet-backed responses are view-only in the dashboard. If invitation storage is unavailable, the admin save and publish actions display an error instead of silently reporting success.

The existing Render Static Site cannot run the Express API. Keep it until the new Web Service has passed the test RSVP, then you can remove the old site if you want.
