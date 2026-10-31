import React from 'react';
import { ArrowUp, Trophy, Lock } from 'lucide-react';
import type { InvitationData } from '../../types/invitation';
import { CanvaScrollReveal } from './CanvaScrollReveal';

interface Props {
  invitation: InvitationData;
  onOpenAdmin: () => void;
}

export const SectionHClosing: React.FC<Props> = ({ invitation, onOpenAdmin }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const canvaAnim = invitation.theme?.canvaAnimationEnabled ?? true;

  return (
    <footer className="relative py-16 px-4 bg-slate-950 text-white text-center border-t border-slate-800 overflow-hidden">
      {/* Decorative finish line checkered border */}
      <div className="absolute top-0 left-0 right-0 h-3 bg-checkered-sm opacity-90" />

      <div className="max-w-2xl mx-auto relative z-10 flex flex-col items-center">
        {/* Winner Trophy Art Illustration with Pop Reveal */}
        <CanvaScrollReveal direction="pop" delay={100} enabled={canvaAnim}>
          <div className="w-44 h-36 sm:w-56 sm:h-44 rounded-3xl overflow-hidden mb-6 shadow-2xl border-2 border-amber-400/50 bg-slate-900 group">
            <img
              src={invitation.trophyIllustrationUrl || '/src/assets/images/winner_podium_trophy_1792841010098.jpg'}
              alt="Winner Trophy Champion"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        </CanvaScrollReveal>

        {/* Closing Title */}
        <CanvaScrollReveal direction="left" delay={200} enabled={canvaAnim}>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold uppercase tracking-widest mb-3 border border-amber-500/20">
            <Trophy className="w-3.5 h-3.5" />
            <span>VICTORY LAP</span>
          </div>
        </CanvaScrollReveal>

        <CanvaScrollReveal direction="left" delay={300} enabled={canvaAnim}>
          <h3 className="text-2xl sm:text-3xl font-black font-display uppercase tracking-tight text-white max-w-lg">
            {invitation.closingMessage ||
              'Thank you for being part of our little racer\'s extraordinary first year!'}
          </h3>
        </CanvaScrollReveal>

        <CanvaScrollReveal direction="left" delay={400} enabled={canvaAnim}>
          <p className="mt-3 text-base sm:text-lg font-bold text-rose-400 font-display">
            {invitation.closingSignOff || 'See you at the starting line!'}
          </p>
        </CanvaScrollReveal>

        {/* Back to Top CTA */}
        <div className="mt-8">
          <button
            onClick={scrollToTop}
            className="px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white transition-all hover:scale-105 flex items-center gap-2 border border-slate-800 shadow-md cursor-pointer"
          >
            <ArrowUp className="w-3.5 h-3.5 text-rose-400" />
            <span>Back to Top 🏁</span>
          </button>
        </div>

        {/* Quiet Admin Access Footer */}
        <div className="mt-12 pt-6 border-t border-slate-900 w-full flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
          <span>Little Racer Turns ONE · First Birthday Invitation</span>
          <button
            onClick={onOpenAdmin}
            className="hover:text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Lock className="w-3 h-3 text-slate-500" />
            <span>Host Admin Portal</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
