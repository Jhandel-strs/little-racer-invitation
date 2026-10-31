# Deploy to Render

This app uses Express plus local JSON and image-file storage. The Render Blueprint in `render.yaml` configures a persistent disk so invitation edits, RSVPs, and uploaded photos survive restarts and deploys.

## Before deploying

- Put this project in a **private** GitHub repository. `data/database.json` contains invitation details and RSVP contact information, and `uploads/` contains personal photos. Do not publish the source repository.
- In Render, create a **Blueprint** from that private repository so Render reads `render.yaml`. This app must run as a Node Web Service because its Express server handles the `/api/...` routes. A Render Static Site can show the page but cannot handle logins, invitation data, RSVPs, or uploads. Render cannot convert the existing Static Site in place, so the Blueprint creates a separate Web Service named `little-racer-invitation-web` with its own URL.
- The build command installs development dependencies because the Vite build and TypeScript server runner are included there.
- Set `ADMIN_BOOTSTRAP_PASSWORD` to a new, unique password of at least 12 characters when Render prompts for the secret. This changes only the deployed admin password; the local app stays as-is.
- The Blueprint uses a paid web service and a 1 GB persistent disk. Render Free services do not support persistent disks, so they would lose saved edits, RSVPs, and uploads on restarts.

The first service start copies the current invitation database and uploaded photos to the persistent disk, rotates the deployed admin password, and clears any local login sessions. Later starts keep the disk data unchanged.

After the first deploy finishes, Render provides an `onrender.com` URL. The public invitation is at `/invite/little-racer-turns-one`; the admin login is at `/admin`.
