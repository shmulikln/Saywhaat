
import React from 'react';
import { MinigameCard } from '../types';
import { useTranslations } from '../contexts/TranslationsContext';

interface FlippableCardProps {
  card: MinigameCard;
  isFlipped: boolean;
  isSelected: boolean;
  isDisabled: boolean;
  onActionClick?: () => void;
}

const FlippableCard: React.FC<FlippableCardProps> = ({ card, isFlipped, isSelected, isDisabled, onActionClick }) => {
  const { t } = useTranslations();

  const cardText = card.outcome ? t(card.outcome.translationKey as any, { value: card.outcome.value }) : '';

  return (
    <div 
        className="w-full h-full"
        style={{ perspective: '1000px' }} 
    >
        <div 
            className={`relative w-full h-full text-center transition-transform duration-700 transform-gpu ${isDisabled && !isSelected ? 'opacity-50' : ''}`}
            style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'none' }}
        >
            {/* Card Front (Back of card) */}
            <div className="absolute w-full h-full rounded-xl bg-purple-600 border-4 border-purple-400 flex items-center justify-center shadow-lg overflow-hidden" style={{ backfaceVisibility: 'hidden' }}>
                <span className="text-6xl font-extrabold text-yellow-300" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>?</span>
            </div>

            {/* Card Back (Face of card) */}
            <div className="absolute w-full h-full rounded-xl bg-slate-800 border-4 border-slate-600 flex flex-col items-center justify-between p-3 shadow-lg overflow-hidden" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                <div className="flex-grow flex items-center justify-center">
                    <p className="text-white text-3xl sm:text-5xl font-black text-center leading-tight">
                        {cardText}
                    </p>
                </div>
                {onActionClick && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onActionClick();
                        }}
                        className="w-full mt-2 bg-[#FBBF24] text-[#4c1d95] font-black uppercase tracking-widest rounded-full shadow-md text-[10px] sm:text-xs py-2.5 px-4 transition-transform transform active:scale-95 shrink-0"
                    >
                        {t('minigameChoosePlayerButton')}
                    </button>
                )}
            </div>
        </div>
    </div>
  );
};

export default React.memo(FlippableCard);
