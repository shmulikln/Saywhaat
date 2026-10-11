import React from 'react';
import { MinigameCard, MinigameCardActionType } from '../types';
import { useTranslations } from '../contexts/TranslationsContext';

interface FlippableCardProps {
  card: MinigameCard;
  isFlipped: boolean;
  isSelected: boolean;
  isDisabled: boolean;
  isZoomed?: boolean;
  onActionClick?: () => void;
  onClick?: () => void;
}

const getOutcomeTheme = (action?: MinigameCardActionType) => {
  switch (action) {
    case MinigameCardActionType.BONUS_POINTS:
    case MinigameCardActionType.DOUBLE_POINTS:
      return {
        bg: 'bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-950',
        border: 'border-emerald-300/80',
        shadow: 'shadow-[0_0_40px_rgba(52,211,153,0.5)]',
        badge: 'bg-emerald-500/30 text-emerald-200 border-emerald-400/40',
        icon: '🌟'
      };
    case MinigameCardActionType.LOSE_POINTS:
    case MinigameCardActionType.LOSE_HALF_POINTS:
      return {
        bg: 'bg-gradient-to-br from-rose-600 via-red-800 to-rose-950',
        border: 'border-rose-400/80',
        shadow: 'shadow-[0_0_40px_rgba(244,63,94,0.5)]',
        badge: 'bg-rose-500/30 text-rose-200 border-rose-400/40',
        icon: '💥'
      };
    case MinigameCardActionType.STEAL_POINTS:
    case MinigameCardActionType.SWAP_SCORES:
    case MinigameCardActionType.GIVE_POINTS:
    case MinigameCardActionType.DOUBLE_TARGET_POINTS:
    case MinigameCardActionType.UNDERDOG_SURGE:
    case MinigameCardActionType.TAX_COLLECTOR:
      return {
        bg: 'bg-gradient-to-br from-amber-500 via-yellow-600 to-amber-950',
        border: 'border-amber-300/80',
        shadow: 'shadow-[0_0_40px_rgba(251,191,36,0.5)]',
        badge: 'bg-amber-500/30 text-amber-100 border-amber-300/40',
        icon: '💰'
      };
    case MinigameCardActionType.ROBIN_HOOD:
      return {
        bg: 'bg-gradient-to-br from-emerald-600 via-teal-800 to-teal-950',
        border: 'border-emerald-300/80',
        shadow: 'shadow-[0_0_40px_rgba(16,185,129,0.5)]',
        badge: 'bg-emerald-500/30 text-emerald-200 border-emerald-400/40',
        icon: '🏹'
      };
    case MinigameCardActionType.RUSSIAN_ROULETTE:
      return {
        bg: 'bg-gradient-to-br from-red-600 via-rose-800 to-red-950',
        border: 'border-red-400/80',
        shadow: 'shadow-[0_0_40px_rgba(239,68,68,0.5)]',
        badge: 'bg-red-500/30 text-red-200 border-red-400/40',
        icon: '🎯'
      };
    case MinigameCardActionType.THE_EQUALIZER:
      return {
        bg: 'bg-gradient-to-br from-cyan-600 via-blue-800 to-indigo-950',
        border: 'border-cyan-300/80',
        shadow: 'shadow-[0_0_40px_rgba(6,182,212,0.5)]',
        badge: 'bg-cyan-500/30 text-cyan-200 border-cyan-400/40',
        icon: '⚖️'
      };
    case MinigameCardActionType.DOUBLE_OR_NOTHING:
    case MinigameCardActionType.MYSTERY_BOX:
      return {
        bg: 'bg-gradient-to-br from-violet-600 via-purple-800 to-indigo-950',
        border: 'border-purple-300/80',
        shadow: 'shadow-[0_0_40px_rgba(168,85,247,0.5)]',
        badge: 'bg-purple-500/30 text-purple-200 border-purple-400/40',
        icon: '🎁'
      };
    case MinigameCardActionType.RANDOMIZE_SCORES:
    default:
      return {
        bg: 'bg-gradient-to-br from-fuchsia-600 via-purple-800 to-indigo-950',
        border: 'border-purple-300/80',
        shadow: 'shadow-[0_0_40px_rgba(168,85,247,0.5)]',
        badge: 'bg-purple-500/30 text-purple-200 border-purple-400/40',
        icon: '🌀'
      };
  }
};

