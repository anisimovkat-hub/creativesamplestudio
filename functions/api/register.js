const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store"
};

const WEBINAR_ID = "CSS-WEB-FASHION-BRAND-AS-A-SYSTEM";
const INSTAGRAM_URL = "https://www.instagram.com/creativesamplestudio/";
const WEBSITE_URL = "https://creativesamplestudio.co.uk";
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
      webinar_date: "TBA",
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
  const subject =
    "Your CSS Launch Framework™ Guide & Brand Readiness Self-Assessment";
  const textContent = [
    `Hi ${firstName},`,
    "",
    "Thank you for registering for the CSS Launch Framework™ Webinar.",
    "",
    "As promised, we’re sharing the CSS Launch Framework™ Guide & Brand Readiness Self-Assessment with you.",
    "",
    "The webinar date and time are still being confirmed. We’ll email you the details and Zoom access as soon as they are available.",
    "",
    "The guide will help you assess the six pillars behind a commercially viable fashion brand:",
    "• Brand Strategy & Positioning",
    "• Commercial Foundation",
    "• Product Development",
    "• Production & Supply Chain",
    "• Market Entry",
    "• Business Infrastructure",
    "",
    "Through the self-assessment, you’ll identify the strongest and weakest areas of your business, uncover important gaps and dependencies, and calculate your Brand Readiness Score out of 48.",
    "",
    `Download the guide: ${GUIDE_URL}`,
    "",
    "If you have questions about brand strategy, product development, production, supply chain or launching your fashion brand, simply reply to this email.",
    "",
    "We also offer one-to-one consultations for founders who would like tailored guidance on the next steps for their business.",
    "",
    `Learn more: ${WEBSITE_URL}`,
    `Instagram: ${INSTAGRAM_URL}`,
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
              Identify the strengths, gaps and risks across the six pillars of your fashion business.
            </div>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#F4F5F7;">
              <tr>
                <td align="center" style="padding:28px 14px;">
                  <table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:640px;background:#FFFFFF;border-collapse:collapse;">
                    <tr>
                      <td class="email-header" style="background:#262C9E;padding:24px 36px;border-bottom:1px solid #9296CE;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;">
                          <tr>
                            <td valign="middle" style="white-space:nowrap;">
                              <div class="email-brand" style="color:#F4F5F7;font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;white-space:nowrap;">Creative Sample Studio</div>
                            </td>
                            <td align="right" valign="middle" style="white-space:nowrap;">
                              <div class="email-badge" style="display:inline-block;border:1px solid #F4F5F7;border-radius:999px;padding:8px 12px;color:#F4F5F7;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;white-space:nowrap;">● &nbsp; Guide included</div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td class="email-hero" style="background:#262C9E;padding:34px 36px 38px;">
                        <h1 class="email-title" style="margin:0;color:#FFFFFF;font-family:Helvetica,Arial,sans-serif;font-size:39px;line-height:1.02;letter-spacing:-1.2px;text-transform:uppercase;">
                          CSS Launch<br><span style="color:#9296CE;">Framework™ Guide</span>
                        </h1>
                      </td>
                    </tr>
                    <tr>
                      <td class="email-body" style="padding:30px 36px 10px;">
                        <p style="margin:0 0 14px;color:#111114;font-size:17px;line-height:1.65;">Hi ${safeName},</p>
                        <p style="margin:0 0 12px;color:#2C2C2C;font-size:16px;line-height:1.7;">
                          Thank you for registering for the <strong>CSS Launch Framework™ Webinar</strong>.
                        </p>
                        <p style="margin:0;color:#2C2C2C;font-size:16px;line-height:1.7;">
                          As promised, we’re sharing the <strong>CSS Launch Framework™ Guide &amp; Brand Readiness Self-Assessment</strong> with you.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td class="email-body" style="padding:18px 36px 16px;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;border:1px solid #D8DCE8;background:#F4F5F7;">
                          <tr>
                            <td style="padding:18px 22px;">
                              <div style="margin-bottom:7px;color:#6B7280;font-size:10px;font-weight:700;letter-spacing:1.3px;text-transform:uppercase;">Webinar details</div>
                              <div style="color:#111114;font-size:15px;line-height:1.6;">The date and time are still being confirmed. We’ll email you the details and Zoom access as soon as they are available.</div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td class="email-body" style="padding:10px 36px 24px;">
                        <p style="margin:0 0 13px;color:#111114;font-size:16px;font-weight:700;line-height:1.5;">Assess the six pillars behind a commercially viable fashion brand:</p>
                        <p style="margin:0;color:#4A4A4A;font-size:14px;line-height:1.85;">
                          • Brand Strategy &amp; Positioning<br>
                          • Commercial Foundation<br>
                          • Product Development<br>
                          • Production &amp; Supply Chain<br>
                          • Market Entry<br>
                          • Business Infrastructure
                        </p>
                        <p style="margin:16px 0 0;color:#4A4A4A;font-size:14px;line-height:1.7;">
                          Identify your strongest and weakest areas, uncover important gaps and dependencies, and calculate your Brand Readiness Score out of 48.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td class="email-body" align="center" style="padding:0 36px 30px;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                          <tr>
                            <td align="center" style="background:#262C9E;">
                              <a href="${GUIDE_URL}" target="_blank" style="display:inline-block;padding:16px 28px;color:#FFFFFF;font-size:12px;font-weight:800;letter-spacing:0.9px;text-decoration:none;text-transform:uppercase;">
                                Download the Guide
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td class="email-body" style="padding:0 36px 30px;">
                        <p style="margin:0 0 12px;color:#2C2C2C;font-size:15px;line-height:1.7;">
                          If you have questions about brand strategy, product development, production, supply chain or launching your fashion brand, simply reply to this email.
                        </p>
                        <p style="margin:0 0 18px;color:#2C2C2C;font-size:15px;line-height:1.7;">
                          We also offer one-to-one consultations for founders who would like tailored guidance on the next steps for their business.
                        </p>
                        <p style="margin:0;color:#111114;font-size:14px;line-height:1.8;">
                          <a href="${WEBSITE_URL}" target="_blank" style="color:#262C9E;text-decoration:underline;">Learn more</a>
                          &nbsp;&nbsp;·&nbsp;&nbsp;
                          <a href="${INSTAGRAM_URL}" target="_blank" style="color:#262C9E;text-decoration:underline;">Instagram</a>
                        </p>
                        <p style="margin:22px 0 0;color:#111114;font-size:14px;line-height:1.65;">
                          Best regards,<br>
                          <strong>Evgeniya Khorosheva</strong><br>
                          Co-Founder &amp; Brand Strategist<br>
                          Creative Sample Studio · London
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="background:#111114;padding:26px 36px;text-align:center;">
                        <div style="margin-bottom:9px;color:#F4F5F7;font-family:Helvetica,Arial,sans-serif;font-size:12px;font-weight:800;letter-spacing:1.3px;text-transform:uppercase;">Creative Sample Studio</div>
                        <div style="color:#B9BBC4;font-size:11px;line-height:1.6;">You received this email because you pre-registered for the webinar.</div>
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
