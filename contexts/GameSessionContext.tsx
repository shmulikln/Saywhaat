import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GameSession, Player, Team, Language, GameState, WinningScore, ChaosEvent, LoadingStep, LoadingStatus, AppTranslations } from '../types';
import { TURN_DURATION_SECONDS, DUO_TURN_DURATION_SECONDS, CHAOS_EVENT_CHANCE } from '../constants';
import { generateId, shuffleArray, generateGameCode } from '../utils/gameUtils';
import { CHAOS_NICKNAMES } from '../utils/chaosUtils';
import { applyMinigameOutcome } from '../utils/minigameLogic';
import { calculateStartTurn, calculateAdvanceTurn, calculateGuess, calculateSkip, calculateRivalGuess, calculateEndTurn } from '../utils/turnLogic';
import { useTranslations } from './TranslationsContext';
import { listenToGameUpdates, createGameInDb, getGameFromDb, runGameTransaction, addPendingPlayer, listenToPendingPlayers, clearPendingPlayers } from '../services/firebaseService';
import { AdMob } from '@capacitor-community/admob';
import AdOverlay from '../components/AdOverlay';


const LOCAL_PLAYER_ID_KEY = 'sayWhaaat_localPlayerId';

interface GameSessionContextType {
  gameSession: GameSession | null;
  isLoading: boolean;
  localPlayerId: string | null;
  loadingTitle: string;
  loadingSteps: LoadingStep[];
  isJoinChecklistVisible: boolean;
  joinChecklistSteps: LoadingStep[];
  showAdOverlay: boolean;
  setShowAdOverlay: (show: boolean) => void;
  createNewGame: (hostName: string, language: Language, winningScore: WinningScore, isChaosMode: boolean, playMode?: 'ffa' | 'teams' | 'duo', team1Name?: string, team2Name?: string) => Promise<GameSession | null>;
  createLocalGame: (playerNames: string[], language: Language, winningScore: WinningScore, isChaosMode: boolean, playMode?: 'ffa' | 'teams' | 'duo', team1Name?: string, team2Name?: string, customDuoRounds?: number) => Promise<void>;
  joinGame: (gameId: string, playerName?: string, teamId?: 'team1' | 'team2') => Promise<GameSession | null>;
  addPlayer: (playerName?: string, teamId?: 'team1' | 'team2') => Promise<void>;
  switchTeam: (playerId: string, targetTeamId: 'team1' | 'team2') => Promise<void>;
  requestStartGame: () => void;
  leaveGame: () => void;
  startTurn: () => void;
  advanceTurn: () => void;
  endTurn: () => void;
  handleGuessedWord: (guesserId?: string) => void;
  handleRivalGuessedWord: () => void;
  handleSkipWord: () => void;
  startRematch: () => void;
  continueRematch: () => void;
  selectCard: (cardId: string) => void;
  revealCardOutcome: () => void;
  applyCardAction: (payload: { targetPlayerId?: string }) => void;
  endMinigame: () => void;
  startMinigameSimulation: () => void;
  resetLoadingState: () => void;
  resetJoinChecklist: () => void;
  setLanguage: (language: Language) => void;
}

const GameSessionContext = createContext<GameSessionContextType | undefined>(undefined);

