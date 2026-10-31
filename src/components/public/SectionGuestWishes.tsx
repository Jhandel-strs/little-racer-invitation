import React, { useState } from 'react';
import { AlertCircle, MessageSquare, Send, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { InvitationData, GuestWish } from '../../types/invitation';
import { CanvaScrollReveal } from './CanvaScrollReveal';

interface Props {
  invitation: InvitationData;
}

const BADGES = ['🏎️', '🏁', '🎂', '🏆', '⭐', '🎈', '❤️', '🎉'];

export const SectionGuestWishes: React.FC<Props> = ({ invitation }) => {
  const [wishes, setWishes] = useState<GuestWish[]>(invitation.wishes || []);
  const [guestName, setGuestName] = useState('');
  const [message, setMessage] = useState('');
  const [badgeEmoji, setBadgeEmoji] = useState('🏁');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const canvaAnim = invitation.theme?.canvaAnimationEnabled ?? true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !message.trim()) return;

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/wishes/${invitation.slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName: guestName.trim(),
          message: message.trim(),
          badgeEmoji,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.wish) {
        setErrorMsg(data.error || 'Your birthday wish could not be sent. Please try again.');
        return;
      }

      setWishes((prev) => [data.wish, ...prev]);
      setGuestName('');
      setMessage('');
      setSuccess(true);
      window.setTimeout(() => setSuccess(false), 4000);
      confetti({
        particleCount: 65,
        spread: 70,
        origin: { y: 0.7 },
      });
    } catch {
      setErrorMsg('The guest book is temporarily unavailable. Please try again in a moment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="relative py-16 px-4 bg-slate-900 border-t border-slate-800 text-white overflow-hidden">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <CanvaScrollReveal direction="left" delay={50} enabled={canvaAnim}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 text-xs font-bold tracking-widest uppercase mb-3 border border-sky-500/20">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>PIT CREW GUEST BOOK</span>
            </div>
          </CanvaScrollReveal>

          <CanvaScrollReveal direction="left" delay={150} enabled={canvaAnim}>
            <h2 className="text-3xl sm:text-4xl font-black font-display tracking-tight uppercase text-white">
              CHEERS & BIRTHDAY WISHES 💬
            </h2>
          </CanvaScrollReveal>

          <CanvaScrollReveal direction="left" delay={250} enabled={canvaAnim}>
            <p className="text-sm text-slate-300 mt-2 max-w-lg mx-auto">
              Leave a warm cheer, memory, or sweet birthday message for our little champion!
            </p>
          </CanvaScrollReveal>
          <div className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-full bg-slate-950 border border-slate-800 text-xs text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span><strong className="text-white tabular-nums">{wishes.length}</strong> {wishes.length === 1 ? 'birthday wish' : 'birthday wishes'} received</span>
          </div>
        </div>

        {/* Wish submission form */}
        <CanvaScrollReveal direction="left" delay={200} enabled={canvaAnim}>
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-950 border border-slate-800 mb-10 shadow-2xl">
            {success && (
              <div role="status" className="mb-4 p-3 rounded-xl bg-emerald-950 border border-emerald-500/50 text-emerald-200 text-xs font-bold text-center">
                🏁 Your cheer was added to the pit board! Thank you!
              </div>
            )}

            {errorMsg && (
              <div role="alert" className="mb-4 p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="e.g. Auntie Laura & Uncle Ben"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Choose a Racing Sticker
                  </label>
                  <div className="flex items-center gap-1.5">
                    {BADGES.map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setBadgeEmoji(b)}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-base transition-transform cursor-pointer ${
                          badgeEmoji === b
                            ? 'bg-rose-600 ring-2 ring-white scale-110'
                            : 'bg-slate-900 hover:bg-slate-800'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Your Cheer for {invitation.celebrantName || 'Leo'}
                </label>
                <textarea
                  rows={2}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write a sweet birthday wish, memory, or roar for our little racer!"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-rose-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                <span>{submitting ? 'Posting...' : 'Post Birthday Cheer'}</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </CanvaScrollReveal>

        {/* Wishes Grid with Canva Stagger */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {wishes.map((w, index) => (
            <CanvaScrollReveal
              key={w.id}
              direction="pop"
              delay={100 + (index % 3) * 100}
              enabled={canvaAnim}
            >
              <div className="h-full p-5 rounded-3xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all hover:scale-[1.02] shadow-lg">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="text-2xl">{w.badgeEmoji || '🏁'}</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(w.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed italic mb-4">
                  "{w.message}"
                </p>
                <div className="text-xs font-bold text-sky-400 border-t border-slate-800/80 pt-2">
                  — {w.guestName}
                </div>
              </div>
            </CanvaScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};
