import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GameSession, Player, Language, GameState, WinningScore, ChaosEvent, LoadingStep, LoadingStatus, AppTranslations } from '../types';
import { TURN_DURATION_SECONDS, CHAOS_EVENT_CHANCE } from '../constants';
import { generateId, shuffleArray, generateGameCode } from '../utils/gameUtils';
import { CHAOS_NICKNAMES } from '../utils/chaosUtils';
import { applyMinigameOutcome } from '../utils/minigameLogic';
import { calculateStartTurn, calculateAdvanceTurn, calculateGuess, calculateSkip } from '../utils/turnLogic';
import { useTranslations } from './TranslationsContext';
import { listenToGameUpdates, createGameInDb, getGameFromDb, runGameTransaction, addPendingPlayer, listenToPendingPlayers } from '../services/firebaseService';
import { AdMob } from '@capacitor-community/admob';

const LOCAL_PLAYER_ID_KEY = 'sayWhaaat_localPlayerId';

interface GameSessionContextType {
  gameSession: GameSession | null;
  isLoading: boolean;
  localPlayerId: string | null;
  loadingTitle: string;
  loadingSteps: LoadingStep[];
  isJoinChecklistVisible: boolean;
  joinChecklistSteps: LoadingStep[];
  createNewGame: (hostName: string, language: Language, winningScore: WinningScore, isChaosMode: boolean) => Promise<GameSession | null>;
  createLocalGame: (playerNames: string[], language: Language, winningScore: WinningScore, isChaosMode: boolean) => Promise<void>;
  joinGame: (gameId: string, playerName?: string) => Promise<GameSession | null>;
  addPlayer: (playerName: string) => Promise<void>;
  requestStartGame: () => void;
  leaveGame: () => void;
  startTurn: () => void;
  advanceTurn: () => void;
  handleGuessedWord: (guesserId: string) => void;
  handleSkipWord: () => void;
  startRematch: () => void;
  selectCard: (cardId: string) => void;
  revealCardOutcome: () => void;
  applyCardAction: (payload: { targetPlayerId?: string }) => void;
  endMinigame: () => void;
  startMinigameSimulation: () => void;
  resetLoadingState: () => void;
  resetJoinChecklist: () => void;
}

const GameSessionContext = createContext<GameSessionContextType | undefined>(undefined);

