
import React, { useState } from 'react';
import Modal from './Modal';
import { useGame } from '../contexts/GameSessionContext';
import { useTranslations } from '../contexts/TranslationsContext';
import { PlayerWithId } from '../types';
import { triggerHaptic } from '../utils/nativeUtils';

interface PlayerSelectionModalProps {
  prompt: string;
  onClose: () => void;
  onPlayerSelected: (targetPlayerId: string) => void;
}

const PlayerSelectionModal: React.FC<PlayerSelectionModalProps> = ({ prompt, onClose, onPlayerSelected }) => {
  const { gameSession } = useGame();
  const { t } = useTranslations();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  if (!gameSession || !gameSession.minigameState) return null;

  const { activePlayerId } = gameSession.minigameState;
  const playersArray: PlayerWithId[] = Object.entries(gameSession.players).map(([id, player]) => ({ id, ...player }));
  const potentialTargets = playersArray.filter(p => p.id !== activePlayerId);

  const handleConfirm = () => {
    if (selectedPlayerId && !isClosing) {
      triggerHaptic('LIGHT');
      setIsClosing(true);
      setTimeout(() => {
        onPlayerSelected(selectedPlayerId);
      }, 220);
    }
  };

  const handleClose = () => {
    if (!isClosing) {
      setIsClosing(true);
      setTimeout(() => {
        onClose();
      }, 220);
    }
  };

  return (
    <Modal title={prompt} onClose={handleClose} isClosing={isClosing}>
      <div className="space-y-2.5 max-h-64 overflow-y-auto p-1 custom-scrollbar">
        {potentialTargets.map((player: PlayerWithId) => {
          const isSelected = selectedPlayerId === player.id;
          return (
            <button
              key={player.id}
              onClick={() => {
                triggerHaptic('LIGHT');
                setSelectedPlayerId(player.id);
              }}
              className={`w-full ltr:text-left rtl:text-right px-5 py-3.5 rounded-2xl font-bold transition-all border flex items-center justify-between ${
                isSelected 
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.5)] scale-[1.02]' 
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/10 hover:border-white/20'
              }`}
            >
              <span className="text-base truncate">
                {player.name}{player.chaosNickname ? ` ${player.chaosNickname}` : ''}
              </span>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                isSelected ? 'bg-amber-400 text-purple-950 shadow' : 'border border-white/30 text-transparent'
              }`}>
                ✓
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-6">
        <button
            onClick={handleConfirm}
            disabled={!selectedPlayerId || isClosing}
            className="w-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-[#3b0764] font-black uppercase tracking-wider h-[56px] rounded-full shadow-[0_10px_25px_rgba(251,191,36,0.35)] active:scale-95 transition-all disabled:opacity-40 disabled:grayscale disabled:scale-100 text-base flex items-center justify-center gap-2"
        >
            <span>{t('confirmButton')}</span>
            <span className="text-xl">➔</span>
        </button>
      </div>
    </Modal>
  );
};

export default PlayerSelectionModal;
