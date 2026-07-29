# Creative Sample Studio

Cloudflare Pages project for Creative Sample Studio landing pages.

Live webinar landing: <https://creativesamplestudio.pages.dev/webinar/>

## Current page

- Webinar: **Fashion Brand as a System**
- URL path: `/webinar/`
- Date: **to be announced by email**
- Live attendance: free
- Mode: **pre-registration**

The public site is built from `public`. Cloudflare Pages Functions in `functions` provide the protected server-side registration endpoint.

## Registration flow

1. The landing submits to `POST /api/register` on the same Cloudflare domain.
2. The server saves the lead to Google Sheets with the status `Pre-registered`.
3. It adds the contact to the webinar list in Brevo and, only with optional consent, to the marketing list.
4. Brevo sends a pre-registration confirmation from `marketing@creativesamplestudio.co.uk`.
5. Once the date is confirmed, the date, time and Zoom access details are sent in a separate email.

No API keys are stored in the repository or browser code.

## Cloudflare settings

Create the Pages project with Git integration:

- production branch: `main`
- build command: leave empty
- build output directory: `public`
- root directory: `/`

Add these encrypted secrets under **Settings → Variables and Secrets**:

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
