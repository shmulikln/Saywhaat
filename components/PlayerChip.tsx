
import React from 'react';
import { PlayerWithId } from '../types';
import { useTranslations } from '../contexts/TranslationsContext';

interface PlayerChipProps {
  player: PlayerWithId;
  isCurrent: boolean;
  isHost: boolean;
  isLeading?: boolean;
  compact?: boolean;
}

const PlayerChip: React.FC<PlayerChipProps> = ({ player, isCurrent, isHost, isLeading = false, compact = false }) => {
  const { t } = useTranslations();
  
  const displayName = `${player.name}${player.chaosNickname ? ` ${player.chaosNickname}` : ''}`;

  const baseClasses = "flex items-center justify-between p-3 rounded-lg shadow-md transition-all duration-300";
  
  const compactBase = "flex items-center justify-between rounded-lg shadow-sm transition-all duration-300 text-xs px-2 py-1 w-auto";
  const compactCurrent = "bg-purple-500/80 text-white";
  const compactDefault = "bg-white/10 text-slate-200";
  
  const fullBase = "min-h-[60px] p-3";
  const fullCurrent = "bg-purple-600/80 text-white ring-2 ring-white/80";
  const fullDefault = "bg-white/10 backdrop-blur-sm text-white border border-white/5";
  const leadingClasses = isLeading ? "ring-2 ring-yellow-400/80" : "ring-1 ring-white/20";


  if (compact) {
    return (
       <div className={`${compactBase} ${isCurrent ? compactCurrent : compactDefault}`}>
        <span className="font-semibold truncate max-w-[150px] ltr:text-left rtl:text-right">
          {isLeading && '⭐ '}{displayName}
        </span>
        <span className={`ms-2 ${isCurrent ? 'bg-yellow-300 text-purple-700' : 'bg-yellow-400 text-gray-800'} text-xs font-bold px-2 py-0.5 rounded-full`}>{player.score}</span>
      </div>
    );
  }

  return (
    <div className={`${baseClasses} ${fullBase} ${isCurrent ? fullCurrent : fullDefault} ${leadingClasses}`}>
      <div className="flex items-center overflow-hidden">
        {isLeading && <span className="text-xl ltr:mr-2 rtl:ml-2" role="img" aria-label={t('leadingPlayer')}>⭐</span>}
        <h4 className="font-bold text-lg truncate" title={displayName}>
          {displayName}
          {isHost && <span className="text-xs ms-1 opacity-80">{` ${t('host')}`}</span>}
        </h4>
      </div>
      <p className="text-xl font-extrabold whitespace-nowrap ps-2">
        {player.score} <span className="text-sm font-normal opacity-70">{t('pointsSuffix')}</span>
      </p>
    </div>
  );
};

export default React.memo(PlayerChip);
