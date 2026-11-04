import express, { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import path from 'path';
import multer from 'multer';
import fs from 'fs';
import { db, verifyPassword, UPLOADS_DIR } from './server/db.js';
import type { GuestWish, InvitationData, RSVPResponse } from './src/types/invitation';
import { parseStandardTime, toTwentyFourHourTime } from './src/utils/time';

const app = express();
app.set('trust proxy', 1);
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';
const isVercel = process.env.VERCEL === '1';
const rsvpSheetUrl = process.env.RSVP_SCRIPT_URL?.trim();
const rsvpSheetReadKey = process.env.RSVP_SHEET_READ_KEY?.trim();
const maxUploadBytes = (isVercel ? 4 : 12) * 1024 * 1024;
let persistentInvitationStateReady = false;

if (isVercel) {
  app.use((req, _res, next) => {
    const rewrittenUrl = new URL(req.originalUrl, 'http://localhost');
    const originalPath = rewrittenUrl.searchParams.get('__vercel_path');
    if (originalPath?.startsWith('/')) {
      rewrittenUrl.searchParams.delete('__vercel_path');
      req.url = `${originalPath}${rewrittenUrl.search}`;
    }
    next();
  });
}

function requireGuestStorageConfiguration(res: Response): boolean {
  if (!isProd || rsvpSheetUrl) return false;
  res.status(503).json({
    error: 'Guest submissions are not connected. Set RSVP_SCRIPT_URL to the deployed Google Apps Script web app URL ending in /exec.',
  });
  return true;
}

async function requestRsvpSheet<T>(
  payload: Record<string, unknown>,
  timeoutMs = 20000
): Promise<T & { success: boolean }> {
  if (!rsvpSheetUrl) {
    throw new Error('The RSVP and guestbook storage is not connected.');
  }

  const response = await fetch(rsvpSheetUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const body = await response.text();
  let result: { success?: boolean; error?: string } & T;
  try {
    result = JSON.parse(body);
  } catch {
    const contentType = response.headers.get('content-type')?.split(';')[0] || 'unknown content type';
    const detail = response.status === 401
      ? ' The /exec readiness page only checks GET. For RSVP and wishes, the active Apps Script web app must execute as you and allow anonymous Anyone access. If that access option is missing, use a personal Google account for the script or ask the Workspace administrator to allow it. Then set Render RSVP_SCRIPT_URL to that deployment’s exact /exec URL and redeploy.'
      : '';
    throw new Error(
      `Guestbook storage returned ${contentType} (HTTP ${response.status}) instead of JSON.${detail || ' Check that RSVP_SCRIPT_URL is the active Apps Script web app URL ending in /exec, with access set to Anyone.'}`
    );
  }
  if (!response.ok || !result.success) {
    throw new Error(result.error || `Guestbook storage failed (HTTP ${response.status}).`);
  }
  return result as T & { success: boolean };
}

// Image uploads are forwarded to Drive as base64 JSON, which is larger than the original file.
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static uploads and public assets
app.use('/uploads', express.static(UPLOADS_DIR));
// Seed invitation records may point to the bundled image fallbacks in this directory.
app.use('/src/assets/images', express.static(path.resolve(process.cwd(), 'src/assets/images')));
app.use(express.static(path.resolve(process.cwd(), 'public')));

// Configure Multer for disk storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const unique = `${Date.now()}_${Math.round(Math.random() * 1e9)}`;
    cb(null, `${cleanName}_${unique}${ext || '.jpg'}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: maxUploadBytes },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WEBP, GIF, and SVG images are permitted.'));
    }
  },
});

// Middleware: Admin Auth Guard
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token || !isAdminSessionValid(token)) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired admin session' });
    return;
  }
  next();
}

function getVercelAdminCredentials(): { password: string; sessionSecret: string } | null {
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD?.trim();
  const sessionSecret = process.env.ADMIN_SESSION_SECRET?.trim();
  if (!password || password.length < 12 || !sessionSecret || sessionSecret.length < 32) {
    return null;
  }
  return { password, sessionSecret };
}

function getVercelSessionSigningKey(sessionSecret: string, password: string): Buffer {
  return crypto.createHmac('sha256', sessionSecret).update(password).digest();
}

function createVercelAdminSession(sessionSecret: string, password: string): string {
  const payload = Buffer.from(JSON.stringify({
    userId: 'admin-01',
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  })).toString('base64url');
  const signature = crypto
    .createHmac('sha256', getVercelSessionSigningKey(sessionSecret, password))
    .update(payload)
    .digest('base64url');
  return `${payload}.${signature}`;
}

function isVercelAdminSessionValid(token: string): boolean {
  const credentials = getVercelAdminCredentials();
  if (!credentials) return false;

  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra !== undefined) return false;

  try {
    const expected = crypto
      .createHmac('sha256', getVercelSessionSigningKey(credentials.sessionSecret, credentials.password))
      .update(payload)
      .digest();
    const supplied = Buffer.from(signature, 'base64url');
    if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) {
      return false;
    }

    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as {
      userId?: string;
      expiresAt?: number;
    };
    return session.userId === 'admin-01' && typeof session.expiresAt === 'number' && session.expiresAt > Date.now();
  } catch {
    return false;
  }
}

function isAdminSessionValid(token: string): boolean {
  return isVercel ? isVercelAdminSessionValid(token) : db.validateSession(token);
}

// In-memory rate limiting map for guest RSVP submissions (prevents flooding)
const ipRateLimit = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = ipRateLimit.get(ip) || { count: 0, resetAt: now + 60000 };

  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + 60000;
  }

  entry.count++;
  ipRateLimit.set(ip, entry);

  if (entry.count > 25) {
    res.status(429).json({ error: 'Too many requests. Please wait a minute and try again.' });
    return;
  }
  next();
}

// ==========================================
// AUTH ROUTES
// ==========================================

const loginFailures = new Map<string, { count: number; resetAt: number }>();
function isLoginRateLimited(req: Request, res: Response): boolean {
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const failures = loginFailures.get(key);
  if (failures && now >= failures.resetAt) loginFailures.delete(key);

  const current = loginFailures.get(key);
  if (current && current.count >= 5) {
    res.status(429).json({ error: 'Too many sign-in attempts. Please wait 15 minutes and try again.' });
    return true;
  }
  return false;
}

function recordLoginFailure(req: Request): void {
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const current = loginFailures.get(key);
  if (!current || now >= current.resetAt) {
    loginFailures.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return;
  }
  current.count += 1;
}

app.post('/api/auth/login', (req: Request, res: Response) => {
  if (isLoginRateLimited(req, res)) return;

  const { username, password } = req.body;
  if (!username || !password) {
    recordLoginFailure(req);
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  if (isVercel) {
    const credentials = getVercelAdminCredentials();
    if (!credentials) {
      res.status(503).json({
        error: 'Admin sign-in is not configured. Set ADMIN_BOOTSTRAP_PASSWORD and ADMIN_SESSION_SECRET in Vercel.',
      });
      return;
    }

    const passwordBuffer = Buffer.from(String(password));
    const configuredPasswordBuffer = Buffer.from(credentials.password);
    const validPassword = passwordBuffer.length === configuredPasswordBuffer.length &&
      crypto.timingSafeEqual(passwordBuffer, configuredPasswordBuffer);
    if (username.toLowerCase().trim() !== 'admin' || !validPassword) {
      recordLoginFailure(req);
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    loginFailures.delete(req.ip || req.socket.remoteAddress || 'unknown');
    res.json({
      token: createVercelAdminSession(credentials.sessionSecret, credentials.password),
      user: { id: 'admin-01', username: 'admin' },
    });
    return;
  }

  const admin = db.getAdmin();
  if (username.toLowerCase().trim() !== admin.username.toLowerCase().trim()) {
    recordLoginFailure(req);
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const isValid = verifyPassword(password, admin.passwordHash, admin.salt);
  if (!isValid) {
    recordLoginFailure(req);
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  loginFailures.delete(req.ip || req.socket.remoteAddress || 'unknown');
  const token = db.createSession(admin.id);
  res.json({
    token,
    user: {
      id: admin.id,
      username: admin.username,
    },
  });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token || !isAdminSessionValid(token)) {
    res.status(401).json({ authenticated: false });
    return;
  }

  const admin = db.getAdmin();
  res.json({
    authenticated: true,
    user: {
      id: admin.id,
      username: admin.username,
    },
  });
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (token && !isVercel) {
    db.deleteSession(token);
  }
  res.json({ success: true });
});

app.post('/api/auth/change-password', requireAdmin, (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 6) {
    res.status(400).json({ error: 'New password must be at least 6 characters' });
    return;
  }

  const admin = db.getAdmin();
  if (!verifyPassword(currentPassword, admin.passwordHash, admin.salt)) {
    res.status(400).json({ error: 'Current password is incorrect' });
    return;
  }

  db.updateAdminPassword(newPassword);
  res.json({ success: true, message: 'Password updated successfully' });
});

// ==========================================
// INVITATION ROUTES (PUBLIC & ADMIN)
// ==========================================

function requirePersistentInvitationConfig(): void {
  if (!rsvpSheetUrl || !rsvpSheetReadKey) {
    throw new Error(
      'Permanent invitation storage is not configured. Set RSVP_SCRIPT_URL and RSVP_SHEET_READ_KEY after deploying the updated Google Apps Script.'
    );
  }
}

async function ensurePersistentInvitationState(): Promise<void> {
  if (!isProd) return;
  requirePersistentInvitationConfig();
  if (persistentInvitationStateReady) return;

  const result = await requestRsvpSheet<{
    state?: { draft: InvitationData; published: InvitationData | null } | null;
  }>({
    action: 'get-invitation',
    key: rsvpSheetReadKey,
  });

  if (result.state) {
    if (!result.state.draft?.id || !result.state.draft?.slug) {
      throw new Error('Google Drive returned an invalid saved invitation.');
    }
    const state = result.state;
    const migratedDraft = migrateCashGiftNumber(state.draft);
    const migratedPublished = state.published ? migrateCashGiftNumber(state.published) : false;
    if (migratedDraft || migratedPublished) {
      await requestRsvpSheet({
        action: 'save-invitation',
        key: rsvpSheetReadKey,
        state,
      });
    }
    db.replaceInvitationState(result.state.draft, result.state.published || null);
  } else {
    const initialState = db.getInvitationState();
    await requestRsvpSheet({
      action: 'save-invitation',
      key: rsvpSheetReadKey,
      state: initialState,
    });
  }
  persistentInvitationStateReady = true;
}

function migrateCashGiftNumber(invitation: InvitationData): boolean {
  const wishlist = invitation.wishlist;
  if (!wishlist || wishlist.cashGiftNumber || !wishlist.cashGiftCaption) return false;

  const match = wishlist.cashGiftCaption.match(/^(\+?[\d][\d ()-]{6,})\r?\n([\s\S]*)$/);
  if (!match) return false;

  wishlist.cashGiftNumber = match[1].trim();
  wishlist.cashGiftCaption = match[2].trim();
  return true;
}

async function persistInvitationState(
  state: { draft: InvitationData; published: InvitationData | null }
): Promise<void> {
  if (!isProd) return;
  requirePersistentInvitationConfig();
  await requestRsvpSheet({
    action: 'save-invitation',
    key: rsvpSheetReadKey,
    state,
  });
}

// Public invitation fetch (only returns published snapshot!)
app.get('/api/invitation/:slug', async (req: Request, res: Response) => {
  try {
    await ensurePersistentInvitationState();
  } catch (error) {
    console.error('Failed to load permanent invitation data:', error);
    res.status(503).json({
      error: error instanceof Error ? error.message : 'Permanent invitation storage is unavailable.',
    });
    return;
  }

  const { slug } = req.params;
  const published = db.getPublishedInvitation(slug);

  if (!published) {
    // Check if draft exists to provide context
    const draft = db.getDraftInvitation();
    if (draft.slug === slug && draft.status === 'draft') {
      res.status(403).json({
        status: 'draft',
        error: 'This invitation is currently in draft mode and has not yet been published by the host.',
      });
      return;
    }
    res.status(404).json({ error: 'Invitation not found' });
    return;
  }

  let invitation = published;
  if (rsvpSheetUrl && rsvpSheetReadKey) {
    try {
      const sheetWishes = await getSheetWishes();
      invitation = {
        ...published,
        wishes: mergeWishes(published.wishes || [], sheetWishes),
      };
    } catch (error) {
      console.error('Could not load birthday wishes from the RSVP sheet:', error);
    }
  }

  res.json({ status: 'published', invitation });
});

// Admin get current invitation (both draft and published snapshot)
app.get('/api/admin/invitation', requireAdmin, async (_req: Request, res: Response) => {
  try {
    await ensurePersistentInvitationState();
  } catch (error) {
    console.error('Failed to load permanent invitation data:', error);
    res.status(503).json({
      error: error instanceof Error ? error.message : 'Permanent invitation storage is unavailable.',
    });
    return;
  }

  const draft = db.getDraftInvitation();
  const published = db.getPublishedInvitation();
  const rsvps = db.getAllRSVPs();

  const totalResponses = rsvps.length;
  const attendingCount = rsvps.filter((r) => r.attending).length;
  const declinedCount = rsvps.filter((r) => !r.attending).length;
  const totalAttendees = rsvps
    .filter((r) => r.attending)
    .reduce((sum, r) => sum + (r.attendeeCount || 1), 0);

  res.json({
    draft,
    published,
    stats: {
      totalResponses,
      attendingCount,
      declinedCount,
      totalAttendees,
      lastResponseAt: rsvps[0]?.submittedAt || null,
    },
  });
});

// Admin save draft
app.put('/api/admin/invitation/draft', requireAdmin, async (req: Request, res: Response) => {
  try {
    await ensurePersistentInvitationState();
    const updated = db.prepareDraft(req.body);
    const state = { draft: updated, published: db.getPublishedInvitation() };
    await persistInvitationState(state);
    db.replaceInvitationState(state.draft, state.published);
    res.json({ success: true, draft: updated });
  } catch (err: any) {
    console.error('Failed to save permanent invitation draft:', err);
    res.status(502).json({ error: err.message || 'Failed to save invitation changes permanently.' });
  }
});

// Admin publish
app.post('/api/admin/invitation/publish', requireAdmin, async (_req: Request, res: Response) => {
  try {
    await ensurePersistentInvitationState();
    const now = new Date().toISOString();
    const draft: InvitationData = {
      ...db.getDraftInvitation(),
      status: 'published',
      publishedAt: now,
      updatedAt: now,
    };
    const published = JSON.parse(JSON.stringify(draft)) as InvitationData;
    const state = { draft, published };
    await persistInvitationState(state);
    db.replaceInvitationState(state.draft, state.published);
    res.json({ success: true, published, message: 'Invitation published successfully!' });
  } catch (err: any) {
    console.error('Failed to publish permanent invitation:', err);
    res.status(502).json({ error: err.message || 'Failed to publish invitation permanently.' });
  }
});

// Admin unpublish
app.post('/api/admin/invitation/unpublish', requireAdmin, async (_req: Request, res: Response) => {
  try {
    await ensurePersistentInvitationState();
    const draft: InvitationData = {
      ...db.getDraftInvitation(),
      status: 'draft',
      updatedAt: new Date().toISOString(),
    };
    const state = { draft, published: null };
    await persistInvitationState(state);
    db.replaceInvitationState(state.draft, state.published);
    res.json({ success: true, draft, message: 'Invitation has been unpublished.' });
  } catch (err: any) {
    console.error('Failed to unpublish permanent invitation:', err);
    res.status(502).json({ error: err.message || 'Failed to unpublish invitation.' });
  }
});

// Admin file upload
app.post('/api/admin/upload', requireAdmin, upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file was uploaded' });
    return;
  }

  try {
    await ensurePersistentInvitationState();
    if (isProd) {
      const result = await requestRsvpSheet<{ url?: string; filename?: string }>(
        {
          action: 'upload-image',
          key: rsvpSheetReadKey,
          filename: req.file.originalname,
          mimeType: req.file.mimetype,
          data: fs.readFileSync(req.file.path).toString('base64'),
        },
        60000
      );
      if (!result.url) throw new Error('Google Drive did not return an image URL.');
      res.json({
        success: true,
        url: result.url,
        filename: result.filename || req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });
    } else {
      res.json({
        success: true,
        url: `/uploads/${req.file.filename}`,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });
    }
  } catch (error) {
    console.error('Failed to upload permanent invitation image:', error);
    res.status(502).json({
      error: error instanceof Error ? error.message : 'Image could not be saved permanently.',
    });
  } finally {
    fs.promises.unlink(req.file.path).catch((error) => {
      console.error('Could not remove temporary image upload:', error);
    });
  }
});

// ==========================================
// GUEST WISHES & CALENDAR ROUTES
// ==========================================

// Post a guest birthday wish
app.post('/api/wishes/:slug', checkRateLimit, async (req: Request, res: Response) => {
  if (requireGuestStorageConfiguration(res)) return;

  try {
    await ensurePersistentInvitationState();
  } catch (error) {
    console.error('Failed to load invitation before saving a birthday wish:', error);
    res.status(503).json({
      error: error instanceof Error ? error.message : 'Invitation storage is unavailable.',
    });
    return;
  }

  const { slug } = req.params;
  const invitation = db.getPublishedInvitation(slug);
  if (!invitation) {
    res.status(404).json({ error: 'Invitation not found' });
    return;
  }

  const { guestName, message, badgeEmoji } = req.body;
  if (!guestName || !guestName.trim() || !message || !message.trim()) {
    res.status(400).json({ error: 'Name and message are required' });
    return;
  }

  let wish: GuestWish;
  if (rsvpSheetUrl) {
    try {
      const result = await requestRsvpSheet<{ wish?: GuestWish }>({
        action: 'wish',
        slug,
        guestName: guestName.trim(),
        message: message.trim(),
        badgeEmoji: badgeEmoji || '🏁',
      });
      if (!result.wish) throw new Error('The birthday wish was not saved.');
      wish = result.wish;
    } catch (error) {
      res.status(502).json({
        error: error instanceof Error ? error.message : 'The birthday wish could not be saved.',
      });
      return;
    }
  } else {
    wish = db.addGuestWish({
      guestName,
      message,
      badgeEmoji: badgeEmoji || '🏁',
    });
  }

  res.status(201).json({ success: true, wish });
});

// Download iCalendar .ics file
app.get('/api/calendar/:slug/invite.ics', async (req: Request, res: Response) => {
  try {
    await ensurePersistentInvitationState();
  } catch (error) {
    console.error('Failed to load invitation for calendar download:', error);
    res.status(503).json({
      error: error instanceof Error ? error.message : 'Invitation storage is unavailable.',
    });
    return;
  }

  const { slug } = req.params;
  const invitation = db.getPublishedInvitation(slug) || db.getDraftInvitation();

  const title = `${invitation.birthdayTitle} - Celebrating ${invitation.celebrantName}`;
  const location = `${invitation.venueName}, ${invitation.venueAddress}`;
  const description = `${invitation.welcomeMessage}\n\nDress Code: ${invitation.dressCode}\nRSVP & Info: ${req.protocol}://${req.get('host')}/invite/${slug}`;

  // Format YYYYMMDDTHHmmSSZ
  const dateStr = invitation.eventDate.replace(/-/g, '');
  const startHour = toTwentyFourHourTime(parseStandardTime(invitation.startTime || '2:00 PM') || { hour: 2, minute: 0, period: 'PM' }).replace(':', '');
  const endHour = toTwentyFourHourTime(parseStandardTime(invitation.endTime || '6:00 PM') || { hour: 6, minute: 0, period: 'PM' }).replace(':', '');

  const dtStart = `${dateStr}T${startHour}00`;
  const dtEnd = `${dateStr}T${endHour}00`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Little Racer Turns ONE//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:little-racer-${Date.now()}@littleracer.com`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${title.replace(/[,;]/g, ' ')}`,
    `LOCATION:${location.replace(/[,;]/g, ' ')}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${slug}-first-birthday.ics"`);
  res.status(200).send(icsContent);
});

