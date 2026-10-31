import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { InvitationData } from '../../types/invitation';
import { CanvaScrollReveal } from './CanvaScrollReveal';

interface Props {
  invitation: InvitationData;
}

export const SectionFaq: React.FC<Props> = ({ invitation }) => {
  const [openId, setOpenId] = useState<string | null>('faq-1');
  const canvaAnim = invitation.theme?.canvaAnimationEnabled ?? true;

  const faqs = invitation.faqs || [
    {
      id: 'faq-1',
      question: 'Are strollers and diaper bags allowed?',
      answer: 'Yes, absolutely! We have dedicated indoor stroller parking right near Pit Gate 1, plus private nursery changing stations stocked with complimentary wipes and diapers.',
    },
    {
      id: 'faq-2',
      question: 'What is the recommended dress code?',
      answer: 'Pit Crew Casual! Think fun racing reds, baby blues, denim, checkered prints, or comfy party clothes ready for track-side playtime.',
    },
    {
      id: 'faq-3',
      question: 'Can older siblings attend and play?',
      answer: 'Yes! While Leo is celebrating his 1st lap, our venue features both a cushioned toddler raceway and an interactive grand prix game zone for older kids.',
    },
    {
      id: 'faq-4',
      question: 'Where can we find parking at the raceway?',
      answer: 'Free valet and dedicated guest parking is available at the Main Entrance Pit Lane. Follow the checkered race flags to Gate 1.',
    },
  ];

  if (!invitation.visibility?.faq) return null;

  return (
    <section className="relative py-16 px-4 bg-slate-950 text-white border-t border-slate-800 overflow-hidden">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <CanvaScrollReveal direction="left" delay={50} enabled={canvaAnim}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold tracking-widest uppercase mb-3 border border-amber-500/20">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>PIT CREW FREQUENTLY ASKED QUESTIONS</span>
            </div>
          </CanvaScrollReveal>

          <CanvaScrollReveal direction="left" delay={150} enabled={canvaAnim}>
            <h2 className="text-3xl sm:text-4xl font-black font-display tracking-tight uppercase text-white">
              RACEDAY FAQ & GUIDE
            </h2>
          </CanvaScrollReveal>

          <CanvaScrollReveal direction="left" delay={250} enabled={canvaAnim}>
            <p className="text-sm text-slate-400 mt-2">
              Answers to common questions about strollers, dress code, parking, and toddler play.
            </p>
          </CanvaScrollReveal>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openId === faq.id;
            return (
              <CanvaScrollReveal
                key={faq.id}
                direction="left"
                delay={100 + index * 80}
                enabled={canvaAnim}
              >
                <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden transition-all hover:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : faq.id)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-white hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-rose-500 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 pt-3 text-base text-slate-300 border-t border-slate-800/80 leading-relaxed animate-fade-in">
                      {faq.answer}
                    </div>
                  )}
                </div>
              </CanvaScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};
