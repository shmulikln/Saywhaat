import React from 'react';
import Modal from './Modal';
import { useGame } from '../contexts/GameSessionContext';
import { useTranslations } from '../contexts/TranslationsContext';

interface TurnChaosModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

const TurnChaosModal: React.FC<TurnChaosModalProps> = ({ onClose, onConfirm }) => {
  const { gameSession } = useGame();
  const { t } = useTranslations();
  
  const chaosRule = gameSession?.activeTurnChaos;
  if (!chaosRule) return null;

  return (
    <Modal title={t('turnChaosTitle')} onClose={onClose}>
      <div className="text-center p-4">
        <p className="text-2xl font-bold text-yellow-300 mb-6">
          {t(chaosRule.descriptionKey)}
        </p>
        <button
          onClick={onConfirm}
          className="w-full h-14 bg-[#FBBF24] hover:bg-[#F59E0B] text-[#4c1d95] font-black uppercase tracking-wider text-base rounded-full shadow-[0_4px_20px_rgba(251,191,36,0.35)] active:scale-95 transition-all flex items-center justify-center"
        >
          {t('turnChaosStartButton')}
        </button>
      </div>
    </Modal>
  );
};

export default TurnChaosModal;
