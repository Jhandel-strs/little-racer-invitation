import React from 'react';

/**
 * FloatingFestiveElements
 * Adds animated floating balloons, drifting racing flags, twinkling stars,
 * and occasional mini racecars to give that magical Carnival / Grand Prix party atmosphere.
 */
export const FloatingFestiveElements: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden" aria-hidden="true">
      {/* Floating Balloon 1 - Monza Red */}
      <div
        className="absolute left-[8%] animate-balloon-slow"
        style={{ animationDelay: '0s' }}
      >
        <div className="flex flex-col items-center opacity-75">
          <div className="w-9 h-11 sm:w-11 sm:h-14 bg-gradient-to-tr from-rose-600 to-rose-400 rounded-full shadow-lg relative flex items-center justify-center text-white text-[10px] font-black">
            🏁
            <div className="absolute top-1 left-2 w-2 h-3 bg-white/40 rounded-full rotate-45" />
          </div>
          <div className="w-0.5 h-10 bg-white/30" />
        </div>
      </div>

      {/* Floating Balloon 2 - Trophy Gold */}
      <div
        className="absolute left-[82%] animate-balloon-med"
        style={{ animationDelay: '3.5s' }}
      >
        <div className="flex flex-col items-center opacity-80">
          <div className="w-8 h-10 sm:w-10 sm:h-12 bg-gradient-to-tr from-amber-500 to-yellow-300 rounded-full shadow-lg relative flex items-center justify-center text-slate-950 text-[10px] font-black">
            #1
            <div className="absolute top-1 left-2 w-2 h-2.5 bg-white/50 rounded-full rotate-45" />
          </div>
          <div className="w-0.5 h-12 bg-white/30" />
        </div>
      </div>

      {/* Floating Balloon 3 - Monaco Sky Blue */}
      <div
        className="absolute left-[35%] animate-balloon-fast"
        style={{ animationDelay: '7s' }}
      >
        <div className="flex flex-col items-center opacity-70">
          <div className="w-7 h-9 sm:w-9 sm:h-11 bg-gradient-to-tr from-sky-500 to-cyan-300 rounded-full shadow-lg relative flex items-center justify-center text-white text-[9px] font-black">
            🏎️
            <div className="absolute top-1 left-2 w-1.5 h-2 bg-white/40 rounded-full rotate-45" />
          </div>
          <div className="w-0.5 h-8 bg-white/30" />
        </div>
      </div>

      {/* Floating Balloon 4 - Racing Emerald */}
      <div
        className="absolute left-[62%] animate-balloon-slow"
        style={{ animationDelay: '5s' }}
      >
        <div className="flex flex-col items-center opacity-65">
          <div className="w-8 h-10 bg-gradient-to-tr from-emerald-500 to-teal-300 rounded-full shadow-lg relative flex items-center justify-center text-white text-[9px] font-black">
            ★
            <div className="absolute top-1 left-2 w-2 h-2 bg-white/40 rounded-full rotate-45" />
          </div>
          <div className="w-0.5 h-11 bg-white/30" />
        </div>
      </div>

      {/* Twinkling Celebration Stars */}
      <div className="absolute top-[18%] left-[12%] text-amber-300 text-xs sm:text-sm animate-twinkle" style={{ animationDelay: '0.2s' }}>✨</div>
      <div className="absolute top-[32%] right-[14%] text-yellow-200 text-xs sm:text-base animate-twinkle" style={{ animationDelay: '1.4s' }}>⭐</div>
      <div className="absolute top-[55%] left-[6%] text-rose-300 text-xs animate-twinkle" style={{ animationDelay: '0.8s' }}>✨</div>
      <div className="absolute top-[75%] right-[8%] text-amber-300 text-sm animate-twinkle" style={{ animationDelay: '2.1s' }}>✨</div>
      <div className="absolute top-[88%] left-[20%] text-sky-300 text-xs animate-twinkle" style={{ animationDelay: '1.7s' }}>⭐</div>

      {/* Mini Race Car Zooming along bottom */}
      <div className="absolute bottom-14 left-0 animate-mini-car">
        <div className="flex items-center gap-1 opacity-85 filter drop-shadow-[0_2px_8px_rgba(225,29,72,0.8)]">
          <span className="text-xl sm:text-2xl">🏎️💨</span>
        </div>
      </div>
    </div>
  );
};
