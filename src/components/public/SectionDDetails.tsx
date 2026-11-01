import React from 'react';
import { Calendar, Clock, MapPin, Shirt, Award, Flag } from 'lucide-react';
import type { InvitationData } from '../../types/invitation';
import { CanvaScrollReveal } from './CanvaScrollReveal';
import { formatStandardTime } from '../../utils/time';

interface Props {
  invitation: InvitationData;
}

export const SectionDDetails: React.FC<Props> = ({ invitation }) => {
  const canvaAnim = invitation.theme?.canvaAnimationEnabled ?? true;

  const formattedDate = (() => {
    try {
      if (!invitation.eventDate) return 'Date TBD';
      const d = new Date(`${invitation.eventDate}T12:00:00`);
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return invitation.eventDate;
    }
  })();

  return (
    <section className="relative py-16 px-4 bg-slate-950 text-white overflow-hidden">
      <div className="max-w-4xl mx-auto">
        {/* Section Header with Canva Slide Reveal */}
        <div className="text-center mb-12">
          <CanvaScrollReveal direction="left" delay={50} enabled={canvaAnim}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-xs font-bold tracking-widest uppercase mb-3 border border-rose-500/20">
              <Flag className="w-3.5 h-3.5 text-rose-500" />
              <span>RACE DAY LOGISTICS</span>
            </div>
          </CanvaScrollReveal>

          <CanvaScrollReveal direction="left" delay={150} enabled={canvaAnim}>
            <h2 className="text-3xl sm:text-4xl font-black font-display tracking-tight uppercase text-white">
              EVENT DETAILS & PIT STOPS 🏎️
            </h2>
          </CanvaScrollReveal>

          <CanvaScrollReveal direction="left" delay={250} enabled={canvaAnim}>
            <p className="text-sm text-slate-400 mt-2 max-w-xl mx-auto">
              Everything your pit crew needs to know before heading to the starting grid.
            </p>
          </CanvaScrollReveal>
        </div>

        {/* 4 Primary Info Cards Grid with Canva Slide-ins */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {/* Date & Day */}
          <CanvaScrollReveal direction="left" delay={100} enabled={canvaAnim}>
            <div className="h-full p-6 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all hover:scale-[1.02] shadow-lg flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-rose-600/20 text-rose-500 border border-rose-500/30 shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">RACE DATE</div>
                <div className="text-lg font-black text-white mt-0.5">{formattedDate}</div>
                <div className="text-sm text-rose-400 font-semibold mt-1">Official Qualifying Day</div>
              </div>
            </div>
          </CanvaScrollReveal>

          {/* Time & Schedule */}
          <CanvaScrollReveal direction="left" delay={200} enabled={canvaAnim}>
            <div className="h-full p-6 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all hover:scale-[1.02] shadow-lg flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">RACE HOURS</div>
                <div className="text-lg font-black text-white mt-0.5">
                  {formatStandardTime(invitation.startTime || '14:00', invitation.timeFormat)} – {formatStandardTime(invitation.endTime || '18:00', invitation.timeFormat)}
                </div>
                <div className="text-sm text-sky-400 font-semibold mt-1">Green Flag drops at {formatStandardTime(invitation.startTime || '14:00', invitation.timeFormat)} sharp</div>
              </div>
            </div>
          </CanvaScrollReveal>

          {/* Venue & Location */}
          <CanvaScrollReveal direction="left" delay={300} enabled={canvaAnim}>
            <div className="h-full p-6 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all hover:scale-[1.02] shadow-lg flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">VENUE / CIRCUIT</div>
                <div className="text-lg font-black text-white mt-0.5">{invitation.venueName || 'Grand Prix Speedway'}</div>
                <div className="text-sm text-slate-300 mt-1 leading-relaxed break-words">
                  {invitation.venueAddress || '450 Speedway Boulevard, Los Angeles, CA'}
                </div>
              </div>
            </div>
          </CanvaScrollReveal>

          {/* Dress Code */}
          <CanvaScrollReveal direction="left" delay={400} enabled={canvaAnim}>
            <div className="h-full p-6 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all hover:scale-[1.02] shadow-lg flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                <Shirt className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">DRESS CODE</div>
                <div className="text-base sm:text-lg font-black text-amber-300 mt-0.5 leading-snug">
                  {invitation.dressCode || 'Pit Crew Casual'}
                </div>
                <div className="text-sm text-slate-300 mt-1">
                  Please dress in the celebrant's color motif for the party photos!
                </div>
              </div>
            </div>
          </CanvaScrollReveal>
        </div>

        {/* Schedule Timeline (Pit Stops) */}
        {invitation.schedule && invitation.schedule.length > 0 && (
          <CanvaScrollReveal direction="left" delay={250} enabled={canvaAnim}>
            <div className="mt-12 bg-slate-900/60 rounded-3xl p-6 sm:p-8 border border-slate-800">
              <div className="flex items-center gap-2 mb-6">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-black uppercase font-display tracking-wider text-white">
                  Pit Stop Race Schedule
                </h3>
              </div>

              <div className="space-y-4">
                {invitation.schedule.map((item, idx) => (
                  <CanvaScrollReveal
                    key={item.id}
                    direction="left"
                    delay={100 + idx * 80}
                    enabled={canvaAnim}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 gap-3 hover:border-slate-700 transition-all hover:translate-x-1">
                      <div className="flex items-center gap-4">
                        <span className="px-3 py-1 rounded-xl bg-rose-600/20 text-rose-400 font-mono text-xs font-black shrink-0 border border-rose-500/30">
                          {item.time}
                        </span>
                        <span className="min-w-0 font-bold text-sm text-white break-words">{item.title}</span>
                      </div>
                      <span className="text-sm text-slate-400 sm:text-right break-words">{item.description}</span>
                    </div>
                  </CanvaScrollReveal>
                ))}
              </div>
            </div>
          </CanvaScrollReveal>
        )}
      </div>
    </section>
  );
};