// ==========================================
// RSVP ROUTES (PUBLIC & ADMIN)
// ==========================================

// Public guest RSVP submission
app.post('/api/rsvp/:slug', checkRateLimit, async (req: Request, res: Response) => {
  if (requireGuestStorageConfiguration(res)) return;

  try {
    await ensurePersistentInvitationState();
  } catch (error) {
    console.error('Failed to load invitation before saving an RSVP:', error);
    res.status(503).json({
      error: error instanceof Error ? error.message : 'Invitation storage is unavailable.',
    });
    return;
  }

  const { slug } = req.params;
  const invitation = db.getPublishedInvitation(slug);

  if (!invitation) {
    res.status(404).json({ error: 'Invitation not found or not published' });
    return;
  }

  if (!invitation.rsvpSettings.enabled) {
    res.status(400).json({ error: 'RSVP submissions are currently closed for this celebration.' });
    return;
  }

  const { guestName, attending, attendeeCount, guestNames, email, phone, message, dietaryNotes } =
    req.body;

  if (!guestName || typeof guestName !== 'string' || !guestName.trim()) {
    res.status(400).json({ error: 'Guest name is required.' });
    return;
  }

  if (typeof attending !== 'boolean') {
    res.status(400).json({ error: 'Please indicate whether you will be attending.' });
    return;
  }

  const maxAllowed = invitation.rsvpSettings.maxAttendeesPerRsvp || 6;
  const parsedCount = attending ? Math.max(1, Math.min(maxAllowed, parseInt(attendeeCount, 10) || 1)) : 0;

  // Check deadline
  if (invitation.rsvpSettings.deadline) {
    const deadlineDate = new Date(`${invitation.rsvpSettings.deadline}T23:59:59`);
    if (new Date() > deadlineDate) {
      res.status(400).json({
        error: `The RSVP deadline (${invitation.rsvpSettings.deadline}) has passed. Please contact the host directly.`,
      });
      return;
    }
  }

  if (rsvpSheetUrl) {
    try {
      const result = await requestRsvpSheet<{ message?: string; rsvp?: Partial<RSVPResponse> }>({
        action: 'rsvp',
        slug,
        guestName: guestName.trim(),
        attending,
        attendeeCount: parsedCount,
      });
      if (!result.rsvp?.id) throw new Error('The RSVP was not saved.');
      res.status(201).json({
        success: true,
        message: result.message || invitation.rsvpSettings.customConfirmationMessage || 'Thank you for your RSVP!',
        rsvp: {
          ...result.rsvp,
          invitationId: invitation.id,
          guestName: result.rsvp.guestName || guestName.trim(),
          attending: result.rsvp.attending ?? attending,
          attendeeCount: result.rsvp.attendeeCount ?? parsedCount,
          submittedAt: result.rsvp.submittedAt || new Date().toISOString(),
          editToken: result.rsvp.editToken || '',
        },
      });
    } catch (error) {
      res.status(502).json({
        error: error instanceof Error ? error.message : 'Your RSVP could not be saved.',
      });
    }
    return;
  }

  // Prevent accidental rapid duplicate submission with identical name
  const existing = db.getAllRSVPs().find(
    (r) =>
      r.invitationId === invitation.id &&
      r.guestName.trim().toLowerCase() === guestName.trim().toLowerCase()
  );

  if (existing) {
    // If they already submitted with this name, let them know and offer the edit token
    res.status(409).json({
      error: `An RSVP for "${guestName}" has already been received! You can update your response using your confirmation link.`,
      existingRsvpId: existing.id,
      editToken: existing.editToken,
    });
    return;
  }

  const newRsvp = db.createRSVP({
    invitationId: invitation.id,
    guestName: guestName.trim(),
    attending,
    attendeeCount: parsedCount,
    guestNames: Array.isArray(guestNames) ? guestNames.filter(Boolean) : undefined,
    email: email?.trim() || undefined,
    phone: phone?.trim() || undefined,
    message: message?.trim() || undefined,
    dietaryNotes: dietaryNotes?.trim() || undefined,
  });

  res.status(201).json({
    success: true,
    message: invitation.rsvpSettings.customConfirmationMessage || 'Thank you for your RSVP!',
    rsvp: {
      id: newRsvp.id,
      guestName: newRsvp.guestName,
      attending: newRsvp.attending,
      attendeeCount: newRsvp.attendeeCount,
      submittedAt: newRsvp.submittedAt,
      editToken: newRsvp.editToken,
    },
  });
});

