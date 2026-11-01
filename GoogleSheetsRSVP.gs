const RSVP_SHEET_NAME = 'RSVP Responses';
const RSVP_HEADERS = [
  'Submitted at',
  'Invitation',
  'Guest name',
  'Attending',
  'Party size',
];

const WISH_SHEET_NAME = 'Birthday Wishes';
const WISH_HEADERS = ['Submitted at', 'Invitation', 'Guest name', 'Wish', 'Badge'];
const INVITATION_STATE_FILE_PROPERTY = 'INVITATION_STATE_FILE_ID';

function initialize() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error('Open this script from the RSVP spreadsheet.');
  }

  PropertiesService.getScriptProperties().setProperty('RSVP_SPREADSHEET_ID', spreadsheet.getId());
  getOrCreateResponseSheet(spreadsheet);
  getOrCreateWishSheet(spreadsheet);
  getOrCreateInvitationStateFile();
}

function doGet() {
  return ContentService.createTextOutput('Little Racer guestbook service is ready.');
}

function doPost(event) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);
    const contents = event && event.postData ? event.postData.contents : '{}';
    const request = JSON.parse(contents || '{}');

    if (request.action === 'list') {
      return jsonResponse(listResponses(request.key));
    }
    if (request.action === 'list-wishes') {
      return jsonResponse(listWishes(request.key));
    }
    if (request.action === 'get-invitation') {
      requireReadKey(request.key);
      return jsonResponse({ success: true, state: getInvitationState() });
    }
    if (request.action === 'save-invitation') {
      requireReadKey(request.key);
      return jsonResponse(saveInvitationState(request.state));
    }
    if (request.action === 'upload-image') {
      requireReadKey(request.key);
      return jsonResponse(uploadInvitationImage(request));
    }
    if (request.action === 'wish') {
      return jsonResponse(addWish(request));
    }
    return jsonResponse(addRsvp(request));
  } catch (error) {
    console.error(error);
    return jsonResponse({ success: false, error: String(error) });
  } finally {
    if (lock.hasLock()) {
      lock.releaseLock();
    }
  }
}

function getInvitationState() {
  const file = getInvitationStateFile();
  if (!file) return null;

  const state = JSON.parse(file.getBlob().getDataAsString());
  if (state && state.draft === null && state.published === null) return null;
  if (!state || !state.draft || !Object.prototype.hasOwnProperty.call(state, 'published')) {
    throw new Error('The saved invitation state is invalid.');
  }
  return state;
}

function saveInvitationState(state) {
  if (!state || !state.draft || !Object.prototype.hasOwnProperty.call(state, 'published')) {
    throw new Error('A draft and published invitation state are required.');
  }

  const file = getInvitationStateFile() || getOrCreateInvitationStateFile();
  file.setContent(JSON.stringify(state));
  return { success: true };
}

function uploadInvitationImage(request) {
  const filename = String(request.filename || 'invitation-image')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 100);
  const mimeType = String(request.mimeType || '');
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
  if (!allowedTypes.includes(mimeType)) {
    throw new Error('Only JPEG, PNG, WEBP, GIF, and SVG images are permitted.');
  }
  if (!request.data) throw new Error('No image data was provided.');

  const bytes = Utilities.base64Decode(request.data);
  if (bytes.length > 12 * 1024 * 1024) throw new Error('Images must be 12MB or smaller.');

  const file = DriveApp.createFile(Utilities.newBlob(bytes, mimeType, filename));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return {
    success: true,
    filename: file.getName(),
    url: `https://drive.google.com/thumbnail?id=${file.getId()}&sz=w2000`,
  };
}

function getInvitationStateFile() {
  const fileId = PropertiesService.getScriptProperties().getProperty(INVITATION_STATE_FILE_PROPERTY);
  if (!fileId) return null;
  return DriveApp.getFileById(fileId);
}

function getOrCreateInvitationStateFile() {
  const existing = getInvitationStateFile();
  if (existing) return existing;

  const file = DriveApp.createFile(
    'Little Racer Invitation State.json',
    JSON.stringify({ draft: null, published: null }),
    MimeType.PLAIN_TEXT
  );
  PropertiesService.getScriptProperties().setProperty(INVITATION_STATE_FILE_PROPERTY, file.getId());
  return file;
}

