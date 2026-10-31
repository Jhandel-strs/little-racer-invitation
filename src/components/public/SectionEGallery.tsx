import React, { useState } from 'react';
import { Camera, X, ZoomIn } from 'lucide-react';
import type { InvitationData, GalleryItem } from '../../types/invitation';
import { CanvaScrollReveal } from './CanvaScrollReveal';

interface Props {
  invitation: InvitationData;
}

export const SectionEGallery: React.FC<Props> = ({ invitation }) => {
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryItem | null>(null);
  const canvaAnim = invitation.theme?.canvaAnimationEnabled ?? true;

  const galleryItems = invitation.gallery || [];
  if (galleryItems.length === 0) return null;

  return (
    <section className="relative py-16 px-4 bg-slate-900 border-t border-slate-800 text-white overflow-hidden">
      <div className="max-w-5xl mx-auto">
        {/* Section Heading with Canva Scroll Reveal */}
        <div className="text-center mb-12">
          <CanvaScrollReveal direction="left" delay={50} enabled={canvaAnim}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 text-xs font-bold tracking-widest uppercase mb-3 border border-sky-500/20">
              <Camera className="w-3.5 h-3.5" />
              <span>YEAR ONE HIGHLIGHTS</span>
            </div>
          </CanvaScrollReveal>

          <CanvaScrollReveal direction="left" delay={150} enabled={canvaAnim}>
            <h2 className="text-3xl sm:text-4xl font-black font-display tracking-tight uppercase text-white">
              CHAMPION'S PHOTO REEL 📸
            </h2>
          </CanvaScrollReveal>

          <CanvaScrollReveal direction="left" delay={250} enabled={canvaAnim}>
            <p className="text-sm text-slate-400 mt-2 max-w-xl mx-auto">
              A look back at 12 months of high-speed smiles, giggles, and growing up!
            </p>
          </CanvaScrollReveal>
        </div>

        {/* Gallery Cards Grid with Staggered Scroll Reveal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {galleryItems.map((item, index) => (
            <CanvaScrollReveal
              key={item.id || index}
              direction="pop"
              delay={100 + (index % 3) * 120}
              enabled={canvaAnim}
            >
              <div
                onClick={() => setSelectedPhoto(item)}
                className="group relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 hover:border-rose-500/80 transition-all duration-300 shadow-xl cursor-pointer aspect-4/3 flex flex-col justify-end hover:scale-[1.03]"
              >
                <img
                  src={item.url}
                  alt={item.caption || 'Celebrant photo'}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />

                {/* Age pill & caption */}
                <div className="relative z-10 p-4">
                  {item.ageMonth && (
                    <span className="inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-rose-600 text-white mb-1 shadow-sm">
                      {item.ageMonth}
                    </span>
                  )}
                  <p className="text-xs sm:text-sm font-semibold text-white drop-shadow truncate">
                    {item.caption || 'Special memory'}
                  </p>
                </div>

                {/* Hover Zoom Icon */}
                <div className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md">
                  <ZoomIn className="w-4 h-4" />
                </div>
              </div>
            </CanvaScrollReveal>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain bg-black/90 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md animate-fade-in sm:items-center sm:p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative my-auto max-h-[calc(100dvh-1.5rem)] max-w-3xl w-full bg-slate-900 rounded-3xl overflow-y-auto border border-slate-700 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-3 right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/70 hover:bg-rose-600 text-white transition-colors cursor-pointer sm:top-4 sm:right-4"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

              <div className="max-h-[62dvh] flex items-center justify-center bg-black sm:max-h-[75vh]">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.caption}
                referrerPolicy="no-referrer"
                className="max-h-[62dvh] w-auto max-w-full object-contain sm:max-h-[75vh]"
              />
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-800 bg-slate-900 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="min-w-0">
                {selectedPhoto.ageMonth && (
                  <div className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                    {selectedPhoto.ageMonth}
                  </div>
                )}
                <div className="break-words text-base font-semibold text-white mt-0.5">
                  {selectedPhoto.caption || 'Pit Stop Memory'}
                </div>
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