// Public guest RSVP update using editToken
app.put('/api/rsvp/:slug/:id', checkRateLimit, (req: Request, res: Response) => {
  const { id } = req.params;
  const { editToken, attending, attendeeCount, guestNames, email, phone, message, dietaryNotes } =
    req.body;

  if (!editToken) {
    res.status(401).json({ error: 'Valid confirmation edit token is required to update an RSVP.' });
    return;
  }

  const existing = db.getRSVPById(id);
  if (!existing || existing.editToken !== editToken) {
    res.status(403).json({ error: 'Unauthorized: invalid edit token or RSVP not found.' });
    return;
  }

  const updated = db.updateRSVP(
    id,
    {
      attending: typeof attending === 'boolean' ? attending : existing.attending,
      attendeeCount: typeof attendeeCount === 'number' ? attendeeCount : existing.attendeeCount,
      guestNames: Array.isArray(guestNames) ? guestNames : existing.guestNames,
      email: email !== undefined ? email.trim() : existing.email,
      phone: phone !== undefined ? phone.trim() : existing.phone,
      message: message !== undefined ? message.trim() : existing.message,
      dietaryNotes: dietaryNotes !== undefined ? dietaryNotes.trim() : existing.dietaryNotes,
    },
    editToken
  );

  res.json({ success: true, rsvp: updated });
});