function addRsvp(request) {
  const guestName = safeSheetText(request.guestName, 120);
  if (!guestName) {
    throw new Error('Guest name is required.');
  }

  const spreadsheet = getSpreadsheet();
  const sheet = getOrCreateResponseSheet(spreadsheet);
  const attending = request.attending !== false;
  const partySize = attending
    ? Math.max(1, Math.min(20, Math.floor(Number(request.attendeeCount) || 1)))
    : 0;
  const submittedAt = new Date();
  const slug = safeSheetText(request.slug, 100);
  const lastRow = sheet.getLastRow();
  const existingRows = lastRow < 2 ? [] : sheet.getRange(2, 2, lastRow - 1, 2).getValues();
  const existingIndex = existingRows.findIndex((row) =>
    String(row[0] || '') === slug && String(row[1] || '').trim().toLowerCase() === guestName.toLowerCase()
  );
  const rowNumber = existingIndex >= 0 ? existingIndex + 2 : lastRow + 1;
  const responseRow = [
    submittedAt,
    slug,
    guestName,
    attending ? 'Yes' : 'No',
    partySize,
  ];

  if (existingIndex >= 0) {
    sheet.getRange(rowNumber, 1, 1, RSVP_HEADERS.length).setValues([responseRow]);
  } else {
    sheet.appendRow(responseRow);
  }

  return {
    success: true,
    message: existingIndex >= 0 ? 'Your RSVP has been updated.' : 'RSVP saved.',
    rsvp: {
      id: `sheet-${rowNumber}`,
      guestName,
      attending,
      attendeeCount: partySize,
      submittedAt: submittedAt.toISOString(),
      editToken: '',
    },
  };
}

function addWish(request) {
  const guestName = safeSheetText(request.guestName, 120);
  const message = safeSheetText(request.message, 1000);
  if (!guestName || !message) {
    throw new Error('Name and birthday wish are required.');
  }

  const sheet = getOrCreateWishSheet(getSpreadsheet());
  const timestamp = new Date();
  const badgeEmoji = safeSheetText(request.badgeEmoji || '🏁', 16);
  sheet.appendRow([
    timestamp,
    safeSheetText(request.slug, 100),
    guestName,
    message,
    badgeEmoji,
  ]);

  return {
    success: true,
    wish: {
      id: `wish-${timestamp.getTime()}`,
      guestName,
      message,
      badgeEmoji,
      timestamp: timestamp.toISOString(),
    },
  };
}

function listResponses(key) {
  requireReadKey(key);
  const sheet = getOrCreateResponseSheet(getSpreadsheet());
  const lastRow = sheet.getLastRow();
  const values = lastRow < 2 ? [] : sheet.getRange(2, 1, lastRow - 1, RSVP_HEADERS.length).getValues();
  const rsvps = values.map((row, index) => {
    const submitted = row[0] instanceof Date ? row[0] : new Date(row[0]);
    const submittedAt = Number.isNaN(submitted.getTime()) ? '' : submitted.toISOString();
    const attending = String(row[3]).toLowerCase() === 'yes';

    return {
      id: `sheet-${index + 2}`,
      invitationId: String(row[1] || ''),
      guestName: String(row[2] || ''),
      attending,
      attendeeCount: attending ? Math.max(1, Number(row[4]) || 1) : 0,
      submittedAt,
      updatedAt: submittedAt,
      editToken: '',
    };
  }).reverse();

  return { success: true, rsvps };
}

function listWishes(key) {
  requireReadKey(key);
  const sheet = getOrCreateWishSheet(getSpreadsheet());
  const lastRow = sheet.getLastRow();
  const values = lastRow < 2 ? [] : sheet.getRange(2, 1, lastRow - 1, WISH_HEADERS.length).getValues();
  const wishes = values.map((row, index) => {
    const submitted = row[0] instanceof Date ? row[0] : new Date(row[0]);
    return {
      id: `wish-${index + 2}`,
      guestName: String(row[2] || ''),
      message: String(row[3] || ''),
      badgeEmoji: String(row[4] || '🏁'),
      timestamp: Number.isNaN(submitted.getTime()) ? '' : submitted.toISOString(),
    };
  }).reverse();

  return { success: true, wishes };
}

function requireReadKey(key) {
  const expectedKey = PropertiesService.getScriptProperties().getProperty('RSVP_READ_KEY');
  if (!expectedKey || !key || key !== expectedKey) {
    throw new Error('RSVP sheet read access is not configured.');
  }
}

function getSpreadsheet() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty('RSVP_SPREADSHEET_ID');
  if (!spreadsheetId) {
    throw new Error('Run initialize from the Apps Script editor before deploying.');
  }
  return SpreadsheetApp.openById(spreadsheetId);
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

function getOrCreateWishSheet(spreadsheet) {
  const sheet = spreadsheet.getSheetByName(WISH_SHEET_NAME) || spreadsheet.insertSheet(WISH_SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(WISH_HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}
