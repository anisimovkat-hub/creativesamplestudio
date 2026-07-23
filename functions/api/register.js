const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store"
};

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

function splitName(fullName) {
  const parts = fullName.split(/\s+/).filter(Boolean);
  return {
    firstName: parts.shift() || fullName,
    lastName: parts.join(" ") || "-"
  };
}

function escapeIcs(value) {
  return String(value || "")
    .replaceAll("\\", "\\\\")
    .replaceAll(/\r?\n/g, "\\n")
    .replaceAll(",", "\\,")
    .replaceAll(";", "\\;");
}

function formatIcsUtc(date) {
  return date.toISOString().replaceAll("-", "").replaceAll(":", "").replace(/\.\d{3}Z$/, "Z");
}

function utf8ToBase64(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 8192) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  }
  return btoa(binary);
}

async function zoomAccessToken(env) {
  const credentials = btoa(`${env.ZOOM_CLIENT_ID}:${env.ZOOM_CLIENT_SECRET}`);
  const tokenUrl = new URL("https://zoom.us/oauth/token");
  tokenUrl.searchParams.set("grant_type", "account_credentials");
  tokenUrl.searchParams.set("account_id", env.ZOOM_ACCOUNT_ID);

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { authorization: `Basic ${credentials}` }
  });
  const body = await response.json();
  if (!response.ok || !body.access_token) {
    throw new Error("Zoom authentication failed");
  }
  return body.access_token;
}

async function createZoomRegistrant(env, lead) {
  const token = await zoomAccessToken(env);
  const name = splitName(lead.name);
  const response = await fetch(
    `https://api.zoom.us/v2/meetings/${encodeURIComponent(env.ZOOM_MEETING_ID)}/registrants`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        email: lead.email,
        first_name: name.firstName,
        last_name: name.lastName,
        auto_approve: true
      })
    }
  );
  const body = await response.json();
  if (!response.ok || !body.join_url) {
    throw new Error("Zoom registration failed");
  }
  return body;
}

async function saveToGoogleSheet(env, lead, zoomRegistrant) {
  const response = await fetch(env.GOOGLE_SHEETS_WEBHOOK_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      secret: env.GOOGLE_SHEETS_WEBHOOK_SECRET,
      action: "upsert_registration",
      ...lead,
      registered_at: new Date().toISOString(),
      zoom_registrant_id: zoomRegistrant.id,
      zoom_join_url: zoomRegistrant.join_url,
      attendance_status: "Registered"
    })
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.ok === false) {
    throw new Error("Google Sheet update failed");
  }
}

async function upsertBrevoContact(env, lead) {
  const listIds = [env.BREVO_WEBINAR_LIST_ID, lead.marketing_consent ? env.BREVO_MARKETING_LIST_ID : null]
    .filter(Boolean)
    .map(Number)
    .filter(Number.isFinite);
  const body = { email: lead.email, updateEnabled: true };
  if (listIds.length) body.listIds = [...new Set(listIds)];

  const response = await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": env.BREVO_API_KEY,
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error("Brevo contact update failed");
}

