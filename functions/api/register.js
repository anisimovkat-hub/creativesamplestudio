const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store"
};

const WEBINAR_ID = "CSS-WEB-FASHION-BRAND-AS-A-SYSTEM";
const GUIDE_URL =
  "https://creativesamplestudio.pages.dev/webinar/CSS_Launch_Framework_Guide_and_Self_Assessment.pdf";
const WEBINAR_TITLE = "Fashion Brand as a System: The CSS Launch Framework™";
const WEBINAR_START_UTC = "20260924T170000Z";
const WEBINAR_END_UTC = "20260924T180000Z";
const ZOOM_URL =
  "https://us06web.zoom.us/j/86009322932?pwd=MWLEAxVSDzRGdZ0KR5bhAhtwq5Ppbd.1";
const CALENDAR_URL =
  "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Fashion%20Brand%20as%20a%20System%3A%20The%20CSS%20Launch%20Framework%E2%84%A2&dates=20260924T170000Z%2F20260924T180000Z&ctz=Europe%2FLondon&details=FREE%20ONLINE%20WEBINAR%0A%0AThe%20strategic%20framework%20behind%20successful%20fashion%20brand%20launches%20%E2%80%94%20and%20why%20the%20strongest%20brands%20are%20built%20as%20systems%2C%20not%20just%20collections.%0A%0AHosted%20by%20Evgeniya%20Khorosheva%2C%20Ksenia%20McGinn%20%26%20Ludovica%20Ferrari.%0A%0AFormat%3A%2045-minute%20presentation%20followed%20by%2015%20minutes%20of%20Q%26A.%0A%0AJoin%20Zoom%20Meeting%3A%0Ahttps%3A%2F%2Fus06web.zoom.us%2Fj%2F86009322932%3Fpwd%3DMWLEAxVSDzRGdZ0KR5bhAhtwq5Ppbd.1%0A%0AMeeting%20ID%3A%20860%200932%202932%0APasscode%3A%20086198&location=Zoom";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function clean(value, maxLength = 250) {
  return String(value || "").trim().slice(0, maxLength);
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function brevoApiKey(value) {
  const rawValue = String(value || "");
  const keyMatch = rawValue.match(/xkeysib-[A-Za-z0-9_-]+/);
  return keyMatch ? keyMatch[0] : rawValue.replace(/[^\x21-\x7E]/g, "").trim();
}

function splitName(fullName) {
  const parts = fullName.split(/\s+/).filter(Boolean);
  return {
    firstName: parts.shift() || fullName,
    lastName: parts.join(" ") || "-"
  };
}

function icsEscape(value) {
  return String(value || "")
    .replaceAll("\\", "\\\\")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,")
    .replace(/\r?\n/g, "\\n");
}

function bytesToBase64(bytes) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

function textToBase64(value) {
  return bytesToBase64(new TextEncoder().encode(value));
}

function calendarInvite(lead) {
  const description = [
    "FREE ONLINE WEBINAR",
    "",
    "The strategic framework behind successful fashion brand launches — and why the strongest brands are built as systems, not just collections.",
    "",
    "Hosted by Evgeniya Khorosheva, Ksenia McGinn & Ludovica Ferrari.",
    "",
    "Format: 45-minute presentation followed by 15 minutes of Q&A.",
    "",
    `Join Zoom: ${ZOOM_URL}`
  ].join("\n");
  const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Creative Sample Studio//CSS Webinar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    "UID:css-launch-framework-20260924@creativesamplestudio.co.uk",
    `DTSTAMP:${timestamp}`,
    `DTSTART:${WEBINAR_START_UTC}`,
    `DTEND:${WEBINAR_END_UTC}`,
    `SUMMARY:${icsEscape(WEBINAR_TITLE)}`,
    `DESCRIPTION:${icsEscape(description)}`,
    "LOCATION:Zoom",
    `URL:${ZOOM_URL}`,
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    "ORGANIZER;CN=Creative Sample Studio:mailto:marketing@creativesamplestudio.co.uk",
    `ATTENDEE;CN=${icsEscape(lead.name)};RSVP=TRUE;PARTSTAT=NEEDS-ACTION:mailto:${lead.email}`,
    "END:VEVENT",
    "END:VCALENDAR",
    ""
  ].join("\r\n");
}

