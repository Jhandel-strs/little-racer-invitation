# Free RSVP and birthday wishes deployment

This setup uses a free Render Web Service for the invitation and a private Google Sheet for RSVP responses and birthday wishes. It does not need a paid Render disk.

## Set up the RSVP sheet

1. Create a Google Sheet in the account where you want to receive responses.
2. In that sheet, open **Extensions → Apps Script**.
3. Replace the sample code with the contents of `GoogleSheetsRSVP.gs`, then save.
4. In the function menu, choose `initialize` and click **Run**. Approve Google's authorization prompt.
5. In **Project Settings → Script Properties**, add `RSVP_READ_KEY` with a long random value (at least 32 characters). Keep this value private.
6. Choose **Deploy → New deployment → Web app**.
7. Set **Execute as** to your account and **Who has access** to **Anyone**, then deploy.
8. Copy the web app URL that ends in `/exec`. Opening it should say the guestbook service is ready.

Keep the spreadsheet private. Guests can submit RSVPs and wishes; the script only returns those lists when the private `RSVP_READ_KEY` is supplied by the signed-in admin server.

## Deploy the invitation on Render for free

1. Connect the private GitHub repository to Render and create a **Blueprint** from `render.yaml`.
2. Set `ADMIN_BOOTSTRAP_PASSWORD` to a unique password of at least 12 characters. The username is `admin`; do not use `admin` or `1111` as the password because they are easy to guess and may be flagged as compromised.
3. Set `RSVP_SCRIPT_URL` to the Apps Script `/exec` URL.
4. Set `RSVP_SHEET_READ_KEY` to the exact same value as the Apps Script `RSVP_READ_KEY` property.
5. Deploy and open the new Web Service URL. Sign in at `/admin`; the **RSVPs & Guests** tab shows the responses, and **Refresh** loads the latest replies. Submit one test RSVP and confirm it appears in both the dashboard and private sheet before sharing the invitation.

To recover admin access, change `ADMIN_BOOTSTRAP_PASSWORD` in the Render service environment to a new private value and redeploy. The service rotates the admin password to that value and clears existing admin sessions. The username remains `admin`.

The Render Free Web Service may take about a minute to wake after 15 minutes without visitors. Its local files reset when it spins down or redeploys, so RSVP responses go directly to Google Sheets instead. Sheet-backed responses are view-only in the dashboard. Invitation edits and newly uploaded photos through the admin dashboard are temporary on this free service.

The existing Render Static Site cannot run the Express API. Keep it until the new Web Service has passed the test RSVP, then you can remove the old site if you want.
