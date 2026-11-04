import React, { useRef, useState, useEffect } from 'react';
import type { InvitationData } from '../../types/invitation';
import { SectionAOpening } from './SectionAOpening';
import { SectionBIntro } from './SectionBIntro';
import { SectionCCountdown } from './SectionCCountdown';
import { SectionDDetails } from './SectionDDetails';
import { SectionCalendarAdd } from './SectionCalendarAdd';
import { SectionEGallery } from './SectionEGallery';
import { SectionGuestWishes } from './SectionGuestWishes';
import { SectionFaq } from './SectionFaq';
import { SectionFMap } from './SectionFMap';
import { SectionGRsvp } from './SectionGRsvp';
import { SectionHClosing } from './SectionHClosing';
import { MobileBottomDock } from './MobileBottomDock';
import { ScrollTransitionManager } from './ScrollTransitionManager';
import { DigitalPitPassModal } from './DigitalPitPassModal';
import { EnvelopeGateReveal } from './EnvelopeGateReveal';
import { FloatingFestiveElements } from './FloatingFestiveElements';
import { RacetrackMusic, type RacetrackMusicHandle } from './RacetrackMusic';

interface Props {
  invitation: InvitationData;
  onOpenAdmin: () => void;
  isPreview?: boolean;
}

export const PublicInvitationView: React.FC<Props> = ({ invitation, onOpenAdmin, isPreview }) => {
  const [currentInvitation, setCurrentInvitation] = useState<InvitationData>(invitation);
  const [showPassModal, setShowPassModal] = useState(false);
  const [isEnvelopeOpen, setIsEnvelopeOpen] = useState(false);
  const introSectionRef = useRef<HTMLDivElement>(null);
  const musicRef = useRef<RacetrackMusicHandle>(null);

  // Sync prop changes
  useEffect(() => {
    setCurrentInvitation(invitation);
  }, [invitation]);

  const handleStartEngines = () => {
    introSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const { visibility, theme } = currentInvitation;
  const marqueeText =
    theme?.marqueeText ||
    `🏁 ${currentInvitation.celebrantName.toUpperCase()} TURNS ONE 🏎️ GRAND PRIX CELEBRATION 🏁 ${currentInvitation.venueName.toUpperCase()} 🏎️ VIP PIT PASS ONLY 🏁`;

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 selection:bg-rose-500 selection:text-white pb-[calc(6rem+env(safe-area-inset-bottom))] sm:pb-0 overflow-x-hidden relative">
      {/* 3D Wax Seal Envelope Opening Reveal (Little Moments signature experience) */}
      {!isEnvelopeOpen && !isPreview && (
        <EnvelopeGateReveal
          invitation={currentInvitation}
          onOpened={() => setIsEnvelopeOpen(true)}
          onStartMusic={() => musicRef.current?.start()}
        />
      )}
      <RacetrackMusic ref={musicRef} />

      {/* Floating Festive Elements (Balloons, Twinkling Stars, Drifting Cars) */}
      <FloatingFestiveElements />

      {/* Scroll-Driven Race Track & RPM Throttle HUD with Engine Rev on Scroll */}
      <ScrollTransitionManager
        theme={theme}
      />

      {isPreview && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-center text-xs font-black uppercase tracking-wider sticky top-3 z-50 shadow-md">
          🏁 PREVIEW MODE · {currentInvitation.status.toUpperCase()} VERSION
        </div>
      )}

      {/* SECTION A: Opening Screen with Starting Lights */}
      {(visibility?.hero ?? true) && (
        <SectionAOpening
          invitation={currentInvitation}
          onStartEngines={handleStartEngines}
        />
      )}

      {/* Canva-Style Kinetic Racing Marquee Ticker */}
      <div className="w-full bg-gradient-to-r from-rose-700 via-amber-500 to-rose-600 py-2.5 overflow-hidden border-y border-amber-300/30 shadow-inner">
        <div className="animate-marquee whitespace-nowrap text-xs font-black font-display tracking-widest text-white uppercase drop-shadow flex items-center gap-8">
          <span>{marqueeText}</span>
          <span>{marqueeText}</span>
          <span>{marqueeText}</span>
          <span>{marqueeText}</span>
        </div>
      </div>

      {/* Target anchor for smooth start transition */}
      <div ref={introSectionRef}>
        {/* SECTION B: Celebrant Introduction */}
        {(visibility?.intro ?? true) && <SectionBIntro invitation={currentInvitation} />}
      </div>

      {/* SECTION C: Live Countdown */}
      {(visibility?.countdown ?? true) && <SectionCCountdown invitation={currentInvitation} />}

      {/* SECTION D: Event Details & Pit Stop Schedule */}
      {(visibility?.details ?? true) && <SectionDDetails invitation={currentInvitation} />}

      {/* 1-Click Calendar Add (Google Calendar & iCal) */}
      <SectionCalendarAdd invitation={currentInvitation} />

      {/* SECTION E: Main Photo and Gallery */}
      {(visibility?.gallery ?? true) && <SectionEGallery invitation={currentInvitation} />}

      {/* Interactive Guest Book & Birthday Cheers Wall */}
      {(visibility?.wishes ?? true) && <SectionGuestWishes invitation={currentInvitation} />}

      {/* Parent Pit Crew FAQ */}
      {(visibility?.faq ?? true) && <SectionFaq invitation={currentInvitation} />}

      {/* SECTION F: Interactive Venue Map */}
      {(visibility?.map ?? true) && <SectionFMap invitation={currentInvitation} />}

      {/* SECTION G: Guest RSVP Form */}
      {(visibility?.rsvp ?? true) && <SectionGRsvp invitation={currentInvitation} />}

      {/* SECTION H: Closing Section */}
      {(visibility?.closing ?? true) && (
        <SectionHClosing invitation={currentInvitation} onOpenAdmin={onOpenAdmin} />
      )}

      {/* Replay Envelope Trigger */}
      {isEnvelopeOpen && !isPreview && (
        <div className="flex justify-center pb-8 pt-2">
          <button
            onClick={() => setIsEnvelopeOpen(false)}
            className="px-4 py-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-rose-300 border border-rose-500/40 text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <span>💌</span>
            <span>Replay Envelope Unsealing</span>
          </button>
        </div>
      )}

      {/* Mobile-First Floating VIP Navigation Dock */}
      <MobileBottomDock
        deadline={currentInvitation.rsvpSettings?.deadline}
        onOpenPass={() => setShowPassModal(true)}
      />

      {/* Digital VIP Pit Pass Card Modal */}
      {showPassModal && (
        <DigitalPitPassModal
          invitation={currentInvitation}
          onClose={() => setShowPassModal(false)}
        />
      )}
    </div>
  );
};
