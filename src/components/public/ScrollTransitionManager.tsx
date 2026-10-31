import React, { useState, useEffect, useRef } from 'react';
import { Zap, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { ThemeSettings } from '../../types/invitation';

interface Props {
  theme?: ThemeSettings;
}

export const ScrollTransitionManager: React.FC<Props> = ({ theme }) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [rpm, setRpm] = useState(1200); // Idle RPM
  const [speedMph, setSpeedMph] = useState(0);
  const [activeLap, setActiveLap] = useState<string>('LAP 1: STARTING GRID');
  const [isRevving, setIsRevving] = useState(false);
  const lastScrollY = useRef(0);
  const revTimeout = useRef<number | null>(null);

  // Read theme configurations with safe defaults
  const lapNames = theme?.lapNames || {
    lap1: 'LAP 1: STARTING GRID 🚦',
    lap2: 'LAP 2: MEET THE CHAMPION 🏆',
    lap3: 'LAP 3: LIVE RACE CLOCK ⏱️',
    lap4: 'LAP 4: PIT STOP SCHEDULE 🏎️',
    lap5: 'LAP 5: PHOTO REEL 📸',
    lap6: 'LAP 6: GUEST CHEERS 💬',
    lap7: 'LAP 7: CIRCUIT LOCATION 🗺️',
    finish: 'FINISH LINE: PIT PASS RSVP 🏁',
  };

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      const currentY = window.scrollY;
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          const deltaY = Math.abs(currentY - lastScrollY.current);
          lastScrollY.current = currentY;

          if (totalScroll > 0) {
            const progress = Math.min(1, Math.max(0, currentY / totalScroll));
            setScrollProgress(progress);

            // Determine active Lap Checkpoint dynamically from admin settings
            if (progress < 0.12) {
              setActiveLap(lapNames.lap1 || 'LAP 1: STARTING GRID 🚦');
            } else if (progress < 0.25) {
              setActiveLap(lapNames.lap2 || 'LAP 2: MEET THE CHAMPION 🏆');
            } else if (progress < 0.38) {
              setActiveLap(lapNames.lap3 || 'LAP 3: LIVE RACE CLOCK ⏱️');
            } else if (progress < 0.52) {
              setActiveLap(lapNames.lap4 || 'LAP 4: PIT STOP SCHEDULE 🏎️');
            } else if (progress < 0.65) {
              setActiveLap(lapNames.lap5 || 'LAP 5: PHOTO REEL 📸');
            } else if (progress < 0.78) {
              setActiveLap(lapNames.lap6 || 'LAP 6: GUEST CHEERS 💬');
            } else if (progress < 0.88) {
              setActiveLap(lapNames.lap7 || 'LAP 7: CIRCUIT LOCATION 🗺️');
            } else {
              setActiveLap(lapNames.finish || 'FINISH LINE: PIT PASS RSVP 🏁');
            }
          }

          // If actively scrolling, animate the speedometer needle and readout.
          if (deltaY > 5) {
            setIsRevving(true);
            const calculatedRpm = Math.min(8800, 2400 + deltaY * 110);
            const calculatedSpeed = Math.min(135, Math.round(15 + deltaY * 1.6));
            setRpm(calculatedRpm);
            setSpeedMph(calculatedSpeed);

            if (revTimeout.current) clearTimeout(revTimeout.current);
            revTimeout.current = window.setTimeout(() => {
              setIsRevving(false);
              setRpm(1200);
              setSpeedMph(0);
            }, 380);
          }

          ticking = false;
        });

        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (revTimeout.current) clearTimeout(revTimeout.current);
    };
  }, [lapNames]);

  const handleConfetti = () => {
    try {
      confetti({
        particleCount: 85,
        spread: 90,
        origin: { y: 0.65 },
        colors: ['#E11D48', '#38BDF8', '#FBBF24', '#FFFFFF'],
      });
    } catch {}
  };

  // Convert RPM (1200 to 8800) to needle rotation angle (-120deg to +120deg)
  const needleAngle = -120 + ((rpm - 1200) / (8800 - 1200)) * 240;

  return (
    <>
      {/* 1. Top Race Track Ribbon with Visible Moving Race Car */}
      <div className="fixed top-0 left-0 right-0 z-50 h-5 bg-slate-950/95 border-b-2 border-slate-800 backdrop-blur-md pointer-events-none select-none">
        {/* Road Track Dashes */}
        <div className="absolute inset-0 opacity-30 road-dashes" />

        {/* Dynamic Track Progress Fill */}
        <div
          className="h-full bg-gradient-to-r from-rose-600 via-amber-400 to-sky-400 transition-all duration-100 ease-out relative flex items-center justify-end shadow-[0_0_12px_rgba(225,29,72,0.8)]"
          style={{ width: `${Math.max(4, scrollProgress * 100)}%` }}
        >
          {/* Animated Exhaust Smoke Puffs */}
          {isRevving && (
            <div className="absolute -left-6 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
              <span className="text-xs animate-smoke-puff opacity-80">💨</span>
              <span className="text-[10px] animate-smoke-puff opacity-60">💨</span>
            </div>
          )}

          {/* Animated Race Car Sprite */}
          <div
            className={`text-lg -mr-3 filter drop-shadow-md transform transition-all duration-150 ${
              isRevving ? 'scale-125 -translate-y-0.5 rotate-3' : 'scale-100'
            }`}
          >
            🏎️
          </div>
        </div>

        {/* Finish Line Checkered Flag Marker at Far Right */}
        <div className="absolute top-0 right-0 bottom-0 w-6 bg-checkered-sm opacity-90 border-l border-white/40 flex items-center justify-center">
          <span className="text-[9px] font-black text-white">🏁</span>
        </div>
      </div>

      {/* 2. Floating Live Speedometer (Top Right) */}
      <aside
        aria-label="Speedometer"
        className="fixed top-6 right-3 sm:right-5 z-40 flex items-center gap-2 pointer-events-none"
      >
        {/* Live Speedometer & Tachometer Needle Gauge Pill */}
        <div
          className={`group flex items-center gap-2.5 px-3 py-1.5 rounded-full border shadow-2xl backdrop-blur-md transition-all ${
            isRevving
              ? 'bg-amber-950/95 border-amber-400 text-amber-300 scale-105 shadow-[0_0_20px_rgba(251,191,36,0.5)]'
              : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
          }`}
        >
          {/* Animated Mini Circular Speedometer Dial */}
          <div className="relative w-6 h-6 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
            {/* Speedometer Rim Markings */}
            <div className="absolute inset-0 rounded-full border-t border-r border-rose-500/80" />
            {/* Animated Needle */}
            <div
              className={`w-0.5 h-2.5 bg-rose-500 rounded-full origin-bottom transition-transform duration-100 ease-out ${
                isRevving ? 'animate-needle-rev' : ''
              }`}
              style={{
                transform: `rotate(${needleAngle}deg)`,
                marginTop: '-4px',
              }}
            />
            {/* Center Pivot Point */}
            <div className="absolute w-1.5 h-1.5 rounded-full bg-amber-400 shadow-sm" />
          </div>

          {/* RPM & MPH Digital Readout */}
          <div className="flex flex-col text-left leading-none">
            <span className="font-mono text-xs font-black tabular-nums text-white">
              {Math.round(rpm)}{' '}
              <span className="text-[9px] text-amber-400 font-sans font-bold">RPM</span>
            </span>
            <span className="text-[9px] font-mono text-slate-400 tabular-nums">
              {speedMph} <span className="text-[8px] font-sans">MPH</span>
            </span>
          </div>

        </div>
      </aside>

      {/* 3. Floating Lap Checkpoint Transition Pill (Top Center) */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-40 hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-white text-xs font-black uppercase tracking-wider shadow-2xl backdrop-blur-md pointer-events-none transition-transform">
        <Zap className={`w-3.5 h-3.5 ${isRevving ? 'text-amber-400 animate-bounce' : 'text-rose-500'}`} />
        <span>{activeLap}</span>
      </div>

      {/* 4. Instant Confetti Popper (Bottom Right) */}
      <div className="fixed bottom-20 right-4 z-30 flex flex-col items-end gap-2 pointer-events-auto">
        <button
          onClick={handleConfetti}
          className="hidden sm:flex px-3.5 py-2 rounded-full bg-slate-900/90 hover:bg-slate-800 text-white text-xs font-bold border border-amber-400/50 shadow-xl backdrop-blur-md items-center gap-1.5 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
          title="Cheer for the champion with confetti!"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Cheer Champ! 🎊</span>
        </button>
      </div>
    </>
  );
};
