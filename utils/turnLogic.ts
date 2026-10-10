import { GameSession, GameState, Player, TurnSummary, GuessEvent } from '../types';
import { roundHalf } from './gameUtils';
import { handleBetweenTurnChaos } from './chaosUtils';

export const normalizeArray = <T>(val: any): T[] => {
  if (!val) return [];
  if (Array.isArray(val)) return [...val];
  if (typeof val === 'object') return Object.values(val);
  return [];
};

export const calculateStartTurn = (session: GameSession, t: (key: string) => string): GameSession | undefined => {
  const words = normalizeArray<string>(session.words);
  if (words.length === 0) {
    return undefined;
  }
  const remainingWords = [...words];
  const nextWord = remainingWords.shift() || null;
  const explainer = session.players[session.currentTurnPlayerId];

  const initialSummary: TurnSummary = {
    explainerId: session.currentTurnPlayerId,
    explainerName: explainer?.name || '',
    words: [],
    scoresDelta: {},
  };

  return { 
    ...session, 
    gameState: GameState.TURN_ACTIVE, 
    currentWord: nextWord, 
    words: remainingWords, 
    turnStartTime: Date.now(),
    turnSummary: initialSummary,
    isTurnSummaryActive: false,
    lastGuessEvent: null,
  };
};

export const calculateEndTurn = (session: GameSession): GameSession => {
  return calculateAdvanceTurn({
    ...session,
    turnStartTime: null,
    isTurnSummaryActive: false,
  });
};

export const calculateAdvanceTurn = (session: GameSession): GameSession => {
  let updatedSession: GameSession = { ...session, isTurnSummaryActive: false, lastGuessEvent: null };
  const playerOrder = normalizeArray<string>(session.playerOrder);

  // Duo Mode logic
  if (session.playMode === 'duo') {
    const currentDuoScore = session.duoScore || 0;
    const totalRounds = session.duoTotalRounds || Math.max(2, Math.round(session.winningScore / 5));
    const currentRound = session.duoCurrentRound || 1;

    // Check if target score was reached or if all rounds are completed
    if (currentDuoScore >= session.winningScore || currentRound >= totalRounds) {
      return {
        ...updatedSession,
        gameState: GameState.GAME_OVER,
        currentWord: null,
        turnStartTime: null,
        lastGuessEvent: null,
        isTurnSummaryActive: false,
      };
    }

    // Advance to next round, switch to the other player
    const nextPlayerIndex = (session.currentPlayerIndex + 1) % (playerOrder.length || 2);
    return {
      ...updatedSession,
      currentPlayerIndex: nextPlayerIndex,
      currentTurnPlayerId: playerOrder[nextPlayerIndex] || session.currentTurnPlayerId,
      duoCurrentRound: currentRound + 1,
      gameState: GameState.IN_GAME,
      currentWord: null,
      turnStartTime: null,
      lastGuessEvent: null,
      isTurnSummaryActive: false,
    };
  }

  // Team Mode logic
  if (session.playMode === 'teams' && session.teams) {
    const team1Score = session.teams.team1.score;
    const team2Score = session.teams.team2.score;
    if (team1Score >= session.winningScore || team2Score >= session.winningScore) {
      return {
        ...updatedSession,
        gameState: GameState.GAME_OVER,
        currentWord: null,
        turnStartTime: null,
        lastGuessEvent: null,
      };
    }

    // Toggle activeTeamId between team1 and team2
    const nextActiveTeamId = session.activeTeamId === 'team1' ? 'team2' : 'team1';

    let nextTurnPlayerId = session.currentTurnPlayerId;
    let nextPlayerIndex = session.currentPlayerIndex;

    const teamPlayers = playerOrder.filter(id => session.players[id]?.teamId === nextActiveTeamId);
    if (teamPlayers.length > 0) {
      const currentTeamExplainerIndex = teamPlayers.indexOf(session.currentTurnPlayerId);
      const nextTeamExplainer = teamPlayers[(currentTeamExplainerIndex + 1) % teamPlayers.length];
      nextTurnPlayerId = nextTeamExplainer;
      nextPlayerIndex = playerOrder.indexOf(nextTeamExplainer);
    } else if (session.gameMode === 'local') {
      nextTurnPlayerId = nextActiveTeamId;
      nextPlayerIndex = nextActiveTeamId === 'team1' ? 0 : 1;
    }

    return {
      ...updatedSession,
      activeTeamId: nextActiveTeamId,
      currentPlayerIndex: nextPlayerIndex >= 0 ? nextPlayerIndex : 0,
      currentTurnPlayerId: nextTurnPlayerId,
      gameState: GameState.IN_GAME,
      currentWord: null,
      turnStartTime: null,
      lastGuessEvent: null,
    };
  }
  
  // Check for Game Over based on scores
  const playersArray = Object.values(updatedSession.players);
  if (playersArray.some(p => p.score >= updatedSession.winningScore)) {
      return { 
        ...updatedSession, 
        gameState: GameState.GAME_OVER, 
        currentWord: null, 
        turnStartTime: null, 
        lastGuessEvent: null,
      };
  }

  // Apply Chaos (if any)
  updatedSession = handleBetweenTurnChaos(updatedSession);
  if (updatedSession.gameState === GameState.MINIGAME) {
      return { ...updatedSession, lastGuessEvent: null };
  }

  // Move to next player
  const nextPlayerIndex = (updatedSession.currentPlayerIndex + 1) % (playerOrder.length || 1);
  return {
    ...updatedSession,
    currentPlayerIndex: nextPlayerIndex,
    currentTurnPlayerId: playerOrder[nextPlayerIndex] || updatedSession.currentTurnPlayerId,
    gameState: GameState.IN_GAME,
    currentWord: null, 
    turnStartTime: null,
    lastGuessEvent: null,
  };
};

