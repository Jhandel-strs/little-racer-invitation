import React, { useState } from 'react';
import { MapPin, Navigation, Copy, Check, ExternalLink } from 'lucide-react';
import type { InvitationData } from '../../types/invitation';
import { CanvaScrollReveal } from './CanvaScrollReveal';

interface Props {
  invitation: InvitationData;
}

export const SectionFMap: React.FC<Props> = ({ invitation }) => {
  const [copied, setCopied] = useState(false);
  const canvaAnim = invitation.theme?.canvaAnimationEnabled ?? true;

  const venueName = invitation.venueName || 'Grand Prix Raceway';
  const venueAddress = invitation.venueAddress || '450 Speedway Boulevard, Los Angeles, CA 90028';

  const directionsUrl =
    invitation.googleMapsUrl ||
    `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      `${venueName}, ${venueAddress}`
    )}`;

  // Google Maps standard search embed URL
  const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
    `${venueName}, ${venueAddress}`
  )}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(`${venueName}, ${venueAddress}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <section id="map-section" className="relative py-16 px-4 bg-slate-950 text-white overflow-hidden">
      <div className="max-w-4xl mx-auto">
        {/* Section Heading with Canva Reveal */}
        <div className="text-center mb-10">
          <CanvaScrollReveal direction="left" delay={50} enabled={canvaAnim}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold tracking-widest uppercase mb-3 border border-emerald-500/20">
              <MapPin className="w-3.5 h-3.5" />
              <span>CIRCUIT LOCATION</span>
            </div>
          </CanvaScrollReveal>

          <CanvaScrollReveal direction="left" delay={150} enabled={canvaAnim}>
            <h2 className="text-3xl sm:text-4xl font-black font-display tracking-tight uppercase text-white">
              FIND THE RACETRACK 🗺️
            </h2>
          </CanvaScrollReveal>

          <CanvaScrollReveal direction="left" delay={250} enabled={canvaAnim}>
            <p className="text-sm text-slate-400 mt-2 max-w-xl mx-auto">
              Set your navigation to the starting line. Ample pit crew parking on site!
            </p>
          </CanvaScrollReveal>
        </div>

        {/* Map Container & Address Card */}
        <CanvaScrollReveal direction="left" delay={200} enabled={canvaAnim}>
          <div className="rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
            {/* Map Embed Frame */}
            <div className="relative w-full h-72 sm:h-96 bg-slate-800">
              <iframe
                title={`Map location for ${venueName}`}
                src={embedUrl}
                className="w-full h-full border-0 filter grayscale-20 contrast-110"
                loading="lazy"
                allowFullScreen
              />
              {/* Visual badge top right of map */}
              <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-bold text-white shadow-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Speedway Gate 1</span>
              </div>
            </div>

            {/* Details & Actions Footer */}
            <div className="p-6 sm:p-8 bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-t border-slate-800">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-rose-500">
                  OFFICIAL VENUE
                </div>
                <h3 className="text-xl font-black text-white mt-0.5">{venueName}</h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-md">{venueAddress}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleCopyAddress}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-white transition-colors flex items-center gap-2 border border-slate-700 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-400" />
                      <span>Copy Address</span>
                    </>
                  )}
                </button>

                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white transition-colors flex items-center gap-2 shadow-lg hover:shadow-rose-600/30 cursor-pointer"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Get Directions</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>
              </div>
            </div>
          </div>
        </CanvaScrollReveal>
      </div>
    </section>
  );
};
