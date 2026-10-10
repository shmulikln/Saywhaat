
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

  const baseClasses = "flex items-center justify-between p-3.5 px-5 rounded-2xl shadow-md transition-all duration-300";
  
  const compactBase = "flex items-center justify-between rounded-full shadow-sm transition-all duration-300 text-xs px-3 py-1.5 w-auto";
  const compactCurrent = "bg-purple-600/90 text-white border border-purple-400/40 shadow-sm";
  const compactDefault = "bg-white/10 text-white/90 border border-white/10";
  
  const fullBase = "min-h-[60px] p-3.5 px-5";
  const fullCurrent = "bg-purple-600/70 text-white ring-2 ring-[#FBBF24]/80 shadow-[0_4px_20px_rgba(251,191,36,0.2)] backdrop-blur-md";
  const fullDefault = "bg-white/10 backdrop-blur-md text-white border border-white/10 hover:bg-white/15";
  const leadingClasses = isLeading ? "ring-2 ring-[#FBBF24] shadow-[0_0_15px_rgba(251,191,36,0.3)]" : "";

  if (compact) {
    return (
       <div className={`${compactBase} ${isCurrent ? compactCurrent : compactDefault}`}>
        <span className="font-bold truncate max-w-[150px] ltr:text-left rtl:text-right">
          {isLeading && '⭐ '}{displayName}
        </span>
        <span className="ms-2 bg-[#FBBF24] text-[#4c1d95] text-xs font-black px-2 py-0.5 rounded-full">{player.score}</span>
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
