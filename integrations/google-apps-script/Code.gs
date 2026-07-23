const SHEET_ID = '1DdiTWrzdHRATq1YD9nEPyH_7GimJp3ITkoGK0RpCHRc';
const LEADS_SHEET = 'Leads';

function doPost(event) {
  try {
    const payload = JSON.parse(event.postData.contents || '{}');
    const expectedSecret = PropertiesService.getScriptProperties().getProperty('WEBHOOK_SECRET');
    if (!expectedSecret || payload.secret !== expectedSecret) {
      return jsonResponse_({ ok: false, error: 'Unauthorized' });
    }
    if (payload.action !== 'upsert_registration') {
      return jsonResponse_({ ok: false, error: 'Unknown action' });
    }

    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(LEADS_SHEET);
    if (!sheet) throw new Error('Leads sheet not found');

    const values = sheet.getDataRange().getValues();
    const headers = values[0].map(String);
    const webinarColumn = headers.indexOf('Webinar ID');
    const emailColumn = headers.indexOf('Email');
    if (webinarColumn < 0 || emailColumn < 0) throw new Error('Required columns not found');

    let targetRow = values.length + 1;
    for (let index = 1; index < values.length; index += 1) {
      const sameWebinar = String(values[index][webinarColumn]) === String(payload.webinar_id);
      const sameEmail = String(values[index][emailColumn]).toLowerCase() === String(payload.email).toLowerCase();
      if (sameWebinar && sameEmail) {
        targetRow = index + 1;
        break;
      }
    }

    const nameParts = splitName_(payload.name);
    const mapping = {
      'Lead ID': `${payload.webinar_id}-${String(payload.email).toLowerCase()}`,
      'Webinar ID': payload.webinar_id,
      'Registered At (UTC)': payload.registered_at,
      'Webinar Title': 'Fashion Brand as a System',
      'Webinar Date': '2026-07-31',
      'First Name': nameParts.firstName,
      'Last Name': nameParts.lastName,
      'Email': payload.email,
      'Phone': payload.phone,
      'Brand / Company': payload.brand,
      'Position': payload.position,
      'Marketing Consent': payload.marketing_consent ? 'Yes' : 'No',
      'UTM Source': payload.utm_source,
      'UTM Medium': payload.utm_medium,
      'UTM Campaign': payload.utm_campaign,
      'UTM Content': payload.utm_content,
      'Landing URL': payload.landing_url,
      'Zoom Registrant ID': payload.zoom_registrant_id,
      'Zoom Join URL': payload.zoom_join_url,
      'Registration Status': 'Registered',
      'Attendance Status': ''
    };

    headers.forEach((header, column) => {
      if (Object.prototype.hasOwnProperty.call(mapping, header)) {
        sheet.getRange(targetRow, column + 1).setValue(mapping[header]);
      }
    });

    return jsonResponse_({ ok: true, row: targetRow });
  } catch (error) {
    return jsonResponse_({ ok: false, error: String(error) });
  }
}

function splitName_(fullName) {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts.shift() || '',
    lastName: parts.join(' ')
  };
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
