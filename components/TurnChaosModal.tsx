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
          className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-md transition-transform transform hover:scale-105"
        >
          {t('turnChaosStartButton')}
        </button>
      </div>
    </Modal>
  );
};

export default TurnChaosModal;
