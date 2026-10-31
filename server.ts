import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import multer from 'multer';
import fs from 'fs';
import { db, verifyPassword, UPLOADS_DIR } from './server/db.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

// Body parsing with 10mb limit for potential JSON data
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
  limits: { fileSize: 12 * 1024 * 1024 }, // 12MB limit
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

  if (!token || !db.validateSession(token)) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired admin session' });
    return;
  }
  next();
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

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  const admin = db.getAdmin();
  if (username.toLowerCase().trim() !== admin.username.toLowerCase().trim()) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const isValid = verifyPassword(password, admin.passwordHash, admin.salt);
  if (!isValid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

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

  if (!token || !db.validateSession(token)) {
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
  if (token) {
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

// Public invitation fetch (only returns published snapshot!)
app.get('/api/invitation/:slug', (req: Request, res: Response) => {
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

  res.json({
    status: 'published',
    invitation: published,
  });
});

// Admin get current invitation (both draft and published snapshot)
app.get('/api/admin/invitation', requireAdmin, (_req: Request, res: Response) => {
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
app.put('/api/admin/invitation/draft', requireAdmin, (req: Request, res: Response) => {
  try {
    const updated = db.saveDraft(req.body);
    res.json({ success: true, draft: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to save draft' });
  }
});

// Admin publish
app.post('/api/admin/invitation/publish', requireAdmin, (_req: Request, res: Response) => {
  try {
    const published = db.publish();
    res.json({ success: true, published, message: 'Invitation published successfully!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to publish invitation' });
  }
});

// Admin unpublish
app.post('/api/admin/invitation/unpublish', requireAdmin, (_req: Request, res: Response) => {
  try {
    const draft = db.unpublish();
    res.json({ success: true, draft, message: 'Invitation has been unpublished.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to unpublish invitation' });
  }
});

// Admin file upload
app.post('/api/admin/upload', requireAdmin, upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file was uploaded' });
    return;
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    success: true,
    url: fileUrl,
    filename: req.file.filename,
    size: req.file.size,
    mimetype: req.file.mimetype,
  });
});

// ==========================================
// GUEST WISHES & CALENDAR ROUTES
// ==========================================

// Post a guest birthday wish
app.post('/api/wishes/:slug', checkRateLimit, (req: Request, res: Response) => {
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

  const wish = db.addGuestWish({
    guestName,
    message,
    badgeEmoji: badgeEmoji || '🏁',
  });

  res.status(201).json({ success: true, wish });
});

// Download iCalendar .ics file
app.get('/api/calendar/:slug/invite.ics', (req: Request, res: Response) => {
  const { slug } = req.params;
  const invitation = db.getPublishedInvitation(slug) || db.getDraftInvitation();

  const title = `${invitation.birthdayTitle} - Celebrating ${invitation.celebrantName}`;
  const location = `${invitation.venueName}, ${invitation.venueAddress}`;
  const description = `${invitation.welcomeMessage}\n\nDress Code: ${invitation.dressCode}\nRSVP & Info: ${req.protocol}://${req.get('host')}/invite/${slug}`;

  // Format YYYYMMDDTHHmmSSZ
  const dateStr = invitation.eventDate.replace(/-/g, '');
  const startHour = (invitation.startTime || '14:00').replace(':', '');
  const endHour = (invitation.endTime || '18:00').replace(':', '');

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
app.post('/api/rsvp/:slug', checkRateLimit, (req: Request, res: Response) => {
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

// Admin RSVP management endpoints
app.get('/api/admin/rsvps', requireAdmin, (_req: Request, res: Response) => {
  const rsvps = db.getAllRSVPs();
  const attending = rsvps.filter((r) => r.attending);
  const declined = rsvps.filter((r) => !r.attending);
  const totalAttendees = attending.reduce((acc, r) => acc + (r.attendeeCount || 1), 0);

  res.json({
    rsvps,
    metrics: {
      total: rsvps.length,
      attendingCount: attending.length,
      declinedCount: declined.length,
      totalAttendees,
    },
  });
});

app.patch('/api/admin/rsvps/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = db.updateRSVP(id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'RSVP record not found' });
    return;
  }
  res.json({ success: true, rsvp: updated });
});

app.delete('/api/admin/rsvps/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const success = db.deleteRSVP(id);
  if (!success) {
    res.status(404).json({ error: 'RSVP record not found' });
    return;
  }
  res.json({ success: true, message: 'RSVP removed successfully' });
});

app.get('/api/admin/rsvps/export.csv', requireAdmin, (_req: Request, res: Response) => {
  const rsvps = db.getAllRSVPs();
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

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