async function getAdminRsvps() {
  if (isProd && (!rsvpSheetUrl || !rsvpSheetReadKey)) {
    throw new Error('Shared guest storage is not connected. Set the Apps Script URL and RSVP read key before viewing responses.');
  }
  if (!rsvpSheetUrl) {
    return { rsvps: db.getAllRSVPs(), source: 'local' as const };
  }
  if (!rsvpSheetReadKey) {
    throw new Error('Set RSVP_SHEET_READ_KEY on the web service and RSVP_READ_KEY in Apps Script to show sheet responses.');
  }

  const result = await requestRsvpSheet<{ rsvps?: RSVPResponse[] }>({
    action: 'list',
    key: rsvpSheetReadKey,
  });
  if (!Array.isArray(result.rsvps)) throw new Error('The RSVP sheet did not include response data.');
  return { rsvps: result.rsvps, source: 'google-sheet' as const };
}

async function getSheetWishes(): Promise<GuestWish[]> {
  if (!rsvpSheetUrl || !rsvpSheetReadKey) return [];
  const result = await requestRsvpSheet<{ wishes?: GuestWish[] }>({
    action: 'list-wishes',
    key: rsvpSheetReadKey,
  });
  if (!Array.isArray(result.wishes)) throw new Error('The guestbook sheet did not include wish data.');
  return result.wishes;
}

