const RSVP_SHEET_NAME = 'RSVP Responses';
const RSVP_HEADERS = [
  'Submitted at',
  'Invitation',
  'Guest name',
  'Attending',
  'Party size',
  'Additional guest names',
  'Email',
  'Phone',
  'Dietary notes',
  'Birthday message',
];

function initialize() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error('Open this script from the RSVP spreadsheet.');
  }

  PropertiesService.getScriptProperties().setProperty('RSVP_SPREADSHEET_ID', spreadsheet.getId());
  getOrCreateResponseSheet(spreadsheet);
}

function doGet() {
  return ContentService.createTextOutput('RSVP receiver is ready.');
}

function doPost(event) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);

    const contents = event && event.postData ? event.postData.contents : '{}';
    const response = JSON.parse(contents || '{}');

    if (response.action === 'list') {
      return jsonResponse(listResponses(response.key));
    }

    const guestName = safeSheetText(response.guestName, 120);

    if (!guestName) {
      throw new Error('Guest name is required.');
    }

    const spreadsheetId = PropertiesService.getScriptProperties().getProperty('RSVP_SPREADSHEET_ID');
    if (!spreadsheetId) {
      throw new Error('Run initialize from the Apps Script editor before deploying.');
    }
    const sheet = getOrCreateResponseSheet(SpreadsheetApp.openById(spreadsheetId));

    const attending = response.attending === true;
    const partySize = attending
      ? Math.max(1, Math.min(20, Math.floor(Number(response.attendeeCount) || 1)))
      : 0;

    sheet.appendRow([
      new Date(),
      safeSheetText(response.slug, 100),
      guestName,
      attending ? 'Yes' : 'No',
      partySize,
      safeGuestNames(response.guestNames),
      safeSheetText(response.email, 200),
      safeSheetText(response.phone, 80),
      safeSheetText(response.dietaryNotes, 500),
      safeSheetText(response.message, 1000),
    ]);

    return jsonResponse({ success: true });
  } catch (error) {
    console.error(error);
    return jsonResponse({ success: false, error: String(error) });
  } finally {
    if (lock.hasLock()) {
      lock.releaseLock();
    }
  }
}

function listResponses(key) {
  const properties = PropertiesService.getScriptProperties();
  const expectedKey = properties.getProperty('RSVP_READ_KEY');
  if (!expectedKey || !key || key !== expectedKey) {
    return { success: false, error: 'RSVP sheet read access is not configured.' };
  }

  const spreadsheetId = properties.getProperty('RSVP_SPREADSHEET_ID');
  if (!spreadsheetId) {
    return { success: false, error: 'Run initialize from the Apps Script editor before deploying.' };
  }

  const sheet = getOrCreateResponseSheet(SpreadsheetApp.openById(spreadsheetId));
  const lastRow = sheet.getLastRow();
  const values = lastRow < 2 ? [] : sheet.getRange(2, 1, lastRow - 1, RSVP_HEADERS.length).getValues();
  const rsvps = values.map((row, index) => {
    const submitted = row[0] instanceof Date ? row[0] : new Date(row[0]);
    const submittedAt = Number.isNaN(submitted.getTime()) ? '' : submitted.toISOString();
    const attending = String(row[3]).toLowerCase() === 'yes';
    const attendeeCount = attending ? Math.max(1, Number(row[4]) || 1) : 0;

    return {
      id: `sheet-${index + 2}`,
      invitationId: String(row[1] || ''),
      guestName: String(row[2] || ''),
      attending,
      attendeeCount,
      guestNames: String(row[5] || '').split(',').map((name) => name.trim()).filter(Boolean),
      email: String(row[6] || ''),
      phone: String(row[7] || ''),
      dietaryNotes: String(row[8] || ''),
      message: String(row[9] || ''),
      submittedAt,
      updatedAt: submittedAt,
      editToken: '',
    };
  }).reverse();

  return { success: true, rsvps };
}

function safeGuestNames(value) {
  const names = Array.isArray(value) ? value : String(value || '').split(',');
  return names
    .map((name) => safeSheetText(name, 120))
    .filter(Boolean)
    .slice(0, 20)
    .join(', ');
}

function safeSheetText(value, maxLength) {
  const text = String(value == null ? '' : value)
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .trim()
    .slice(0, maxLength);

  return /^[=+@\-]/.test(text) ? `'${text}` : text;
}

function jsonResponse(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateResponseSheet(spreadsheet) {
  const sheet = spreadsheet.getSheetByName(RSVP_SHEET_NAME) || spreadsheet.insertSheet(RSVP_SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(RSVP_HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}
