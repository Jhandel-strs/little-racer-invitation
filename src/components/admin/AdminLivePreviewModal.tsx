import React, { useState } from 'react';
import { X, Smartphone, Tablet, Monitor, ExternalLink } from 'lucide-react';
import type { InvitationData } from '../../types/invitation';
import { PublicInvitationView } from '../public/PublicInvitationView';

interface Props {
  draft: InvitationData;
  published: InvitationData | null;
  onClose: () => void;
  onPublish: () => void;
}

export const AdminLivePreviewModal: React.FC<Props> = ({
  draft,
  published,
  onClose,
  onPublish,
}) => {
  const [device, setDevice] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  const [version, setVersion] = useState<'draft' | 'published'>('draft');

  const activeInvitation =
    version === 'published' && published ? published : draft;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white">
      {/* Control Toolbar */}
      <header className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-2 border-b border-slate-800 bg-slate-900 px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:flex sm:h-16 sm:px-6 sm:py-0">
        <div className="col-span-2 flex min-w-0 items-center justify-between gap-2 sm:col-span-1 sm:justify-start sm:gap-4">
          <span className="hidden font-display font-black text-sm uppercase tracking-wider text-white sm:inline">
            LIVE INVITATION PREVIEW
          </span>

          {/* Draft vs Published Switcher */}
          <div className="flex min-w-0 items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 p-1 text-[11px] sm:text-xs">
            <button
              onClick={() => setVersion('draft')}
              className={`min-h-10 px-2 sm:px-3 py-1 rounded font-bold transition-colors cursor-pointer ${
                version === 'draft' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Draft View
            </button>
            <button
              onClick={() => setVersion('published')}
              disabled={!published}
              className={`min-h-10 px-2 sm:px-3 py-1 rounded font-bold transition-colors cursor-pointer disabled:opacity-40 ${
                version === 'published' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Published Live
            </button>
          </div>
        </div>

        {/* Device Dimension Buttons */}
        <div className="col-span-2 flex items-center justify-center gap-1 rounded-lg border border-slate-800 bg-slate-950 p-1 sm:col-span-1 sm:justify-start">
          <button
            onClick={() => setDevice('mobile')}
            className={`flex min-h-10 items-center gap-1.5 rounded px-2 sm:px-2.5 transition-colors text-xs font-semibold cursor-pointer ${
              device === 'mobile' ? 'bg-slate-800 text-rose-400' : 'text-slate-400 hover:text-white'
            }`}
            title="Mobile (375px)"
          >
            <Smartphone className="w-4 h-4" />
            <span className="hidden sm:inline">Mobile</span>
          </button>
          <button
            onClick={() => setDevice('tablet')}
            className={`flex min-h-10 items-center gap-1.5 rounded px-2 sm:px-2.5 transition-colors text-xs font-semibold cursor-pointer ${
              device === 'tablet' ? 'bg-slate-800 text-sky-400' : 'text-slate-400 hover:text-white'
            }`}
            title="Tablet (768px)"
          >
            <Tablet className="w-4 h-4" />
            <span className="hidden sm:inline">Tablet</span>
          </button>
          <button
            onClick={() => setDevice('desktop')}
            className={`flex min-h-10 items-center gap-1.5 rounded px-2 sm:px-2.5 transition-colors text-xs font-semibold cursor-pointer ${
              device === 'desktop' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-white'
            }`}
            title="Desktop (Full)"
          >
            <Monitor className="w-4 h-4" />
            <span className="hidden sm:inline">Desktop</span>
          </button>
        </div>

        {/* Right side actions */}
        <div className="col-span-2 flex items-center justify-end gap-2 sm:col-span-1 sm:ml-auto sm:gap-3">
          {version === 'draft' && (
            <button
              onClick={onPublish}
              className="min-h-11 px-3 sm:px-4 rounded-lg text-xs font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
            >
              <span className="sm:hidden">Publish</span>
              <span className="hidden sm:inline">Publish Now</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Close Preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Frame Viewport Container */}
      <div className="flex-1 overflow-auto bg-slate-950/90 p-2 sm:p-4 flex justify-center items-start">
        <div
          className={`transition-all duration-300 rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-800 bg-slate-950 ${
            device === 'mobile'
              ? 'my-2 w-[375px] max-w-full min-h-[720px] ring-8 ring-slate-900 sm:my-4'
              : device === 'tablet'
              ? 'w-[768px] min-h-[900px] my-4'
              : 'w-full max-w-6xl'
          }`}
        >
          <PublicInvitationView
            invitation={activeInvitation}
            onOpenAdmin={onClose}
            isPreview={true}
          />
        </div>
      </div>
    </div>
  );
};