function mergeWishes(localWishes: GuestWish[], sheetWishes: GuestWish[]): GuestWish[] {
  const byId = new Map<string, GuestWish>();
  for (const wish of [...localWishes, ...sheetWishes]) byId.set(wish.id, wish);
  return [...byId.values()].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
}

function getRsvpMetrics(rsvps: RSVPResponse[]) {
  const attending = rsvps.filter((r) => r.attending);
  const declined = rsvps.filter((r) => !r.attending);
  const totalAttendees = attending.reduce((acc, r) => acc + (r.attendeeCount || 1), 0);
  return {
    total: rsvps.length,
    totalResponses: rsvps.length,
    attendingCount: attending.length,
    declinedCount: declined.length,
    totalAttendees,
  };
}

// Admin RSVP management endpoints
app.get('/api/admin/rsvps', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const { rsvps, source } = await getAdminRsvps();
    res.json({ rsvps, source, metrics: getRsvpMetrics(rsvps) });
  } catch (error) {
    console.error('Failed to load admin RSVP responses:', error);
    res.status(502).json({
      error: error instanceof Error ? error.message : 'Unable to load RSVP responses.',
    });
  }
});

app.get('/api/admin/wishes', requireAdmin, async (_req: Request, res: Response) => {
  try {
    await ensurePersistentInvitationState();
  } catch (error) {
    console.error('Failed to load invitation before displaying birthday wishes:', error);
    res.status(503).json({
      error: error instanceof Error ? error.message : 'Invitation storage is unavailable.',
    });
    return;
  }

  const invitationWishes = mergeWishes(
    db.getDraftInvitation().wishes || [],
    db.getPublishedInvitation()?.wishes || []
  );

  if (!rsvpSheetUrl || !rsvpSheetReadKey) {
    res.json({
      wishes: invitationWishes,
      source: 'local',
      warning: isProd && rsvpSheetUrl
        ? 'Set RSVP_SHEET_READ_KEY on the web service and RSVP_READ_KEY in Apps Script to view shared birthday wishes.'
        : undefined,
    });
    return;
  }

  try {
    const wishes = mergeWishes(invitationWishes, await getSheetWishes());
    res.json({ wishes, source: 'google-sheet' });
  } catch (error) {
    console.error('Failed to load admin birthday wishes:', error);
    res.status(502).json({
      error: error instanceof Error ? error.message : 'Unable to load birthday wishes.',
    });
  }
});

