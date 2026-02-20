
import React from 'react';
import Modal from './Modal';
import { useTranslations } from '../contexts/TranslationsContext';
import { AppTranslations, MinigameCardActionType, MinigameCardOutcome } from '../types';

interface ChaosModeInfoModalProps {
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

const ChaosEventItem: React.FC<{ title: string, description: string, emoji: string }> = ({ title, description, emoji }) => (
  <div className="flex items-start gap-4 p-3 bg-white/5 rounded-2xl border border-white/5">
    <div className="text-2xl pt-1">{emoji}</div>
    <div>
      <h4 className="font-black text-white uppercase text-xs tracking-widest mb-1">{title}</h4>
      <p className="text-sm text-slate-300 leading-relaxed">{description}</p>
    </div>
  </div>
);

const ChaosModeInfoModal: React.FC<ChaosModeInfoModalProps> = ({ onClose }) => {
  const { t } = useTranslations();

  const getEventParts = (key: keyof AppTranslations) => {
    const text = t(key);
    const parts = text.split(':');
    const title = parts[0];
    const description = parts.slice(1).join(':').trim();
    return { title, description };
  };

  return (
    <Modal title={t('chaosModeInfoTitle')} onClose={onClose}>
      <div className="space-y-6 max-h-[75vh] overflow-y-auto p-1 pr-3 custom-scrollbar">
        <p className="text-center text-slate-300 text-sm leading-relaxed mb-4">
          {t('chaosModeInfoDescription')}
        </p>
        
        <div className="space-y-3">
          <ChaosEventItem 
            emoji="🤪"
            title={getEventParts('chaosEventNicknames').title}
            description={getEventParts('chaosEventNicknames').description}
          />
          <ChaosEventItem 
            emoji="📜"
            title={getEventParts('chaosEventTurnModifier').title}
            description={getEventParts('chaosEventTurnModifier').description}
          />
        </div>

        <div className="mt-8 border-t border-white/10 pt-6">
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FBBF24] mb-4 text-center">
            The Chaos Deck 🃏
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {ALL_POSSIBLE_OUTCOMES.map((outcome, index) => {
              const isPositive = [MinigameCardActionType.BONUS_POINTS, MinigameCardActionType.DOUBLE_POINTS, MinigameCardActionType.STEAL_POINTS].includes(outcome.action);
              const isNegative = [MinigameCardActionType.LOSE_POINTS, MinigameCardActionType.LOSE_HALF_POINTS].includes(outcome.action);
              
              return (
                <div 
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-xl border ${
                    isPositive ? 'bg-green-500/10 border-green-500/20' : 
                    isNegative ? 'bg-red-500/10 border-red-500/20' : 
                    'bg-white/5 border-white/10'
                  }`}
                >
                  <span className={`text-xs font-black uppercase tracking-tight ${
                    isPositive ? 'text-green-400' : 
                    isNegative ? 'text-red-400' : 
                    'text-white'
                  }`}>
                    {t(outcome.translationKey as any, { value: outcome.value })}
                  </span>
                  
                  {outcome.requiresPlayerChoice && (
                    <span className="text-[8px] font-black bg-[#FBBF24] text-[#4c1d95] px-2 py-0.5 rounded-full uppercase tracking-tighter">
                      Choice
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ChaosModeInfoModal;
