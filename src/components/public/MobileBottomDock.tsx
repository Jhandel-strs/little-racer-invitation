import React from 'react';
import { Flag, Navigation, Calendar, Ticket } from 'lucide-react';

interface Props {
  deadline?: string;
  onOpenPass: () => void;
}

export const MobileBottomDock: React.FC<Props> = ({
  deadline,
  onOpenPass,
}) => {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav
      aria-label="Mobile party navigation"
      className="fixed bottom-[calc(0.5rem+env(safe-area-inset-bottom))] left-0 right-0 z-40 flex justify-center px-2 pointer-events-none sm:hidden"
    >
      <div className="pointer-events-auto flex items-center justify-between gap-1 px-2 py-2 bg-slate-900/95 text-white rounded-2xl border border-rose-500/50 shadow-[0_10px_35px_rgba(0,0,0,0.85)] backdrop-blur-xl w-full max-w-md">
        {/* RSVP Primary Button */}
        <button
          onClick={() => scrollToSection('rsvp-section')}
          className="flex-1 min-h-12 py-2 px-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/30 cursor-pointer"
        >
          <span>RSVP</span>
          <Flag className="w-3 h-3 fill-white" />
        </button>

        {/* Calendar Add */}
        <button
          onClick={() => scrollToSection('calendar-section')}
          className="min-w-12 min-h-12 p-1 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 flex flex-col items-center justify-center transition-colors cursor-pointer"
          title="Save Date"
        >
          <Calendar className="w-4 h-4 text-sky-400" />
          <span className="text-[9px] font-bold mt-0.5">Date</span>
        </button>

        {/* Directions / Map */}
        <button
          onClick={() => scrollToSection('map-section')}
          className="min-w-12 min-h-12 p-1 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 flex flex-col items-center justify-center transition-colors cursor-pointer"
          title="Map & Directions"
        >
          <Navigation className="w-4 h-4 text-amber-400" />
          <span className="text-[9px] font-bold mt-0.5">Track</span>
        </button>

        {/* Digital VIP Pit Pass */}
        <button
          onClick={onOpenPass}
          className="min-w-12 min-h-12 p-1 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 flex flex-col items-center justify-center transition-colors cursor-pointer"
          title="VIP Pit Pass"
        >
          <Ticket className="w-4 h-4 text-rose-400" />
          <span className="text-[9px] font-bold mt-0.5">Pass</span>
        </button>
      </div>
    </nav>
  );
};