export const GameSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameSession, setInternalGameSession] = useState<GameSession | null>(null);
  const gameSessionRef = useRef<GameSession | null>(gameSession);

  const setGameSessionState = useCallback((sessionOrUpdater: GameSession | null | ((prev: GameSession | null) => GameSession | null)) => {
    setInternalGameSession((prev) => {
      const next = typeof sessionOrUpdater === 'function' ? (sessionOrUpdater as any)(prev) : sessionOrUpdater;
      gameSessionRef.current = next;
      return next;
    });
  }, []);

  const [localPlayerId, setLocalPlayerId] = useState<string | null>(null);
  const [showAdOverlay, setShowAdOverlay] = useState(false);

  
  const location = useLocation();
  const navigate = useNavigate();
  const { t, setLanguage } = useTranslations();
  
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
            if (initialSession?.language) {
              setLanguage(initialSession.language, false);
            }
        }

        unsubscribeListenerRef.current = listenToGameUpdates(gameIdFromUrl, (session) => {
          if (isLeavingRef.current) return;
          setGameSessionState(session);
          if (session?.language) {
            setLanguage(session.language, false);
          }
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
  }, [gameIdFromUrl, isInitializing, setLanguage]);

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

  const createNewGame = useCallback(async (
    hostName: string,
    language: Language,
    winningScore: WinningScore,
    isChaosMode: boolean,
    playMode: 'ffa' | 'teams' | 'duo' = 'ffa',
    team1Name?: string,
    team2Name?: string
  ): Promise<GameSession | null> => {
    sessionStorage.removeItem('saywhaaat_lobby_refreshed');
    isCreatingOrJoiningRef.current = true;
    isLeavingRef.current = false;
    setIsFetching(true);
    setLoadingTitle(t('loadingCreatingGame'));
    setLanguage(language);
    
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

      let teamsObj: { team1: Team; team2: Team } | undefined = undefined;
      let hostPlayer: Player;

      if (playMode === 'teams') {
        const t1Name = team1Name?.trim() || t('defaultTeam1Name');
        const t2Name = team2Name?.trim() || t('defaultTeam2Name');
        teamsObj = {
          team1: { id: 'team1', name: t1Name, score: 0, playerIds: [hostId] },
          team2: { id: 'team2', name: t2Name, score: 0, playerIds: [] },
        };
        hostPlayer = {
          name: hostName?.trim() || 'Player 1',
          score: 0,
          isHost: true,
          teamId: 'team1',
        };
      } else {
        hostPlayer = {
          name: hostName?.trim() || 'Host',
          score: 0,
          isHost: true,
        };
      }

      const newSession: GameSession = {
        gameId: newGameId,
        hostId,
        gameMode: 'online',
        playMode,
        ...(playMode === 'teams' && teamsObj ? { teams: teamsObj, activeTeamId: 'team1' } : {}),
        players: { [hostId]: hostPlayer },
        playerOrder: [hostId],
        language,
        winningScore,
        currentPlayerIndex: 0,
        currentTurnPlayerId: hostId,
        words: shuffleArray(wordsList),
        turnTimer: TURN_DURATION_SECONDS,
        gameState: GameState.LOBBY,
        currentWord: null,
        turnStartTime: null,
        isChaosMode,
        activeChaosEvent: null,
        activeTurnChaos: null,
        minigameState: null,
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
    const count = sessionWithChaos.playerOrder?.length || Object.keys(sessionWithChaos.players || {}).length;
    const isDuo = sessionWithChaos.playMode === 'duo' || (sessionWithChaos.playMode !== 'teams' && count === 2);

    if (isDuo) {
      sessionWithChaos.playMode = 'duo';
      sessionWithChaos.isChaosMode = false;
      sessionWithChaos.activeChaosEvent = null;
      sessionWithChaos.activeTurnChaos = null;
      sessionWithChaos.duoScore = 0;
      sessionWithChaos.duoCurrentRound = 1;
      sessionWithChaos.duoTotalRounds = Math.max(2, Math.round(sessionWithChaos.winningScore / 5));
      sessionWithChaos.turnTimer = DUO_TURN_DURATION_SECONDS;
    } else if (sessionWithChaos.isChaosMode && Math.random() < CHAOS_EVENT_CHANCE) {
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
    if (sessionWithChaos.playMode === 'teams') {
      sessionWithChaos.activeTeamId = 'team1';
      const team1Players = sessionWithChaos.playerOrder.filter(id => sessionWithChaos.players[id]?.teamId === 'team1');
      if (team1Players.length > 0) {
        sessionWithChaos.currentTurnPlayerId = team1Players[0];
        sessionWithChaos.currentPlayerIndex = sessionWithChaos.playerOrder.indexOf(team1Players[0]);
      }
    }
    return { ...sessionWithChaos, gameState: GameState.IN_GAME };
  };

  const _internal_startGame = useCallback((sessionToStart?: GameSession) => {
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

  const createLocalGame = useCallback(async (
    playerNames: string[],
    language: Language,
    winningScore: WinningScore,
    isChaosMode: boolean,
    playMode: 'ffa' | 'teams' | 'duo' = 'ffa',
    team1Name?: string,
    team2Name?: string,
    customDuoRounds?: number
  ) => {
    isCreatingOrJoiningRef.current = true;
    setLanguage(language);
    
    try {
      const response = await fetch(`/data/words_${language}.json`);
      if (!response.ok) {
        const statusStr = String(response.status);
        const statusTextStr = String(response.statusText || 'unknown status');
        throw new Error(`Failed to fetch words: ${statusStr} ${statusTextStr}`);
      }
      const wordsList = (await response.json()) as string[];
      if (!wordsList || wordsList.length === 0) throw new Error(t('noWordsAvailableError'));

      let players: { [playerId: string]: Player } = {};
      let playerOrder: string[] = [];
      let teamsObj: { team1: Team; team2: Team } | undefined = undefined;

      if (playMode === 'teams') {
        const t1Name = team1Name?.trim() || t('defaultTeam1Name');
        const t2Name = team2Name?.trim() || t('defaultTeam2Name');
        teamsObj = {
          team1: { id: 'team1', name: t1Name, score: 0 },
          team2: { id: 'team2', name: t2Name, score: 0 },
        };
        players = {
          team1: { name: t1Name, score: 0, teamId: 'team1' },
          team2: { name: t2Name, score: 0, teamId: 'team2' },
        };
        playerOrder = ['team1', 'team2'];
      } else {
        playerNames.forEach(name => {
          const id = generateId();
          players[id] = { name, score: 0 };
          playerOrder.push(id);
        });
        playerOrder = shuffleArray(playerOrder);
      }

      const isDuo = playMode === 'duo' || (playMode !== 'teams' && playerNames.length === 2);
      const finalPlayMode = isDuo ? 'duo' : playMode;

      const baseSession: GameSession = {
        gameId: `local-${generateId()}`,
        gameMode: 'local',
        playMode: finalPlayMode,
        duoScore: isDuo ? 0 : undefined,
        duoCurrentRound: isDuo ? 1 : undefined,
        duoTotalRounds: isDuo ? (customDuoRounds || Math.max(1, Math.round(winningScore / 5))) : undefined,
        teams: teamsObj,
        activeTeamId: playMode === 'teams' ? 'team1' : undefined,
        players,
        playerOrder,
        language, winningScore,
        currentPlayerIndex: 0,
        currentTurnPlayerId: playerOrder[0] || '',
        words: shuffleArray(wordsList),
        turnTimer: isDuo ? DUO_TURN_DURATION_SECONDS : TURN_DURATION_SECONDS,
        gameState: GameState.LOBBY, 
        currentWord: null, turnStartTime: null,
        isChaosMode: isDuo ? false : isChaosMode, activeChaosEvent: null, activeTurnChaos: null, minigameState: null,
        playerCount: playerOrder.length,
      };
      
      const startedSession = prepareGameStart(baseSession);
      setGameSessionState(startedSession);

      navigate('/game/local', { replace: true });
      
      setTimeout(() => {
           isCreatingOrJoiningRef.current = false;
      }, 500);

    } catch (e: any) {
      const error = e instanceof Error ? e : new Error(String(e));
      const errorMessage = String(error.message);
      alert(`${t('loadingStepError')} ${errorMessage}`);
      isCreatingOrJoiningRef.current = false;
      navigate('/');
    }
  }, [t, navigate, prepareGameStart]);

  const joinGame = useCallback(async (gameIdToJoin: string, playerName?: string, teamId?: 'team1' | 'team2'): Promise<GameSession | null> => {
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
      setLanguage(session.language, false);
      updateStepStatus(currentStepKey, 'completed');

      currentStepKey = 'loadingStepRender';
      updateStepStatus(currentStepKey, 'in-progress');
      setGameSessionState(session);
      updateStepStatus(currentStepKey, 'completed');
      
      currentStepKey = 'loadingStepNavigate';
      updateStepStatus(currentStepKey, 'in-progress');
      navigate(`/lobby/${upperCaseGameId}`, { state: { playerName, teamId } });
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

  const addPlayer = useCallback(async (playerName?: string, teamId?: 'team1' | 'team2') => {
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
  
    const currentSession = gameSessionRef.current;
    const gameId = currentSession?.gameId;
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
      let assignedTeamId = teamId;
      if (currentSession?.playMode === 'teams') {
        if (!assignedTeamId) {
          const t1Count = (Object.values(currentSession.players) as Player[]).filter(p => p.teamId === 'team1').length;
          const t2Count = (Object.values(currentSession.players) as Player[]).filter(p => p.teamId === 'team2').length;
          assignedTeamId = t1Count <= t2Count ? 'team1' : 'team2';
        }
      }
      const currentPlayersCount = currentSession?.players ? Object.keys(currentSession.players).length : 1;
      const effectiveName = playerName?.trim() || `Player ${currentPlayersCount + 1}`;
      const newPlayer: Player = { name: effectiveName, score: 0, teamId: assignedTeamId };
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
      timeoutId = window.setTimeout(() => {
        setJoinChecklistSteps(prev => prev.map(s => 
          s.key === 'checklistConfirming' ? { ...s, status: 'failed' } : s
        ));
      }, 15000);
    }
    return () => clearTimeout(timeoutId);
  }, [isJoinChecklistVisible, joinChecklistSteps]);

  useEffect(() => {
    if (gameSession?.showRematchAd) {
      setShowAdOverlay(true);
    } else {
      setShowAdOverlay(false);
    }
  }, [gameSession?.showRematchAd]);

  const unsubscribePendingPlayersRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const isUserHost = !!localPlayerId && localPlayerId === gameSession?.hostId;
    const currentGameId = gameSession?.gameId;
    const isOnline = gameSession?.gameMode === 'online';

    if (isUserHost && currentGameId && isOnline) {
      if (!unsubscribePendingPlayersRef.current) {
        unsubscribePendingPlayersRef.current = listenToPendingPlayers(currentGameId, (pendingPlayers) => {
          if (pendingPlayers && Object.keys(pendingPlayers).length > 0) {
            runGameTransaction(currentGameId, (currentSession) => {
              // Firebase transactions invoke the callback first with null while fetching server state.
              // Returning currentSession (null) allows Firebase to fetch and re-run with live server data.
              if (!currentSession) return currentSession;
              
              const pendingToProcess = currentSession.pendingPlayers || pendingPlayers;
              if (!pendingToProcess || Object.keys(pendingToProcess).length === 0) {
                return currentSession;
              }
              
              const newPlayers = { ...currentSession.players };
              const newPlayerOrder = Array.isArray(currentSession.playerOrder) ? [...currentSession.playerOrder] : [];
              let updatedTeams = currentSession.teams ? { ...currentSession.teams } : undefined;
              let playersAdded = false;

              for (const [playerId, player] of Object.entries(pendingToProcess)) {
                if (!newPlayers[playerId]) {
                  newPlayers[playerId] = player;
                  newPlayerOrder.push(playerId);
                  playersAdded = true;

                  if (currentSession.playMode === 'teams' && updatedTeams && player.teamId) {
                    const tid = player.teamId;
                    const existingTeam = updatedTeams[tid];
                    if (existingTeam) {
                      const pids = existingTeam.playerIds ? [...existingTeam.playerIds] : [];
                      if (!pids.includes(playerId)) {
                        pids.push(playerId);
                      }
                      updatedTeams = {
                        ...updatedTeams,
                        [tid]: {
                          ...existingTeam,
                          playerIds: pids,
                        },
                      };
                    }
                  }
                }
              }
              if (!playersAdded) return { ...currentSession, pendingPlayers: null };
              
              return {
                  ...currentSession,
                  players: newPlayers,
                  playerOrder: newPlayerOrder,
                  playerCount: newPlayerOrder.length,
                  teams: updatedTeams,
                  pendingPlayers: null,
              };
            })
            .then(() => {
              clearPendingPlayers(currentGameId);
            })
            .catch(err => console.error("[Host] CRITICAL FAILURE processing pending players transaction:", err));
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
    };
  }, [gameSession?.hostId, gameSession?.gameId, gameSession?.gameMode, localPlayerId]);

  const switchTeam = useCallback(async (playerId: string, targetTeamId: 'team1' | 'team2') => {
    const currentGame = gameSessionRef.current;
    if (!currentGame) return;

    const updateSessionWithTeamSwitch = (session: GameSession): GameSession => {
      if (!session.players[playerId] || !session.teams) return session;

      const updatedPlayer = { ...session.players[playerId], teamId: targetTeamId };
      const updatedPlayers = { ...session.players, [playerId]: updatedPlayer };

      const t1Pids = (session.teams.team1.playerIds || []).filter(id => id !== playerId);
      const t2Pids = (session.teams.team2.playerIds || []).filter(id => id !== playerId);

      if (targetTeamId === 'team1') {
        t1Pids.push(playerId);
      } else {
        t2Pids.push(playerId);
      }

      return {
        ...session,
        players: updatedPlayers,
        teams: {
          team1: { ...session.teams.team1, playerIds: t1Pids },
          team2: { ...session.teams.team2, playerIds: t2Pids },
        },
      };
    };

    if (currentGame.gameMode === 'online') {
      await runGameTransaction(currentGame.gameId, (dbSession) => {
        if (!dbSession) return undefined;
        return updateSessionWithTeamSwitch(dbSession);
      });
    } else {
      setGameSessionState(prev => prev ? updateSessionWithTeamSwitch(prev) : prev);
    }
  }, []);

  const requestStartGame = useCallback(() => {
    const currentGame = gameSessionRef.current;
    if (!currentGame) return;

    if (currentGame.playMode === 'teams') {
      const t1Count = (Object.values(currentGame.players) as Player[]).filter(p => p.teamId === 'team1').length;
      const t2Count = (Object.values(currentGame.players) as Player[]).filter(p => p.teamId === 'team2').length;
      if (t1Count < 1 || t2Count < 1) {
        alert(t('minPlayersPerTeam'));
        return;
      }
    } else {
      if (currentGame.playerCount < 2) {
        alert(t('minTwoPlayers'));
        return;
      }
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
        
        let updatedTeams = currentSession.teams;
        if (currentSession.playMode === 'teams' && updatedTeams) {
          updatedTeams = {
            team1: { ...updatedTeams.team1, playerIds: (updatedTeams.team1.playerIds || []).filter(id => id !== playerIdToLeave) },
            team2: { ...updatedTeams.team2, playerIds: (updatedTeams.team2.playerIds || []).filter(id => id !== playerIdToLeave) },
          };
        }

        return { 
          ...currentSession, 
          hostId: newHostId,
          players: updatedPlayers,
          playerOrder: updatedPlayerOrder,
          playerCount: updatedPlayerOrder.length,
          teams: updatedTeams,
        };
      }).catch(err => console.error(`[GameAction] leaveGame transaction failed for player ${playerIdToLeave}:`, err));
    }
  }, [localPlayerId, navigate]);


  const startRematch = useCallback(async () => {
    const currentGame = gameSessionRef.current;
    if (!currentGame) return;

    if (currentGame.gameMode === 'online') {
      await runGameTransaction(currentGame.gameId, (dbSession) => {
          if (!dbSession) return undefined;
          return { ...dbSession, showRematchAd: true };
      });
    } else {
      setGameSessionState(prev => prev ? { ...prev, showRematchAd: true } : prev);
    }
  }, []);

  const continueRematch = useCallback(async () => {
    const currentGame = gameSessionRef.current;
    if (!currentGame) return;

    if (currentGame.gameMode === 'online' && localPlayerId !== currentGame.hostId) {
      setShowAdOverlay(false);
      return;
    }

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
                      teamId: existingP.teamId,
                  };
                  if (existingP.isHost) newP.isHost = true;
                  if (shouldTriggerChaos) {
                      newP.chaosNickname = chaosNicknames[index % chaosNicknames.length];
                  }
                  resetPlayers[pid] = newP;
              }
          });

          let resetTeams = baseSession.teams;
          if (baseSession.playMode === 'teams' && resetTeams) {
            resetTeams = {
              team1: { ...resetTeams.team1, score: 0 },
              team2: { ...resetTeams.team2, score: 0 },
            };
          }

          const isDuo = baseSession.playMode === 'duo' || (baseSession.playMode !== 'teams' && playerIds.length === 2);
          const duoTotalRounds = isDuo ? Math.max(2, Math.round(baseSession.winningScore / 5)) : undefined;

          return {
              ...baseSession,
              gameState: GameState.IN_GAME,
              playMode: isDuo ? 'duo' : baseSession.playMode,
              duoScore: isDuo ? 0 : undefined,
              duoCurrentRound: isDuo ? 1 : undefined,
              duoTotalRounds,
              players: resetPlayers,
              teams: resetTeams,
              activeTeamId: baseSession.playMode === 'teams' ? 'team1' : undefined,
              words: shuffledWords,
              currentPlayerIndex: 0,
              currentTurnPlayerId: playerIds[0] || '',
              currentWord: null,
              turnStartTime: null,
              turnTimer: isDuo ? DUO_TURN_DURATION_SECONDS : TURN_DURATION_SECONDS,
              isChaosMode: isDuo ? false : baseSession.isChaosMode,
              activeChaosEvent: shouldTriggerChaos && !isDuo ? ChaosEvent.NICKNAMES : null,
              activeTurnChaos: null,
              minigameState: null,
              pendingPlayers: null,
              showRematchAd: false
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
      setShowAdOverlay(false);
    }
  }, [t, localPlayerId]);

  const advanceTurn = useCallback(() => {
    const currentGame = gameSessionRef.current || gameSession;
    if (!currentGame) return;

    try {
      const nextLocalSession = calculateAdvanceTurn(currentGame);
      setGameSessionState(nextLocalSession);
      gameSessionRef.current = nextLocalSession;

      if (currentGame.gameMode === 'online') {
        runGameTransaction(currentGame.gameId, (dbSession) => {
          const base = dbSession || currentGame;
          return calculateAdvanceTurn(base);
        }).catch(err => console.error(`[GameAction] advanceTurn failed:`, err));
      }
    } catch (err) {
      console.error(`[GameAction] CRITICAL error in advanceTurn:`, err);
    }
  }, [gameSession]);

  const endTurn = useCallback(() => {
    const currentGame = gameSessionRef.current || gameSession;
    if (!currentGame || currentGame.gameState !== GameState.TURN_ACTIVE) return;

    try {
      const nextLocalSession = calculateEndTurn(currentGame);
      setGameSessionState(nextLocalSession);
      gameSessionRef.current = nextLocalSession;

      if (currentGame.gameMode === 'online') {
        runGameTransaction(currentGame.gameId, (dbSession) => {
          const base = dbSession || currentGame;
          return calculateEndTurn(base);
        }).catch(err => console.error(`[GameAction] endTurn failed:`, err));
      }
    } catch (err) {
      console.error(`[GameAction] CRITICAL error in endTurn:`, err);
    }
  }, [gameSession]);

  const startTurn = useCallback(() => {
    const currentGame = gameSessionRef.current || gameSession;
    if (!currentGame || currentGame.gameState !== GameState.IN_GAME) return;
    const safeT = (k: string) => t(k as keyof AppTranslations);

    try {
      const nextLocalSession = calculateStartTurn(currentGame, safeT);
      if (nextLocalSession) {
        setGameSessionState(nextLocalSession);
        gameSessionRef.current = nextLocalSession;
      }

      if (currentGame.gameMode === 'online') {
        runGameTransaction(currentGame.gameId, (dbSession) => {
          const base = dbSession || currentGame;
          return calculateStartTurn(base, safeT);
        }).catch(err => console.error(`[GameAction] startTurn failed:`, err));
      }
    } catch (err) {
      console.error(`[GameAction] CRITICAL error in startTurn:`, err);
    }
  }, [gameSession, t]);

  const handleGuessedWord = useCallback((guesserId?: string) => {
    const currentGame = gameSessionRef.current || gameSession;
    if (!currentGame) return;
    if (currentGame.gameState !== GameState.TURN_ACTIVE && !currentGame.currentWord) return;
    const safeT = (k: string) => t(k as keyof AppTranslations);
    const targetId = guesserId || currentGame.currentTurnPlayerId;

    try {
      const nextLocalSession = calculateGuess(currentGame, targetId, safeT);
      setGameSessionState(nextLocalSession);
      gameSessionRef.current = nextLocalSession;

      if (currentGame.gameMode === 'online') {
        runGameTransaction(currentGame.gameId, (dbSession) => {
          const base = dbSession || currentGame;
          return calculateGuess(base, targetId, safeT);
        }).catch(err => console.error(`[GameAction] handleGuessedWord failed:`, err));
      }
    } catch (err) {
      console.error(`[GameAction] CRITICAL error in handleGuessedWord:`, err);
    }
  }, [gameSession, t]);

  const handleRivalGuessedWord = useCallback(() => {
    const currentGame = gameSessionRef.current || gameSession;
    if (!currentGame) return;
    if (currentGame.gameState !== GameState.TURN_ACTIVE && !currentGame.currentWord) return;
    const safeT = (k: string) => t(k as keyof AppTranslations);

    try {
      const nextLocalSession = calculateRivalGuess(currentGame, safeT);
      setGameSessionState(nextLocalSession);
      gameSessionRef.current = nextLocalSession;

      if (currentGame.gameMode === 'online') {
        runGameTransaction(currentGame.gameId, (dbSession) => {
          const base = dbSession || currentGame;
          return calculateRivalGuess(base, safeT);
        }).catch(err => console.error(`[GameAction] handleRivalGuessedWord failed:`, err));
      }
    } catch (err) {
      console.error(`[GameAction] CRITICAL error in handleRivalGuessedWord:`, err);
    }
  }, [gameSession, t]);

  const handleSkipWord = useCallback(() => {
    const currentGame = gameSessionRef.current || gameSession;
    if (!currentGame) return;
    if (currentGame.gameState !== GameState.TURN_ACTIVE && !currentGame.currentWord) return;
    const safeT = (k: string) => t(k as keyof AppTranslations);

    try {
      const nextLocalSession = calculateSkip(currentGame, safeT);
      setGameSessionState(nextLocalSession);
      gameSessionRef.current = nextLocalSession;

      if (currentGame.gameMode === 'online') {
        runGameTransaction(currentGame.gameId, (dbSession) => {
          const base = dbSession || currentGame;
          return calculateSkip(base, safeT);
        }).catch(err => console.error(`[GameAction] handleSkipWord failed:`, err));
      }
    } catch (err) {
      console.error(`[GameAction] CRITICAL error in handleSkipWord:`, err);
    }
  }, [gameSession, t]);

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
    gameSession, isLoading, localPlayerId, loadingTitle, loadingSteps, isJoinChecklistVisible, joinChecklistSteps, showAdOverlay, setShowAdOverlay,
    createNewGame, createLocalGame, joinGame, addPlayer, switchTeam, requestStartGame, leaveGame, startTurn, advanceTurn, endTurn,
    handleGuessedWord, handleRivalGuessedWord, handleSkipWord, startRematch, continueRematch, selectCard, revealCardOutcome, applyCardAction,
    endMinigame, startMinigameSimulation, resetLoadingState, resetJoinChecklist,
    setLanguage
  }), [
    gameSession, isLoading, localPlayerId, loadingTitle, loadingSteps, isJoinChecklistVisible, joinChecklistSteps, showAdOverlay, setShowAdOverlay,
    createNewGame, createLocalGame, joinGame, addPlayer, switchTeam, requestStartGame, leaveGame, startTurn, advanceTurn, endTurn,
    handleGuessedWord, handleRivalGuessedWord, handleSkipWord, startRematch, continueRematch, selectCard, revealCardOutcome, applyCardAction,
    endMinigame, startMinigameSimulation, resetLoadingState, resetJoinChecklist,
    setLanguage
  ]);

  return (
    <GameSessionContext.Provider value={value}>
      {children}
      {showAdOverlay && <AdOverlay onAdClosed={continueRematch} />}
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