async function emailAttachments(lead) {
  const guideResponse = await fetch(GUIDE_URL);
  if (!guideResponse.ok) throw new Error("Guide attachment download failed");

  return [
    {
      name: "CSS Launch Framework Guide and Self Assessment.pdf",
      content: bytesToBase64(new Uint8Array(await guideResponse.arrayBuffer()))
    },
    {
      name: "Fashion Brand as a System - 24 September 2026.ics",
      content: textToBase64(calendarInvite(lead))
    }
  ];
}

async function saveToGoogleSheet(env, lead) {
  const response = await fetch(env.GOOGLE_SHEETS_WEBHOOK_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      secret: env.GOOGLE_SHEETS_WEBHOOK_SECRET,
      action: "upsert_registration",
      ...lead,
      registered_at: new Date().toISOString(),
      webinar_date: "2026-09-24 18:00 Europe/London",
      registration_status: "Pre-registered",
      zoom_registrant_id: "",
      zoom_join_url: "",
      attendance_status: ""
    })
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.ok === false) {
    throw new Error("Google Sheet update failed");
  }
}

async function upsertBrevoContact(env, lead) {
  const listIds = [
    env.BREVO_WEBINAR_LIST_ID,
    lead.marketing_consent ? env.BREVO_MARKETING_LIST_ID : null
  ]
    .filter(Boolean)
    .map(Number)
    .filter(Number.isFinite);
  const body = { email: lead.email, updateEnabled: true };
  if (listIds.length) body.listIds = [...new Set(listIds)];

  const response = await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": brevoApiKey(env.BREVO_API_KEY),
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Brevo contact update response", response.status, errorBody);
    throw new Error("Brevo contact update failed");
  }
}

