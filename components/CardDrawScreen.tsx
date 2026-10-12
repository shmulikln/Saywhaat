import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameSessionContext';
import { useTranslations } from '../contexts/TranslationsContext';
import { GameState, MinigameCardActionType, Player } from '../types';
import AppHeader from './AppHeader';
import FlippableCard from './FlippableCard';
import PlayerSelectionModal from './PlayerSelectionModal';
import { triggerHaptic } from '../utils/nativeUtils';

interface CardFlight {
  cardId: string;
  deltaX: number;
  deltaY: number;
  scale: number;
  isLanded: boolean;
}

const CardDrawScreen: React.FC = () => {
  const { 
    gameSession, 
    selectCard, 
    revealCardOutcome, 
    applyCardAction, 
    applyCardActionAndEnd, 
    endMinigame, 
    localPlayerId 
  } = useGame();
  const { t } = useTranslations();
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [isPlayerSelectionModalOpen, setPlayerSelectionModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string, key: number } | null>(null);
  const prevPlayersRef = useRef(gameSession?.players);

  // Flight animation state for smooth card zoom from its original position
  const [flight, setFlight] = useState<CardFlight | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<{ [cardId: string]: HTMLDivElement | null }>({});

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

  // Synchronize remote card selection for spectators or fallback
  useEffect(() => {
    if (selectedCardId && !flight && containerRef.current) {
      const cardEl = cardRefs.current[selectedCardId];
      if (cardEl) {
        const startRect = cardEl.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        const targetCenterX = containerRect.left + containerRect.width / 2;
        const targetCenterY = containerRect.top + containerRect.height / 2;
        const startCenterX = startRect.left + startRect.width / 2;
        const startCenterY = startRect.top + startRect.height / 2;
        const targetWidth = Math.min(window.innerWidth * 0.88, window.innerWidth >= 640 ? 420 : 360);
        const scale = Math.min(startRect.width / targetWidth, 0.45);
        const deltaX = startCenterX - targetCenterX;
        const deltaY = startCenterY - targetCenterY;
        setFlight({ cardId: selectedCardId, deltaX, deltaY, scale, isLanded: false });
      } else {
        setFlight({ cardId: selectedCardId, deltaX: 0, deltaY: 0, scale: 0.35, isLanded: true });
      }
    }
  }, [selectedCardId, flight]);

  // Reset flight when selectedCardId clears
  useEffect(() => {
    if (!selectedCardId) {
      setFlight(null);
    }
  }, [selectedCardId]);

  // Trigger smooth transition from starting position to center on the next frame
  useEffect(() => {
    if (flight && !flight.isLanded) {
      const raf1 = requestAnimationFrame(() => {
        const raf2 = requestAnimationFrame(() => {
          setFlight(prev => prev ? { ...prev, isLanded: true } : null);
        });
        return () => cancelAnimationFrame(raf2);
      });
      return () => cancelAnimationFrame(raf1);
    }
  }, [flight?.isLanded]);

  // Reveal card after it smoothly lands and centers (540ms)
  useEffect(() => {
    if (selectedCardId && !hasRevealed && isMyTurn) {
      const timer = setTimeout(() => {
        triggerHaptic('LIGHT');
        revealCardOutcome();
      }, 540);
      return () => clearTimeout(timer);
    }
  }, [selectedCardId, hasRevealed, isMyTurn, revealCardOutcome]);

  // Automatically apply outcomes for cards that do NOT require a player choice
  useEffect(() => {
    const { minigameState } = gameSession || {};
    if (!minigameState) return;
    const { revealedOutcome, actionApplied } = minigameState;
    if (revealedOutcome && !actionApplied && isMyTurn && !revealedOutcome.requiresPlayerChoice) {
      const timer = setTimeout(() => { 
        triggerHaptic('SUCCESS');
        applyCardAction({}); 
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [gameSession, isMyTurn, applyCardAction]);

  const decisionTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleOpenDecisionModal = useCallback(() => {
    if (decisionTimerRef.current) {
      clearTimeout(decisionTimerRef.current);
      decisionTimerRef.current = null;
    }
    triggerHaptic('LIGHT');
    setPlayerSelectionModalOpen(true);
  }, []);

  // Launch modal after 4 seconds if not tapped yet
  useEffect(() => {
    const { minigameState } = gameSession || {};
    if (!minigameState) return;
    const { revealedOutcome, actionApplied } = minigameState;
    if (revealedOutcome && !actionApplied && isMyTurn && revealedOutcome.requiresPlayerChoice) {
      if (decisionTimerRef.current) {
        clearTimeout(decisionTimerRef.current);
      }
      decisionTimerRef.current = setTimeout(() => {
        handleOpenDecisionModal();
      }, 4000);
      return () => {
        if (decisionTimerRef.current) {
          clearTimeout(decisionTimerRef.current);
          decisionTimerRef.current = null;
        }
      };
    }
  }, [gameSession?.minigameState?.revealedOutcome, gameSession?.minigameState?.actionApplied, isMyTurn, handleOpenDecisionModal]);

  useEffect(() => {
    return () => {
      if (decisionTimerRef.current) {
        clearTimeout(decisionTimerRef.current);
        decisionTimerRef.current = null;
      }
    };
  }, []);

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
            case MinigameCardActionType.ROBIN_HOOD: return "🏹 Robin Hood took points from the leader and gave them to last place!";
            case MinigameCardActionType.UNDERDOG_SURGE: {
                const diff = getScoreDiff(activePlayerId);
                return `🚀 Underdog Surge! ${activePlayerName} gained ${diff} points!`;
            }
            case MinigameCardActionType.TAX_COLLECTOR: {
                const diff = getScoreDiff(activePlayerId);
                return `💰 Tax Collector! ${activePlayerName} collected ${diff} points in taxes!`;
            }
            case MinigameCardActionType.THE_EQUALIZER: return "⚖️ The Equalizer balanced everyone's scores!";
            case MinigameCardActionType.DOUBLE_OR_NOTHING: {
                const diff = getScoreDiff(activePlayerId);
                return diff > 0 ? `🎲 Double or Nothing: ${activePlayerName} won +${diff} points!` : `🎲 Double or Nothing: ${activePlayerName} lost ${Math.abs(diff)} points!`;
            }
            case MinigameCardActionType.RUSSIAN_ROULETTE: {
                const activeDiff = getScoreDiff(activePlayerId);
                return activeDiff > 0 
                  ? `🎯 Russian Roulette: ${activePlayerName} won 3 points from ${targetPlayerName}!` 
                  : `🎯 Russian Roulette: ${targetPlayerName} won 3 points from ${activePlayerName}!`;
            }
            case MinigameCardActionType.MYSTERY_BOX: {
                const diff = getScoreDiff(activePlayerId);
                return diff >= 0 ? `🎁 Mystery Box: ${activePlayerName} gained ${diff} points!` : `🎁 Mystery Box: ${activePlayerName} lost ${Math.abs(diff)} points!`;
            }
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

  const handleCardClick = (cardId: string, e: React.MouseEvent<HTMLDivElement>) => {
    if (selectedCardId || flight) return;
    triggerHaptic('LIGHT');

    const cardEl = e.currentTarget;
    if (containerRef.current) {
      const startRect = cardEl.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      const targetCenterX = containerRect.left + containerRect.width / 2;
      const targetCenterY = containerRect.top + containerRect.height / 2;
      const startCenterX = startRect.left + startRect.width / 2;
      const startCenterY = startRect.top + startRect.height / 2;
      const targetWidth = Math.min(window.innerWidth * 0.88, window.innerWidth >= 640 ? 420 : 360);
      const scale = Math.min(startRect.width / targetWidth, 0.45);
      const deltaX = startCenterX - targetCenterX;
      const deltaY = startCenterY - targetCenterY;

      setFlight({
        cardId,
        deltaX,
        deltaY,
        scale,
        isLanded: false,
      });
    }

    selectCard(cardId);
  };

  const renderThreeCards = () => (
    <div 
      className={`flex justify-center items-center gap-3 sm:gap-6 w-full min-h-[300px] py-4 relative z-10 transition-opacity duration-300 ${
        selectedCardId ? 'pointer-events-none' : 'animate-fade-in'
      }`}
    >
      {minigameState.cards.map((card) => {
        const isThisSelected = selectedCardId === card.id;
        const isClickable = isMyTurn && !selectedCardId;
        return (
          <div 
            key={card.id} 
            ref={(el) => { cardRefs.current[card.id] = el; }}
            className={`relative w-[29%] max-w-[130px] transition-all duration-400 ${
              isClickable ? 'cursor-pointer hover:scale-105 hover:-translate-y-3 active:scale-95' : ''
            } ${
              selectedCardId
                ? (isThisSelected ? 'opacity-0' : 'opacity-0 scale-75')
                : 'opacity-100 scale-100'
            }`} 
            onClick={(e) => { 
              e.stopPropagation(); 
              if (isClickable) handleCardClick(card.id, e); 
            }}
          >
            <div className="pt-[145%]"></div>
            <div className="absolute inset-0">
              <FlippableCard card={card} isFlipped={false} isSelected={false} isDisabled={false} />
            </div>
          </div>
        );
      })}
    </div>
  );

  const canTapToDecide = hasRevealed && !!revealedOutcome?.requiresPlayerChoice && isMyTurn && !actionApplied;

  const renderSelectedCard = () => {
    const card = minigameState.cards.find(c => c.id === selectedCardId);
    if (!card) return null;

    const isLanded = flight?.isLanded ?? true;
    const deltaX = flight?.deltaX ?? 0;
    const deltaY = flight?.deltaY ?? 0;
    const scale = flight?.scale ?? 1;

    return (
      <div 
        className="flex justify-center items-center w-full min-h-[440px] sm:min-h-[520px] py-2 relative z-20 pointer-events-auto"
        style={{
          transform: isLanded 
            ? 'translate3d(0, 0, 0) scale(1)' 
            : `translate3d(${deltaX}px, ${deltaY}px, 0) scale(${scale})`,
          transition: isLanded 
            ? 'transform 520ms cubic-bezier(0.16, 1, 0.3, 1)' 
            : 'none',
          transformOrigin: 'center center',
          willChange: 'transform',
        }}
      >
        <div 
          onClick={canTapToDecide ? handleOpenDecisionModal : undefined}
          className={`relative w-[88vw] max-w-[360px] sm:max-w-[420px] h-[58vh] max-h-[520px] min-h-[420px] transition-transform ${
            canTapToDecide ? 'cursor-pointer active:scale-[0.98]' : ''
          }`}
        >
          <FlippableCard 
            card={card} 
            isFlipped={hasRevealed} 
            isSelected={true} 
            isZoomed={true}
            isDisabled={false} 
            onClick={canTapToDecide ? handleOpenDecisionModal : undefined}
            onActionClick={canTapToDecide ? handleOpenDecisionModal : undefined} 
          />
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="min-h-screen flex flex-col items-center p-4 pt-safe-top relative overflow-hidden">
        {toast && (
          <div key={toast.key} className="fixed bottom-6 inset-x-4 sm:inset-x-auto sm:right-8 sm:max-w-md bg-slate-900/95 backdrop-blur-md text-white py-3.5 px-5 rounded-2xl shadow-[0_15px_30px_rgba(0,0,0,0.5)] border border-white/20 z-50 animate-snackbar flex items-center justify-center gap-2" role="status">
            <span className="text-xl">⚡</span>
            <p className="text-sm sm:text-base font-bold text-center">{toast.message}</p>
          </div>
        )}
        <AppHeader />
        <div className="relative w-full max-w-3xl flex flex-col items-center flex-grow justify-between">
          <div className="flex flex-col items-center w-full">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-orange-500/20 text-orange-300 border border-orange-400/30 mb-2 animate-pulse">
              🔥 {t('chaosMode')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-400 drop-shadow-md text-center">
              {t('minigameTitle')}
            </h2>
            <p className="text-base sm:text-lg mb-4 sm:mb-6 text-white/80 min-h-[2rem] text-center flex items-center justify-center font-medium px-4">
              {!selectedCardId && (isMyTurn ? t('minigamePickACard') : t('minigameWaiting', { playerName: activePlayerName }))}
              {selectedCardId && !hasRevealed && (<span className="animate-pulse text-[#FBBF24] font-bold">{isMyTurn ? t('minigameRevealPrompt') : t('minigameWaiting', { playerName: activePlayerName })}</span>)}
              {selectedCardId && hasRevealed && (<span className="text-amber-200 font-semibold">{activePlayerName}</span>)}
            </p>
          </div>
          
          <div 
            ref={containerRef}
            className="w-full flex-grow grid grid-cols-1 grid-rows-1 items-center justify-items-center relative"
          >
            <div className="col-start-1 row-start-1 w-full flex items-center justify-center">
              {renderThreeCards()}
            </div>
            {selectedCardId && (
              <div className="col-start-1 row-start-1 w-full flex items-center justify-center">
                {renderSelectedCard()}
              </div>
            )}
          </div>

          <div className="h-24 flex items-center justify-center w-full mt-2">
            {hasRevealed && minigameState.actionApplied && isMyTurn && !revealedOutcome?.requiresPlayerChoice && (
              <button 
                onClick={() => {
                  triggerHaptic('LIGHT');
                  endMinigame();
                }} 
                className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-black uppercase tracking-widest py-4 px-10 rounded-full shadow-[0_10px_25px_rgba(16,185,129,0.4)] transition-all transform active:scale-95 text-lg animate-fade-in relative z-20 border border-emerald-300/40"
              >
                {t('minigameContinueButton')}
              </button>
            )}
          </div>
        </div>
      </div>
      {isPlayerSelectionModalOpen && isMyTurn && revealedOutcome?.playerChoicePromptKey && (
        <PlayerSelectionModal 
          prompt={t(revealedOutcome.playerChoicePromptKey)} 
          onClose={() => setPlayerSelectionModalOpen(false)} 
          onPlayerSelected={(targetPlayerId) => {
            setPlayerSelectionModalOpen(false);
            applyCardActionAndEnd({ targetPlayerId });
          }} 
        />
      )}
    </>
  );
};

export default CardDrawScreen;
