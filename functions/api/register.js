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
  const safeName = escapeHtml(lead.name);
  const safeDate = escapeHtml(env.WEBINAR_DATE_LABEL);
  const safeTitle = escapeHtml(env.WEBINAR_TITLE);
  const safeJoinUrl = escapeHtml(zoomRegistrant.join_url);
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
      to: [{ email: lead.email, name: lead.name }],
      subject: `Your Zoom link — ${env.WEBINAR_TITLE}`,
      htmlContent: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111114;max-width:620px;margin:auto">
          <h1 style="color:#262C9E;font-size:26px">You’re registered</h1>
          <p>Hello ${safeName},</p>
          <p>Your place for <strong>${safeTitle}</strong> is confirmed.</p>
          <p><strong>${safeDate}</strong></p>
          <p><a href="${safeJoinUrl}" style="display:inline-block;background:#262C9E;color:#fff;padding:14px 22px;text-decoration:none;font-weight:bold">Join the webinar on Zoom</a></p>
          <p>This is your personal Zoom link. Please do not share it, because it lets us correctly record your attendance.</p>
          <p>Creative Sample Studio</p>
        </div>`
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

  const requiredSecrets = [
    "ZOOM_ACCOUNT_ID",
    "ZOOM_CLIENT_ID",
    "ZOOM_CLIENT_SECRET",
    "ZOOM_MEETING_ID",
    "BREVO_API_KEY",
    "GOOGLE_SHEETS_WEBHOOK_URL",
    "GOOGLE_SHEETS_WEBHOOK_SECRET"
  ];
  if (requiredSecrets.some((key) => !env[key])) {
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
