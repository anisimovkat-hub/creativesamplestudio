# Creative Sample Studio

Cloudflare Pages project for Creative Sample Studio landing pages.

Live webinar landing: <https://creativesamplestudio.pages.dev/webinar/>

## Current page

- Webinar: **Fashion Brand as a System**
- URL path: `/webinar/`
- Date: **31 July 2026, 12:00 PM New York / 5:00 PM London**
- Live attendance: free
- Recording: **$30** (checkout intentionally not enabled yet)

The public site is built from `public`. Cloudflare Pages Functions in `functions` provide the protected server-side registration endpoint.

## Registration flow

1. The landing submits to `POST /api/register` on the same Cloudflare domain.
2. The server creates an approved Zoom registrant and receives a personal join link.
3. It saves the lead and Zoom identifiers to Google Sheets.
4. It adds the contact to the webinar list in Brevo and, only with optional consent, to the marketing list.
5. Brevo sends the personal Zoom link from `marketing@creativesamplestudio.co.uk`.
6. The Zoom attendance report can later update the same sheet by webinar ID and email, enabling separate attended and no-show campaigns.

No API keys are stored in the repository or browser code.

## Cloudflare settings

Create the Pages project with Git integration:

- production branch: `main`
- build command: leave empty
- build output directory: `public`
- root directory: `/`

Add these encrypted secrets under **Settings → Variables and Secrets**:

- `ZOOM_ACCOUNT_ID`
- `ZOOM_CLIENT_ID`
- `ZOOM_CLIENT_SECRET`
- `ZOOM_MEETING_ID`
- `BREVO_API_KEY`
- `GOOGLE_SHEETS_WEBHOOK_URL`
- `GOOGLE_SHEETS_WEBHOOK_SECRET`

Optional numeric Brevo list IDs:

- `BREVO_WEBINAR_LIST_ID`
- `BREVO_MARKETING_LIST_ID`

Non-secret sender and event labels are defined in `wrangler.toml`.

## Google Sheet

[CSS Webinar Leads & Attendance Tracker](https://docs.google.com/spreadsheets/d/1DdiTWrzdHRATq1YD9nEPyH_7GimJp3ITkoGK0RpCHRc/edit)

Suggested unique key: `webinar_id + email`. Store the personal Zoom URL and registrant ID in restricted columns; do not publish the sheet.

## Consent and cookies

Marketing consent is deliberately separate and unchecked. Webinar administration emails do not depend on marketing consent. Meta Pixel loads only after the visitor accepts optional cookies; rejecting optional cookies leaves registration fully available.
