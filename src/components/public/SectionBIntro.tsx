import React from 'react';
import { Trophy, Sparkles, Gift, CarFront, BookOpen, Music2 } from 'lucide-react';
import type { InvitationData } from '../../types/invitation';
import { CanvaScrollReveal, CanvaKineticWords } from './CanvaScrollReveal';

interface Props {
  invitation: InvitationData;
}

export const SectionBIntro: React.FC<Props> = ({ invitation }) => {
  const { milestones, theme } = invitation;
  const isOswald = theme?.fontFamily === 'Oswald';
  const canvaAnim = theme?.canvaAnimationEnabled ?? true;
  const riderLikes = milestones?.giftIdeas || milestones?.lovesTo || milestones?.favoriteToy || 'Cars, books & music toys';
  const interests = `${riderLikes} ${milestones?.favoriteToy || ''} ${milestones?.lovesTo || ''}`.toLowerCase();
  const lovesWheels = /car|race|truck|vehicle|wheel|track|ride/.test(interests);
  const lovesStories = /book|story|read|animal|dinosaur|space/.test(interests);
  const lovesMusic = /music|song|dance|clap|rhythm/.test(interests);

  return (
    <section className="relative py-10 px-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden sm:py-16">
      {/* Decorative Track Mark / Checkered Border */}
      <div className="absolute top-0 left-0 right-0 h-3 bg-checkered-sm opacity-80" />

      <div className="max-w-4xl mx-auto">
        {/* Section Heading with Canva-Style Kinetic Left-to-Right Reveal */}
        <div className="text-center mb-8 sm:mb-12">
          <CanvaScrollReveal direction="left" delay={50} enabled={canvaAnim}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 text-xs font-bold tracking-widest uppercase mb-3 border border-rose-500/30">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>MEET THE CHAMPION</span>
            </div>
          </CanvaScrollReveal>

          <CanvaScrollReveal direction="left" delay={150} enabled={canvaAnim}>
            <h2
              className={`text-3xl sm:text-5xl font-black tracking-tight uppercase text-white ${
                isOswald ? 'font-racing' : 'font-display'
              }`}
            >
              {invitation.celebrantName} Is Turning{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-amber-300 to-sky-400">
                {invitation.turningAge === 1 ? 'ONE' : invitation.turningAge}! 🏆
              </span>
            </h2>
          </CanvaScrollReveal>

          <CanvaScrollReveal direction="left" delay={250} enabled={canvaAnim}>
            <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              {invitation.welcomeMessage ||
                'Get ready to race into a day full of smiles, laughter, and unforgettable memories as we celebrate our little champion\'s very first birthday!'}
            </p>
          </CanvaScrollReveal>
        </div>

        {/* Celebrant Profile & Stats Card with Canva Slide-In */}
        <CanvaScrollReveal direction="left" delay={300} enabled={canvaAnim}>
          <div className="bg-slate-800/80 rounded-3xl p-4 sm:p-8 border border-slate-700 shadow-2xl backdrop-blur-md">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-center">
              {/* Baby Portrait & Trophy Stamp */}
              <div className="md:col-span-5 flex flex-col items-center">
                <div className="relative w-40 h-40 sm:w-56 sm:h-56 rounded-3xl overflow-hidden shadow-2xl border-4 border-rose-500/80 bg-slate-900 group">
                  <img
                    src={invitation.mainPhotoUrl || '/src/assets/images/baby_racer_portrait_1792840991262.jpg'}
                    alt={invitation.celebrantName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-rose-600 text-white text-[11px] font-black px-2.5 py-1 rounded-md shadow-md uppercase">
                    LEADER OF THE PACK
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <h3
                    className={`text-2xl font-black text-white ${
                      isOswald ? 'font-racing' : 'font-display'
                    }`}
                  >
                    {invitation.celebrantName}
                  </h3>
                  <p className="text-xs font-semibold text-sky-400 uppercase tracking-widest mt-0.5">
                    Racer #1 · Age 1 Year Old
                  </p>
                </div>
              </div>

              {/* Birthday Gift Recommendations */}
              <div className="md:col-span-7 space-y-3 sm:space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/20">
                      <Gift className="h-4 w-4" />
                    </span>
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Pit crew gift guide</span>
                      <span className="block text-lg font-black text-white">Birthday Gift Recommendations</span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
                    <Sparkles className="h-3.5 w-3.5" />
                    Pit crew picks
                  </span>
                </div>

                <div className="rounded-2xl border border-rose-400/30 bg-gradient-to-r from-rose-950/70 to-slate-900 px-4 py-3.5">
                  <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-rose-200">What the rider likes</div>
                  <p className="mt-1 text-sm font-bold leading-relaxed text-white">{riderLikes}</p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-700 bg-slate-900/75 p-4 transition-colors hover:border-rose-400/50">
                    <div className="flex items-center gap-2 text-rose-300">
                      <CarFront className="h-4 w-4" />
                      <span className="text-[10px] font-extrabold uppercase tracking-[0.14em]">Trackside play</span>
                    </div>
                    <p className="mt-2 text-sm font-extrabold text-white">
                      {milestones?.giftRecommendationPlay ||
                        (lovesWheels ? 'Wooden cars and a little track ramp' : 'A hands-on toy inspired by a favorite interest')}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">A fun pick for playtime after the victory lap.</p>
                  </div>

                  <div className="rounded-2xl border border-slate-700 bg-slate-900/75 p-4 transition-colors hover:border-sky-300/50">
                    <div className="flex items-center gap-2 text-sky-300">
                      <BookOpen className="h-4 w-4" />
                      <span className="text-[10px] font-extrabold uppercase tracking-[0.14em]">Storytime pit stop</span>
                    </div>
                    <p className="mt-2 text-sm font-extrabold text-white">
                      {milestones?.giftRecommendationStory ||
                        (lovesStories ? 'Board books about favorite themes' : 'A colorful board book for storytime')}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">A sweet way to wind down after a busy race day.</p>
                  </div>

                  <div className="rounded-2xl border border-slate-700 bg-slate-900/75 p-4 transition-colors hover:border-amber-300/50 sm:col-span-2">
                    <div className="flex items-center gap-2 text-amber-300">
                      <Music2 className="h-4 w-4" />
                      <span className="text-[10px] font-extrabold uppercase tracking-[0.14em]">Play it again</span>
                    </div>
                    <p className="mt-2 text-sm font-extrabold text-white">
                      {milestones?.giftRecommendationKeepsake ||
                        (lovesMusic ? 'Music toys for clapping and dancing' : 'A birthday keepsake made for little celebrations')}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">Choose a small surprise that fits the rider’s favorite things.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CanvaScrollReveal>
      </div>
    </section>
  );
};
