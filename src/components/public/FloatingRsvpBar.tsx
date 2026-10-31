import React, { useState, useEffect } from 'react';
import { Flag, Calendar } from 'lucide-react';

interface Props {
  deadline?: string;
}

export const FloatingRsvpBar: React.FC<Props> = ({ deadline }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const rsvpEl = document.getElementById('rsvp-section');
      if (!rsvpEl) {
        setVisible(scrollY > 400);
        return;
      }
      const rect = rsvpEl.getBoundingClientRect();
      // Hide once user is looking right at the RSVP form
      if (scrollY > 350 && (rect.top > window.innerHeight || rect.bottom < 0)) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!visible) return null;

  const scrollToRsvp = () => {
    const el = document.getElementById('rsvp-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="fixed bottom-3 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none animate-fade-in">
      <div className="pointer-events-auto flex items-center justify-between gap-3 px-4 py-2 bg-slate-900/95 text-white rounded-full border border-rose-500/50 shadow-[0_8px_30px_rgba(0,0,0,0.8)] backdrop-blur-md max-w-sm w-full">
        <div className="flex items-center gap-2 text-xs truncate">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
          <span className="font-bold text-slate-200 truncate">
            RSVP by <strong className="text-rose-400">{deadline || 'Nov 1'}</strong>
          </span>
        </div>

        <button
          onClick={scrollToRsvp}
          className="px-4 py-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 shrink-0 shadow-md cursor-pointer"
        >
          <span>RSVP NOW</span>
          <Flag className="w-3 h-3 fill-white" />
        </button>
      </div>
    </div>
  );
};
