# Little Racer Turns ONE 🏁
## Baby Boy First Birthday Digital Invitation & Admin Management System

A production-grade, customizable digital invitation website for a baby boy's first birthday celebration with a playful racing-car theme ("Little Racer Turns ONE"). Features a public vertically scrollable invitation, interactive guest RSVP with duplicate protection and celebratory confetti, live racing telemetry countdown, Google Maps venue integration, and a private administrator dashboard.

---

### 🌟 Key Features

#### 1. Public Digital Invitation
- **Section A (Opening Screen)**:
  - Starting lights sequence (3 Red -> 2 Red -> Green "GO!") with synthesized Web Audio API sound effects.
  - Baby champion portrait framed in chrome racing wheel with official `#1` birthday badge.
  - "START YOUR ENGINES" button with engine revving sound and smooth transition that auto-starts lovely background music.
  - One-click "Share to Facebook" and "Copy Share Link" buttons.
  - Floating vinyl music player widget with spinning animation, play/pause toggle, and volume control.
- **Section B (Celebrant Introduction)**:
  - Welcome message, baby name, and celebration title.
  - Pit Stop Profile spec sheet: favorite fuel, number of teeth, favorite ride, height, chassis weight, first word, and speed crawling superpower.
- **Section C (Live Countdown)**:
  - Tachometer and race-board digital dashboard displaying Days, Hours, Minutes, and Seconds.
  - Updates automatically every second based on selected event date and time.
- **Section D (Event Details & Pit Stop Schedule)**:
  - Race date, start & end time, circuit venue, dress code ("Pit Crew Casual"), and reminders.
  - Interactive Race Day Pit Stop schedule.
- **NEW: 1-Click Calendar Add**:
  - Direct 1-tap "Add to Google Calendar" button.
  - Direct 1-tap Apple / Outlook `.ics` calendar invite file download.
- **NEW: Baby Wishlist & Gift Registry Guide**:
  - Clothing size (12-18M), Shoe size (Size 4 Infant), favorite toys, storybook inscriptions note, and online registry button.
- **NEW: Interactive Guest Book & Birthday Cheers Wall**:
  - Real-time guest greetings board with racing sticker emojis (🏎️ 🏁 🎂 🏆 ⭐ 🎈) and instant cheer posting.
- **NEW: Pit Crew Parent FAQ**:
  - Interactive accordion covering stroller parking, diaper changing nursery stations, parking valet, dress code, and sibling play areas.
- **NEW: Digital VIP Pit Pass Wallet**:
  - Interactive modal generating a personal VIP Pit Crew Pass card with barcode, attendee name, and gate credential to screenshot or save.
- **NEW: Scroll-Driven Racing Animations**:
  - Animated miniature racecar speeding across a live progress track lane as you scroll down the page!
  - "Cheer Leo! 🎊" floating instant confetti burst button.
- **NEW: Mobile-First Bottom Navigation Dock**:
  - Touch-friendly floating bottom dock on phones with 1-tap buttons for RSVP, Lovely Music disc, Calendar save, Directions, and VIP Pass.
- **Section F (Interactive Venue Map)**:
  - Google Maps embedded venue view with Speedway Gate pin.
  - "Get Directions" button opening Google Maps directions.
  - "Copy Address" with instant clipboard confirmation.
- **Section G (Interactive Guest RSVP)**:
  - Guest name, attendance selection ("YES, I'LL BE THERE 🏁" or "SORRY, CAN'T MAKE IT 🛑"), attendee count picker.
  - Optional email, phone, dietary notes, and birthday greeting.
  - Checkered flag confirmation card with `canvas-confetti` fireworks.
  - Duplicate submission protection and secure `editToken` stored locally to update response anytime.
  - Full guest privacy (guests cannot view or tamper with other guests' responses).
- **Section H (Closing & Victory Lap)**:
  - Golden winner champion trophy #1 artwork.
  - Celebratory message and "Back to Top" navigation.
  - Host Admin Portal link.
- **Sticky Floating RSVP Pill**:
  - Unobtrusive floating action bar complying with the $\le 15\%$ mobile sticky cap rule.

---

### 🛡️ Private Admin Dashboard

Accessible at `/admin`:
- **Default Master Admin Credentials**:
  - **Username**: `admin`
  - **Password**: `1111`
- **Overview Module**:
  - Real-time RSVP metrics (Total responses, Confirmed attendees, Declined, Total guest count).
  - One-click copy for the stable public URL (`/invite/little-racer-turns-one`).
  - Draft vs. Published status indicator.
- **Content & Schedule Editor**:
  - Change baby's name, birthday title, welcome message, closing message, date, start/end time, dress code, reminders, and RSVP deadline.
  - Add, edit, or delete Pit Stop schedule timeline items.
  - Toggle visibility for any section of the invitation.
- **Image & Media Management**:
  - Separate upload dropzones for Baby Portrait and Backdrop images. Local uploads use `/uploads`; the free Render setup stores uploaded invitation images in Google Drive.
  - Background overlay opacity slider (10% to 85%).
  - Add, caption, and delete photo gallery items.
- **Venue & Google Maps Configuration**:
  - Edit venue name, street address, and custom directions link.
  - Embedded map preview.
- **RSVP Management**:
  - Searchable and filterable guest table (All, Attending, Declined).
  - Toggle attendance status or delete duplicate/inappropriate submissions.
  - **CSV Export**: One-click download of all responses with full guest details (`/api/admin/rsvps/export.csv`).
- **Live Preview Modal**:
  - Test the exact guest experience across Mobile (375px), Tablet (768px), and Desktop viewports.
  - Switch between reviewing Draft changes and Published version.
- **Draft & Publishing Isolation**:
  - Edits saved as Draft remain private until the administrator clicks **"Publish Now"**.
  - Guests visiting the public URL only see the published snapshot.

---

### 🚀 Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Canvas-Confetti, Web Audio API.
- **Backend**: Node.js, Express, Multer for image file uploads.
- **Database & Storage**: Local development uses an atomically written JSON database (`data/database.json`) and `/uploads`. The free Render setup stores invitation edits and uploaded photos in Google Drive, and RSVP responses and birthday wishes in Google Sheets, because Render's free filesystem is temporary.
- **Security**: PBKDF2 password hashing with salt, session tokens, rate limiting on RSVP submissions.

---

### 🔧 Running Locally

```bash
# Install dependencies
npm install

# Start the full-stack server
npm run dev

# The applet will be accessible at http://localhost:3000
```
