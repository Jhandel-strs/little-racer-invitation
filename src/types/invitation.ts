export interface GalleryItem {
  id: string;
  url: string;
  caption: string;
  ageMonth?: string;
}

export interface ScheduleItem {
  id: string;
  time: string;
  title: string;
  description: string;
  iconName?: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface GuestWish {
  id: string;
  guestName: string;
  message: string;
  badgeEmoji: string;
  timestamp: string;
}

export interface WishlistConfig {
  enabled: boolean;
  clothingSize: string;
  shoeSize: string;
  favoriteItems: string[];
  registryUrl?: string;
  registryName?: string;
  notes?: string;
}

export interface ThemeSettings {
  primaryColor: string; // Racing Red, e.g. #E11D48
  secondaryColor: string; // Asphalt Slate, e.g. #0F172A
  accentColor: string; // Baby Blue, e.g. #38BDF8
  creamColor: string; // Light Cream, e.g. #F8FAFC
  fontFamily: string; // 'Outfit' | 'Plus Jakarta Sans' | 'Oswald'
  stylePreset?: 'classic-grand-prix' | 'vintage-speedway' | 'midnight-racer' | 'pastel-pitstop' | 'custom';
  cardStyle?: 'vip-pit-pass' | 'modern-race' | 'vintage-poster';
  badgeText?: string;
  ticketNumber?: string;
  overlayOpacity: number; // 0 to 1
  canvaAnimationEnabled: boolean;
  marqueeText?: string;
  envelopeBannerText?: string;
  envelopeSalutation?: string;
  envelopeAddressee?: string;
  envelopeTagline?: string;
  lapNames: {
    lap1: string;
    lap2: string;
    lap3: string;
    lap4: string;
    lap5: string;
    lap6: string;
    lap7: string;
    finish: string;
  };
  confettiEnabled: boolean;
  showTireMarks: boolean;
  showCheckeredBorders: boolean;
}

export interface RsvpSettings {
  enabled: boolean;
  deadline: string; // YYYY-MM-DD
  maxAttendeesPerRsvp: number;
  allowAdditionalGuests: boolean;
  collectPhone: boolean;
  collectEmail: boolean;
  collectDietaryNotes: boolean;
  collectMessage: boolean;
  customConfirmationMessage: string;
}

export interface SectionVisibility {
  hero: boolean;
  intro: boolean;
  milestones: boolean;
  countdown: boolean;
  schedule: boolean;
  details: boolean;
  gallery: boolean;
  wishlist: boolean;
  faq: boolean;
  wishes: boolean;
  map: boolean;
  rsvp: boolean;
  closing: boolean;
}

export interface InvitationData {
  id: string;
  slug: string;
  status: 'draft' | 'published';
  celebrantName: string;
  turningAge: number;
  birthdayTitle: string;
  tagline: string;
  welcomeMessage: string;
  eventDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  timezone: string; // e.g. "America/Los_Angeles"
  venueName: string;
  venueAddress: string;
  venueCoordinates: {
    lat: number;
    lng: number;
  };
  googleMapsUrl?: string;
  dressCode: string;
  reminders: string;
  closingMessage: string;
  closingSignOff: string;
  mainPhotoUrl: string;
  backdropUrl: string;
  trophyIllustrationUrl: string;
  gallery: GalleryItem[];
  schedule: ScheduleItem[];
  faqs: FaqItem[];
  wishlist: WishlistConfig;
  wishes: GuestWish[];
  milestones: {
    favoriteFood: string;
    favoriteToy: string;
    teethCount: number;
    lovesTo: string;
    giftIdeas?: string;
    giftRecommendationPlay?: string;
    giftRecommendationStory?: string;
    giftRecommendationKeepsake?: string;
    superpower: string;
    height?: string;
    weight?: string;
    firstWord?: string;
  };
  theme: ThemeSettings;
  rsvpSettings: RsvpSettings;
  visibility: SectionVisibility;
  publishedAt?: string;
  updatedAt: string;
  createdAt: string;
}

export interface RSVPResponse {
  id: string;
  invitationId: string;
  guestName: string;
  attending: boolean;
  attendeeCount: number;
  guestNames?: string[];
  email?: string;
  phone?: string;
  message?: string;
  dietaryNotes?: string;
  submittedAt: string;
  updatedAt?: string;
  editToken: string;
}

export interface AdminStats {
  totalResponses: number;
  attendingCount: number;
  declinedCount: number;
  totalAttendees: number;
  lastResponseAt?: string;
}
