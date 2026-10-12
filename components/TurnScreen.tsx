
import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameSessionContext';
import { useTranslations } from '../contexts/TranslationsContext';
import TimerDisplay from './TimerDisplay';
import { PlayerWithId, Language, TurnChaosType, GameState } from '../types';
import { TURN_DURATION_SECONDS } from '../constants';
import AppHeader from './AppHeader';
import { triggerHaptic } from '../utils/nativeUtils';
import { 
  start10SecCountdownSound, 
  stop10SecCountdownSound, 
  playTurnEndedSound, 
  playSuccessSound, 
  playSkipSound,
  playHornSound 
} from '../utils/soundUtils';

interface AutoFitWordProps {
  word: string;
  language: Language;
}

const splitIntoLines = (text: string): string[] => {
  const words = text.trim().split(/\s+/);
  if (words.length <= 1) return [text];
  if (words.length === 2) return [words[0], words[1]];
  if (words.length === 3) {
    if (words[1].length <= 3) {
      return [`${words[0]} ${words[1]}`, words[2]];
    }
    const opt1Max = Math.max(words[0].length + 1 + words[1].length, words[2].length);
    const opt2Max = Math.max(words[0].length, words[1].length + 1 + words[2].length);
    return opt1Max <= opt2Max ? [`${words[0]} ${words[1]}`, words[2]] : [words[0], `${words[1]} ${words[2]}`];
  }
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
};