export const calculateGuess = (session: GameSession, guesserId: string, t: (key: string) => string): GameSession => {
    // Co-op Duo mode scoring
    if (session.playMode === 'duo') {
      const currentDuoScore = session.duoScore || 0;
      const newDuoScore = currentDuoScore + 1;
      const gameShouldEnd = newDuoScore >= session.winningScore;

      const updatedPlayers = { ...session.players };
      for (const pid of Object.keys(updatedPlayers)) {
        updatedPlayers[pid] = {
          ...updatedPlayers[pid],
          score: newDuoScore,
        };
      }

      const guessedWord = session.currentWord || '';
      const remainingWords = normalizeArray<string>(session.words);
      const nextWord = remainingWords.shift() || null;

      const guessEvent: GuessEvent = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        word: guessedWord,
        guesserName: 'Duo',
        points: 1,
        timestamp: Date.now(),
      };

      const updatedSession: GameSession = {
        ...session,
        duoScore: newDuoScore,
        players: updatedPlayers,
        currentWord: nextWord,
        words: remainingWords,
        lastGuessEvent: guessEvent,
        isTurnSummaryActive: false,
      };

      if (gameShouldEnd) {
        return {
          ...updatedSession,
          gameState: GameState.GAME_OVER,
          currentWord: null,
          turnStartTime: null,
          isTurnSummaryActive: false,
        };
      }
      if (!nextWord) {
        return {
          ...updatedSession,
          gameState: GameState.IN_GAME,
          turnStartTime: null,
          isTurnSummaryActive: false,
        };
      }
      return updatedSession;
    }

    // Team mode scoring
    if (session.playMode === 'teams' && session.teams && session.activeTeamId) {
      const activeTeamId = session.activeTeamId;
      const teamName = session.teams[activeTeamId]?.name || (activeTeamId === 'team1' ? t('defaultTeam1Name') : t('defaultTeam2Name'));
      const currentTeamScore = Number(session.teams[activeTeamId]?.score) || 0;
      const newTeamScore = currentTeamScore + 1;
      const updatedTeams = {
        ...session.teams,
        [activeTeamId]: {
          ...session.teams[activeTeamId],
          score: newTeamScore,
        },
      };

      const updatedPlayers = { ...session.players };
      if (updatedPlayers[session.currentTurnPlayerId]) {
        const currentExplainerScore = Number(updatedPlayers[session.currentTurnPlayerId]?.score) || 0;
        updatedPlayers[session.currentTurnPlayerId] = {
          ...updatedPlayers[session.currentTurnPlayerId],
          score: currentExplainerScore + 1,
        };
      }

      const gameShouldEnd = newTeamScore >= session.winningScore;
      const guessedWord = session.currentWord || '';
      const remainingWords = normalizeArray<string>(session.words);
      const nextWord = remainingWords.shift() || null;

      const guessEvent: GuessEvent = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        word: guessedWord,
        guesserName: teamName,
        points: 1,
        timestamp: Date.now(),
      };

      const currentSummary: TurnSummary = session.turnSummary || {
        explainerId: session.currentTurnPlayerId,
        explainerName: session.players[session.currentTurnPlayerId]?.name || '',
        words: [],
        scoresDelta: {},
      };

      const summaryWords = normalizeArray(currentSummary.words);
      const newWords = guessedWord
        ? [...summaryWords, { word: guessedWord, status: 'guessed' as const, guesserName: teamName }]
        : summaryWords;

      const newScoresDelta = { ...(currentSummary.scoresDelta || {}) };
      newScoresDelta[activeTeamId] = {
        name: teamName,
        delta: (newScoresDelta[activeTeamId]?.delta || 0) + 1,
      };

      const updatedSummary: TurnSummary = {
        ...currentSummary,
        words: newWords,
        scoresDelta: newScoresDelta,
      };

      let updatedSession: GameSession = {
        ...session,
        teams: updatedTeams,
        players: updatedPlayers,
        currentWord: nextWord,
        words: remainingWords,
        lastGuessEvent: guessEvent,
        turnSummary: updatedSummary,
      };

      if (gameShouldEnd) {
        return {
          ...updatedSession,
          gameState: GameState.GAME_OVER,
          currentWord: null,
          turnStartTime: null,
          isTurnSummaryActive: false,
        };
      }
      if (!nextWord) {
        return {
          ...updatedSession,
          gameState: GameState.IN_GAME,
          turnStartTime: null,
        };
      }
      return updatedSession;
    }

    const explainerId = session.currentTurnPlayerId;
    let gameShouldEnd = false;
    const updatedPlayers = { ...session.players };
    const originalGuesser = (guesserId && updatedPlayers[guesserId]) ? updatedPlayers[guesserId] : undefined;
    const originalExplainer = updatedPlayers[explainerId];

    const guesserName = originalGuesser?.name || (guesserId === explainerId ? (originalExplainer?.name || '') : '');
    const explainerName = originalExplainer?.name || '';

    // Award point to guesser (if different from explainer)
    if (guesserId && guesserId !== explainerId && originalGuesser) {
        const newScore = Math.max(0, (Number(originalGuesser.score) || 0) + 1);
        updatedPlayers[guesserId] = { ...originalGuesser, score: newScore };
        if (newScore >= session.winningScore) gameShouldEnd = true;
    }

    // Award point to explainer
    if (originalExplainer) {
        const newScore = Math.max(0, (Number(originalExplainer.score) || 0) + 1);
        updatedPlayers[explainerId] = { ...originalExplainer, score: newScore };
        if (newScore >= session.winningScore) gameShouldEnd = true;
    }
    
    const guessedWord = session.currentWord || '';
    const remainingWords = normalizeArray<string>(session.words);
    const nextWord = remainingWords.shift() || null;

    const guessEvent: GuessEvent = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      word: guessedWord,
      guesserName: guesserName || explainerName,
      points: 1,
      timestamp: Date.now(),
    };

    // Track for Round Summary in chronological order
    const currentSummary: TurnSummary = session.turnSummary || {
      explainerId,
      explainerName,
      words: [],
      scoresDelta: {},
    };

    const summaryWords = normalizeArray(currentSummary.words);
    const newWords = guessedWord
      ? [...summaryWords, { word: guessedWord, status: 'guessed' as const, guesserName: guesserName || explainerName, guesserId }]
      : summaryWords;

    const newScoresDelta = { ...(currentSummary.scoresDelta || {}) };
    if (guesserId && guesserId !== explainerId && originalGuesser) {
      newScoresDelta[guesserId] = {
        name: guesserName,
        delta: (newScoresDelta[guesserId]?.delta || 0) + 1,
      };
    }
    if (originalExplainer) {
      newScoresDelta[explainerId] = {
        name: explainerName,
        delta: (newScoresDelta[explainerId]?.delta || 0) + 1,
      };
    }

    const updatedSummary: TurnSummary = {
      ...currentSummary,
      words: newWords,
      scoresDelta: newScoresDelta,
    };
    
    let updatedSession: GameSession = { 
      ...session, 
      players: updatedPlayers, 
      currentWord: nextWord, 
      words: remainingWords,
      lastGuessEvent: guessEvent,
      turnSummary: updatedSummary,
    };
    
    if (gameShouldEnd) return { ...updatedSession, gameState: GameState.GAME_OVER, currentWord: null, turnStartTime: null, isTurnSummaryActive: false };
    if (!nextWord) return { ...updatedSession, gameState: GameState.IN_GAME, turnStartTime: null };
    return updatedSession;
};

