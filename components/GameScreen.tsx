import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameSessionContext';
import { useTranslations } from '../contexts/TranslationsContext';
import PlayerChip from './PlayerChip';
import { ChaosEvent, PlayerWithId } from '../types';
import AppHeader from './AppHeader';
import TurnChaosModal from './TurnChaosModal';
import GameRulesModal from './GameRulesModal';

const GameScreen: React.FC = () => {
  const { gameSession, startTurn, leaveGame, localPlayerId } = useGame();
  const { t, language, setLanguage } = useTranslations();
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();

  const prevChaosEventRef = useRef(gameSession?.activeChaosEvent);
  const [showChaosNotification, setShowChaosNotification] = useState(false);
  const [isTurnChaosModalOpen, setTurnChaosModalOpen] = useState(false);
  const [isRulesModalOpen, setRulesModalOpen] = useState(false);
  
  const isLocalGame = gameSession?.gameMode === 'local';

  useEffect(() => {
    if (gameSession?.language && gameSession.language !== language) {
      setLanguage(gameSession.language, false);
    }
  }, [gameSession?.language, language, setLanguage]);

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

  const isTeamsMode = gameSession.playMode === 'teams';
  const isDuoMode = gameSession.playMode === 'duo';
  const activeTeamId = gameSession.activeTeamId || 'team1';
  const activeTeam = gameSession.teams ? gameSession.teams[activeTeamId] : undefined;
  const activeTeamName = activeTeam?.name || (activeTeamId === 'team1' ? t('defaultTeam1Name') : t('defaultTeam2Name'));
  
  const currentPlayerForTurn = gameSession.players[gameSession.currentTurnPlayerId];
  const currentPlayerName = currentPlayerForTurn ? `${currentPlayerForTurn.name}${currentPlayerForTurn.chaosNickname ? ` ${currentPlayerForTurn.chaosNickname}` : ''}`: '';
  
  const isMyTeamTurn = localPlayerId ? gameSession.players[localPlayerId]?.teamId === activeTeamId : false;
  const isMyTurn = localPlayerId === gameSession.currentTurnPlayerId;
  const canStartTurn = isLocalGame || isMyTurn || (isTeamsMode && isMyTeamTurn);

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
    if (isLocalGame) {
      return t('startButtonLabel');
    }
    if (isTeamsMode) {
      if (isMyTurn) return t('startButtonLabel');
      if (isMyTeamTurn) return t('startButtonLabel');
      return t('waitingForPlayerTurn', { playerName: activeTeamName });
    }
    if (isDuoMode) {
      if (isMyTurn) return t('startButtonLabel');
      return t('waitingForPlayerTurn', { playerName: currentPlayerForTurn?.name || '' });
    }
    if (isMyTurn) {
      return t('startButtonLabel'); 
    }
    return t('waitingForPlayerTurn', { playerName: currentPlayerForTurn?.name || '' });
  };

  return (
    <>
    <div className="min-h-screen flex flex-col items-center p-4 pt-safe-top relative">
      {showChaosNotification && chaosMessage && (
        <div className="absolute top-[var(--page-top-spacing)] inset-x-4 bg-purple-600/90 backdrop-blur-sm text-white text-center p-3 rounded-lg shadow-lg animate-bounce z-20">
          <p className="font-bold">{t('chaosEventStarted')} {chaosMessage}!</p>
        </div>
      )}
      <AppHeader />
      
      <div className="w-full max-w-lg mt-4 px-2 animate-fade-in">
        {/* Next Up Section Container */}
        <div className="text-center mb-10 p-6 bg-white/10 backdrop-blur-md rounded-[30px] border border-white/20 shadow-xl">
            {isDuoMode ? (
              <div className="inline-block bg-emerald-950/70 border border-emerald-400/40 px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider text-emerald-300 mb-3 shadow-inner">
                {t('duoRoundLabel')?.replace('{current}', String(gameSession.duoCurrentRound || 1)).replace('{total}', String(gameSession.duoTotalRounds || 2)) || `Round ${gameSession.duoCurrentRound || 1} of ${gameSession.duoTotalRounds || 2}`}
              </div>
            ) : (
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50 mb-1">{t('nextUp')}</p>
            )}
            <p className="text-3xl font-black text-white mb-2">
              {isTeamsMode ? activeTeamName : currentPlayerName}
              {gameSession.activeTurnChaos && <span className="text-[#FBBF24] text-xs block mt-2 animate-pulse tracking-widest uppercase">{t('specialRuleActive') || 'Special Rule Active!'}</span>}
            </p>
            {isDuoMode ? (
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-300/80 mb-6">
                {isLocalGame
                  ? t('isExplaining', { playerName: currentPlayerName })
                  : (isMyTurn ? (t('yourTurnToExplain') || "Your turn to explain!") : t('isExplaining', { playerName: currentPlayerName }))}
              </p>
            ) : isTeamsMode && !isLocalGame ? (
              <p className="text-xs font-bold uppercase tracking-wider text-white/60 mb-6">
                {isMyTurn ? (t('yourTurnToExplain') || "Your turn to explain!") : (isMyTeamTurn ? (t('yourTeamTurn') || "Your team's turn!") : (t('otherTeamTurn') || "Other team's turn"))}
              </p>
            ) : (
              <div className="mb-6"></div>
            )}

            <button
                onClick={handleStartTurnClick}
                disabled={!canStartTurn}
                className={`w-full h-[60px] rounded-full bg-[#FBBF24] text-[#4c1d95] font-black uppercase tracking-widest text-lg shadow-[0_10px_30px_rgba(251,191,36,0.3)] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:scale-100 disabled:cursor-not-allowed ${canStartTurn ? 'animate-gentle-pulse' : ''}`}
              >
                {getStartButtonText()}
            </button>
        </div>
        
        {/* Scoreboard Section */}
        {isTeamsMode && gameSession.teams ? (
          <div className="mb-10 space-y-4">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/40 mb-3 px-4 text-center">{t('finalScores')}</h2>
            <div className="grid grid-cols-2 gap-3">
              {/* Team 1 Score Card */}
              <div className={`p-5 rounded-[24px] border backdrop-blur-md transition-all ${
                activeTeamId === 'team1'
                  ? 'bg-cyan-950/60 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)] ring-2 ring-cyan-400/50'
                  : 'bg-white/5 border-white/10 opacity-80'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-3 rounded-full bg-cyan-400"></span>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight truncate">{gameSession.teams.team1.name}</h3>
                </div>
                <div className="flex items-baseline justify-between mt-3">
                  <span className="text-4xl font-black text-cyan-300 font-mono">{gameSession.teams.team1.score}</span>
                  <span className="text-xs text-white/50 font-bold">/ {gameSession.winningScore} {t('pointsSuffix')}</span>
                </div>
                <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden mt-3">
                  <div 
                    className="bg-cyan-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (gameSession.teams.team1.score / gameSession.winningScore) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Team 2 Score Card */}
              <div className={`p-5 rounded-[24px] border backdrop-blur-md transition-all ${
                activeTeamId === 'team2'
                  ? 'bg-amber-950/60 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)] ring-2 ring-amber-400/50'
                  : 'bg-white/5 border-white/10 opacity-80'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight truncate">{gameSession.teams.team2.name}</h3>
                </div>
                <div className="flex items-baseline justify-between mt-3">
                  <span className="text-4xl font-black text-amber-300 font-mono">{gameSession.teams.team2.score}</span>
                  <span className="text-xs text-white/50 font-bold">/ {gameSession.winningScore} {t('pointsSuffix')}</span>
                </div>
                <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden mt-3">
                  <div 
                    className="bg-amber-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (gameSession.teams.team2.score / gameSession.winningScore) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        ) : isDuoMode ? (
          <div className="mb-10 space-y-4 max-w-md mx-auto w-full">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/40 mb-3 px-4 text-center">
              {t('duoScoreLabel') || 'Co-op Team Score'}
            </h2>
            <div className="p-5 rounded-[24px] border border-emerald-400/40 bg-emerald-950/60 shadow-[0_0_25px_rgba(16,185,129,0.25)] backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                  <span className="text-sm font-black text-white uppercase tracking-wider truncate max-w-[200px]">
                    {Object.values(gameSession.players).map(p => p.name).join(' & ')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-emerald-300 font-mono">
                    {gameSession.duoScore || 0}
                  </span>
                  <span className="text-xs text-white/50 font-bold ml-1.5">
                    / {gameSession.winningScore} {t('pointsSuffix')}
                  </span>
                </div>
              </div>
              <div className="w-full bg-black/40 h-2.5 rounded-full overflow-hidden mt-4 border border-white/10">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-green-400 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                  style={{ width: `${Math.min(100, ((gameSession.duoScore || 0) / gameSession.winningScore) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
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
        )}

        <div className="flex flex-col items-center pb-8 gap-3">
          {/* Subtle area to view game rules & scoring */}
          <button
            type="button"
            id="ready-rules-btn"
            onClick={() => setRulesModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white/80 hover:text-white text-xs font-bold tracking-wider uppercase backdrop-blur-sm transition-all active:scale-95 shadow-sm"
          >
            <span className="text-amber-300 text-sm">📖</span>
            <span>{t('gameRulesAndScoring') || 'Rules & Scoring'}</span>
          </button>

          {/* Leave game button: takes less visual attention */}
          <button
            type="button"
            onClick={leaveGame}
            className="text-red-400/50 hover:text-red-400 font-semibold text-[11px] tracking-wider uppercase py-1 px-3 rounded-lg hover:bg-red-500/10 transition-colors active:scale-95"
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

    {isRulesModalOpen && (
      <GameRulesModal
        currentMode={isDuoMode ? 'duo' : isTeamsMode ? 'teams' : 'individual'}
        onClose={() => setRulesModalOpen(false)}
      />
    )}
    </>
  );
};

export default GameScreen;