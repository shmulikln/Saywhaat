
import React from 'react';
import { useTranslations } from '../contexts/TranslationsContext';
import { TURN_DURATION_SECONDS } from '../constants';

interface TimerDisplayProps {
  timeLeft: number;
  duration?: number;
  playerName?: string;
  score?: number;
  className?: string;
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({
  timeLeft,
  duration = TURN_DURATION_SECONDS,
  className = '',
}) => {
  const { t } = useTranslations();
  const percentage = Math.max(0, Math.min(100, (timeLeft / duration) * 100));

  let barBg = 'bg-gradient-to-r from-emerald-500 to-green-400 shadow-[0_0_12px_rgba(52,211,153,0.6)]';
  let badgeColor = 'text-white';
  
  if (timeLeft <= 10) {
    barBg = 'bg-gradient-to-r from-red-600 via-rose-500 to-red-600 animate-pulse shadow-[0_0_16px_rgba(239,68,68,0.9)]';
    badgeColor = 'text-red-400 animate-pulse';
  } else if (timeLeft <= duration / 2) {
    barBg = 'bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_12px_rgba(251,191,36,0.6)]';
  }

  return (
    <div className={`w-full flex flex-col justify-center ${className}`}>
      {/* Top Row: "Time Left" on the left, Numeric countdown on the right */}
      <div className="flex items-center justify-between w-full mb-2.5">
        <span className="font-extrabold text-base sm:text-lg uppercase tracking-wider text-slate-200 drop-shadow-sm flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-yellow-400/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t('timeRemaining')}
        </span>

        {/* Numeric countdown */}
        <div className="flex items-baseline gap-1 font-black text-2xl sm:text-3xl tracking-tight tabular-nums flex-shrink-0">
          <span className={badgeColor} style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
            {timeLeft}
          </span>
          <span className="text-xs uppercase font-bold text-white/60">{t('secondsSuffix')}</span>
        </div>
      </div>

      {/* Linear progress bar */}
      <div className="w-full bg-black/40 rounded-full h-3 sm:h-3.5 p-0.5 overflow-hidden border border-white/15 shadow-inner">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-linear ${barBg}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default React.memo(TimerDisplay);

