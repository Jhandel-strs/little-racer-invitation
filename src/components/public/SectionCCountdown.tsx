import React, { useState, useEffect } from 'react';
import { Timer, Gauge, Flag, Sparkles } from 'lucide-react';
import type { InvitationData } from '../../types/invitation';
import { CanvaScrollReveal } from './CanvaScrollReveal';
import { formatStandardTime, toTwentyFourHourTime, parseStandardTime } from '../../utils/time';

interface Props {
  invitation: InvitationData;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
  isToday: boolean;
  isValid: boolean;
}

export const SectionCCountdown: React.FC<Props> = ({ invitation }) => {
  const [timeLeft, setTimeLeft] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPast: false,
    isToday: false,
    isValid: true,
  });

  const canvaAnim = invitation.theme?.canvaAnimationEnabled ?? true;

  useEffect(() => {
    const calculateTime = () => {
      try {
        const dateStr = invitation.eventDate;
        const timeParts = parseStandardTime(invitation.startTime || '2:00 PM');
        if (!timeParts) {
          setTimeLeft((prev) => ({ ...prev, isValid: false }));
          return;
        }
        const timeStr = toTwentyFourHourTime(timeParts);

        if (!dateStr) {
          setTimeLeft((prev) => ({ ...prev, isValid: false }));
          return;
        }

        // Construct target ISO date
        const targetDate = new Date(`${dateStr}T${timeStr}:00`);
        if (isNaN(targetDate.getTime())) {
          setTimeLeft((prev) => ({ ...prev, isValid: false }));
          return;
        }

        const now = new Date();
        const diffMs = targetDate.getTime() - now.getTime();

        const isSameDay =
          targetDate.getFullYear() === now.getFullYear() &&
          targetDate.getMonth() === now.getMonth() &&
          targetDate.getDate() === now.getDate();

        if (diffMs <= 0) {
          setTimeLeft({
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
            isPast: !isSameDay,
            isToday: isSameDay,
            isValid: true,
          });
          return;
        }

        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

        setTimeLeft({
          days,
          hours,
          minutes,
          seconds,
          isPast: false,
          isToday: isSameDay,
          isValid: true,
        });
      } catch {
        setTimeLeft((prev) => ({ ...prev, isValid: false }));
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [invitation.eventDate, invitation.startTime, invitation.timezone]);

  // Formatted date string for label
  const formattedEventDate = (() => {
    try {
      if (!invitation.eventDate) return 'Date TBD';
      const d = new Date(`${invitation.eventDate}T${invitation.startTime || '12:00'}:00`);
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
    <section className="relative py-14 px-4 bg-slate-900 border-y border-slate-800 text-white overflow-hidden">
      {/* Background road lines */}
      <div className="absolute inset-0 opacity-10 road-dashes pointer-events-none" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        {/* Header Indicator */}
        <CanvaScrollReveal direction="left" delay={50} enabled={canvaAnim}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 text-xs font-bold tracking-widest uppercase mb-3 border border-sky-500/20">
            <Gauge className="w-3.5 h-3.5 text-sky-400" />
            <span>RACE CLOCK & TELEMETRY</span>
          </div>
        </CanvaScrollReveal>

        <CanvaScrollReveal direction="left" delay={150} enabled={canvaAnim}>
          <h3 className="text-2xl sm:text-4xl font-black font-display tracking-tight uppercase text-white">
            COUNTDOWN TO RACE DAY ⏱️
          </h3>
        </CanvaScrollReveal>

        <CanvaScrollReveal direction="left" delay={250} enabled={canvaAnim}>
          <p className="text-sm text-slate-400 mt-1">
            Target Launch: <span className="text-rose-400 font-bold">{formattedEventDate}</span> at{' '}
            <span className="text-slate-200 font-semibold">{formatStandardTime(invitation.startTime || '14:00', invitation.timeFormat)}</span>
          </p>
        </CanvaScrollReveal>

        {/* Dashboard Display Case with Canva Slide */}
        <CanvaScrollReveal direction="left" delay={350} enabled={canvaAnim}>
          <div className="mt-8 p-4 sm:p-8 rounded-3xl bg-slate-950/90 border-2 border-slate-800 shadow-[0_15px_40px_rgba(0,0,0,0.6)] backdrop-blur-md max-w-2xl mx-auto">
            {!timeLeft.isValid ? (
              <div className="py-6 text-amber-400 font-medium">
                Event date will be announced soon! Stay tuned at the pit stop.
              </div>
            ) : timeLeft.isToday ? (
              <div className="py-6 flex flex-col items-center gap-3">
                <div className="p-4 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
                  <Flag className="w-8 h-8" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400 uppercase font-display">
                  TODAY IS RACE DAY! 🏁
                </div>
                <p className="text-sm text-slate-300 max-w-md">
                  The green flag has dropped! Head to the track and join the celebration!
                </p>
              </div>
            ) : timeLeft.isPast ? (
              <div className="py-6 flex flex-col items-center gap-3">
                <div className="p-4 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-amber-400 uppercase font-display">
                  VICTORY LAP COMPLETED! 🏆
                </div>
                <p className="text-sm text-slate-300">
                  Thank you to all our wonderful family and friends who cheered on our champion!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {/* Days */}
                <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 flex flex-col items-center transition-transform hover:scale-105">
                  <span className="text-2xl sm:text-5xl font-black text-rose-500 font-display tabular-nums tracking-tight">
                    {String(timeLeft.days).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">
                    DAYS
                  </span>
                </div>

                {/* Hours */}
                <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 flex flex-col items-center transition-transform hover:scale-105">
                  <span className="text-2xl sm:text-5xl font-black text-sky-400 font-display tabular-nums tracking-tight">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">
                    HOURS
                  </span>
                </div>

                {/* Minutes */}
                <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 flex flex-col items-center transition-transform hover:scale-105">
                  <span className="text-2xl sm:text-5xl font-black text-white font-display tabular-nums tracking-tight">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">
                    MINUTES
                  </span>
                </div>

                {/* Seconds */}
                <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 flex flex-col items-center transition-transform hover:scale-105">
                  <span className="text-2xl sm:text-5xl font-black text-amber-400 font-display tabular-nums tracking-tight">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">
                    SECONDS
                  </span>
                </div>
              </div>
            )}

            {/* Pit Crew Reminder Badge */}
            <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-center gap-2 text-xs text-slate-400">
              <Timer className="w-3.5 h-3.5 text-rose-500" />
              <span>RSVP Deadline: <strong className="text-slate-200">{invitation.rsvpSettings.deadline || 'Nov 1, 2026'}</strong></span>
            </div>
          </div>
        </CanvaScrollReveal>
      </div>
    </section>
  );
};
