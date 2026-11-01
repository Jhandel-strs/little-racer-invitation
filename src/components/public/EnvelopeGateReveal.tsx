import React, { useState } from 'react';
import { ArrowRight, Flag, Ticket } from 'lucide-react';
import type { InvitationData } from '../../types/invitation';
import { formatStandardTime } from '../../utils/time';

interface Props {
  invitation: InvitationData;
  onOpened: () => void;
}

const formatEventDate = (value: string) => {
  if (!value) return 'Details inside';
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric' }).format(date);
};

export const EnvelopeGateReveal: React.FC<Props> = ({ invitation, onOpened }) => {
  const [isOpening, setIsOpening] = useState(false);

  const handleOpen = () => {
    if (isOpening) return;
    setIsOpening(true);
    window.setTimeout(onOpened, 360);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950 px-3 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] transition-opacity duration-300 sm:p-6 ${isOpening ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
      aria-label="Invitation cover"
    >
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(225,29,72,.24),transparent_55%)]" />
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-2 bg-checkered-sm opacity-75" />

      <article className="relative my-auto grid w-full max-w-5xl overflow-hidden rounded-[1.5rem] border border-white/15 bg-[#fffaf2] shadow-[0_35px_100px_rgba(0,0,0,.55)] sm:rounded-[2rem] md:grid-cols-[.9fr_1.1fr]">
        <div className="relative h-48 min-h-0 overflow-hidden bg-slate-900 sm:h-64 md:h-auto md:min-h-[570px]">
          <img
            src={invitation.mainPhotoUrl || '/src/assets/images/baby_racer_portrait_1792840991262.jpg'}
            alt={invitation.celebrantName}
            referrerPolicy="no-referrer"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/10 to-slate-950/20" />
          <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/30 bg-slate-950/45 px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.15em] text-white backdrop-blur-sm sm:left-7 sm:top-7">
            <Flag className="h-3.5 w-3.5 fill-rose-400 text-rose-400" />
            Special delivery · Speedway
          </div>
          <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-200">The guest of honor</p>
            <h1 className="mt-1 font-display text-3xl font-black tracking-tight sm:mt-2 sm:text-5xl">{invitation.celebrantName}</h1>
            <p className="mt-1 text-xs font-medium text-white/80 sm:mt-2 sm:text-sm">{invitation.tagline || `A birthday celebration for our little racer`}</p>
            <div className="mt-3 flex items-center gap-2 text-sm font-bold text-white/90 sm:mt-5">
              <Ticket className="h-4 w-4 text-rose-300" />
              <span>Racer #{invitation.turningAge || 1} · {invitation.turningAge === 1 ? 'First lap' : `Turning ${invitation.turningAge}`}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center p-4 sm:p-9 lg:p-12">
          <div className="inline-flex w-fit max-w-full items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-rose-700 sm:text-xs">
            <span className="h-2 w-2 rounded-full bg-rose-600" />
            <span className="min-w-0 break-words">{invitation.theme?.envelopeBannerText || 'You’re on the guest list'}</span>
          </div>

          <p className="mt-5 text-xs font-bold uppercase tracking-[0.19em] text-slate-500 sm:mt-8">
            {invitation.theme?.envelopeSalutation || 'An invitation for'}
          </p>
          <h2 className="mt-2 font-display text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
            {invitation.theme?.envelopeAddressee || 'Family & friends'}
          </h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-600 sm:mt-4 sm:text-base sm:leading-7">
            Join us to celebrate {invitation.celebrantName}’s {invitation.turningAge === 1 ? 'first birthday' : `${invitation.turningAge}th birthday`} with a day full of fun, treats, and little-racer memories.
          </p>

          <div className="mt-5 flex flex-wrap gap-x-8 gap-y-3 border-y border-slate-200 py-4 sm:mt-7 sm:gap-y-4 sm:py-5">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-rose-700">Race date</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{formatEventDate(invitation.eventDate)}</p>
            </div>
            {invitation.venueName && (
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-rose-700">Track location</p>
                <p className="mt-1 max-w-[220px] truncate text-sm font-bold text-slate-900">{invitation.venueName}</p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleOpen}
            disabled={isOpening}
            className="group mt-5 inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl bg-rose-600 px-6 py-3 text-sm font-extrabold uppercase tracking-[0.09em] text-white shadow-[0_12px_30px_rgba(225,29,72,.22)] transition hover:-translate-y-0.5 hover:bg-rose-500 disabled:translate-y-0 disabled:opacity-75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-slate-900 sm:mt-7 sm:min-h-14 sm:py-4"
          >
            <span>{isOpening ? 'Getting the track ready…' : 'Open your invitation'}</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
          <p className="mt-3 text-center text-xs text-slate-500">{invitation.startTime ? `${formatStandardTime(invitation.startTime, invitation.timeFormat)} · ` : ''}Your full race-day details are waiting inside.</p>
        </div>
      </article>
    </div>
  );
};
