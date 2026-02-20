
import React from 'react';
import Modal from './Modal';
import { useTranslations } from '../contexts/TranslationsContext';
import { MinigameCardActionType, MinigameCardOutcome } from '../types';

interface ChaosCardsGalleryModalProps {
  onClose: () => void;
}

const ALL_POSSIBLE_OUTCOMES: MinigameCardOutcome[] = [
  { action: MinigameCardActionType.BONUS_POINTS, value: 3, translationKey: 'cardOutcomeBonusPoints' },
  { action: MinigameCardActionType.STEAL_POINTS, value: 2, translationKey: 'cardOutcomeStealPoints', requiresPlayerChoice: true, playerChoicePromptKey: 'minigamePlayerChoiceSteal' },
  { action: MinigameCardActionType.DOUBLE_POINTS, value: 0, translationKey: 'cardOutcomeDoublePoints' },
  { action: MinigameCardActionType.SWAP_SCORES, value: 0, translationKey: 'cardOutcomeSwapScores', requiresPlayerChoice: true, playerChoicePromptKey: 'minigamePlayerChoiceSwap' },
  { action: MinigameCardActionType.RANDOMIZE_SCORES, value: 0, translationKey: 'cardOutcomeRandomizeScores' },
  { action: MinigameCardActionType.DOUBLE_TARGET_POINTS, value: 0, translationKey: 'cardOutcomeDoubleTargetPoints', requiresPlayerChoice: true, playerChoicePromptKey: 'minigamePlayerChoiceDoublePoints' },
  { action: MinigameCardActionType.LOSE_POINTS, value: 2, translationKey: 'cardOutcomeLosePoints' },
  { action: MinigameCardActionType.LOSE_HALF_POINTS, value: 0, translationKey: 'cardOutcomeLoseHalfPoints' },
  { action: MinigameCardActionType.GIVE_POINTS, value: 3, translationKey: 'cardOutcomeGivePoints', requiresPlayerChoice: true, playerChoicePromptKey: 'minigamePlayerChoiceGivePoints' },
];

const ChaosCardsGalleryModal: React.FC<ChaosCardsGalleryModalProps> = ({ onClose }) => {
  const { t } = useTranslations();

  return (
    <Modal title={t('minigameTitle')} onClose={onClose}>
      <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-3 custom-scrollbar">
        <p className="text-center text-slate-300 text-sm mb-6">
          {t('chaosModeInfoDescription')}
        </p>
        
        <div className="grid grid-cols-2 gap-4">
          {ALL_POSSIBLE_OUTCOMES.map((outcome, index) => (
            <div 
              key={index}
              className="relative group aspect-[1/1.4] bg-slate-800 border-2 border-slate-600 rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-xl animate-word-snap"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Card Decoration */}
              <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-slate-600"></div>
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-slate-600"></div>
              <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-slate-600"></div>
              <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-slate-600"></div>

              <p className="text-white text-xs sm:text-sm font-black uppercase leading-tight drop-shadow-md">
                {t(outcome.translationKey as any, { value: outcome.value })}
              </p>
              
              {outcome.requiresPlayerChoice && (
                <div className="mt-2 bg-[#FBBF24]/20 border border-[#FBBF24]/30 rounded-full px-2 py-0.5">
                  <span className="text-[8px] font-black text-[#FBBF24] uppercase tracking-tighter">
                    Choice Card
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default ChaosCardsGalleryModal;
