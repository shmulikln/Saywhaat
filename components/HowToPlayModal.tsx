
import React from 'react';
import Modal from './Modal';
import { useTranslations } from '../contexts/TranslationsContext';
import { AppTranslations } from '../types';

interface HowToPlayModalProps {
  onClose: () => void;
}

const RuleSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="ltr:pl-4 rtl:pr-4 ltr:border-l-2 rtl:border-r-2 border-indigo-200 dark:border-indigo-700">
        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{title}</h3>
        <div className="space-y-2 text-sm mt-2">{children}</div>
    </div>
);

const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose }) => {
  const { t } = useTranslations();
  
  const createMarkup = (key: keyof AppTranslations) => {
      const text = t(key);
      const html = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>');
      return { __html: html };
  }

  return (
    <Modal title={t('howToPlayTitle')} onClose={onClose}>
      <div className="space-y-6 max-h-[70vh] overflow-y-auto p-1 pr-3 text-slate-600 dark:text-slate-300">
        
        <RuleSection title={t('howToPlayTheGoal')}>
            <p>{t('howToPlayTheGoalDesc')}</p>
        </RuleSection>

        <RuleSection title={t('howToPlayTheTurn')}>
            <p dangerouslySetInnerHTML={createMarkup('howToPlayTheTurnDesc1')} />
            <p dangerouslySetInnerHTML={createMarkup('howToPlayTheTurnDesc2')} />
        </RuleSection>

        <RuleSection title={t('howToPlayTheRules')}>
            <p dangerouslySetInnerHTML={createMarkup('howToPlayTheRulesRule1')} />
            <p dangerouslySetInnerHTML={createMarkup('howToPlayTheRulesRule2')} />
        </RuleSection>
        
        <RuleSection title={t('howToPlayScoring')}>
            <p dangerouslySetInnerHTML={createMarkup('howToPlayScoringDesc1')} />
            <p dangerouslySetInnerHTML={createMarkup('howToPlayScoringDesc2')} />
        </RuleSection>

        <RuleSection title={t('howToPlayWinning')}>
            <p>{t('howToPlayWinningDesc')}</p>
        </RuleSection>
        
        <RuleSection title={t('howToPlayChaosMode')}>
            <p>{t('howToPlayChaosModeDesc')}</p>
        </RuleSection>

      </div>
    </Modal>
  );
};

export default HowToPlayModal;
