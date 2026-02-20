
import React from 'react';
import { useTranslations } from '../contexts/TranslationsContext';
import { TURN_DURATION_SECONDS } from '../constants';

interface TimerDisplayProps {
  timeLeft: number;
  duration?: number;
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({ timeLeft, duration = TURN_DURATION_SECONDS }) => {
  const { t } = useTranslations();
  const percentage = (timeLeft / duration) * 100;

  let bgColor = 'bg-green-500';
  if (timeLeft <= 10) bgColor = 'bg-red-500 animate-pulse';
  else if (timeLeft <= (duration / 2)) bgColor = 'bg-yellow-500';

  return (
    <div className="flex flex-col items-center">
      <div className="text-sm mb-1 text-slate-300">{t('timeRemaining')}</div>
      <div className="w-24 h-24 rounded-full border-4 border-white/20 flex items-center justify-center relative overflow-hidden bg-black/20">
        <div 
          className={`absolute bottom-0 left-0 right-0 ${bgColor} transition-all duration-500 ease-linear`}
          style={{ height: `${percentage}%`}}
        ></div>
        <span 
          className="text-4xl font-bold z-10 text-white"
          style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
        >
          {timeLeft}
        </span>
         <span className="absolute bottom-2 text-xs z-10 text-slate-300">{t('secondsSuffix')}</span>
      </div>
    </div>
  );
};

export default React.memo(TimerDisplay);
