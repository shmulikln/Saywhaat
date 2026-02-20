
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameSessionContext';
import { useTranslations } from '../contexts/TranslationsContext';
import { GameState, MinigameCardActionType, Player } from '../types';
import AppHeader from './AppHeader';
import FlippableCard from './FlippableCard';
import PlayerSelectionModal from './PlayerSelectionModal';
import { triggerHaptic } from '../utils/nativeUtils';

const CardDrawScreen: React.FC = () => {
  const { gameSession, selectCard, revealCardOutcome, applyCardAction, endMinigame, localPlayerId } = useGame();
  const { t } = useTranslations();
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [isPlayerSelectionModalOpen, setPlayerSelectionModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string, key: number } | null>(null);
  const prevPlayersRef = useRef(gameSession?.players);

  const isMyTurn = gameSession?.gameMode === 'local' || localPlayerId === gameSession?.minigameState?.activePlayerId;
  const { minigameState } = gameSession || {};
  const { revealedOutcome, actionApplied, selectedCardId } = minigameState || {};
  const hasRevealed = !!revealedOutcome;

  useEffect(() => {
    if (!gameSession || (gameSession.gameMode === 'online' && gameSession.gameId !== gameId)) {
      navigate('/');
      return;
    }
    if (gameSession.gameState !== GameState.MINIGAME) {
      if (gameSession.gameState === GameState.GAME_OVER) navigate(`/gameover/${gameId}`);
      else navigate(`/game/${gameId}`);
    }
  }, [gameSession, gameId, navigate]);

  useEffect(() => {
    if (selectedCardId && !hasRevealed && isMyTurn) {
      const timer = setTimeout(() => {
        triggerHaptic('LIGHT');
        revealCardOutcome();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedCardId, hasRevealed, isMyTurn, revealCardOutcome]);

  useEffect(() => {
    const { minigameState } = gameSession || {};
    if (!minigameState) return;
    const { revealedOutcome, actionApplied } = minigameState;
    if (revealedOutcome && !actionApplied && isMyTurn && !revealedOutcome.requiresPlayerChoice) {
      const timer = setTimeout(() => { 
        triggerHaptic('SUCCESS');
        applyCardAction({}); 
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [gameSession, isMyTurn, applyCardAction]);

  useEffect(() => {
    const generateToastMessage = (oldPlayers: { [id: string]: Player }, newPlayers: { [id: string]: Player }, outcome: NonNullable<typeof revealedOutcome>, activePlayerId: string, targetPlayerId?: string) => {
        const activePlayerName = newPlayers[activePlayerId]?.name || '';
        const targetPlayerName = targetPlayerId ? newPlayers[targetPlayerId]?.name : '';
        const getScoreDiff = (playerId: string) => (newPlayers[playerId]?.score ?? 0) - (oldPlayers[playerId]?.score ?? 0);
        switch (outcome.action) {
            case MinigameCardActionType.BONUS_POINTS:
            case MinigameCardActionType.LOSE_POINTS:
            case MinigameCardActionType.DOUBLE_POINTS:
            case MinigameCardActionType.LOSE_HALF_POINTS: {
                const diff = getScoreDiff(activePlayerId);
                return diff > 0 ? `${activePlayerName} gained ${diff} points!` : diff < 0 ? `${activePlayerName} lost ${Math.abs(diff)} points.` : `${activePlayerName}'s score is unchanged.`;
            }
            case MinigameCardActionType.STEAL_POINTS:
                const activeDiff = getScoreDiff(activePlayerId);
                if (activeDiff > 0 && targetPlayerName) return `${activePlayerName} stole ${activeDiff} points from ${targetPlayerName}!`;
                break;
            case MinigameCardActionType.SWAP_SCORES:
                if (targetPlayerName) return `${activePlayerName} and ${targetPlayerName} swapped scores!`;
                break;
            case MinigameCardActionType.GIVE_POINTS:
                const targetDiff = targetPlayerId ? getScoreDiff(targetPlayerId) : 0;
                if (targetDiff > 0 && targetPlayerName) return `${activePlayerName} gave ${targetDiff} points to ${targetPlayerName}.`;
                break;
            case MinigameCardActionType.DOUBLE_TARGET_POINTS:
                 const td = targetPlayerId ? getScoreDiff(targetPlayerId) : 0;
                 if (td > 0 && targetPlayerName) return `${targetPlayerName}'s score was doubled to ${newPlayers[targetPlayerId!].score}!`;
                 break;
            case MinigameCardActionType.RANDOMIZE_SCORES: return "Everyone's scores have been randomized!";
        }
        return null;
    };
    if (minigameState?.actionApplied && prevPlayersRef.current) {
      const { revealedOutcome, activePlayerId } = minigameState;
      let targetPlayerId: string | undefined = undefined;
      if(revealedOutcome) {
          const newPlayers = gameSession!.players;
          for (const pId in newPlayers) { if (pId !== activePlayerId && newPlayers[pId].score !== prevPlayersRef.current[pId]?.score) { targetPlayerId = pId; break; } }
          const message = generateToastMessage(prevPlayersRef.current, newPlayers, revealedOutcome, activePlayerId, targetPlayerId);
          if (message) { setToast({ message, key: Date.now() }); setTimeout(() => setToast(null), 4000); }
      }
      prevPlayersRef.current = undefined;
    } else if (!minigameState?.actionApplied) { prevPlayersRef.current = gameSession?.players; }
  }, [gameSession]);

  if (!gameSession || !minigameState) {
    return <div className="flex items-center justify-center min-h-screen p-4"><div className="text-xl text-slate-100">{t('getReady')}...</div></div>;
  }

  const activePlayer = gameSession.players[minigameState.activePlayerId];
  const activePlayerName = activePlayer ? `${activePlayer.name}${activePlayer.chaosNickname ? ` ${activePlayer.chaosNickname}` : ''}` : '';

  const handleCardClick = (cardId: string) => {
    triggerHaptic('LIGHT');
    selectCard(cardId);
  }

  const renderThreeCards = () => (
    <div className="flex justify-center items-center gap-4 w-full min-h-[250px] relative z-10 animate-chaos-cut">
      {minigameState.cards.map((card) => {
        const isClickable = isMyTurn && !selectedCardId;
        return (
          <div key={card.id} className={`relative w-[28%] max-w-[120px] transition-transform duration-300 ${isClickable ? 'cursor-pointer hover:scale-105 hover:-translate-y-2' : ''}`} onClick={(e) => { e.stopPropagation(); if (isClickable) handleCardClick(card.id); }}>
            <div className="pt-[140%]"></div>
            <div className="absolute inset-0">
                <FlippableCard card={card} isFlipped={false} isSelected={false} isDisabled={false} />
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderSelectedCard = () => {
    const card = minigameState.cards.find(c => c.id === selectedCardId);
    if (!card) return null;
    return (
        <div className="flex justify-center items-center w-full min-h-[400px] py-4 relative z-10 animate-chaos-cut">
            <div className="relative w-[70vw] max-w-[280px]">
                <div className="pt-[140%]"></div>
                <div className="absolute inset-0">
                    <FlippableCard card={card} isFlipped={hasRevealed} isSelected={true} isDisabled={false} onActionClick={revealedOutcome?.requiresPlayerChoice && isMyTurn && !actionApplied ? () => {
                      triggerHaptic('LIGHT');
                      setPlayerSelectionModalOpen(true);
                    } : undefined} />
                </div>
            </div>
        </div>
  );
  };

  return (
    <>
      <div className="min-h-screen flex flex-col items-center p-4 pt-8 sm:pt-12 relative overflow-hidden animate-hard-cut">
        {toast && (
          <div key={toast.key} className="fixed bottom-6 left-1/2 -translate-x-1/2 w-11/12 max-w-md bg-slate-800/95 backdrop-blur-sm text-white py-3 px-5 rounded-lg shadow-2xl z-50 animate-snackbar" role="status">
            <p className="text-base font-medium text-center">{toast.message}</p>
          </div>
        )}
        <AppHeader />
        <div className="relative w-full max-w-3xl flex flex-col items-center">
          <h2 className="text-3xl font-bold mb-2 text-yellow-300 drop-shadow-lg">{t('minigameTitle')}</h2>
          <p className="text-lg mb-8 text-slate-200 min-h-[2rem] text-center flex items-center justify-center">
            {!selectedCardId && (isMyTurn ? t('minigamePickACard') : t('minigameWaiting', { playerName: activePlayerName }))}
            {selectedCardId && !hasRevealed && (<span className="animate-pulse">{isMyTurn ? t('minigameRevealPrompt') : t('minigameWaiting', { playerName: activePlayerName })}</span>)}
          </p>
          
          {selectedCardId ? renderSelectedCard() : renderThreeCards()}

          <div className="h-24 flex items-center justify-center">
            {hasRevealed && minigameState.actionApplied && isMyTurn && (
              <button onClick={() => {
                triggerHaptic('LIGHT');
                endMinigame();
              }} className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform transform hover:scale-105 text-lg animate-fade-in relative z-20">
                {t('minigameContinueButton')}
              </button>
            )}
          </div>
        </div>
      </div>
      {isPlayerSelectionModalOpen && isMyTurn && revealedOutcome?.playerChoicePromptKey && (
        <PlayerSelectionModal prompt={t(revealedOutcome.playerChoicePromptKey)} onClose={() => setPlayerSelectionModalOpen(false)} onPlayerSelected={() => setPlayerSelectionModalOpen(false)} />
      )}
    </>
  );
};

export default CardDrawScreen;
