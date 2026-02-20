
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameSessionContext';
import { useTranslations } from '../contexts/TranslationsContext';
import TimerDisplay from './TimerDisplay';
import PlayerChip from './PlayerChip';
import { PlayerWithId, Language, TurnChaosType, GameState } from '../types';
import { TURN_DURATION_SECONDS } from '../constants';
import AppHeader from './AppHeader';
import { triggerHaptic } from '../utils/nativeUtils';

const TurnScreen: React.FC = () => {
  const { gameSession, advanceTurn, handleGuessedWord, handleSkipWord, localPlayerId } = useGame();
  const { t } = useTranslations();
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  
  const isLocalGame = gameSession?.gameMode === 'local';
  const turnChaos = gameSession?.activeTurnChaos;
  const turnDuration = turnChaos?.type === TurnChaosType.SHORT_TURN && turnChaos.value ? turnChaos.value : TURN_DURATION_SECONDS;

  const [isReadyForTurn, setIsReadyForTurn] = useState(!isLocalGame);
  const [timeLeft, setTimeLeft] = useState(turnDuration);
  const [guessNotification, setGuessNotification] = useState<{ word: string; guesserName: string } | null>(null);
  const prevGameSessionRef = useRef(gameSession);

  useEffect(() => {
    if (!gameSession) { navigate('/'); return; }
    if (!isLocalGame && gameSession.gameId !== gameId) { navigate('/'); return; }

    if (gameSession.turnStartTime) {
      const elapsedSeconds = Math.floor((Date.now() - gameSession.turnStartTime) / 1000);
      const remaining = turnDuration - elapsedSeconds;
      setTimeLeft(remaining > 0 ? remaining : 0);
    } else {
      setTimeLeft(turnDuration);
    }
  }, [gameSession, gameId, navigate, turnDuration, isLocalGame]);
  
  useEffect(() => {
    if (!isReadyForTurn) return;
    if (gameSession?.turnStartTime) {
      const timerId = setInterval(() => {
          const elapsed = Math.floor((Date.now() - gameSession.turnStartTime!) / 1000);
          const newTimeLeft = turnDuration - elapsed;
          if (newTimeLeft <= 0) {
            setTimeLeft(0);
            if (isLocalGame || localPlayerId === gameSession.currentTurnPlayerId) {
                advanceTurn();
            }
            clearInterval(timerId);
          } else {
            setTimeLeft(newTimeLeft);
          }
      }, 1000);
      return () => clearInterval(timerId);
    }
  }, [gameSession?.turnStartTime, advanceTurn, turnDuration, localPlayerId, gameSession?.currentTurnPlayerId, isReadyForTurn, isLocalGame]);
  
  useEffect(() => {
    const prevSession = prevGameSessionRef.current;
    if (prevSession?.gameState === GameState.TURN_ACTIVE && prevSession.currentWord && gameSession) {
        let wasGuessed = false;
        let guesserId: string | null = null;
        const explainerId = prevSession.currentTurnPlayerId;
        for (const playerId in gameSession.players) {
            if (playerId === explainerId) continue;
            const oldPlayer = prevSession.players[playerId];
            const newPlayer = gameSession.players[playerId];
            if (oldPlayer && newPlayer && newPlayer.score > oldPlayer.score) {
                wasGuessed = true;
                guesserId = playerId;
                break;
            }
        }
        if (wasGuessed && guesserId) {
            const guesser = gameSession.players[guesserId];
            setGuessNotification({ word: prevSession.currentWord, guesserName: guesser.name });
            triggerHaptic('SUCCESS');
            setTimeout(() => setGuessNotification(null), 4000);
        }
    }
    prevGameSessionRef.current = gameSession;
  }, [gameSession]);
  
  if (!gameSession) {
    return <div className="flex items-center justify-center min-h-screen p-4"><div className="text-xl text-slate-100">{t('getReady')}...</div></div>;
  }
  
  const explainer = gameSession.players[gameSession.currentTurnPlayerId];
  const isMyTurnExplainer = localPlayerId === gameSession.currentTurnPlayerId;
  const isExplainerView = isLocalGame || isMyTurnExplainer;
  const playersArray: PlayerWithId[] = Object.entries(gameSession.players).map(([id, player]) => ({ id, ...player }));
  const potentialGuessers = playersArray.filter(p => p.id !== gameSession.currentTurnPlayerId);
  const leadingScore = playersArray.reduce((max, p) => p.score > max ? p.score : max, 0);
  const isLowTime = timeLeft <= 10 && timeLeft > 0;

  const renderChaosOverlay = () => {
    if (!turnChaos) return null;
    switch (turnChaos.type) {
      case TurnChaosType.BREAKING_NEWS:
        return (
          <div className="fixed top-0 left-0 w-full z-50 pointer-events-none">
            <div className="bg-red-700 text-white font-black py-2 px-4 uppercase tracking-[0.3em] flex items-center gap-4 animate-hard-cut">
              <span className="bg-white text-red-700 px-2 py-0.5 rounded animate-pulse">LIVE</span>
              <div className="overflow-hidden whitespace-nowrap">
                <div className="inline-block animate-[slot-spin_5s_linear_infinite] translate-y-0">
                   +++ BREAKING NEWS +++ {explainer?.name.toUpperCase()} ON THE SCENE +++ {explainer?.name.toUpperCase()} ON THE SCENE +++
                </div>
              </div>
            </div>
          </div>
        );
      case TurnChaosType.SOUNDS_AND_MIME:
        return (
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-20 z-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-96 h-96 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          </div>
        );
      case TurnChaosType.QUESTIONS_ONLY:
        return (
          <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-0 opacity-10">
            <span className="text-[40rem] font-black text-white leading-none">?</span>
          </div>
        );
      default: return null;
    }
  };

  const handleSkip = () => {
    triggerHaptic('WARNING');
    handleSkipWord();
  };

  if (isLocalGame && !isReadyForTurn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <div className="w-full max-w-md bg-white/10 backdrop-blur-md p-8 rounded-xl shadow-2xl text-white animate-fade-in">
          <h2 className="text-3xl font-bold mb-4">{t('readyScreenTitle', { playerName: explainer?.name || '...' })}</h2>
          <p className="text-lg mb-8">{t('readyScreenMessage')}</p>
          <button 
            onClick={() => {
              triggerHaptic('LIGHT');
              setIsReadyForTurn(true);
            }}
            className="w-full bg-[#FBBF24] text-[#4c1d95] font-black py-4 px-6 rounded-full shadow-lg transition-transform transform hover:scale-105"
          >
            {t('showWordButton')}
          </button>
        </div>
      </div>
    );
  }

  if (!isExplainerView) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 pt-8 sm:pt-12 text-white relative">
        {isLowTime && <div className="absolute inset-0 bg-red-600/20 animate-pulse z-30 pointer-events-none"></div>}
        {renderChaosOverlay()}
        {guessNotification && (
          <div key={guessNotification.word} className="fixed bottom-6 left-1/2 -translate-x-1/2 w-auto max-w-[calc(100vw-2rem)] sm:max-w-md bg-slate-800/95 backdrop-blur-sm text-white py-3 px-5 rounded-lg shadow-2xl z-50 flex items-center gap-4 animate-snackbar" role="status">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-base font-medium">
              <span className="font-bold">{guessNotification.guesserName}</span>
              <span> guessed "</span><span className="font-bold text-yellow-300">{guessNotification.word}</span><span>" (+1 {t('pointsSuffix')})</span>
            </p>
          </div>
        )}
        <AppHeader />
        <div className="w-full max-lg bg-white/10 backdrop-blur-md p-6 sm:p-8 rounded-xl shadow-2xl text-center relative z-10">
            <h2 className="text-2xl font-semibold mb-4 text-slate-200">{t('guessingScreenTitle')}</h2>
            <p className="text-3xl font-bold mb-8 text-yellow-300">{t('isExplaining', { playerName: explainer?.name || '...' })}</p>
            <TimerDisplay timeLeft={timeLeft} duration={turnDuration} />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col items-center justify-between p-4 pt-4 sm:pt-6 relative ${turnChaos ? 'animate-chaos-cut' : ''}`}>
      {isLowTime && <div className="absolute inset-0 bg-red-600/20 animate-pulse z-30 pointer-events-none"></div>}
      {renderChaosOverlay()}
      {turnChaos && <div className="absolute top-0 inset-x-0 bg-purple-600 text-white p-2 text-center text-sm shadow-lg z-20 animate-hard-cut"><strong className="font-bold uppercase tracking-widest">Chaos:</strong> {t(turnChaos.descriptionKey)}</div>}
      
      <header className="w-full max-w-2xl flex justify-between items-center p-4 bg-white/10 backdrop-blur-md rounded-lg shadow-lg text-white relative z-10">
        <div className="overflow-hidden">
          <h2 className="text-xl font-bold truncate">{(explainer?.name || t('player'))}</h2>
          <p className="text-xs font-bold opacity-60 uppercase tracking-widest">{t('yourScore')}: {explainer?.score} {t('pointsSuffix')}</p>
        </div>
        <TimerDisplay timeLeft={timeLeft} duration={turnDuration} />
      </header>

      <main className="flex-grow flex flex-col items-center justify-center w-full max-w-2xl my-4 relative z-10">
        <div className="p-8 sm:p-12 text-center text-white w-full min-h-[220px] flex flex-col items-center justify-center">
            {gameSession.currentWord ? (
              <div className="text-center overflow-hidden">
                <p className="text-xs font-bold uppercase tracking-[0.4em] mb-4 text-white/40">{t('word')}</p>
                <p 
                  key={gameSession.currentWord}
                  className={`text-4xl sm:text-7xl font-black break-words uppercase ${gameSession.language === Language.HE ? 'font-secular-one' : 'font-outfit'}`} 
                  style={{ textShadow: '0px 10px 30px rgba(0,0,0,0.5)' }}
                >
                  {gameSession.currentWord}
                </p>
              </div>
            ) : (
              <p className="text-2xl font-bold uppercase tracking-widest">{t('noWordsLeft')}</p>
            )}
        </div>
      </main>

      <section className="w-full max-w-2xl my-4 text-center px-4 relative z-10">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] mb-4 text-white/40">{t('selectGuesserTitle')}</h3>
        <div className="flex flex-wrap justify-center gap-2">
          {potentialGuessers.map(player => (
            <button key={player.id} onClick={() => handleGuessedWord(player.id)} disabled={!gameSession.currentWord} className="flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/10 transition-all active:scale-95 text-white disabled:opacity-30 disabled:pointer-events-none shadow-lg">
              <span className="font-bold text-sm tracking-tight">{player.name}</span>
            </button>
          ))}
        </div>
      </section>

      <footer className="w-full max-w-2xl p-4 bg-white/10 backdrop-blur-md rounded-[30px] border border-white/10 shadow-lg mt-2 relative z-10">
        <div className="grid grid-cols-2 gap-3">
          <button onClick={handleSkip} disabled={!gameSession.currentWord} className="h-14 bg-[#FBBF24] text-[#4c1d95] font-black uppercase tracking-widest rounded-full shadow-md active:scale-95 disabled:opacity-50 transition-all">{t('skipButton')}</button>
          <button onClick={advanceTurn} className="h-14 border-2 border-red-500 text-red-500 font-black uppercase tracking-widest rounded-full shadow-md active:scale-95 transition-all">{t('endTurnEarlyButton')}</button>
        </div>
        <div className="mt-6 flex flex-col items-center">
            <h3 className="text-[10px] font-bold uppercase tracking-widest mb-3 text-white/30">{t('currentPlayers')}</h3>
            <div className="flex flex-wrap justify-center gap-2">
                {playersArray.map(p => (<PlayerChip key={p.id} player={p} isCurrent={p.id === gameSession.currentTurnPlayerId} isHost={!!p.isHost} isLeading={p.score === leadingScore && leadingScore > 0} compact={true} />))}
            </div>
        </div>
      </footer>
    </div>
  );
};

export default TurnScreen;