app.patch('/api/admin/rsvps/:id', requireAdmin, (req: Request, res: Response) => {
  if (rsvpSheetUrl) {
    res.status(405).json({ error: 'Google Sheets RSVP responses are read-only in the admin dashboard.' });
    return;
  }
  const { id } = req.params;
  const updated = db.updateRSVP(id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'RSVP record not found' });
    return;
  }
  res.json({ success: true, rsvp: updated });
});

app.delete('/api/admin/rsvps/:id', requireAdmin, (req: Request, res: Response) => {
  if (rsvpSheetUrl) {
    res.status(405).json({ error: 'Google Sheets RSVP responses are read-only in the admin dashboard.' });
    return;
  }
  const { id } = req.params;
  const success = db.deleteRSVP(id);
  if (!success) {
    res.status(404).json({ error: 'RSVP record not found' });
    return;
  }
  res.json({ success: true, message: 'RSVP removed successfully' });
});

app.get('/api/admin/rsvps/export.csv', requireAdmin, async (_req: Request, res: Response) => {
  let rsvps: RSVPResponse[];
  try {
    ({ rsvps } = await getAdminRsvps());
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : 'Unable to export RSVP responses.' });
    return;
  }
  const headers = ['ID', 'Guest Name', 'Status', 'Attendee Count', 'Guest Names', 'Email', 'Phone', 'Dietary Notes', 'Message', 'Submitted At'];
  
  const escapeCsv = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = rsvps.map((r) => [
    r.id,
    r.guestName,
    r.attending ? 'ATTENDING' : 'DECLINED',
    r.attendeeCount,
    (r.guestNames || []).join('; '),
    r.email || '',
    r.phone || '',
    r.dietaryNotes || '',
    r.message || '',
    new Date(r.submittedAt).toLocaleString(),
  ].map(escapeCsv).join(','));

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="little-racer-turns-one-rsvps.csv"');
  res.status(200).send(csvContent);
});

// ==========================================
// CLIENT SERVING & DEV INTEGRATION
// ==========================================

async function startServer() {
  if (isProd && rsvpSheetUrl && rsvpSheetReadKey) {
    try {
      await ensurePersistentInvitationState();
    } catch (error) {
      console.error('Permanent invitation storage is not ready; invitation APIs will report the storage error:', error);
    }
  } else if (isProd) {
    console.error('Permanent invitation storage requires RSVP_SCRIPT_URL and RSVP_SHEET_READ_KEY.');
  }

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🏁 Little Racer Turns ONE server listening on http://0.0.0.0:${PORT}`);
  });
}

export { app };

if (!isVercel) {
  startServer().catch((err) => {
    console.error('Fatal server startup error:', err);
    process.exit(1);
  });
}
