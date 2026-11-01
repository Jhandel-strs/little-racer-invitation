import React, { useState } from 'react';
import { Calendar, Download, ExternalLink, Check } from 'lucide-react';
import type { InvitationData } from '../../types/invitation';
import { CanvaScrollReveal } from './CanvaScrollReveal';
import { parseStandardTime, toTwentyFourHourTime } from '../../utils/time';

interface Props {
  invitation: InvitationData;
}

export const SectionCalendarAdd: React.FC<Props> = ({ invitation }) => {
  const [downloaded, setDownloaded] = useState(false);
  const canvaAnim = invitation.theme?.canvaAnimationEnabled ?? true;

  // Construct Google Calendar Link
  const buildGoogleCalendarUrl = () => {
    const title = `${invitation.birthdayTitle} - ${invitation.celebrantName}'s 1st Birthday`;
    const details = `${invitation.welcomeMessage}\n\nDress Code: ${invitation.dressCode}\nVenue: ${invitation.venueName}`;
    const location = `${invitation.venueName}, ${invitation.venueAddress}`;

    const dateStr = invitation.eventDate.replace(/-/g, '');
    const startTimeClean = toTwentyFourHourTime(parseStandardTime(invitation.startTime || '2:00 PM') || { hour: 2, minute: 0, period: 'PM' }).replace(':', '');
    const endTimeClean = toTwentyFourHourTime(parseStandardTime(invitation.endTime || '6:00 PM') || { hour: 6, minute: 0, period: 'PM' }).replace(':', '');

    const dates = `${dateStr}T${startTimeClean}00/${dateStr}T${endTimeClean}00`;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      title
    )}&dates=${dates}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(
      location
    )}`;
  };

  const handleDownloadIcs = () => {
    window.location.href = `/api/calendar/${invitation.slug}/invite.ics`;
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  return (
    <section id="calendar-section" className="relative py-12 px-4 bg-slate-900 border-t border-slate-800 text-white overflow-hidden">
      <div className="max-w-3xl mx-auto text-center">
        <CanvaScrollReveal direction="left" delay={50} enabled={canvaAnim}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold tracking-widest uppercase mb-3 border border-amber-500/20">
            <Calendar className="w-3.5 h-3.5" />
            <span>SAVE THE DATE TO YOUR PHONE</span>
          </div>
        </CanvaScrollReveal>

        <CanvaScrollReveal direction="left" delay={150} enabled={canvaAnim}>
          <h3 className="text-2xl sm:text-3xl font-black font-display uppercase tracking-tight text-white">
            DON'T MISS THE GREEN FLAG! 🏁
          </h3>
        </CanvaScrollReveal>

        <CanvaScrollReveal direction="left" delay={250} enabled={canvaAnim}>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-lg mx-auto">
            Add {invitation.celebrantName || 'Leo'}'s first birthday celebration directly to your digital calendar with one tap.
          </p>
        </CanvaScrollReveal>

        {/* 2 Big Tap Buttons with Pop Reveal */}
        <CanvaScrollReveal direction="pop" delay={300} enabled={canvaAnim}>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={buildGoogleCalendarUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition-all hover:scale-105 cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-rose-600" />
              <span>Add to Google Calendar</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            </a>

            <button
              onClick={handleDownloadIcs}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-slate-700 shadow-xl transition-all hover:scale-105 cursor-pointer"
            >
              {downloaded ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Downloaded .ics!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-sky-400" />
                  <span>Apple / Outlook iCal</span>
                </>
              )}
            </button>
          </div>
        </CanvaScrollReveal>
      </div>
    </section>
  );
};