export const GameSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameSession, setGameSessionState] = useState<GameSession | null>(null);
  const [localPlayerId, setLocalPlayerId] = useState<string | null>(null);
  const adShownThisRoundRef = useRef(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslations();
  
  const getGameIdFromPath = (path: string): string | undefined => {
    const match = path.match(/\/(?:lobby|game|turn|minigame|gameover)\/([A-Z0-9]{4}|local)/i);
    return match?.[1]?.toUpperCase();
  };

  const gameIdFromUrl = getGameIdFromPath(location.pathname);
  // Robust initial fetching state
  const [isFetching, setIsFetching] = useState(!!gameIdFromUrl && gameIdFromUrl.toUpperCase() !== 'LOCAL');
  const [isInitializing, setIsInitializing] = useState(true);

  // Allow initial render to complete before setting up Firebase listeners
  // Use a ref-based flag to avoid race conditions with setTimeout
  const initializationCompleteRef = useRef(false);

  useEffect(() => {
    // Mark initialization as complete after first render cycle
    if (!initializationCompleteRef.current) {
      initializationCompleteRef.current = true;
      setIsInitializing(false);
    }
  }, []);

  const [loadingTitle, setLoadingTitle] = useState('');
  const [loadingSteps, setLoadingSteps] = useState<LoadingStep[]>([]);
  const [isJoinChecklistVisible, setIsJoinChecklistVisible] = useState(false);
  const [joinChecklistSteps, setJoinChecklistSteps] = useState<LoadingStep[]>([]);
  
  const isCreatingOrJoiningRef = useRef(false);
  const isLeavingRef = useRef(false);
  const unsubscribeListenerRef = useRef<(() => void) | null>(null);

  const gameSessionRef = useRef(gameSession);
  useEffect(() => {
    gameSessionRef.current = gameSession;
  }, [gameSession]);
  
  useEffect(() => {
    const storedPlayerId = localStorage.getItem(LOCAL_PLAYER_ID_KEY);
    if (storedPlayerId) {
      setLocalPlayerId(storedPlayerId);
    }
  }, []);

  const updateStepStatus = useCallback((key: keyof AppTranslations, status: LoadingStatus) => {
    setLoadingSteps(prevSteps =>
      prevSteps.map(step => (step.key === key ? { ...step, status } : step))
    );
  }, []);

  useEffect(() => {
    // Don't set up listeners during initial render to prevent hydration errors
    if (isInitializing) {
      return;
    }

    if (gameSessionRef.current?.gameMode === 'local') {
      setIsFetching(false);
      return;
    }

    if (unsubscribeListenerRef.current) {
      unsubscribeListenerRef.current();
      unsubscribeListenerRef.current = null;
    }

    if (!gameIdFromUrl || gameIdFromUrl.toUpperCase() === 'LOCAL') {
      if (!isCreatingOrJoiningRef.current) {
        if (gameSessionRef.current?.gameMode === 'online') {
          setGameSessionState(null);
        }
      }
      setIsFetching(false);
      return;
    }

    isLeavingRef.current = false;

    const syncGameSession = async () => {
      if (!isCreatingOrJoiningRef.current) {
          setIsFetching(true);
      }

      try {
        const initialSession = await getGameFromDb(gameIdFromUrl);
        if (!isLeavingRef.current) {
            setGameSessionState(initialSession);
        }

        unsubscribeListenerRef.current = listenToGameUpdates(gameIdFromUrl, (session) => {
          if (isLeavingRef.current) return;
          setGameSessionState(session);
        });

      } catch (error: any) {
        console.error(`[GameSession] CRITICAL: Failed to fetch or listen to game ${gameIdFromUrl}:`, error);
        setGameSessionState(null);
      } finally {
        if (!isCreatingOrJoiningRef.current) {
           setIsFetching(false);
        }
      }
    };

    syncGameSession();

    return () => {
      if (unsubscribeListenerRef.current) {
        unsubscribeListenerRef.current();
        unsubscribeListenerRef.current = null;
      }
    };
  }, [gameIdFromUrl, isInitializing]);

  const resetLoadingState = useCallback(() => {
    setIsFetching(false);
    setLoadingTitle('');
    setLoadingSteps([]);
    isCreatingOrJoiningRef.current = false;
    isLeavingRef.current = false;
    navigate('/');
  }, [navigate]);

  const resetJoinChecklist = useCallback(() => {
    setIsJoinChecklistVisible(false);
    setJoinChecklistSteps([]);
    sessionStorage.removeItem('saywhaaat_join_refreshed');
  }, []);

  const createNewGame = useCallback(async (hostName: string, language: Language, winningScore: WinningScore, isChaosMode: boolean): Promise<GameSession | null> => {
    sessionStorage.removeItem('saywhaaat_lobby_refreshed');
    isCreatingOrJoiningRef.current = true;
    isLeavingRef.current = false;
    setIsFetching(true);
    setLoadingTitle(t('loadingCreatingGame'));
    
    const steps: LoadingStep[] = [
      { key: 'loadingStepFetchWords', status: 'pending' },
      { key: 'loadingStepGenerateId', status: 'pending' },
      { key: 'loadingStepCreateSession', status: 'pending' },
      { key: 'loadingStepRender', status: 'pending' },
      { key: 'loadingStepNavigate', status: 'pending' },
    ];
    setLoadingSteps(steps);

    let currentStepKey: keyof AppTranslations = 'loadingStepFetchWords';

    try {
      updateStepStatus(currentStepKey, 'in-progress');
      const response = await fetch(`/data/words_${language}.json`);
      if (!response.ok) {
        const statusStr = String(response.status);
        const statusTextStr = String(response.statusText || 'unknown status');
        throw new Error(`Failed to fetch words: ${statusStr} ${statusTextStr}`);
      }
      
      const wordsList = (await response.json()) as string[];
      
      if (!wordsList || wordsList.length === 0) throw new Error(t('noWordsAvailableError'));
      updateStepStatus(currentStepKey, 'completed');

      currentStepKey = 'loadingStepGenerateId';
      updateStepStatus(currentStepKey, 'in-progress');
      const newGameId = generateGameCode();
      const hostId = generateId();
      const hostPlayer: Player = { name: hostName, score: 0, isHost: true };
      const newSession: GameSession = {
        gameId: newGameId, hostId, gameMode: 'online',
        players: { [hostId]: hostPlayer },
        playerOrder: [hostId],
        language, winningScore,
        currentPlayerIndex: 0, currentTurnPlayerId: hostId, words: shuffleArray(wordsList),
        turnTimer: TURN_DURATION_SECONDS, gameState: GameState.LOBBY,
        currentWord: null, turnStartTime: null,
        isChaosMode, activeChaosEvent: null, activeTurnChaos: null, minigameState: null,
        pendingPlayers: null,
        playerCount: 1,
      };
      updateStepStatus(currentStepKey, 'completed');

      currentStepKey = 'loadingStepCreateSession';
      updateStepStatus(currentStepKey, 'in-progress');
      await createGameInDb(newGameId, newSession);
      updateStepStatus(currentStepKey, 'completed');
      
      localStorage.setItem(LOCAL_PLAYER_ID_KEY, hostId);
      setLocalPlayerId(hostId);
      
      currentStepKey = 'loadingStepRender';
      updateStepStatus(currentStepKey, 'in-progress');
      const confirmedSession = await getGameFromDb(newGameId);
      if (!confirmedSession) throw new Error("Could not verify game creation.");
      setGameSessionState(confirmedSession);
      updateStepStatus(currentStepKey, 'completed');
      
      currentStepKey = 'loadingStepNavigate';
      updateStepStatus(currentStepKey, 'in-progress');
      navigate(`/lobby/${newGameId}`);
      updateStepStatus(currentStepKey, 'completed');

      setTimeout(() => {
        setIsFetching(false);
        isCreatingOrJoiningRef.current = false;
      }, 400);

      return confirmedSession;

    } catch (error: any) {
      console.error("[GameAction] CRITICAL FAILURE in createNewGame:", error);
      updateStepStatus(currentStepKey, 'failed');
      setLoadingTitle(t('loadingStepError'));
      isCreatingOrJoiningRef.current = false;
      return null;
    }
  }, [t, navigate, updateStepStatus]);

  const prepareGameStart = (session: GameSession): GameSession => {
    let sessionWithChaos = { ...session };
    if (sessionWithChaos.isChaosMode && Math.random() < CHAOS_EVENT_CHANCE) {
      // FIX: Cast CHAOS_NICKNAMES to any to prevent potential 'unknown' type inference on indexed access using dynamic language key
      const languageNicknames = (CHAOS_NICKNAMES as any)[sessionWithChaos.language] || (CHAOS_NICKNAMES as any)[Language.EN];
      const nicknames = shuffleArray(languageNicknames as string[]);
      sessionWithChaos.playerOrder.forEach((playerId, index) => {
        if (sessionWithChaos.players[playerId]) {
            sessionWithChaos.players[playerId].chaosNickname = nicknames[index % nicknames.length];
        }
      });
      sessionWithChaos.activeChaosEvent = ChaosEvent.NICKNAMES;
    }
    return { ...sessionWithChaos, gameState: GameState.IN_GAME };
  };

  const _internal_startGame = useCallback((sessionToStart?: GameSession) => {
    adShownThisRoundRef.current = false; // Reset ad flag for the new round
    const currentGame = sessionToStart || gameSessionRef.current;
    if (!currentGame) return;

    const finalSession = prepareGameStart(currentGame);
    
    if (currentGame.gameMode === 'online') {
        runGameTransaction(currentGame.gameId, (currentDbSession) => {
            if (!currentDbSession) return undefined;
            return { ...currentDbSession, ...finalSession };
        });
    } else {
        setGameSessionState(finalSession);
    }
  }, []);

  const createLocalGame = useCallback(async (playerNames: string[], language: Language, winningScore: WinningScore, isChaosMode: boolean) => {
    isCreatingOrJoiningRef.current = true;
    setIsFetching(true);
    setLoadingTitle(t('loadingCreatingGame'));
    
    try {
      const response = await fetch(`/data/words_${language}.json`);
      if (!response.ok) {
        const statusStr = String(response.status);
        const statusTextStr = String(response.statusText || 'unknown status');
        throw new Error(`Failed to fetch words: ${statusStr} ${statusTextStr}`);
      }
      const wordsList = (await response.json()) as string[];
      if (!wordsList || wordsList.length === 0) throw new Error(t('noWordsAvailableError'));

      const players: { [playerId: string]: Player } = {};
      const playerOrder: string[] = [];
      playerNames.forEach(name => {
        const id = generateId();
        players[id] = { name, score: 0 };
        playerOrder.push(id);
      });

      const shuffledPlayerOrder = shuffleArray(playerOrder);

      const baseSession: GameSession = {
        gameId: `local-${generateId()}`,
        gameMode: 'local',
        players,
        playerOrder: shuffledPlayerOrder,
        language, winningScore,
        currentPlayerIndex: 0,
        currentTurnPlayerId: shuffledPlayerOrder[0] || '',
        words: shuffleArray(wordsList),
        turnTimer: TURN_DURATION_SECONDS,
        gameState: GameState.LOBBY, 
        currentWord: null, turnStartTime: null,
        isChaosMode, activeChaosEvent: null, activeTurnChaos: null, minigameState: null,
        playerCount: playerNames.length,
      };
      
      const startedSession = prepareGameStart(baseSession);
      setGameSessionState(startedSession);

      navigate('/game/local', { replace: true });
      setIsFetching(false);
      
      setTimeout(() => {
           isCreatingOrJoiningRef.current = false;
      }, 500);

    } catch (e: any) {
      const error = e instanceof Error ? e : new Error(String(e));
      const errorMessage = String(error.message);
      alert(`${t('loadingStepError')} ${errorMessage}`);
      setIsFetching(false);
      isCreatingOrJoiningRef.current = false;
      navigate('/');
    }
  }, [t, navigate]);

  const joinGame = useCallback(async (gameIdToJoin: string, playerName?: string): Promise<GameSession | null> => {
    const upperCaseGameId = gameIdToJoin.toUpperCase();
    isCreatingOrJoiningRef.current = true;
    isLeavingRef.current = false;
    setIsFetching(true);
    setLoadingTitle(t('loadingJoiningGame'));

    const steps: LoadingStep[] = [
        { key: 'loadingStepVerifyCode', status: 'pending' },
        { key: 'loadingStepRender', status: 'pending' },
        { key: 'loadingStepNavigate', status: 'pending' },
    ];
    setLoadingSteps(steps);
    let currentStepKey: keyof AppTranslations = 'loadingStepVerifyCode';

    try {
      updateStepStatus(currentStepKey, 'in-progress');
      const session = await getGameFromDb(upperCaseGameId);
      if (!session) {
        throw new Error(t('gameNotFound'));
      }
      updateStepStatus(currentStepKey, 'completed');

      currentStepKey = 'loadingStepRender';
      updateStepStatus(currentStepKey, 'in-progress');
      setGameSessionState(session);
      updateStepStatus(currentStepKey, 'completed');
      
      currentStepKey = 'loadingStepNavigate';
      updateStepStatus(currentStepKey, 'in-progress');
      navigate(`/lobby/${upperCaseGameId}`, { state: { playerName } });
      updateStepStatus(currentStepKey, 'completed');
      
      setTimeout(() => {
        setIsFetching(false);
        isCreatingOrJoiningRef.current = false;
      }, 400);
      
      return session;

    } catch (error: any) {
      updateStepStatus(currentStepKey, 'failed');
      setLoadingTitle(t('gameNotFound'));
      setIsFetching(false);
      isCreatingOrJoiningRef.current = false;
      return null;
    }
  }, [t, navigate, updateStepStatus]);

  const addPlayer = useCallback(async (playerName: string) => {
    const updateStep = (key: keyof AppTranslations, status: LoadingStatus) => {
      setJoinChecklistSteps(prev => prev.map(s => (s.key === key ? { ...s, status } : s)));
    };
  
    const initialSteps: LoadingStep[] = [
      { key: 'checklistGeneratingId', status: 'pending' },
      { key: 'checklistValidating', status: 'pending' },
      { key: 'checklistConfirming', status: 'pending' },
    ];
    setJoinChecklistSteps(initialSteps);
    setIsJoinChecklistVisible(true);
  
    const gameId = gameSessionRef.current?.gameId;
    if (!gameId) {
      updateStep('checklistValidating', 'failed');
      return;
    }
    
    updateStep('checklistGeneratingId', 'in-progress');
    const newPlayerId = generateId();
    localStorage.setItem(LOCAL_PLAYER_ID_KEY, newPlayerId);
    setLocalPlayerId(newPlayerId);
    updateStep('checklistGeneratingId', 'completed');

    updateStep('checklistValidating', 'in-progress');
    try {
      const newPlayer: Player = { name: playerName, score: 0 };
      await addPendingPlayer(gameId, newPlayerId, newPlayer);
      updateStep('checklistValidating', 'completed');
      updateStep('checklistConfirming', 'in-progress');
    } catch (error: any) {
      updateStep('checklistValidating', 'failed');
      localStorage.removeItem(LOCAL_PLAYER_ID_KEY);
      setLocalPlayerId(null);
    }
  }, []);

  useEffect(() => {
    const waitingStep = joinChecklistSteps.find(s => s.key === 'checklistConfirming');
    if (isJoinChecklistVisible && waitingStep?.status === 'in-progress') {
      if (localPlayerId && gameSession?.playerOrder.includes(localPlayerId)) {
        setJoinChecklistSteps(prev => prev.map(s => 
          s.key === 'checklistConfirming' ? { ...s, status: 'completed' } : s
        ));
        setTimeout(resetJoinChecklist, 1500);
      }
    }
  }, [gameSession?.playerOrder, localPlayerId, isJoinChecklistVisible, joinChecklistSteps, resetJoinChecklist]);

  useEffect(() => {
    let timeoutId: number | undefined;
    const isJoining = isJoinChecklistVisible && joinChecklistSteps.some(s => s.key === 'checklistConfirming' && s.status === 'in-progress');
    if (isJoining) {
      const hasRefreshed = sessionStorage.getItem('saywhaaat_join_refreshed');
      if (!hasRefreshed) {
        timeoutId = window.setTimeout(() => {
          sessionStorage.setItem('saywhaaat_join_refreshed', 'true');
          window.location.reload();
        }, 5000);
      }
    }
    return () => clearTimeout(timeoutId);
  }, [isJoinChecklistVisible, joinChecklistSteps]);

  const unsubscribePendingPlayersRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const isUserHost = localPlayerId === gameSession?.hostId;
    const currentGameId = gameSession?.gameId;

    if (isUserHost && currentGameId && gameSession.gameMode === 'online') {
      if (!unsubscribePendingPlayersRef.current) {
        unsubscribePendingPlayersRef.current = listenToPendingPlayers(currentGameId, (pendingPlayers) => {
          if (pendingPlayers && Object.keys(pendingPlayers).length > 0) {
            runGameTransaction(currentGameId, (currentSession) => {
              if (!currentSession?.pendingPlayers) return undefined;
              
              const newPlayers = { ...currentSession.players };
              const newPlayerOrder = [...currentSession.playerOrder];
              let playersAdded = false;

              for (const [playerId, player] of Object.entries(currentSession.pendingPlayers)) {
                if (!newPlayers[playerId]) {
                  newPlayers[playerId] = player;
                  newPlayerOrder.push(playerId);
                  playersAdded = true;
                }
              }
              if (!playersAdded) return { ...currentSession, pendingPlayers: null };
              
              return {
                  ...currentSession,
                  players: newPlayers,
                  playerOrder: newPlayerOrder,
                  playerCount: newPlayerOrder.length,
                  pendingPlayers: null,
              };
            }).catch(err => console.error("[Host] CRITICAL FAILURE processing pending players transaction:", err));
          }
        });
      }
    } 
    else if (unsubscribePendingPlayersRef.current) {
      unsubscribePendingPlayersRef.current();
      unsubscribePendingPlayersRef.current = null;
    }

    return () => {
      if (unsubscribePendingPlayersRef.current) {
        unsubscribePendingPlayersRef.current();
        unsubscribePendingPlayersRef.current = null;
      }
    }
  }, [gameSession, localPlayerId]);

  const requestStartGame = useCallback(() => {
    const currentGame = gameSessionRef.current;
    if (!currentGame) return;

    if (currentGame.playerCount < 2) {
      alert(t('minTwoPlayers'));
      return;
    }
    
    _internal_startGame();

  }, [t, _internal_startGame]);

  const leaveGame = useCallback(() => {
    const currentGame = gameSessionRef.current;
    if (!currentGame) {
        navigate('/');
        return;
    }

    isLeavingRef.current = true;
    
    if (unsubscribeListenerRef.current) {
        unsubscribeListenerRef.current();
        unsubscribeListenerRef.current = null;
    }

    if (currentGame.gameMode === 'local') {
        setGameSessionState(null);
        navigate('/');
        return;
    }

    const gameIdToLeave = currentGame.gameId;
    const playerIdToLeave = localPlayerId;

    sessionStorage.removeItem('saywhaaat_lobby_refreshed');
    localStorage.removeItem(LOCAL_PLAYER_ID_KEY);
    setLocalPlayerId(null);
    setGameSessionState(null);
    navigate('/');

    if (gameIdToLeave && playerIdToLeave) {
      runGameTransaction(gameIdToLeave, (currentSession) => {
        if (!currentSession) return undefined;
        const isPlayerInGame = currentSession.playerOrder.includes(playerIdToLeave);
        if (!isPlayerInGame) return undefined;

        const updatedPlayerOrder = currentSession.playerOrder.filter(id => id !== playerIdToLeave);
        const updatedPlayers = { ...currentSession.players };
        delete updatedPlayers[playerIdToLeave];
        
        if (updatedPlayerOrder.length === 0) return null; 

        let newHostId = currentSession.hostId;
        if (currentSession.hostId === playerIdToLeave && updatedPlayerOrder.length > 0) {
          newHostId = updatedPlayerOrder[0];
          if(updatedPlayers[newHostId]) {
            const player = updatedPlayers[newHostId];
            updatedPlayers[newHostId] = { 
              name: player.name,
              score: player.score,
              isHost: true,
              chaosNickname: player.chaosNickname
            };
          }
        }
        
        return { 
          ...currentSession, 
          hostId: newHostId,
          players: updatedPlayers,
          playerOrder: updatedPlayerOrder,
          playerCount: updatedPlayerOrder.length,
        };
      }).catch(err => console.error(`[GameAction] leaveGame transaction failed for player ${playerIdToLeave}:`, err));
    }
  }, [localPlayerId, navigate]);


  const prepareAd = useCallback(async () => {
    try {
      await AdMob.prepareInterstitial({
        adId: 'ca-app-pub-7599308880531325/6231560290',
        isTesting: true,
      });
      console.log("AD LOG: Ad prepped and ready");
    } catch (e) {
      console.log("AD LOG: Prep failed", e);
    }
  }, []);

  const showAd = useCallback(async () => {
    if (adShownThisRoundRef.current) {
      console.log("AD LOG: Ad already shown this round");
      return;
    }
    try {
      await AdMob.showInterstitial();
      adShownThisRoundRef.current = true;
      prepareAd(); // Pre-load next ad
    } catch (e) {
      console.log("AD LOG: Show failed", e);
      // Even if showing fails, prepare the next one
      prepareAd();
    }
  }, [prepareAd]);

  const startRematch = useCallback(async () => {
    const currentGame = gameSessionRef.current;
    if (!currentGame) return;

    // Show an ad before starting the rematch
    await showAd();

    setIsFetching(true);
    try {
      const wordsList = (await fetch(
        `/data/words_${currentGame.language}.json`
      ).then((res) => res.json())) as string[];

      if (!wordsList || !Array.isArray(wordsList) || wordsList.length === 0) {
        throw new Error("Failed to load words for rematch.");
      }

      let chaosNicknames: string[] = [];
      let shouldTriggerChaos = false;

      if (currentGame.isChaosMode && Math.random() < CHAOS_EVENT_CHANCE) {
         shouldTriggerChaos = true;
         chaosNicknames = shuffleArray(CHAOS_NICKNAMES[currentGame.language] || CHAOS_NICKNAMES[Language.EN]);
      }

      const prepareNewSessionState = (baseSession: GameSession): GameSession => {
          const shuffledWords = shuffleArray(wordsList);
          const resetPlayers: { [key: string]: Player } = {};
          const playerIds = baseSession.playerOrder || Object.keys(baseSession.players);

          playerIds.forEach((pid, index) => {
              const existingP = baseSession.players[pid];
              if (existingP) {
                  const newP: Player = {
                      name: existingP.name,
                      score: 0,
                  };
                  if (existingP.isHost) newP.isHost = true;
                  if (shouldTriggerChaos) {
                      newP.chaosNickname = chaosNicknames[index % chaosNicknames.length];
                  }
                  resetPlayers[pid] = newP;
              }
          });

          return {
              ...baseSession,
              gameState: GameState.IN_GAME,
              players: resetPlayers,
              words: shuffledWords,
              currentPlayerIndex: 0,
              currentTurnPlayerId: playerIds[0] || '',
              currentWord: null,
              turnStartTime: null,
              turnTimer: TURN_DURATION_SECONDS,
              activeChaosEvent: shouldTriggerChaos ? ChaosEvent.NICKNAMES : null,
              activeTurnChaos: null,
              minigameState: null,
              pendingPlayers: null
          };
      };

      if (currentGame.gameMode === 'online') {
        await runGameTransaction(currentGame.gameId, (dbSession) => {
            if (!dbSession) return undefined;
            return prepareNewSessionState(dbSession);
        });
      } else {
        setGameSessionState(prepareNewSessionState(currentGame));
      }
      
    } catch (error: any) {
      alert(t('loadingStepError'));
    } finally {
      setIsFetching(false);
    }
  }, [t]);

  const advanceTurn = useCallback(() => {
    const currentGame = gameSessionRef.current;
    if (!currentGame) return;

    if (currentGame.gameMode === 'online') {
      runGameTransaction(currentGame.gameId, (dbSession) => dbSession ? calculateAdvanceTurn(dbSession) : undefined);
    } else {
      setGameSessionState(calculateAdvanceTurn(currentGame));
    }
  }, []);

  const startTurn = useCallback(() => {
    const currentGame = gameSessionRef.current;
    if (!currentGame || currentGame.gameState !== GameState.IN_GAME) return;
    const safeT = (k: string) => t(k as keyof AppTranslations);

    if (currentGame.gameMode === 'online') {
        runGameTransaction(currentGame.gameId, (dbSession) => dbSession ? calculateStartTurn(dbSession, safeT) : undefined);
    } else {
        const newSession = calculateStartTurn(currentGame, safeT);
        if (newSession) setGameSessionState(newSession);
    }
  }, [t]);

  const handleGuessedWord = useCallback((guesserId: string) => {
    const currentGame = gameSessionRef.current;
    if (!currentGame || currentGame.gameState !== GameState.TURN_ACTIVE) return;
    const safeT = (k: string) => t(k as keyof AppTranslations);

    if (currentGame.gameMode === 'online') {
        runGameTransaction(currentGame.gameId, (dbSession) => dbSession ? calculateGuess(dbSession, guesserId, safeT) : undefined)
            .catch(err => console.error(`[GameAction] handleGuessedWord failed:`, err));
    } else {
        setGameSessionState(calculateGuess(currentGame, guesserId, safeT));
    }
  }, [t]);

  const handleSkipWord = useCallback(() => {
    const currentGame = gameSessionRef.current;
    if (!currentGame || currentGame.gameState !== GameState.TURN_ACTIVE) return;
    const safeT = (k: string) => t(k as keyof AppTranslations);

    if (currentGame.gameMode === 'online') {
        runGameTransaction(currentGame.gameId, (dbSession) => dbSession ? calculateSkip(dbSession, safeT) : undefined)
            .catch(err => console.error(`[GameAction] handleSkipWord failed:`, err));
    } else {
        setGameSessionState(calculateSkip(currentGame, safeT));
    }
  }, [t]);

  const selectCard = useCallback((cardId: string) => {
    const currentGame = gameSessionRef.current;
    if (!currentGame?.minigameState) return;
    const updateFn = (s: GameSession): GameSession => ({ 
        ...s, 
        minigameState: { ...s.minigameState!, selectedCardId: cardId } 
    });

    if (currentGame.gameMode === 'online') {
        runGameTransaction(currentGame.gameId, (db) => db ? updateFn(db) : undefined);
    } else {
        setGameSessionState(prev => {
            if (!prev || !prev.minigameState) return prev;
            return updateFn(prev);
        });
    }
  }, []);

  const revealCardOutcome = useCallback(() => {
    const currentGame = gameSessionRef.current;
    if (!currentGame?.minigameState?.selectedCardId) return;
    const updateFn = (s: GameSession) => {
        const card = s.minigameState!.cards.find(c => c.id === s.minigameState!.selectedCardId);
        if (!card) return s;
        return { ...s, minigameState: { ...s.minigameState!, revealedOutcome: card.outcome } };
    }
    if (currentGame.gameMode === 'online') {
        runGameTransaction(currentGame.gameId, (db) => db ? updateFn(db) : undefined);
    } else {
        setGameSessionState(updateFn(currentGame));
    }
  }, []);
  
  const applyCardAction = useCallback((payload: { targetPlayerId?: string }) => {
    const currentGame = gameSessionRef.current;
    if (!currentGame?.minigameState?.revealedOutcome) return;
    
    if (currentGame.gameMode === 'online') {
        runGameTransaction(currentGame.gameId, (db) => db ? applyMinigameOutcome(db, payload.targetPlayerId) : undefined);
    } else {
        setGameSessionState(applyMinigameOutcome(currentGame, payload.targetPlayerId));
    }
  }, []);

  const endMinigame = useCallback(() => {
    const currentGame = gameSessionRef.current;
    if (!currentGame) return;
    const performEnd = (session: GameSession): GameSession => {
        const nextPlayerIndex = (session.currentPlayerIndex + 1) % session.playerOrder.length;
        return {
          ...session, minigameState: null, gameState: GameState.IN_GAME,
          currentPlayerIndex: nextPlayerIndex,
          currentTurnPlayerId: session.playerOrder[nextPlayerIndex],
          activeChaosEvent: null, activeTurnChaos: null,
        };
    };
    if (currentGame.gameMode === 'online') {
        runGameTransaction(currentGame.gameId, (db) => db ? performEnd(db) : undefined);
    } else {
        setGameSessionState(performEnd(currentGame));
    }
  }, []);

  const startMinigameSimulation = useCallback(async () => {}, []);

  const isLoading = isFetching || isInitializing;

  const value = useMemo(() => ({
    gameSession, isLoading, localPlayerId, loadingTitle, loadingSteps, isJoinChecklistVisible, joinChecklistSteps,
    createNewGame, createLocalGame, joinGame, addPlayer, requestStartGame, leaveGame, startTurn, advanceTurn,
    handleGuessedWord, handleSkipWord, startRematch, selectCard, revealCardOutcome, applyCardAction,
    endMinigame, startMinigameSimulation, resetLoadingState, resetJoinChecklist
  }), [
    gameSession, isLoading, localPlayerId, loadingTitle, loadingSteps, isJoinChecklistVisible, joinChecklistSteps,
    createNewGame, createLocalGame, joinGame, addPlayer, requestStartGame, leaveGame, startTurn, advanceTurn,
    handleGuessedWord, handleSkipWord, startRematch, selectCard, revealCardOutcome, applyCardAction,
    endMinigame, startMinigameSimulation, resetLoadingState, resetJoinChecklist
  ]);

  return (
    <GameSessionContext.Provider value={value}>
      {children}
    </GameSessionContext.Provider>
  );
};

export const useGame = (): GameSessionContextType => {
  const context = useContext(GameSessionContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameSessionProvider');
  }
  return context;
};
