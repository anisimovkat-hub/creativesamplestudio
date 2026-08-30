const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store"
};

const WEBINAR_ID = "CSS-WEB-FASHION-BRAND-AS-A-SYSTEM";
const GUIDE_URL =
  "https://creativesamplestudio.pages.dev/webinar/CSS_Launch_Framework_Guide_and_Self_Assessment.pdf";

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

async function saveToGoogleSheet(env, lead) {
  const response = await fetch(env.GOOGLE_SHEETS_WEBHOOK_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      secret: env.GOOGLE_SHEETS_WEBHOOK_SECRET,
      action: "upsert_registration",
      ...lead,
      registered_at: new Date().toISOString(),
      webinar_date: "2026-09-24 18:00 America/New_York",
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
  const subject = "Your CSS Launch Framework™ guide";
  const textContent = [
    `Hi ${firstName},`,
    "",
    "Thank you for registering for the CSS Launch Framework™ Webinar.",
    "",
    "As promised, we’re sharing the CSS Launch Framework™ Guide & Brand Readiness Self-Assessment with you.",
    "",
    "The webinar will take place on 24 September 2026 at 18:00 New York time. We’ll email the Zoom access details separately.",
    "",
    `Download the guide: ${GUIDE_URL}`,
    "",
    "The guide covers the six pillars of a commercially viable fashion brand and includes a practical Brand Readiness Self-Assessment.",
    "",
    "Best regards,",
    "Evgeniya Khorosheva",
    "Co-Founder & Brand Strategist",
    "Creative Sample Studio",
    "London"
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
      htmlContent: `
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>CSS Launch Framework™ Guide</title>
          </head>
          <body style="margin:0;padding:0;background:#FFFFFF;color:#222222;font-family:Arial,sans-serif;">
            <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
              Your registration is confirmed. We’ll send the webinar details as soon as they are available.
            </div>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#FFFFFF;">
              <tr>
                <td align="center" style="padding:24px 16px;">
                  <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;border-collapse:collapse;">
                    <tr>
                      <td style="padding:0;color:#222222;font-size:16px;line-height:1.65;">
                        <p style="margin:0 0 18px;">Hi ${safeName},</p>
                        <p style="margin:0 0 18px;">
                          Thank you for registering for the <strong>CSS Launch Framework™ Webinar</strong>.
                        </p>
                        <p style="margin:0 0 18px;">
                          As promised, we’re sharing the <strong>CSS Launch Framework™ Guide &amp; Brand Readiness Self-Assessment</strong> with you.
                        </p>
                        <p style="margin:0 0 18px;">
                          The webinar will take place on 24 September 2026 at 18:00 New York time. We’ll email the Zoom access details separately.
                        </p>
                        <p style="margin:0 0 18px;">
                          <a href="${GUIDE_URL}" target="_blank" style="color:#262C9E;text-decoration:underline;"><strong>Download the guide</strong></a>
                        </p>
                        <p style="margin:0 0 18px;">
                          The guide covers the six pillars of a commercially viable fashion brand and includes a practical Brand Readiness Self-Assessment.
                        </p>
                        <p style="margin:24px 0 0;">
                          Best regards,<br>
                          <strong>Evgeniya Khorosheva</strong><br>
                          Co-Founder &amp; Brand Strategist<br>
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
