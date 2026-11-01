import React, { useState } from 'react';
import { ArrowRight, Check, Flag, Share2, Ticket } from 'lucide-react';
import type { InvitationData } from '../../types/invitation';

interface Props {
  invitation: InvitationData;
  onStartEngines: () => void;
}

const formatEventDate = (value: string) => {
  if (!value) return 'Date to be announced';
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
};

export const SectionAOpening: React.FC<Props> = ({ invitation, onStartEngines }) => {
  const [copiedShare, setCopiedShare] = useState(false);
  const isOswald = invitation.theme?.fontFamily === 'Oswald';
  const badgeText = invitation.theme?.badgeText || 'RACE DAY INVITATION';
  const ticketNumber = invitation.theme?.ticketNumber || 'PASS #001 · ADMIT ONE';
  const birthdayTitle = invitation.birthdayTitle || `${invitation.celebrantName} turns ${invitation.turningAge === 1 ? 'one' : invitation.turningAge}!`;

  const handleShare = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank', 'width=600,height=500');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      window.setTimeout(() => setCopiedShare(false), 2000);
    } catch {
      setCopiedShare(false);
    }
  };

  return (
    <section className="relative isolate min-h-0 overflow-hidden bg-slate-950 px-3 py-4 text-white sm:min-h-[92dvh] sm:px-8 sm:py-6 lg:min-h-screen lg:px-12">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: `url(${invitation.backdropUrl || '/src/assets/images/racing_track_backdrop_1792840969035.jpg'})` }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-slate-950"
        style={{ opacity: invitation.theme?.overlayOpacity ?? 0.72 }}
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/45" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-t from-slate-950/90 to-transparent" />

      <div className="mx-auto flex min-h-0 max-w-7xl flex-col sm:min-h-[calc(92dvh-3rem)] lg:min-h-[calc(100dvh-3rem)]">
        <header className="flex items-center justify-between gap-4">
          <div className="inline-flex max-w-[75%] items-center gap-2.5 rounded-full border border-white/15 bg-slate-950/45 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-white/90 backdrop-blur-sm sm:text-xs">
            <Flag className="h-4 w-4 shrink-0 fill-rose-500 text-rose-500" />
            <span className="truncate">{badgeText}</span>
          </div>
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400"
            aria-label="Share this invitation"
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Share invitation</span>
          </button>
        </header>

        <div className="grid flex-1 items-center gap-5 py-5 sm:gap-10 sm:py-12 lg:grid-cols-[1.02fr_.98fr] lg:gap-16 lg:py-14">
          <div className="mx-auto w-full max-w-2xl text-center lg:mx-0 lg:text-left">
            <p className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-rose-300 sm:mb-5 sm:text-sm">
              <span className="h-px w-8 bg-rose-400" />
              The starting line is ready
            </p>
            <h1 className={`text-balance break-words text-[clamp(2.35rem,10vw,3rem)] font-black leading-[0.98] tracking-tight text-white sm:text-6xl lg:text-7xl ${isOswald ? 'font-racing' : 'font-display'}`}>
              {birthdayTitle}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-200 sm:mt-6 sm:text-lg lg:mx-0">
              {invitation.welcomeMessage || `Join us for a joyful race-day celebration as ${invitation.celebrantName} makes another lap around the sun.`}
            </p>

            <div className="mt-5 flex flex-col items-center gap-3 sm:mt-8 sm:flex-row sm:gap-4 sm:justify-center lg:justify-start">
              <button
                type="button"
                onClick={onStartEngines}
                className="group inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl bg-rose-600 px-6 py-3 text-sm font-extrabold uppercase tracking-[0.08em] text-white shadow-[0_12px_35px_rgba(225,29,72,.28)] transition hover:-translate-y-0.5 hover:bg-rose-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white sm:min-h-14 sm:w-auto sm:px-7 sm:py-4"
              >
                <span>View party details</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-200 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400"
              >
                {copiedShare ? <Check className="h-4 w-4 text-emerald-300" /> : <Share2 className="h-4 w-4" />}
                {copiedShare ? 'Link copied' : 'Copy invitation link'}
              </button>
            </div>
          </div>

          <div className="mx-auto w-full max-w-lg lg:max-w-none">
            <article className="relative overflow-hidden rounded-3xl border border-white/65 bg-[#fffaf2] p-2 text-slate-950 shadow-[0_30px_90px_rgba(0,0,0,.42)] sm:rounded-[2rem] sm:p-4">
              <div className="flex items-center justify-between gap-3 px-2 pb-2 pt-1 sm:px-4 sm:pb-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white">
                    <Ticket className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-extrabold uppercase tracking-[0.18em] text-rose-700">Official race-day pass</p>
                    <p className="truncate text-xs font-bold text-slate-500">{ticketNumber}</p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-rose-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-rose-700">
                  Age {invitation.turningAge}
                </span>
              </div>

              <div className="relative overflow-hidden rounded-[1.5rem] bg-slate-200">
                <img
                  src={invitation.mainPhotoUrl || '/src/assets/images/baby_racer_portrait_1792840991262.jpg'}
                  alt={invitation.celebrantName}
                  referrerPolicy="no-referrer"
                  className="aspect-[16/10] w-full object-cover object-center lg:aspect-[4/3]"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent px-5 pb-5 pt-14 text-white">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-rose-200">Our guest of honor</p>
                  <p className="mt-1 font-display text-2xl font-black sm:text-3xl">{invitation.celebrantName}</p>
                </div>
                <div className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-rose-600 text-lg font-black text-white shadow-lg sm:h-14 sm:w-14 sm:text-xl">
                  #{invitation.turningAge || 1}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 px-1 sm:gap-3 sm:px-2">
                <div className="rounded-2xl bg-white px-3 py-3 sm:px-4">
                  <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-rose-700">Race date</p>
                  <p className="mt-1 text-sm font-extrabold text-slate-900">{formatEventDate(invitation.eventDate)}</p>
                </div>
                <div className="rounded-2xl bg-white px-3 py-3 sm:px-4">
                  <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-rose-700">Green flag</p>
                  <p className="mt-1 text-sm font-extrabold text-slate-900">{invitation.startTime || 'Time to be announced'}</p>
                </div>
                {invitation.venueName && (
                  <div className="col-span-2 flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-3 sm:px-4">
                    <div className="min-w-0">
                      <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-rose-700">Meet us at</p>
                      <p className="mt-1 truncate text-sm font-extrabold text-slate-900">{invitation.venueName}</p>
                    </div>
                    <span aria-hidden="true" className="h-8 w-8 shrink-0 rounded-lg bg-checkered-sm opacity-75" />
                  </div>
                )}
              </div>
              <div className="mx-2 mt-3 border-t border-dashed border-slate-300 pt-3 text-center text-[9px] font-bold uppercase tracking-[0.24em] text-slate-500">
                Made for our favorite little champion
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
};
