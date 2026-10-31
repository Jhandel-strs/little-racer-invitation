import React from 'react';
import { X, Flag, Download, Share2, Sparkles, Check } from 'lucide-react';
import type { InvitationData } from '../../types/invitation';

interface Props {
  invitation: InvitationData;
  guestName?: string;
  onClose: () => void;
}

export const DigitalPitPassModal: React.FC<Props> = ({ invitation, guestName, onClose }) => {
  const displayName = guestName || 'VIP Champion Guest';
  const passNum = `PASS #${Math.floor(100 + Math.random() * 900)}-LRP`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain bg-black/85 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md animate-fade-in sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative my-auto max-h-[calc(100dvh-1.5rem)] max-w-sm w-full overflow-y-auto overscroll-contain bg-slate-900 rounded-3xl p-5 sm:p-6 border-2 border-rose-500 shadow-[0_20px_50px_rgba(225,29,72,0.4)] text-center text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Checkered top bar */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-checkered-sm" />

        <button
          onClick={onClose}
          className="absolute top-3 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-slate-300 hover:text-white sm:top-4 sm:right-4"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Lanyard Ring */}
        <div className="w-10 h-3 bg-slate-500 rounded-t-md mx-auto -mt-2 mb-3" />

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600/30 text-rose-400 text-[10px] font-black uppercase tracking-widest border border-rose-500/40 mb-3">
          <Flag className="w-3 h-3 fill-rose-500" />
          <span>OFFICIAL SPEEDWAY CREDENTIAL</span>
        </div>

        <h3 className="text-xl font-black font-display uppercase tracking-tight text-white">
          {invitation.birthdayTitle}
        </h3>
        <p className="text-xs font-bold text-sky-300">Pit Pass Credential</p>

        {/* Guest name badge */}
        <div className="my-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            HOLDER / PIT CREW
          </div>
          <div className="text-lg font-black text-white mt-0.5 truncate">{displayName}</div>
          <div className="text-[10px] text-amber-400 font-mono mt-1">{passNum} · ALL ACCESS</div>
        </div>

        {/* Event logistics strip */}
        <div className="grid grid-cols-2 gap-2 text-[11px] text-left mb-4">
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-[9px] uppercase font-bold block">Date</span>
            <span className="font-bold text-white">{invitation.eventDate}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 text-[9px] uppercase font-bold block">Pit Gate</span>
            <span className="font-bold text-white">Gate 1 ({invitation.startTime})</span>
          </div>
        </div>

        {/* Barcode Graphic */}
        <div className="w-full h-10 rounded bg-white p-1 mb-4 flex items-center justify-center">
          <div className="w-full h-full barcode-pattern" />
        </div>

        <div className="text-[10px] text-slate-400">
          Take a screenshot or save this digital pass to present at the welcome table!
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            Print / Save Pass
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