const AutoFitWord: React.FC<AutoFitWordProps> = ({ word, language }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState<number>(72);

  const fontClass = language === Language.HE ? 'font-secular-one' : 'font-outfit';
  const lines = splitIntoLines(word);

  useLayoutEffect(() => {
    const calculateSize = () => {
      if (!containerRef.current || !measureRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      const measuredWidth = measureRef.current.offsetWidth;

      if (containerWidth > 0 && measuredWidth > 0) {
        // Leave 8% margin for safety against any font-rendering or subpixel overflow
        const availableWidth = containerWidth * 0.92;
        // Text is measured at 100px font-size
        const widthBasedSize = Math.floor((availableWidth / measuredWidth) * 100);

        // Height constraint so multi-line text doesn't overflow vertically
        const maxHeightBasedSize = lines.length === 1 ? 135 : lines.length === 2 ? 92 : 68;

        const ideal = Math.min(widthBasedSize, maxHeightBasedSize);
        const clamped = Math.max(28, ideal);
        setFontSize(clamped);
      }
    };

    calculateSize();
    window.addEventListener('resize', calculateSize);
    return () => window.removeEventListener('resize', calculateSize);
  }, [word, language]);

  return (
    <div ref={containerRef} className="w-full max-w-full overflow-hidden flex items-center justify-center relative py-2">
      {/* Hidden off-screen probe at exactly 100px to measure the widest line */}
      <div
        ref={measureRef}
        aria-hidden="true"
        className={`absolute opacity-0 pointer-events-none uppercase font-black text-[100px] leading-none ${fontClass}`}
        style={{ visibility: 'hidden', top: -9999, left: -9999 }}
      >
        {lines.map((line, idx) => (
          <div key={idx} className="whitespace-nowrap">
            {line}
          </div>
        ))}
      </div>

      {/* Visible word: multi-line supported on word boundaries, font size maximized */}
      <div
        key={word}
        className={`animate-word-quick flex flex-col items-center justify-center font-black uppercase select-none tracking-tight leading-[1.05] ${fontClass}`}
        style={{ fontSize: `${fontSize}px` }}
      >
        {lines.map((line, idx) => (
          <span key={idx} className="whitespace-nowrap text-center">
            {line}
          </span>
        ))}
      </div>
    </div>
  );
};

const TurnScreen: React.FC = () => {
  const { gameSession, endTurn, handleGuessedWord, handleRivalGuessedWord, handleSkipWord, localPlayerId } = useGame();
  const { t, language } = useTranslations();
  const fontClass = language === Language.HE ? 'font-secular-one' : 'font-outfit';
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  
  const isLocalGame = gameSession?.gameMode === 'local';
  const isDuoMode = gameSession?.playMode === 'duo';
  const isTeamsMode = gameSession?.playMode === 'teams';
  const turnChaos = gameSession?.activeTurnChaos;
  const turnDuration = isDuoMode ? 30 : (turnChaos?.type === TurnChaosType.SHORT_TURN && turnChaos.value ? turnChaos.value : TURN_DURATION_SECONDS);

  const [isReadyForTurn, setIsReadyForTurn] = useState(!isLocalGame);
  const [timeLeft, setTimeLeft] = useState(turnDuration);
  const [guessNotification, setGuessNotification] = useState<{ id: string; word: string; guesserName: string; points?: number } | null>(null);
  const [pointDeltaBadge, setPointDeltaBadge] = useState<{ id: string; delta: '+1' | '-1' } | null>(null);
  const [wordStartTime, setWordStartTime] = useState<number>(Date.now());
  const [secondsOnCurrentWord, setSecondsOnCurrentWord] = useState<number>(0);
  const hasHornPlayedForWordRef = useRef<boolean>(false);
  const lastProcessedGuessIdRef = useRef<string | null>(gameSession?.lastGuessEvent?.id || null);
  const prevGameSessionRef = useRef(gameSession);
  const isPlayingCountdownRef = useRef(false);

  useEffect(() => {
    setWordStartTime(Date.now());
    setSecondsOnCurrentWord(0);
    hasHornPlayedForWordRef.current = false;
  }, [gameSession?.currentWord]);

  useEffect(() => {
    if (!isTeamsMode || !gameSession?.turnStartTime) return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - wordStartTime) / 1000);
      setSecondsOnCurrentWord(elapsed);
      if (elapsed >= 8 && !hasHornPlayedForWordRef.current && gameSession?.currentWord) {
        hasHornPlayedForWordRef.current = true;
        playHornSound();
      }
    }, 200);
    return () => clearInterval(interval);
  }, [isTeamsMode, gameSession?.turnStartTime, gameSession?.currentWord, wordStartTime]);

  const rivalCooldownRemaining = Math.max(0, 8 - secondsOnCurrentWord);
  const isRivalStealUnlocked = rivalCooldownRemaining === 0 && !!gameSession?.currentWord;

  const triggerPointBadge = useCallback((delta: '+1' | '-1') => {
    setPointDeltaBadge({
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      delta,
    });
  }, []);

  useEffect(() => {
    if (!pointDeltaBadge) return;
    const timer = setTimeout(() => {
      setPointDeltaBadge(null);
    }, 1250);
    return () => clearTimeout(timer);
  }, [pointDeltaBadge]);

  useEffect(() => {
    if (!guessNotification) return;
    const timer = setTimeout(() => {
      setGuessNotification(null);
    }, 3400);
    return () => clearTimeout(timer);
  }, [guessNotification]);

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
            stop10SecCountdownSound();
            isPlayingCountdownRef.current = false;
            playTurnEndedSound();
            if (isLocalGame || localPlayerId === gameSession.currentTurnPlayerId) {
                endTurn();
            }
            clearInterval(timerId);
          } else {
            setTimeLeft(newTimeLeft);
            if (newTimeLeft <= 10) {
              if (!isPlayingCountdownRef.current) {
                isPlayingCountdownRef.current = true;
                start10SecCountdownSound();
              }
              if (newTimeLeft <= 5) {
                triggerHaptic('LIGHT');
              }
            }
          }
      }, 1000);
      return () => clearInterval(timerId);
    }
  }, [gameSession?.turnStartTime, endTurn, turnDuration, localPlayerId, gameSession?.currentTurnPlayerId, isReadyForTurn, isLocalGame]);

  useEffect(() => {
    return () => {
      stop10SecCountdownSound();
      isPlayingCountdownRef.current = false;
    };
  }, []);
  
  useEffect(() => {
    if (!gameSession) return;

    // 1. Direct event sync from GameSession (works in both FFA and Team modes across all devices)
    if (gameSession.lastGuessEvent && gameSession.lastGuessEvent.id !== lastProcessedGuessIdRef.current) {
      lastProcessedGuessIdRef.current = gameSession.lastGuessEvent.id;
      // Only show if the event was created recently (within last 6 seconds) to avoid replaying old events
      if (Date.now() - gameSession.lastGuessEvent.timestamp < 6000) {
        setGuessNotification({
          id: gameSession.lastGuessEvent.id,
          word: gameSession.lastGuessEvent.word,
          guesserName: gameSession.lastGuessEvent.guesserName,
          points: gameSession.lastGuessEvent.points,
        });
        triggerHaptic('SUCCESS');
        playSuccessSound();
      }
    } else {
      // 2. Fallback detection based on score increase
      const prevSession = prevGameSessionRef.current;
      if (prevSession?.gameState === GameState.TURN_ACTIVE && prevSession.currentWord && gameSession.gameState === GameState.TURN_ACTIVE) {
        let wasGuessed = false;
        let guesserName = '';
        let points = 1;

        if (gameSession.playMode === 'teams' && gameSession.teams && prevSession.teams) {
          const activeTeamId = gameSession.activeTeamId || 'team1';
          const oldScore = prevSession.teams[activeTeamId]?.score || 0;
          const newScore = gameSession.teams[activeTeamId]?.score || 0;
          if (newScore > oldScore) {
            wasGuessed = true;
            guesserName = gameSession.teams[activeTeamId]?.name || (activeTeamId === 'team1' ? t('defaultTeam1Name') : t('defaultTeam2Name'));
            points = newScore - oldScore;
          }
        } else {
          const explainerId = prevSession.currentTurnPlayerId;
          for (const playerId in gameSession.players) {
            if (playerId === explainerId) continue;
            const oldPlayer = prevSession.players[playerId];
            const newPlayer = gameSession.players[playerId];
            if (oldPlayer && newPlayer && newPlayer.score > oldPlayer.score) {
              wasGuessed = true;
              guesserName = newPlayer.name;
              points = newPlayer.score - oldPlayer.score;
              break;
            }
          }
        }

        if (wasGuessed && guesserName) {
          const fallbackId = `${Date.now()}_${guesserName}`;
          if (fallbackId !== lastProcessedGuessIdRef.current) {
            lastProcessedGuessIdRef.current = fallbackId;
            setGuessNotification({
              id: fallbackId,
              word: prevSession.currentWord,
              guesserName,
              points,
            });
            triggerHaptic('SUCCESS');
            playSuccessSound();
          }
        }
      }
    }
    prevGameSessionRef.current = gameSession;
  }, [gameSession, t]);
  
  if (!gameSession) {
    return <div className="flex items-center justify-center min-h-screen p-4"><div className="text-xl text-slate-100">{t('getReady')}...</div></div>;
  }
  
  const explainer = gameSession.players[gameSession.currentTurnPlayerId];
  const isMyTurnExplainer = localPlayerId === gameSession.currentTurnPlayerId;
  const isExplainerView = isLocalGame || isMyTurnExplainer;
  const playersArray: PlayerWithId[] = Object.entries(gameSession.players).map(([id, player]) => ({ id, ...player }));
  const potentialGuessers = playersArray.filter(p => p.id !== gameSession.currentTurnPlayerId);
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
        return null;
      case TurnChaosType.QUESTIONS_ONLY:
        return (
          <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-0 opacity-10">
            <span className="text-[40rem] font-black text-white leading-none">?</span>
          </div>
        );
      default: return null;
    }
  };

  const activeTeamId = gameSession.activeTeamId || 'team1';
  const activeTeam = gameSession.teams ? gameSession.teams[activeTeamId] : undefined;
  const activeTeamName = activeTeam?.name || (activeTeamId === 'team1' ? t('defaultTeam1Name') : t('defaultTeam2Name'));

  const handleGuessed = (guesserId?: string) => {
    triggerPointBadge('+1');
    playSuccessSound();
    handleGuessedWord(guesserId);
  };

  const handleRivalGuessed = () => {
    triggerPointBadge('+1');
    triggerHaptic('MEDIUM');
    playSuccessSound();
    handleRivalGuessedWord();
  };

  const handleSkip = () => {
    triggerPointBadge('-1');
    triggerHaptic('WARNING');
    playSkipSound();
    handleSkipWord();
  };

  const handleEndTurnEarly = () => {
    stop10SecCountdownSound();
    isPlayingCountdownRef.current = false;
    playTurnEndedSound();
    endTurn();
  };

  if (isLocalGame && !isReadyForTurn) {
    const readyName = isTeamsMode ? activeTeamName : (explainer?.name || '...');
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 pt-safe-top text-center">
        <div className="w-full max-w-md bg-white/10 backdrop-blur-md p-8 rounded-xl shadow-2xl text-white animate-fade-in">
          <h2 className="text-3xl font-bold mb-4">{t('readyScreenTitle', { playerName: readyName })}</h2>
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
    const explainerName = isTeamsMode ? (activeTeamName || 'Team') : (explainer?.name || '...');
    const template = t('isExplaining', { playerName: '||NAME||' });
    const nameParts = template.includes('||NAME||') ? template.split('||NAME||') : null;

    return (
      <>
        <div className="min-h-[100dvh] flex flex-col items-center justify-between p-4 pt-safe-top pb-safe-bottom text-white relative overflow-hidden select-none">
          {isLowTime && <div className="absolute inset-0 bg-red-600/20 animate-pulse z-30 pointer-events-none"></div>}
          {renderChaosOverlay()}

          {/* Logo on top of the page with status bar margins */}
          <div className="w-full flex justify-center z-10">
            <AppHeader />
          </div>

          {/* Vertically centered content: Title then Timer in a container */}
          <div className="flex-1 w-full max-w-md flex flex-col items-center justify-center text-center z-10 px-4 my-auto">
            <h1 className={`text-3xl sm:text-4xl font-black text-white mb-8 tracking-wide drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] leading-tight ${fontClass}`}>
              {nameParts ? (
                <>
                  <span>{nameParts[0]}</span>
                  <span className="text-[#FBBF24] drop-shadow-[0_2px_10px_rgba(251,191,36,0.5)]">
                    {explainerName}
                  </span>
                  <span>{nameParts[1]}</span>
                </>
              ) : (
                t('isExplaining', { playerName: explainerName })
              )}
            </h1>

            {/* Dedicated Timer Container */}
            <div className="w-full bg-white/10 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-white/15 shadow-2xl flex flex-col items-center justify-center">
              <TimerDisplay timeLeft={timeLeft} duration={turnDuration} />
            </div>
          </div>

          {/* Optical balance spacer for top header */}
          <div className="w-full h-12 opacity-0 pointer-events-none" aria-hidden="true" />
        </div>

        {/* Floating Celebratory Guess Badge Notification */}
        {guessNotification && (
          <div 
            key={guessNotification.id} 
            className="fixed bottom-10 sm:bottom-14 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-max max-w-[92vw] sm:max-w-md px-2 flex justify-center pb-safe-bottom" 
            role="status"
          >
            <div className="animate-badge-pop bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-600 text-white py-3 px-5 sm:px-6 rounded-full shadow-[0_12px_36px_rgba(16,185,129,0.55),0_0_0_2px_rgba(255,255,255,0.25)] border-2 border-emerald-300 flex items-center gap-2.5 sm:gap-3 backdrop-blur-md">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/25 flex items-center justify-center text-white shrink-0 shadow-[inset_0_1px_3px_rgba(255,255,255,0.6)]">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white filter drop-shadow" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-base font-bold whitespace-nowrap overflow-hidden">
                <span className="text-white drop-shadow-sm font-extrabold truncate max-w-[110px] sm:max-w-[150px]">{guessNotification.guesserName}</span>
                <span className="text-emerald-100 font-medium shrink-0">{language === Language.HE ? 'ניחש/ה' : (language === Language.AR ? 'خمّن' : (language === Language.PT ? 'acertou' : 'guessed'))}</span>
                <span className="text-amber-300 font-black tracking-wide drop-shadow-md truncate max-w-[110px] sm:max-w-[160px]">"{guessNotification.word}"</span>
                <span className="bg-amber-400 text-purple-950 text-[10px] sm:text-xs font-black px-2 sm:px-2.5 py-0.5 rounded-full shadow-sm shrink-0">
                  +{guessNotification.points || 1} {t('pointsSuffix')}
                </span>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-between p-4 pt-safe-top relative">
        {isLowTime && <div className="absolute inset-0 bg-red-600/20 animate-pulse z-30 pointer-events-none"></div>}
        {renderChaosOverlay()}
        {turnChaos && turnChaos.descriptionKey && (
          <div className="w-full max-w-2xl bg-purple-600 text-white p-2.5 rounded-2xl text-center text-sm shadow-lg mb-2 z-20 animate-hard-cut border border-purple-400/30">
            <strong className="font-bold uppercase tracking-widest">Chaos:</strong> {t(turnChaos.descriptionKey)}
          </div>
        )}
        
        <header className="w-full max-w-2xl p-4 sm:p-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg text-white relative z-10">
          <TimerDisplay 
            timeLeft={timeLeft} 
            duration={turnDuration} 
          />
          {isTeamsMode && activeTeam ? (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10 px-2">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${activeTeamId === 'team1' ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'}`}></span>
                <span className="font-black text-sm uppercase tracking-wider">{activeTeamName}</span>
              </div>
              <div className="flex items-center gap-2">
                {pointDeltaBadge && (
                  <span
                    key={pointDeltaBadge.id}
                    className={`animate-score-pop font-black text-xs sm:text-sm px-2.5 py-0.5 rounded-full shadow-md ${
                      pointDeltaBadge.delta === '+1'
                        ? 'bg-emerald-500 text-white border border-emerald-300'
                        : 'bg-red-600 text-white border border-red-300'
                    }`}
                  >
                    {pointDeltaBadge.delta}
                  </span>
                )}
                <span className="font-mono font-black text-base text-[#FBBF24]">
                  {activeTeam.score} / {gameSession.winningScore} {t('pointsSuffix')}
                </span>
              </div>
            </div>
          ) : isDuoMode ? (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10 px-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                <span className="font-black text-sm uppercase tracking-wider">{explainer?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {pointDeltaBadge && (
                  <span
                    key={pointDeltaBadge.id}
                    className={`animate-score-pop font-black text-xs sm:text-sm px-2.5 py-0.5 rounded-full shadow-md ${
                      pointDeltaBadge.delta === '+1'
                        ? 'bg-emerald-500 text-white border border-emerald-300'
                        : 'bg-red-600 text-white border border-red-300'
                    }`}
                  >
                    {pointDeltaBadge.delta}
                  </span>
                )}
                <span className="font-mono font-black text-base text-[#FBBF24]">
                  {gameSession.duoScore || 0} / {gameSession.winningScore} {t('pointsSuffix')}
                </span>
              </div>
            </div>
          ) : (
            explainer && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10 px-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#FBBF24] shadow-[0_0_8px_rgba(251,191,36,0.8)]"></span>
                  <span className="font-black text-sm uppercase tracking-wider">{explainer.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {pointDeltaBadge && (
                    <span
                      key={pointDeltaBadge.id}
                      className={`animate-score-pop font-black text-xs sm:text-sm px-2.5 py-0.5 rounded-full shadow-md ${
                        pointDeltaBadge.delta === '+1'
                          ? 'bg-emerald-500 text-white border border-emerald-300'
                          : 'bg-red-600 text-white border border-red-300'
                      }`}
                    >
                      {pointDeltaBadge.delta}
                    </span>
                  )}
                  <span className="font-mono font-black text-base text-[#FBBF24]">
                    {explainer.score || 0} / {gameSession.winningScore} {t('pointsSuffix')}
                  </span>
                </div>
              </div>
            )
          )}
        </header>

        <main className="flex-grow flex flex-col items-center justify-center w-full max-w-2xl my-2 sm:my-4 relative z-10">
          <div className="p-2 sm:p-4 text-center text-white w-full min-h-[220px] sm:min-h-[260px] flex flex-col items-center justify-center">
              {gameSession.currentWord ? (
                <div className="text-center w-full max-w-full">
                  <p className="text-xs sm:text-sm font-black uppercase tracking-[0.3em] mb-2 sm:mb-3 text-white/40">{t('word')}</p>
                  <AutoFitWord word={gameSession.currentWord} language={gameSession.language} />
                </div>
              ) : (
                <p className="text-2xl font-bold uppercase tracking-widest">{t('noWordsLeft')}</p>
              )}
          </div>
        </main>

        {isTeamsMode ? (
          <section className="w-full max-w-2xl my-2 mb-6 sm:mb-8 text-center px-4 relative z-10 flex flex-col items-center gap-3">
            {/* Active Team Guess Button */}
            <button 
              onClick={() => handleGuessed()} 
              disabled={!gameSession.currentWord} 
              className="w-full max-w-md h-20 sm:h-24 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 active:scale-95 text-white font-black text-2xl sm:text-3xl uppercase tracking-wider rounded-full shadow-[0_8px_30px_rgba(16,185,129,0.45)] border-2 border-emerald-300/40 transition-all flex items-center justify-center gap-3 disabled:opacity-40 disabled:pointer-events-none"
            >
              <span>{t('guessedButton')}</span>
            </button>

            {/* Rival Team Steal Button (Unlocked after 8s) */}
            <button
              onClick={handleRivalGuessed}
              disabled={!isRivalStealUnlocked}
              className={`w-full max-w-md h-20 sm:h-24 rounded-full font-black uppercase tracking-wider text-xl sm:text-2xl transition-all duration-300 flex items-center justify-center px-4 shadow-lg ${
                isRivalStealUnlocked
                  ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-white shadow-[0_8px_30px_rgba(245,158,11,0.5)] border-2 border-amber-300/60 active:scale-95 animate-pulse-subtle cursor-pointer'
                  : 'bg-white/10 text-white/40 border border-white/10 cursor-not-allowed opacity-60'
              }`}
            >
              {isRivalStealUnlocked ? (
                <span>{t('rivalGuessedButton') || 'Other Team Guessed!'}</span>
              ) : (
                <span>
                  {t('rivalGuessLocked', { seconds: String(rivalCooldownRemaining) }) || `Other Team Guess (${rivalCooldownRemaining}s)`}
                </span>
              )}
            </button>
          </section>
        ) : isDuoMode ? (
          <section className="w-full max-w-2xl my-2 mb-8 sm:mb-12 text-center px-4 relative z-10 flex flex-col items-center">
            <button 
              onClick={() => handleGuessed()} 
              disabled={!gameSession.currentWord} 
              className="w-full max-w-md h-20 sm:h-24 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 active:scale-95 text-white font-black text-2xl sm:text-3xl uppercase tracking-wider rounded-full shadow-[0_8px_30px_rgba(16,185,129,0.45)] border-2 border-emerald-300/40 transition-all flex items-center justify-center gap-3 disabled:opacity-40 disabled:pointer-events-none"
            >
              <span>{t('guessedButton')}</span>
            </button>
          </section>
        ) : (
          <section className="w-full max-w-2xl my-2 mb-8 sm:mb-12 text-center px-4 relative z-10">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-[0.25em] mb-3 sm:mb-4 text-white/50">{t('selectGuesserTitle')}</h3>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              {potentialGuessers.map(player => (
                <button 
                  key={player.id} 
                  onClick={() => handleGuessed(player.id)} 
                  disabled={!gameSession.currentWord} 
                  className="flex items-center justify-center bg-white/15 hover:bg-white/25 active:bg-white/30 backdrop-blur-md px-7 py-3.5 sm:px-8 sm:py-4 rounded-full border-2 border-white/20 hover:border-white/40 transition-all active:scale-95 text-white disabled:opacity-30 disabled:pointer-events-none shadow-xl"
                >
                  <span className="font-black text-xl sm:text-2xl tracking-tight drop-shadow-sm">{player.name}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        <footer className="w-full max-w-2xl p-4 bg-white/10 backdrop-blur-md rounded-[28px] border border-white/10 shadow-xl mt-6 sm:mt-8 mb-3 relative z-10">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <button 
              onClick={handleEndTurnEarly} 
              className="h-14 sm:h-16 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-black uppercase tracking-wider text-sm sm:text-base rounded-full shadow-[0_4px_20px_rgba(220,38,38,0.45)] border border-red-400/30 active:scale-95 transition-all flex items-center justify-center px-4"
            >
              {t('endTurnEarlyButton')}
            </button>
            <button 
              onClick={handleSkip} 
              disabled={!gameSession.currentWord} 
              className="h-14 sm:h-16 bg-[#FBBF24] hover:bg-[#f59e0b] active:bg-[#d97706] text-[#3b0764] font-black uppercase tracking-wider text-sm sm:text-base rounded-full shadow-[0_4px_20px_rgba(251,191,36,0.35)] active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center px-4"
            >
              {t('skipButton')}
            </button>
          </div>
        </footer>
      </div>
    </>
  );
};

export default TurnScreen;
