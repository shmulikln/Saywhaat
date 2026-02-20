import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameSessionContext';
import { useTranslations } from '../contexts/TranslationsContext';
import PlayerChip from './PlayerChip';
import { ChaosEvent, PlayerWithId } from '../types';
import AppHeader from './AppHeader';
import TurnChaosModal from './TurnChaosModal';

const GameScreen: React.FC = () => {
  const { gameSession, startTurn, leaveGame, localPlayerId } = useGame();
  const { t } = useTranslations();
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();

  const prevChaosEventRef = useRef(gameSession?.activeChaosEvent);
  const [showChaosNotification, setShowChaosNotification] = useState(false);
  const [isTurnChaosModalOpen, setTurnChaosModalOpen] = useState(false);
  
  const isLocalGame = gameSession?.gameMode === 'local';

  useEffect(() => {
    console.log(`[GameScreen] Mounted for game: ${gameId}`);
  }, [gameId]);

  useEffect(() => {
    if (!gameSession) {
      navigate('/');
      return;
    }
    // For local games, the gameId in URL is 'local'. For online, it's the 4-char code.
    if (!isLocalGame && gameSession.gameId !== gameId) {
      navigate('/');
    }
  }, [gameSession, gameId, navigate, isLocalGame]);

  useEffect(() => {
    if (gameSession?.activeChaosEvent && prevChaosEventRef.current !== gameSession.activeChaosEvent) {
        setShowChaosNotification(true);
        const timer = setTimeout(() => setShowChaosNotification(false), 4000);
        return () => clearTimeout(timer);
    }
    prevChaosEventRef.current = gameSession?.activeChaosEvent;
  }, [gameSession?.activeChaosEvent]);

  if (!gameSession) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <div className="text-xl p-6 bg-white/10 backdrop-blur-md rounded-lg shadow-lg text-slate-100">{t('gameLoadingError')}</div>
      </div>
    );
  }

  const handleStartTurnClick = () => {
    if (gameSession?.activeTurnChaos) {
      setTurnChaosModalOpen(true);
    } else {
      startTurn();
    }
  };

  const handleConfirmChaosTurn = () => {
    setTurnChaosModalOpen(false);
    startTurn();
  };

  const currentPlayerForTurn = gameSession.players[gameSession.currentTurnPlayerId];
  const currentPlayerName = currentPlayerForTurn ? `${currentPlayerForTurn.name}${currentPlayerForTurn.chaosNickname ? ` ${currentPlayerForTurn.chaosNickname}` : ''}`: '';
  const isMyTurn = localPlayerId === gameSession.currentTurnPlayerId;
  const canStartTurn = isLocalGame || isMyTurn;

  const playersArray: PlayerWithId[] = Object.entries(gameSession.players).map(([id, player]) => ({ id, ...player }));
  const leadingScore = playersArray.reduce((max, p) => p.score > max ? p.score : max, 0);
  const playersWithLeadingStatus = playersArray.map(p => ({
    ...p,
    isLeading: p.score === leadingScore && leadingScore > 0,
  }));
  
  const chaosMessageKey = gameSession.activeChaosEvent === ChaosEvent.NICKNAMES
    ? 'chaosEventNicknames'
    : gameSession.activeChaosEvent === ChaosEvent.MINIGAME_TRIGGER
    ? 'chaosEventMinigame'
    : gameSession.activeChaosEvent === ChaosEvent.TURN_MODIFIER
    ? 'chaosEventTurnModifier'
    : null;

  const chaosMessage = chaosMessageKey ? t(chaosMessageKey).split(':')[0] : '';
  
  const getStartButtonText = () => {
    if (isLocalGame || isMyTurn) {
      // Return a clean "Start!" text by stripping "My Turn" if needed, 
      // or using the base translation and refining it.
      return t('startButtonLabel'); 
    }
    return t('waitingForPlayerTurn', { playerName: '' }).replace(/for\s*$/i, '').trim() + '...';
  };

  return (
    <>
    <div className="min-h-screen flex flex-col items-center p-4 pt-4 sm:pt-6 relative">
      {showChaosNotification && chaosMessage && (
        <div className="absolute top-4 inset-x-4 bg-purple-600/90 backdrop-blur-sm text-white text-center p-3 rounded-lg shadow-lg animate-bounce z-20">
          <p className="font-bold">{t('chaosEventStarted')} {chaosMessage}!</p>
        </div>
      )}
      <AppHeader />
      
      <div className="w-full max-w-lg mt-4 px-2">
        {/* Next Up Section Container */}
        <div className="text-center mb-10 p-6 bg-white/10 backdrop-blur-md rounded-[30px] border border-white/20 shadow-xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50 mb-1">{t('nextUp')}</p>
            <p className="text-3xl font-black text-white mb-8">
              {currentPlayerName}
              {gameSession.activeTurnChaos && <span className="text-[#FBBF24] text-xs block mt-2 animate-pulse tracking-widest uppercase">Special Rule Active!</span>}
            </p>

            <button
                onClick={handleStartTurnClick}
                disabled={!canStartTurn}
                className={`w-full h-[60px] rounded-[30px] bg-[#FBBF24] text-[#4c1d95] font-black uppercase tracking-widest text-lg shadow-[0_10px_30px_rgba(251,191,36,0.3)] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:scale-100 disabled:cursor-not-allowed`}
              >
                {getStartButtonText()}
            </button>
        </div>
        
        <div className="mb-10">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/40 mb-4 px-4">{t('currentPlayers')}</h2>
          <div className="flex flex-col gap-3"> 
            {playersWithLeadingStatus.map(player => (
              <PlayerChip 
                key={player.id} 
                player={player} 
                isCurrent={player.id === gameSession.currentTurnPlayerId}
                isHost={player.id === gameSession.hostId}
                isLeading={player.isLeading}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center pb-8">
          <button
            onClick={leaveGame}
            className="px-8 py-3 rounded-full border-2 border-red-500 text-red-500 font-bold uppercase tracking-widest text-xs hover:bg-red-500/10 transition-colors active:scale-95 bg-transparent"
          >
            {t('leaveGame')}
          </button>
        </div>
      </div>
    </div>

    {isTurnChaosModalOpen && canStartTurn && (
      <TurnChaosModal
        onClose={() => setTurnChaosModalOpen(false)}
        onConfirm={handleConfirmChaosTurn}
      />
    )}
    </>
  );
};

export default GameScreen;