const FlippableCard: React.FC<FlippableCardProps> = ({ 
  card, 
  isFlipped, 
  isSelected, 
  isDisabled, 
  isZoomed = false,
  onActionClick,
  onClick
}) => {
  const { t } = useTranslations();

  const cardText = card.outcome ? t(card.outcome.translationKey as any, { value: card.outcome.value }) : '';
  const theme = getOutcomeTheme(card.outcome?.action);

  return (
    <div 
      className="w-full h-full select-none"
      style={{ perspective: '1400px' }} 
    >
      <div 
        className={`relative w-full h-full text-center transition-transform duration-700 transform-gpu ${
          isDisabled && !isSelected ? 'opacity-40 grayscale' : ''
        }`}
        style={{ 
          transformStyle: 'preserve-3d', 
          transform: isFlipped ? 'rotateY(180deg)' : 'none' 
        }}
      >
        {/* Card Front (Face-down Mystery Back) */}
        <div 
          className={`absolute inset-0 ${
            isZoomed 
              ? 'rounded-3xl border-4 border-[#FBBF24]/80 p-5 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.7)] ring-2 ring-white/30' 
              : 'rounded-2xl border-3 border-[#FBBF24]/70 p-3.5 shadow-[0_12px_28px_rgba(0,0,0,0.5)] ring-1 ring-white/20'
          } bg-gradient-to-br from-indigo-700 via-purple-700 to-violet-950 flex flex-col items-center justify-between overflow-hidden`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Ornate Corner Accents */}
          <div className="w-full flex justify-between items-center text-xs text-[#FBBF24]/70 font-mono">
            <span>◆</span>
            <span className={`${isZoomed ? 'text-[11px] tracking-[0.3em]' : 'text-[8px] tracking-[0.2em]'} font-black uppercase text-white/60`}>
              CHAOS
            </span>
            <span>◆</span>
          </div>

          {/* Central Mystery Icon */}
          <div className="relative flex items-center justify-center">
            <div className={`${
              isZoomed 
                ? 'w-24 h-24 sm:w-32 sm:h-32 border-2 border-[#FBBF24]/50 shadow-[0_0_30px_rgba(251,191,36,0.3)]' 
                : 'w-16 h-16 sm:w-20 sm:h-20 border border-[#FBBF24]/30'
            } rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center shadow-inner`}>
              <span 
                className={`${isZoomed ? 'text-6xl sm:text-8xl' : 'text-5xl sm:text-6xl'} font-black text-[#FBBF24] select-none`}
                style={{ textShadow: '0 4px 14px rgba(0,0,0,0.7), 0 0 25px rgba(251,191,36,0.7)' }}
              >
                ?
              </span>
            </div>
          </div>

          <div className="w-full flex justify-between items-center text-xs text-[#FBBF24]/70 font-mono">
            <span>◆</span>
            <span className={`${isZoomed ? 'text-[11px] tracking-[0.3em]' : 'text-[8px] tracking-[0.2em]'} font-black uppercase text-white/60`}>
              CARD
            </span>
            <span>◆</span>
          </div>
        </div>

        {/* Card Back (Face-up Revealed Outcome) */}
        <div 
          onClick={onClick}
          className={`absolute inset-0 ${theme.bg} ${
            isZoomed 
              ? `rounded-3xl border-4 ${theme.border} ${theme.shadow} p-6 sm:p-8 ring-2 ring-white/30 backdrop-blur-md` 
              : `rounded-2xl border-3 ${theme.border} ${theme.shadow} p-4 ring-1 ring-white/30`
          } flex flex-col items-center justify-between overflow-hidden ${
            onClick ? 'cursor-pointer' : ''
          }`}
          style={{ 
            backfaceVisibility: 'hidden', 
            transform: 'rotateY(180deg)' 
          }}
        >
          {/* Header Tag */}
          <div className="w-full flex items-center justify-between">
            <span className={isZoomed ? 'text-2xl sm:text-3xl' : 'text-xl'}>{theme.icon}</span>
            <span className={`${
              isZoomed 
                ? 'text-xs sm:text-sm font-black px-3.5 py-1' 
                : 'text-[10px] font-black px-2.5 py-0.5'
            } uppercase tracking-widest rounded-full border ${theme.badge}`}>
              {card.outcome?.value ? `${card.outcome.value} PTS` : 'CHAOS'}
            </span>
          </div>

          {/* Center Outcome Description */}
          <div className="flex-grow flex items-center justify-center px-2 py-4">
            <p 
              className={`text-white ${
                isZoomed 
                  ? 'text-2xl sm:text-4xl leading-tight' 
                  : 'text-xl sm:text-3xl leading-snug'
              } font-black text-center tracking-tight drop-shadow-[0_4px_14px_rgba(0,0,0,0.85)]`}
            >
              {cardText}
            </p>
          </div>

          {/* Action Button for Choice Outcomes */}
          {onActionClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onActionClick();
              }}
              className={`w-full mt-2 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-[#3b0764] font-black uppercase tracking-wider rounded-full shadow-[0_8px_20px_rgba(251,191,36,0.4)] ${
                isZoomed ? 'text-xs sm:text-sm py-3.5 px-6' : 'text-[11px] sm:text-xs py-2.5 px-4'
              } transition-transform transform active:scale-95 shrink-0 flex items-center justify-center gap-2 animate-pulse`}
            >
              <span>{t('minigameChoosePlayerButton')}</span>
              <span className="text-lg">➔</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(FlippableCard);
