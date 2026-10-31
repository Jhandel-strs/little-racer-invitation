import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Flag, CheckCircle2, XCircle, AlertCircle, Edit3 } from 'lucide-react';
import type { InvitationData } from '../../types/invitation';
import { submitRsvp, updateGuestRsvp } from '../../utils/api';
import { CanvaScrollReveal } from './CanvaScrollReveal';

interface Props {
  invitation: InvitationData;
}

export const SectionGRsvp: React.FC<Props> = ({ invitation }) => {
  const rsvpConfig = invitation.rsvpSettings || {
    enabled: true,
    deadline: '2026-11-01',
    maxAttendeesPerRsvp: 6,
    allowAdditionalGuests: true,
    collectPhone: true,
    collectEmail: true,
    collectDietaryNotes: true,
    collectMessage: true,
    customConfirmationMessage: 'Vroom vroom! Your pit pass is confirmed!',
  };

  const [guestName, setGuestName] = useState('');
  const attending = true;
  const [attendeeCount, setAttendeeCount] = useState<number>(1);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedData, setConfirmedData] = useState<{
    id: string;
    guestName: string;
    attending: boolean;
    attendeeCount: number;
    editToken: string;
    message: string;
  } | null>(null);

  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const canvaAnim = invitation.theme?.canvaAnimationEnabled ?? true;

  // Check if guest previously submitted in this browser session
  useEffect(() => {
    const storageKey = `little_racer_rsvp_${invitation.slug}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.id && parsed.editToken) {
          setConfirmedData(parsed);
          setGuestName(parsed.guestName);
          setAttendeeCount(parsed.attendeeCount || 1);
        }
      } catch {}
    }
  }, [invitation.slug]);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 85,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#E11D48', '#38BDF8', '#FBBF24', '#FFFFFF', '#0F172A'],
      });
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!guestName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    setSubmitting(true);

    try {
      if (isEditingExisting && confirmedData?.id && confirmedData?.editToken) {
        // Updating existing RSVP
        const res = await updateGuestRsvp(invitation.slug, confirmedData.id, {
          editToken: confirmedData.editToken,
          attending: true,
          attendeeCount,
        });

        if (res.success && res.rsvp) {
          const updated = {
            id: res.rsvp.id,
            guestName: res.rsvp.guestName,
            attending: res.rsvp.attending,
            attendeeCount: res.rsvp.attendeeCount,
            editToken: res.rsvp.editToken,
            message: 'Your pit pass has been updated successfully!',
          };
          setConfirmedData(updated);
          localStorage.setItem(`little_racer_rsvp_${invitation.slug}`, JSON.stringify(updated));
          setIsEditingExisting(false);
          if (attending) {
            triggerConfetti();
          }
        } else {
          setErrorMsg(res.error || 'Failed to update your response.');
        }
      } else {
        // New submission
        const res = await submitRsvp(invitation.slug, {
          guestName: guestName.trim(),
          attending: true,
          attendeeCount,
        });

        if (res.success) {
          const conf = {
            id: res.rsvp?.id || `sheet-${Date.now()}`,
            guestName: res.rsvp?.guestName || guestName.trim(),
            attending: res.rsvp?.attending ?? true,
            attendeeCount: res.rsvp?.attendeeCount ?? attendeeCount,
            editToken: res.rsvp?.editToken || '',
            message: res.message || rsvpConfig.customConfirmationMessage,
          };
          setConfirmedData(conf);
          localStorage.setItem(`little_racer_rsvp_${invitation.slug}`, JSON.stringify(conf));
          if (attending) {
            triggerConfetti();
          }
        } else {
          setErrorMsg(res.message || res.error || 'Failed to submit RSVP.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error submitting RSVP. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = () => {
    setIsEditingExisting(true);
  };

  return (
    <section id="rsvp-section" className="relative py-16 px-4 bg-slate-900 border-t border-slate-800 text-white overflow-hidden">
      {/* Decorative track border */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-checkered-sm opacity-60" />

      <div className="max-w-2xl mx-auto">
        {/* Header with Canva Scroll Reveal */}
        <div className="text-center mb-10">
          <CanvaScrollReveal direction="left" delay={50} enabled={canvaAnim}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-xs font-bold tracking-widest uppercase mb-3 border border-rose-500/20">
              <Flag className="w-3.5 h-3.5" />
              <span>OFFICIAL PIT PASS</span>
            </div>
          </CanvaScrollReveal>

          <CanvaScrollReveal direction="left" delay={150} enabled={canvaAnim}>
            <h2 className="text-3xl sm:text-4xl font-black font-display tracking-tight uppercase text-white">
              JOIN THE RACE TEAM (RSVP) 🏁
            </h2>
          </CanvaScrollReveal>

          <CanvaScrollReveal direction="left" delay={250} enabled={canvaAnim}>
            <p className="text-sm text-slate-300 mt-2">
              Add your name and total number of guests by{' '}
              <strong className="text-rose-400">{rsvpConfig.deadline || 'Nov 1, 2026'}</strong>.
            </p>
          </CanvaScrollReveal>
        </div>

        {/* Confirmation Screen View */}
        {confirmedData && !isEditingExisting ? (
          <CanvaScrollReveal direction="pop" delay={150} enabled={canvaAnim}>
            <div className="p-8 rounded-3xl bg-slate-950 border-2 border-rose-500/60 shadow-[0_20px_50px_rgba(225,29,72,0.25)] text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-2 bg-checkered-sm" />

              <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mx-auto mb-4">
                {confirmedData.attending ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                ) : (
                  <XCircle className="w-8 h-8 text-slate-400" />
                )}
              </div>

              <span className="text-xs font-extrabold uppercase tracking-widest text-sky-400">
                RESPONSE CONFIRMED 🏁
              </span>
              <h3 className="text-2xl font-black font-display text-white mt-1">
                {confirmedData.attending ? 'See You at the Starting Line!' : 'Thank You for Letting Us Know!'}
              </h3>
              <p className="text-sm text-slate-300 mt-3 max-w-md mx-auto leading-relaxed">
                {confirmedData.message}
              </p>

              {/* Pit Pass Summary Badge */}
              <div className="my-6 p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left text-xs space-y-2 max-w-md mx-auto">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Racer Guest:</span>
                  <span className="font-bold text-white">{confirmedData.guestName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Attendance:</span>
                  <span
                    className={`font-bold ${
                      confirmedData.attending ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    {confirmedData.attending ? 'YES, ATTENDING 🏎️' : 'CANNOT MAKE IT'}
                  </span>
                </div>
                {confirmedData.attending && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pit Crew Count:</span>
                    <span className="font-bold text-amber-400 tabular-nums">
                      {confirmedData.attendeeCount} Attendee{confirmedData.attendeeCount > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-3">
                {confirmedData.editToken ? (
                  <button
                    onClick={handleStartEdit}
                    className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-2 border border-slate-700 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Update My Response</span>
                  </button>
                ) : (
                  <p className="text-xs text-slate-400">Need to change your RSVP? Please contact the host.</p>
                )}
              </div>
            </div>
          </CanvaScrollReveal>
        ) : (
          /* Active RSVP Form with Canva Scroll Reveal */
          <CanvaScrollReveal direction="left" delay={200} enabled={canvaAnim}>
            <form
              onSubmit={handleSubmit}
              className="p-6 sm:p-8 rounded-3xl bg-slate-950/90 border border-slate-800 shadow-2xl space-y-6"
            >
              {isEditingExisting && (
                <div className="p-3 rounded-xl bg-sky-950/60 border border-sky-800/80 text-sky-200 text-xs flex items-center justify-between">
                  <span>Updating existing RSVP for {confirmedData?.guestName}</span>
                  <button
                    type="button"
                    onClick={() => setIsEditingExisting(false)}
                    className="text-white underline font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {errorMsg && (
                <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <div>{errorMsg}</div>
                </div>
              )}

              {/* Guest Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  YOUR FULL NAME <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g., Uncle Mark & Auntie Sarah"
                  className="w-full px-4 py-3.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-white placeholder-slate-500 text-sm outline-none transition-colors"
                />
              </div>

              {/* Party size */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <label htmlFor="rsvp-party-size" className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                      HOW MANY PEOPLE ARE COMING?
                    </label>
                    <p className="text-[11px] text-slate-400 mt-1">Include yourself in the total.</p>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setAttendeeCount((prev) => Math.max(1, prev - 1))}
                      disabled={attendeeCount <= 1}
                      aria-label="Remove one person"
                      className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-black text-lg flex items-center justify-center transition-colors border border-slate-700"
                    >
                      -
                    </button>
                    <input
                      id="rsvp-party-size"
                      type="number"
                      min="1"
                      max={rsvpConfig.maxAttendeesPerRsvp || 6}
                      value={attendeeCount}
                      onChange={(e) => {
                        const value = Number.parseInt(e.target.value, 10);
                        const maximum = rsvpConfig.maxAttendeesPerRsvp || 6;
                        setAttendeeCount(Number.isFinite(value) ? Math.min(maximum, Math.max(1, value)) : 1);
                      }}
                      className="w-16 text-center text-xl font-black text-rose-400 tabular-nums font-display bg-transparent outline-none"
                      aria-label="Number of people attending"
                    />
                    <button
                      type="button"
                      onClick={() => setAttendeeCount((prev) => Math.min(rsvpConfig.maxAttendeesPerRsvp || 6, prev + 1))}
                      disabled={attendeeCount >= (rsvpConfig.maxAttendeesPerRsvp || 6)}
                      aria-label="Add one person"
                      className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-black text-lg flex items-center justify-center transition-colors border border-slate-700"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 px-6 rounded-2xl font-black text-sm sm:text-base uppercase tracking-wider text-white bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 hover:from-rose-500 hover:to-rose-600 shadow-xl shadow-rose-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <span>SUBMITTING TO RACE CONTROL...</span>
                ) : isEditingExisting ? (
                  <span>UPDATE PIT PASS</span>
                ) : (
                  <>
                    <span>CONFIRM MY RSVP</span>
                    <Flag className="w-4 h-4 fill-white" />
                  </>
                )}
              </button>
            </form>
          </CanvaScrollReveal>
        )}
      </div>
    </section>
  );
};
