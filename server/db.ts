import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { InvitationData, RSVPResponse } from '../src/types/invitation';

export interface AdminUser {
  id: string;
  username: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
}

export interface Session {
  token: string;
  userId: string;
  expiresAt: number;
}

export interface DatabaseSchema {
  admin: AdminUser;
  draftInvitation: InvitationData;
  publishedInvitation: InvitationData | null;
  rsvps: RSVPResponse[];
  sessions: Session[];
}

const PROJECT_DATA_DIR = path.resolve(process.cwd(), 'data');
const PROJECT_UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
const DATA_DIR = path.resolve(process.env.DATA_DIR || PROJECT_DATA_DIR);
const DB_FILE = path.join(DATA_DIR, 'database.json');
export const UPLOADS_DIR = path.resolve(process.env.UPLOADS_DIR || PROJECT_UPLOADS_DIR);
const RENDER_DATA_DIR = process.env.RENDER_DATA_DIR
  ? path.resolve(process.env.RENDER_DATA_DIR)
  : null;

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const finalSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, finalSalt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt: finalSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const calculated = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(calculated, 'hex'), Buffer.from(hash, 'hex'));
}

function initializeRenderStorage() {
  if (!RENDER_DATA_DIR) return;

  const markerFile = path.join(RENDER_DATA_DIR, '.little-racer-seeded');
  const bootstrapPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD?.trim();
  if (!bootstrapPassword || bootstrapPassword.length < 4) {
    throw new Error(
      'Set ADMIN_BOOTSTRAP_PASSWORD in Render to a password of at least 4 characters. Use a unique value with 12 or more characters.'
    );
  }

  if (fs.existsSync(markerFile)) {
    try {
      const marker = JSON.parse(fs.readFileSync(markerFile, 'utf-8')) as {
        version?: number;
        hash?: string;
        salt?: string;
      };
      if (
        marker.version === 1 &&
        marker.hash &&
        marker.salt &&
        verifyPassword(bootstrapPassword, marker.hash, marker.salt)
      ) {
        return;
      }
    } catch {
      // Older timestamp-only markers are upgraded below using the current Render secret.
    }
  }

  fs.mkdirSync(RENDER_DATA_DIR, { recursive: true });
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });

  const seedDatabase = path.join(PROJECT_DATA_DIR, 'database.json');
  if (!fs.existsSync(DB_FILE)) {
    if (!fs.existsSync(seedDatabase)) {
      throw new Error(`The invitation database seed was not found at ${seedDatabase}.`);
    }
    fs.copyFileSync(seedDatabase, DB_FILE);
  }

  if (PROJECT_UPLOADS_DIR !== UPLOADS_DIR && fs.existsSync(PROJECT_UPLOADS_DIR)) {
    fs.cpSync(PROJECT_UPLOADS_DIR, UPLOADS_DIR, {
      recursive: true,
      force: false,
      errorOnExist: false,
    });
  }

  const database = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')) as DatabaseSchema;
  if (!database.admin) {
    throw new Error('The invitation database seed does not contain an administrator account.');
  }

  const { hash, salt } = hashPassword(bootstrapPassword);
  database.admin.passwordHash = hash;
  database.admin.salt = salt;
  database.sessions = [];

  const tempFile = `${DB_FILE}.bootstrap.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(database, null, 2), 'utf-8');
  fs.renameSync(tempFile, DB_FILE);
  const markerHash = hashPassword(bootstrapPassword);
  fs.writeFileSync(
    markerFile,
    JSON.stringify({ version: 1, ...markerHash }),
    'utf-8'
  );
}

initializeRenderStorage();

const DEFAULT_INVITATION: InvitationData = {
  id: 'inv-little-racer-001',
  slug: 'little-racer-turns-one',
  status: 'published',
  celebrantName: 'Leo James',
  turningAge: 1,
  birthdayTitle: 'Little Racer Turns ONE! 🏁',
  tagline: 'Fast & One-derful! The Grand Prix of First Birthdays',
  welcomeMessage:
    'Get ready to race into a day full of giggles, checkered flags, and unforgettable memories as our little champion crosses the finish line into year ONE!',
  eventDate: '2026-11-14',
  startTime: '14:00',
  endTime: '18:00',
  timezone: 'America/Los_Angeles',
  venueName: 'Grand Prix Raceway & Kids Club',
  venueAddress: '450 Speedway Boulevard, Los Angeles, CA 90028',
  venueCoordinates: {
    lat: 34.1012,
    lng: -118.3256,
  },
  googleMapsUrl: 'https://maps.google.com/?q=450+Speedway+Boulevard,+Los+Angeles,+CA+90028',
  dressCode: 'Pit Crew Casual & Racing Attire (Racing Red, Baby Blue, Checkered Flags, or Denim)',
  reminders:
    '• Complimentary Pit Lane valet parking available at Main Gate.\n• Toddler-safe indoor racetrack and soft play area provided.\n• Official Cake Smash ceremony begins at 3:30 PM sharp!\n• Stroller parking is located near the victory podium.',
  closingMessage:
    'Thank you for being part of our little racer\'s extraordinary first year! Your love fuels our journey.',
  closingSignOff: 'See you at the starting line! — The James Family',
  mainPhotoUrl: '/src/assets/images/baby_racer_portrait_1792840991262.jpg',
  backdropUrl: '/src/assets/images/racing_track_backdrop_1792840969035.jpg',
  trophyIllustrationUrl: '/src/assets/images/winner_podium_trophy_1792841010098.jpg',
  gallery: [
    {
      id: 'g-1',
      url: '/src/assets/images/baby_racer_portrait_1792840991262.jpg',
      caption: 'Testing the wheels at month 9!',
      ageMonth: '9 Months',
    },
    {
      id: 'g-2',
      url: '/src/assets/images/racing_track_backdrop_1792840969035.jpg',
      caption: 'The championship circuit is ready!',
      ageMonth: 'Track Day',
    },
    {
      id: 'g-3',
      url: '/src/assets/images/winner_podium_trophy_1792841010098.jpg',
      caption: 'First place in our hearts every single lap.',
      ageMonth: '1st Birthday',
    },
  ],
  schedule: [
    {
      id: 's-1',
      time: '2:00 PM',
      title: 'Warm-Up Lap (Check-In & Pit Passes)',
      description: 'Guests arrive, grab personalized racing lanyards and pit crew refreshments.',
    },
    {
      id: 's-2',
      time: '2:45 PM',
      title: 'Baby Grand Prix & Soft Track Races',
      description: 'Crawlers, walkers, and toddler racers take the custom foam raceway.',
    },
    {
      id: 's-3',
      time: '3:30 PM',
      title: 'The Champion Cake Smash Ceremony',
      description: 'Singing happy birthday and watching Leo tackle his giant tire cake!',
    },
    {
      id: 's-4',
      time: '4:15 PM',
      title: 'Pit Stop Fuel (Family Feast & Treats)',
      description: 'Gourmet slider station, tire donuts, dipstick fries, and celebration punch.',
    },
    {
      id: 's-5',
      time: '5:30 PM',
      title: 'Victory Lap & Trophy Favors',
      description: 'Commemorative medals, checkered flags, and baby racer gift bags.',
    },
  ],
  milestones: {
    favoriteFood: 'Mashed sweet potatoes & teething biscuits',
    favoriteToy: 'Zooming red wooden sports car',
    teethCount: 6,
    lovesTo: 'Clap hands when hearing car sounds & wave flags',
    giftIdeas: 'Board books, wooden cars & musical toys',
    superpower: 'Speed crawling across the living room in 3 seconds flat!',
    height: '30.5 inches (77 cm)',
    weight: '22.4 lbs (10.2 kg)',
    firstWord: 'Vroom!',
  },
  faqs: [
    {
      id: 'faq-1',
      question: 'Are strollers and diaper bags allowed?',
      answer: 'Yes, absolutely! We have dedicated indoor stroller parking right near Pit Gate 1, plus private nursery changing stations stocked with complimentary wipes and diapers.',
    },
    {
      id: 'faq-2',
      question: 'What is the recommended dress code?',
      answer: 'Pit Crew Casual! Think fun racing reds, baby blues, denim, checkered prints, or comfy party clothes ready for track-side playtime.',
    },
    {
      id: 'faq-3',
      question: 'Can older siblings attend and play?',
      answer: 'Yes! While Leo is celebrating his 1st lap, our venue features both a cushioned toddler raceway and an interactive grand prix game zone for older kids.',
    },
    {
      id: 'faq-4',
      question: 'Where can we find parking at the raceway?',
      answer: 'Free valet and dedicated guest parking is available at the Main Entrance Pit Lane. Follow the checkered race flags to Gate 1.',
    },
  ],
  wishlist: {
    enabled: true,
    clothingSize: '12 – 18 Months',
    shoeSize: 'Size 4 Infant / Toddler',
    favoriteItems: [
      'Wooden Montessori racing tracks & ramps',
      'Board books & touch-and-feel sensory stories',
      'Stacking cups and soft building blocks',
      'Bath toy speedboats & splash fun',
    ],
    registryUrl: 'https://www.amazon.com/baby-reg',
    registryName: "Leo's Amazon Birthday Registry",
    notes: 'Your love and presence is the greatest gift! For those asking, handwritten notes inside storybooks are treasured forever.',
  },
  wishes: [
    {
      id: 'wish-1',
      guestName: 'Grandma Martha',
      message: 'Happy 1st Birthday my sweetest little racer! May your life be filled with endless smiles and green flags all the way!',
      badgeEmoji: '🏁',
      timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'wish-2',
      guestName: 'Uncle Dave & Aunt Sarah',
      message: 'Zoom zoom little buddy! Can not wait to see you smash that giant tire cake! Proud of our champ!',
      badgeEmoji: '🏎️',
      timestamp: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
    {
      id: 'wish-3',
      guestName: 'Cousin Lucas',
      message: 'Happy birthday Leo! I am bringing my toy hot rod to race with you on the soft track!',
      badgeEmoji: '🏆',
      timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
    },
  ],
    theme: {
    primaryColor: '#E11D48',
    secondaryColor: '#0F172A',
    accentColor: '#38BDF8',
    creamColor: '#F8FAFC',
    fontFamily: 'Outfit',
    stylePreset: 'classic-grand-prix',
    cardStyle: 'vip-pit-pass',
    badgeText: 'VIP PIT CREW PASS',
    ticketNumber: 'PASS #001-LRP · ADMIT ONE',
    overlayOpacity: 0.35,
    canvaAnimationEnabled: true,
    marqueeText: 'FAST & ONE-DERFUL 🏎️ LEO TURNS ONE 🏁 START YOUR ENGINES 🚦 PIT CREW APPROVED 🏆 GET READY TO RACE 🎈',
    lapNames: {
      lap1: 'LAP 1: STARTING GRID 🚦',
      lap2: 'LAP 2: MEET THE CHAMPION 🏆',
      lap3: 'LAP 3: LIVE RACE CLOCK ⏱️',
      lap4: 'LAP 4: PIT STOP SCHEDULE 🏎️',
      lap5: 'LAP 5: PHOTO REEL 📸',
      lap6: 'LAP 6: GUEST CHEERS 💬',
      lap7: 'LAP 7: RACEDAY LOGISTICS 🛠️',
      finish: 'FINISH LINE: PIT PASS RSVP 🏁',
    },
    confettiEnabled: true,
    showTireMarks: true,
    showCheckeredBorders: true,
  },
  rsvpSettings: {
    enabled: true,
    deadline: '2026-11-01',
    maxAttendeesPerRsvp: 6,
    allowAdditionalGuests: true,
    collectPhone: true,
    collectEmail: true,
    collectDietaryNotes: true,
    collectMessage: true,
    customConfirmationMessage:
      'Vroom vroom! Your pit pass is confirmed. We cannot wait to celebrate our little champion with you!',
  },
  visibility: {
    hero: true,
    intro: true,
    milestones: true,
    countdown: true,
    schedule: true,
    details: true,
    gallery: true,
    wishlist: true,
    faq: true,
    wishes: true,
    map: true,
    rsvp: true,
    closing: true,
  },
  publishedAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
};

const SEED_RSVPS: RSVPResponse[] = [
  {
    id: 'rsvp-seed-01',
    invitationId: 'inv-little-racer-001',
    guestName: 'Grandma & Grandpa Miller',
    attending: true,
    attendeeCount: 2,
    guestNames: ['Martha Miller', 'Robert Miller'],
    email: 'marthamiller@example.com',
    phone: '(555) 234-5678',
    message: 'We are so excited to cheer for our favorite number one racer! Love you Leo!',
    dietaryNotes: 'None',
    submittedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    editToken: crypto.randomBytes(16).toString('hex'),
  },
  {
    id: 'rsvp-seed-02',
    invitationId: 'inv-little-racer-001',
    guestName: 'Uncle Dave & Family',
    attending: true,
    attendeeCount: 4,
    guestNames: ['Dave', 'Sarah', 'Lucas (3)', 'Mia (1)'],
    email: 'dave.adventures@example.com',
    phone: '(555) 987-6543',
    message: 'Lucas already has his racing helmet ready! See you on track!',
    dietaryNotes: 'Gluten-free for Sarah',
    submittedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    editToken: crypto.randomBytes(16).toString('hex'),
  },
  {
    id: 'rsvp-seed-03',
    invitationId: 'inv-little-racer-001',
    guestName: 'Auntie Chloe',
    attending: false,
    attendeeCount: 0,
    email: 'chloe.k@example.com',
    phone: '(555) 444-1122',
    message: 'Sending so much love from overseas! Will video call after the victory lap!',
    submittedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    editToken: crypto.randomBytes(16).toString('hex'),
  },
];

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.admin && parsed.draftInvitation) {
          if (!parsed.admin.username || parsed.admin.email) {
            parsed.admin.username = 'admin';
            delete parsed.admin.email;
            this.save(parsed);
          }
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse database.json, reinitializing...', e);
      }
    }

    // Local development keeps a legacy convenience password; production must configure a secret.
    const bootstrapPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD?.trim() ||
      (process.env.NODE_ENV === 'production' ? '' : '1111');
    if (bootstrapPassword.length < 4) {
      throw new Error('Set ADMIN_BOOTSTRAP_PASSWORD before creating the administrator account.');
    }
    const { hash, salt } = hashPassword(bootstrapPassword);
    const initial: DatabaseSchema = {
      admin: {
        id: 'admin-01',
        username: 'admin',
        passwordHash: hash,
        salt,
        createdAt: new Date().toISOString(),
      },
      draftInvitation: JSON.parse(JSON.stringify(DEFAULT_INVITATION)),
      publishedInvitation: JSON.parse(JSON.stringify(DEFAULT_INVITATION)),
      rsvps: [...SEED_RSVPS],
      sessions: [],
    };
    this.save(initial);
    return initial;
  }

  private save(data?: DatabaseSchema) {
    const toSave = data || this.data;
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(toSave, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  }

  // Admin and Auth
  getAdmin(): AdminUser {
    return this.data.admin;
  }

  updateAdminPassword(newPassword: string): void {
    const { hash, salt } = hashPassword(newPassword);
    this.data.admin.passwordHash = hash;
    this.data.admin.salt = salt;
    this.save();
  }

  updateAdminUsername(username: string): void {
    this.data.admin.username = username;
    this.save();
  }

  createSession(userId: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
    this.data.sessions.push({ token, userId, expiresAt });
    this.save();
    return token;
  }

  validateSession(token: string): boolean {
    if (!token) return false;
    const session = this.data.sessions.find((s) => s.token === token);
    if (!session) return false;
    if (session.expiresAt < Date.now()) {
      this.deleteSession(token);
      return false;
    }
    return true;
  }

  deleteSession(token: string): void {
    this.data.sessions = this.data.sessions.filter((s) => s.token !== token);
    this.save();
  }

  // Invitation Management
  getDraftInvitation(): InvitationData {
    return this.data.draftInvitation;
  }

  getPublishedInvitation(slug?: string): InvitationData | null {
    if (!this.data.publishedInvitation) return null;
    if (slug && this.data.publishedInvitation.slug !== slug) {
      // Check if draft matches slug or fallback
      if (this.data.draftInvitation.slug === slug && this.data.draftInvitation.status === 'published') {
        return this.data.publishedInvitation;
      }
      return null;
    }
    return this.data.publishedInvitation;
  }

  saveDraft(updates: Partial<InvitationData>): InvitationData {
    this.data.draftInvitation = {
      ...this.data.draftInvitation,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.draftInvitation;
  }

  publish(): InvitationData {
    const now = new Date().toISOString();
    this.data.draftInvitation.status = 'published';
    this.data.draftInvitation.publishedAt = now;
    this.data.draftInvitation.updatedAt = now;
    // Clone draft into published snapshot
    this.data.publishedInvitation = JSON.parse(JSON.stringify(this.data.draftInvitation));
    this.save();
    return this.data.publishedInvitation as InvitationData;
  }

  unpublish(): InvitationData {
    this.data.draftInvitation.status = 'draft';
    this.data.draftInvitation.updatedAt = new Date().toISOString();
    this.data.publishedInvitation = null;
    this.save();
    return this.data.draftInvitation;
  }

  addGuestWish(payload: { guestName: string; message: string; badgeEmoji?: string }) {
    const wish = {
      id: `wish-${Date.now()}`,
      guestName: payload.guestName.trim(),
      message: payload.message.trim(),
      badgeEmoji: payload.badgeEmoji || '🏁',
      timestamp: new Date().toISOString(),
    };

    if (!this.data.draftInvitation.wishes) {
      this.data.draftInvitation.wishes = [];
    }
    this.data.draftInvitation.wishes.unshift(wish);

    if (this.data.publishedInvitation) {
      if (!this.data.publishedInvitation.wishes) {
        this.data.publishedInvitation.wishes = [];
      }
      this.data.publishedInvitation.wishes.unshift(wish);
    }

    this.save();
    return wish;
  }

  // RSVP Management
  getAllRSVPs(): RSVPResponse[] {
    return [...this.data.rsvps].sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  }

  getRSVPById(id: string): RSVPResponse | undefined {
    return this.data.rsvps.find((r) => r.id === id);
  }

  createRSVP(payload: Omit<RSVPResponse, 'id' | 'submittedAt' | 'editToken'>): RSVPResponse {
    const newRsvp: RSVPResponse = {
      ...payload,
      id: `rsvp-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      submittedAt: new Date().toISOString(),
      editToken: crypto.randomBytes(16).toString('hex'),
    };
    this.data.rsvps.push(newRsvp);
    this.save();
    return newRsvp;
  }

  updateRSVP(id: string, updates: Partial<RSVPResponse>, editToken?: string): RSVPResponse | null {
    const index = this.data.rsvps.findIndex((r) => r.id === id);
    if (index === -1) return null;

    // If editToken provided, verify it matches
    if (editToken && this.data.rsvps[index].editToken !== editToken) {
      return null;
    }

    this.data.rsvps[index] = {
      ...this.data.rsvps[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.rsvps[index];
  }

  deleteRSVP(id: string): boolean {
    const initialLen = this.data.rsvps.length;
    this.data.rsvps = this.data.rsvps.filter((r) => r.id !== id);
    if (this.data.rsvps.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }
}

export const db = new Database();
