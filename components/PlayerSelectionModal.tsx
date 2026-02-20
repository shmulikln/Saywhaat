
import React, { useState } from 'react';
import Modal from './Modal';
import { useGame } from '../contexts/GameSessionContext';
import { useTranslations } from '../contexts/TranslationsContext';
import { PlayerWithId } from '../types';

interface PlayerSelectionModalProps {
  prompt: string;
  onClose: () => void;
  onPlayerSelected: () => void;
}

const PlayerSelectionModal: React.FC<PlayerSelectionModalProps> = ({ prompt, onClose, onPlayerSelected }) => {
  const { gameSession, applyCardAction } = useGame();
  const { t } = useTranslations();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  if (!gameSession || !gameSession.minigameState) return null;

  const { activePlayerId } = gameSession.minigameState;
  const playersArray: PlayerWithId[] = Object.entries(gameSession.players).map(([id, player]) => ({ id, ...player }));
  const potentialTargets = playersArray.filter(p => p.id !== activePlayerId);

  const handleConfirm = () => {
    if (selectedPlayerId) {
      applyCardAction({ targetPlayerId: selectedPlayerId });
      onPlayerSelected();
    }
  };

  return (
    <Modal title={prompt} onClose={onClose}>
      <div className="space-y-2 max-h-60 overflow-y-auto p-1 custom-scrollbar">
        {potentialTargets.map((player: PlayerWithId) => (
          <button
            key={player.id}
            onClick={() => setSelectedPlayerId(player.id)}
            className={`w-full ltr:text-left rtl:text-right px-6 py-3 rounded-full font-bold transition-all border ${
              selectedPlayerId === player.id 
                ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_15px_rgba(139,92,246,0.3)]' 
                : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
            }`}
          >
            {player.name}{player.chaosNickname ? ` ${player.chaosNickname}` : ''}
          </button>
        ))}
      </div>
      <div className="mt-8">
        <button
            onClick={handleConfirm}
            disabled={!selectedPlayerId}
            className="w-full bg-[#FBBF24] text-[#4c1d95] font-black uppercase tracking-widest h-[56px] rounded-full shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:scale-100"
        >
            {t('confirmButton')}
        </button>
      </div>
    </Modal>
  );
};

export default PlayerSelectionModal;