async function sendBrevoGuideEmail(env, lead) {
  const firstName = splitName(lead.name).firstName;
  const safeName = escapeHtml(firstName);
  const subject = "You’re registered: Fashion Brand as a System";
  const attachments = await emailAttachments(lead);
  const textContent = [
    `Hi ${firstName},`,
    "",
    "You’re registered for Fashion Brand as a System: The CSS Launch Framework™.",
    "",
    "24 September 2026 · 18:00 London time · 13:00 New York time",
    "",
    `Add the event to your calendar: ${CALENDAR_URL}`,
    `Join on Zoom: ${ZOOM_URL}`,
    "",
    "We’ve attached the CSS Launch Framework™ Guide & Brand Readiness Self-Assessment, together with a calendar invitation for the webinar.",
    "",
    "The webinar explores the strategic framework behind commercially viable fashion brand launches — from positioning and product development to production, pricing, marketing and launch.",
    "",
    "Best regards,",
    "Evgeniya Khorosheva",
    "Co-Founder & CEO",
    "Creative Sample Studio"
  ].join("\n");

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": brevoApiKey(env.BREVO_API_KEY),
      "content-type": "application/json"
    },
    body: JSON.stringify({
      sender: {
        email: env.BREVO_SENDER_EMAIL,
        name: env.BREVO_SENDER_NAME
      },
      replyTo: {
        email: env.BREVO_SENDER_EMAIL,
        name: env.BREVO_SENDER_NAME
      },
      to: [{ email: lead.email, name: lead.name }],
      subject,
      textContent,
      attachment: attachments,
      htmlContent: `
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>${WEBINAR_TITLE}</title>
          </head>
          <body style="margin:0;padding:0;background:#F4F2EF;color:#1A1A1A;font-family:Arial,sans-serif;">
            <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
              Your guide, Zoom access and calendar invitation are inside.
            </div>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#F4F2EF;">
              <tr>
                <td align="center" style="padding:32px 16px;">
                  <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;border-collapse:collapse;background:#FFFFFF;">
                    <tr>
                      <td style="padding:28px 32px 24px;background:#1A1A1A;color:#FFFFFF;font-size:11px;letter-spacing:1.7px;font-weight:bold;">
                        CREATIVE SAMPLE STUDIO
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:34px 32px 12px;color:#1A1A1A;font-size:16px;line-height:1.65;">
                        <p style="margin:0 0 18px;">Hi ${safeName},</p>
                        <p style="margin:0 0 18px;">
                          You’re registered for <strong>Fashion Brand as a System: The CSS Launch Framework™</strong>.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:12px 32px 24px;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #D8D4CD;background:#F8F7F4;">
                          <tr>
                            <td style="padding:20px 18px;width:78px;color:#1A1A1A;font-size:24px;line-height:1;font-weight:bold;text-align:center;border-right:1px solid #D8D4CD;">24<br><span style="font-size:11px;letter-spacing:1.3px;">SEP</span></td>
                            <td style="padding:18px 20px;color:#1A1A1A;">
                              <div style="font-size:16px;line-height:1.35;font-weight:bold;">Free online webinar</div>
                              <div style="padding-top:5px;font-size:14px;line-height:1.5;">18:00 London time<br>13:00 New York time · Live on Zoom</div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:0 32px 8px;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                          <tr>
                            <td style="padding:0 10px 12px 0;"><a href="${CALENDAR_URL}" target="_blank" style="display:inline-block;padding:13px 18px;background:#262C9E;color:#FFFFFF;font-size:14px;font-weight:bold;text-decoration:none;">Add to Google Calendar</a></td>
                            <td style="padding:0 0 12px 0;"><a href="${ZOOM_URL}" target="_blank" style="display:inline-block;padding:13px 18px;border:1px solid #262C9E;color:#262C9E;font-size:14px;font-weight:bold;text-decoration:none;">Join on Zoom</a></td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:6px 32px 34px;color:#1A1A1A;font-size:16px;line-height:1.65;">
                        <p style="margin:0 0 18px;">
                          We’ve also attached the <strong>CSS Launch Framework™ Guide &amp; Brand Readiness Self-Assessment</strong>, together with a calendar invitation for the webinar.
                        </p>
                        <p style="margin:0 0 18px;">
                          The webinar explores the strategic framework behind commercially viable fashion brand launches — from positioning and product development to production, pricing, marketing and launch.
                        </p>
                        <p style="margin:24px 0 0;">
                          Best regards,<br>
                          <strong>Evgeniya Khorosheva</strong><br>
                          Co-Founder &amp; CEO<br>
                          Creative Sample Studio
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>`
    })
  });
  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Brevo email response", response.status, errorBody);
    throw new Error("Guide email failed");
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return json({ error: "Request origin is not allowed." }, 403);
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 12_000) return json({ error: "Request is too large." }, 413);

  const requiredConfiguration = [
    "BREVO_API_KEY",
    "BREVO_SENDER_EMAIL",
    "BREVO_SENDER_NAME",
    "GOOGLE_SHEETS_WEBHOOK_URL",
    "GOOGLE_SHEETS_WEBHOOK_SECRET",
    "WEBINAR_TITLE"
  ];
  if (requiredConfiguration.some((key) => !env[key])) {
    return json({ error: "Pre-registration is being prepared. Please try again shortly." }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return json({ error: "Invalid request." }, 400);
  }

  if (clean(body.website)) return json({ ok: true });

  const lead = {
    webinar_id: clean(body.webinar_id, 80),
    name: clean(body.name, 120),
    email: clean(body.email, 254).toLowerCase(),
    phone: clean(body.phone, 50),
    brand: clean(body.brand, 120),
    position: clean(body.position, 120),
    marketing_consent: body.marketing_consent === true,
    landing_url: clean(body.landing_url, 1000),
    utm_source: clean(body.utm_source, 120),
    utm_medium: clean(body.utm_medium, 120),
    utm_campaign: clean(body.utm_campaign, 180),
    utm_content: clean(body.utm_content, 180)
  };

  if (lead.webinar_id !== WEBINAR_ID) {
    return json({ error: "Unknown webinar." }, 400);
  }
  if (lead.name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
    return json({ error: "Please enter a valid name and email address." }, 400);
  }
  if (lead.position.length < 2) {
    return json({ error: "Please enter your position." }, 400);
  }

  try {
    await Promise.all([
      saveToGoogleSheet(env, lead),
      upsertBrevoContact(env, lead)
    ]);

    try {
      await sendBrevoGuideEmail(env, lead);
    } catch (error) {
      console.error("Guide email error", error);
    }

    return json({ ok: true });
  } catch (error) {
    console.error("Pre-registration pipeline error", error);
    return json({ error: "We couldn’t complete your pre-registration. Please try again or contact Creative Sample Studio." }, 502);
  }
}

export function onRequestGet() {
  return json({ error: "Method not allowed." }, 405);
}