async function sendBrevoConfirmation(env, lead, zoomRegistrant) {
  const webinarStart = new Date(env.WEBINAR_START_UTC);
  const durationMinutes = Number(env.WEBINAR_DURATION_MINUTES || 60);
  if (Number.isNaN(webinarStart.getTime()) || !Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    throw new Error("Webinar calendar configuration is invalid");
  }
  const webinarEnd = new Date(webinarStart.getTime() + durationMinutes * 60_000);
  const startIcs = formatIcsUtc(webinarStart);
  const endIcs = formatIcsUtc(webinarEnd);
  const calendarDetails = [
    `Personal Zoom link: ${zoomRegistrant.join_url}`,
    "",
    "Please do not share this link. It allows Creative Sample Studio to record your attendance correctly."
  ].join("\n");
  const googleCalendarUrl = new URL("https://calendar.google.com/calendar/render");
  googleCalendarUrl.searchParams.set("action", "TEMPLATE");
  googleCalendarUrl.searchParams.set("text", env.WEBINAR_TITLE);
  googleCalendarUrl.searchParams.set("dates", `${startIcs}/${endIcs}`);
  googleCalendarUrl.searchParams.set("details", calendarDetails);
  googleCalendarUrl.searchParams.set("location", "Zoom");
  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Creative Sample Studio//Webinar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:css-webinar-${startIcs.slice(0, 8)}@creativesamplestudio.co.uk`,
    `DTSTAMP:${formatIcsUtc(new Date())}`,
    `DTSTART:${startIcs}`,
    `DTEND:${endIcs}`,
    `SUMMARY:${escapeIcs(env.WEBINAR_TITLE)}`,
    `DESCRIPTION:${escapeIcs(calendarDetails)}`,
    "LOCATION:Zoom",
    `URL:${escapeIcs(zoomRegistrant.join_url)}`,
    `ORGANIZER;CN=Creative Sample Studio:mailto:${env.BREVO_SENDER_EMAIL}`,
    `ATTENDEE;RSVP=TRUE:mailto:${lead.email}`,
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    "BEGIN:VALARM",
    "TRIGGER:-PT24H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeIcs(env.WEBINAR_TITLE)} starts in 24 hours`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
  const safeName = escapeHtml(splitName(lead.name).firstName);
  const safeDate = escapeHtml(env.WEBINAR_DATE_LABEL);
  const safeTitle = escapeHtml(env.WEBINAR_TITLE);
  const safeJoinUrl = escapeHtml(zoomRegistrant.join_url);
  const safeGoogleCalendarUrl = escapeHtml(googleCalendarUrl.toString());
  const subject = `👗 Webinar: ${env.WEBINAR_TITLE} — ${env.WEBINAR_DATE_LABEL}`;
  const textContent = [
    `Hello ${splitName(lead.name).firstName},`,
    "",
    `Thank you for registering for our webinar, ${env.WEBINAR_TITLE}. We’re delighted to have you join us live.`,
    env.WEBINAR_DATE_LABEL,
    "Live online on Zoom · 60 minutes · Live Q&A included",
    "",
    `Join the webinar: ${zoomRegistrant.join_url}`,
    `Add to Google Calendar: ${googleCalendarUrl.toString()}`,
    "",
    "This is your personal Zoom link. Please do not share it, because it allows us to record your attendance correctly.",
    "",
    "Creative Sample Studio"
  ].join("\n");
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": env.BREVO_API_KEY,
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
      htmlContent: `
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>${safeTitle}</title>
            <style>
              @media only screen and (max-width: 520px) {
                .email-header { padding: 18px 14px !important; }
                .email-brand { font-size: 9.5px !important; letter-spacing: 0.5px !important; }
                .email-badge { font-size: 8px !important; letter-spacing: 0.4px !important; padding: 6px 8px !important; }
                .email-hero { padding: 30px 20px 32px !important; }
                .email-title { font-size: 32px !important; }
                .email-body { padding-left: 20px !important; padding-right: 20px !important; }
              }
            </style>
          </head>
          <body style="margin:0;padding:0;background:#F4F5F7;color:#111114;font-family:Inter,Arial,sans-serif;">
            <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
              Your registration is complete. Your personal Zoom link is inside.
            </div>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#F4F5F7;">
              <tr>
                <td align="center" style="padding:28px 14px;">
                  <table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:640px;background:#FFFFFF;border-collapse:collapse;">
                    <tr>
                      <td class="email-header" style="background:#262C9E;padding:24px 36px;border-bottom:1px solid rgba(255,255,255,0.22);">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;">
                          <tr>
                            <td valign="middle" style="white-space:nowrap;">
                              <div class="email-brand" style="color:#F4F5F7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;font-weight:800;letter-spacing:1.2px;line-height:1;text-transform:uppercase;white-space:nowrap;">
                                Creative Sample Studio
                              </div>
                            </td>
                            <td align="right" valign="middle" style="white-space:nowrap;">
                              <div class="email-badge" style="display:inline-block;border:1px solid #F4F5F7;border-radius:999px;padding:8px 12px;color:#F4F5F7;font-size:10px;font-weight:700;letter-spacing:1.1px;line-height:1;text-transform:uppercase;white-space:nowrap;">
                                ● &nbsp; Free online webinar
                              </div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td class="email-hero" style="background:#262C9E;padding:34px 36px 38px;">
                        <h1 class="email-title" style="margin:0;color:#FFFFFF;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:39px;line-height:1.02;letter-spacing:-1.2px;text-transform:uppercase;">
                          Fashion Brand<br>as a <span style="color:#9296CE;">System</span>
                        </h1>
                      </td>
                    </tr>
                    <tr>
                      <td class="email-body" style="padding:30px 36px 10px;">
                        <p style="margin:0 0 14px;color:#111114;font-size:17px;line-height:1.65;">Hello ${safeName},</p>
                        <p style="margin:0;color:#2C2C2C;font-size:16px;line-height:1.7;">
                          Thank you for registering for our webinar, <strong>${safeTitle}</strong>. We’re delighted to have you join us live.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td class="email-body" style="padding:18px 36px;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;border:1px solid #D8DCE8;background:#F4F5F7;">
                          <tr>
                            <td style="padding:18px 22px;border-bottom:1px solid #D8DCE8;">
                              <div style="margin-bottom:7px;color:#6B7280;font-size:10px;font-weight:700;letter-spacing:1.3px;text-transform:uppercase;">Date &amp; time</div>
                              <div style="color:#111114;font-size:16px;font-weight:700;line-height:1.45;">${safeDate}</div>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:18px 22px;">
                              <div style="margin-bottom:7px;color:#6B7280;font-size:10px;font-weight:700;letter-spacing:1.3px;text-transform:uppercase;">Format</div>
                              <div style="color:#111114;font-size:15px;line-height:1.45;">Live online · Zoom · 60 minutes · Live Q&amp;A</div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td class="email-body" align="center" style="padding:6px 36px 24px;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                          <tr>
                            <td align="center" style="background:#262C9E;">
                              <a href="${safeJoinUrl}" style="display:inline-block;padding:17px 30px;color:#FFFFFF;font-size:13px;font-weight:800;letter-spacing:1px;text-decoration:none;text-transform:uppercase;">
                                Join the webinar on Zoom
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td class="email-body" align="center" style="padding:0 36px 24px;">
                        <a href="${safeGoogleCalendarUrl}" style="display:inline-block;border:1px solid #262C9E;padding:14px 24px;color:#262C9E;font-size:12px;font-weight:800;letter-spacing:0.8px;text-decoration:none;text-transform:uppercase;">
                          Add to Google Calendar
                        </a>
                        <div style="margin-top:10px;color:#6B7280;font-size:11px;line-height:1.5;">
                          An .ics calendar invitation is also attached for Apple Calendar and Outlook.
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td class="email-body" style="padding:0 36px 32px;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;">
                          <tr>
                            <td style="border-left:3px solid #262C9E;padding:14px 18px;background:#F4F5F7;color:#4A4A4A;font-size:13px;line-height:1.65;">
                              This is your personal Zoom link. Please do not share it — it allows us to record your attendance correctly.
                            </td>
                          </tr>
                        </table>
                        <p style="margin:22px 0 7px;color:#6B7280;font-size:12px;line-height:1.6;text-align:center;">
                          If the button does not work, copy and paste this link into your browser:
                        </p>
                        <p style="margin:0;word-break:break-all;text-align:center;">
                          <a href="${safeJoinUrl}" style="color:#262C9E;font-size:12px;line-height:1.6;">${safeJoinUrl}</a>
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="background:#111114;padding:26px 36px;text-align:center;">
                        <div style="margin-bottom:9px;color:#F4F5F7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;font-weight:800;letter-spacing:1.3px;text-transform:uppercase;">Creative Sample Studio</div>
                        <div style="color:#B9BBC4;font-size:11px;line-height:1.6;">
                          You received this transactional email because you registered for the webinar.
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>`,
      attachment: [{
        content: utf8ToBase64(icsContent),
        name: "fashion-brand-as-a-system-webinar.ics"
      }]
    })
  });
  if (!response.ok) throw new Error("Confirmation email failed");
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
    "ZOOM_ACCOUNT_ID",
    "ZOOM_CLIENT_ID",
    "ZOOM_CLIENT_SECRET",
    "ZOOM_MEETING_ID",
    "BREVO_API_KEY",
    "GOOGLE_SHEETS_WEBHOOK_URL",
    "GOOGLE_SHEETS_WEBHOOK_SECRET",
    "WEBINAR_START_UTC",
    "WEBINAR_DURATION_MINUTES"
  ];
  if (requiredConfiguration.some((key) => !env[key])) {
    return json({ error: "Registration is being prepared. Please try again shortly." }, 503);
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

  if (lead.webinar_id !== "CSS-WEB-2026-07-31") {
    return json({ error: "Unknown webinar." }, 400);
  }
  if (lead.name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
    return json({ error: "Please enter a valid name and email address." }, 400);
  }

  try {
    const zoomRegistrant = await createZoomRegistrant(env, lead);
    await saveToGoogleSheet(env, lead, zoomRegistrant);
    await upsertBrevoContact(env, lead);
    await sendBrevoConfirmation(env, lead, zoomRegistrant);
    return json({ ok: true });
  } catch (error) {
    console.error("Registration pipeline error", error);
    return json({ error: "We couldn’t complete your registration. Please try again or contact Creative Sample Studio." }, 502);
  }
}

export function onRequestGet() {
  return json({ error: "Method not allowed." }, 405);
}