export const calculateSkip = (session: GameSession, t: (key: string) => string): GameSession => {
    // Co-op Duo mode skip
    if (session.playMode === 'duo') {
      const currentDuoScore = session.duoScore || 0;
      const newDuoScore = Math.max(0, currentDuoScore - 1);

      const updatedPlayers = { ...session.players };
      for (const pid of Object.keys(updatedPlayers)) {
        updatedPlayers[pid] = {
          ...updatedPlayers[pid],
          score: newDuoScore,
        };
      }

      const remainingWords = normalizeArray<string>(session.words);
      const nextWord = remainingWords.shift() || null;

      if (!nextWord) {
        return {
          ...session,
          duoScore: newDuoScore,
          players: updatedPlayers,
          currentWord: null,
          words: remainingWords,
          gameState: GameState.IN_GAME,
          turnStartTime: null,
          lastGuessEvent: null,
          isTurnSummaryActive: false,
        };
      }

      return {
        ...session,
        duoScore: newDuoScore,
        players: updatedPlayers,
        currentWord: nextWord,
        words: remainingWords,
        lastGuessEvent: null,
        isTurnSummaryActive: false,
      };
    }

    // Team mode skip
    if (session.playMode === 'teams' && session.teams && session.activeTeamId) {
      const activeTeamId = session.activeTeamId;
      const currentTeamScore = Number(session.teams[activeTeamId]?.score) || 0;
      const updatedTeams = {
        ...session.teams,
        [activeTeamId]: {
          ...session.teams[activeTeamId],
          score: Math.max(0, currentTeamScore - 1),
        },
      };

      const updatedPlayers = { ...session.players };
      if (updatedPlayers[session.currentTurnPlayerId]) {
        const currentExplainerScore = Number(updatedPlayers[session.currentTurnPlayerId]?.score) || 0;
        updatedPlayers[session.currentTurnPlayerId] = {
          ...updatedPlayers[session.currentTurnPlayerId],
          score: Math.max(0, currentExplainerScore - 1),
        };
      }

      const remainingWords = normalizeArray<string>(session.words);
      const nextWord = remainingWords.shift() || null;
      if (!nextWord) {
        return {
          ...session,
          teams: updatedTeams,
          players: updatedPlayers,
          currentWord: null,
          words: remainingWords,
          gameState: GameState.IN_GAME,
          turnStartTime: null,
          lastGuessEvent: null,
        };
      }
      return {
        ...session,
        teams: updatedTeams,
        players: updatedPlayers,
        currentWord: nextWord,
        words: remainingWords,
        lastGuessEvent: null,
      };
    }

    const explainerId = session.currentTurnPlayerId;
    const updatedPlayers = { ...session.players };
    const explainer = updatedPlayers[explainerId];

    if (explainer) {
        updatedPlayers[explainerId] = { ...explainer, score: Math.max(0, explainer.score - 1) };
    }

    const remainingWords = normalizeArray<string>(session.words);
    const nextWord = remainingWords.shift() || null;

    // Track skipped word for Round Summary
    const currentSummary: TurnSummary = session.turnSummary || {
      explainerId,
      explainerName: explainer?.name || '',
      words: [],
      scoresDelta: {},
    };

    const explainerName = explainer?.name || '';
    const summaryWords = normalizeArray(currentSummary.words);

    const newWords = session.currentWord
      ? [...summaryWords, { word: session.currentWord, status: 'skipped' as const }]
      : summaryWords;

    const newScoresDelta = { ...(currentSummary.scoresDelta || {}) };
    newScoresDelta[explainerId] = {
      name: explainerName,
      delta: (newScoresDelta[explainerId]?.delta || 0) - 1,
    };

    const updatedSummary: TurnSummary = {
      ...currentSummary,
      words: newWords,
      scoresDelta: newScoresDelta,
    };
    
    if (!nextWord) {
        return { 
          ...session, 
          players: updatedPlayers, 
          currentWord: null, 
          words: remainingWords, 
          gameState: GameState.IN_GAME, 
          turnStartTime: null,
          turnSummary: updatedSummary,
          lastGuessEvent: null,
        };
    }
    return { ...session, players: updatedPlayers, currentWord: nextWord, words: remainingWords, turnSummary: updatedSummary, lastGuessEvent: null };
};
