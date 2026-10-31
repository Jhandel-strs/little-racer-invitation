# Free RSVP deployment

This setup uses a free Render Web Service for the invitation and a private Google Sheet for RSVP responses. It does not need a paid Render disk.

## Set up the RSVP sheet

1. Create a Google Sheet in the account where you want to receive responses.
2. In that sheet, open **Extensions → Apps Script**.
3. Replace the sample code with the contents of `GoogleSheetsRSVP.gs`, then save.
4. In the function menu, choose `initialize` and click **Run**. Approve Google's authorization prompt.
5. Choose **Deploy → New deployment → Web app**.
6. Set **Execute as** to your account and **Who has access** to **Anyone**, then deploy.
7. Copy the web app URL that ends in `/exec`. Opening it should show “RSVP receiver is ready.”

The script only appends RSVP details. It does not provide a way to read the sheet. Keep the spreadsheet private.

## Deploy the invitation on Render for free

1. Connect the private GitHub repository to Render and create a **Blueprint** from `render.yaml`.
2. Set `ADMIN_BOOTSTRAP_PASSWORD` to a unique password with at least 12 characters.
3. Set `VITE_RSVP_SCRIPT_URL` to the Apps Script `/exec` URL.
4. Deploy and open the new Web Service URL. Submit one test RSVP and confirm it appears in the private sheet before sharing the invitation.

The Render Free Web Service may take about a minute to wake after 15 minutes without visitors. Its local files reset when it spins down or redeploys, so RSVP responses go directly to Google Sheets instead. The admin dashboard's local RSVP list will not include sheet responses; check the spreadsheet for the guest list. Invitation edits and newly uploaded photos through the admin dashboard are temporary on this free service.

The existing Render Static Site cannot run the Express API. Keep it until the new Web Service has passed the test RSVP, then you can remove the old site if you want.
