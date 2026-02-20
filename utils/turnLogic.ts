import { GameSession, GameState, Player } from '../types';
import { roundHalf } from './gameUtils';
import { handleBetweenTurnChaos } from './chaosUtils';

export const calculateStartTurn = (session: GameSession, t: (key: string) => string): GameSession | undefined => {
  if (!session.words || session.words.length === 0) {
    alert(t('noWordsLeft'));
    return undefined;
  }
  const remainingWords = [...session.words];
  const nextWord = remainingWords.shift();
  return { 
    ...session, 
    gameState: GameState.TURN_ACTIVE, 
    currentWord: nextWord || null, 
    words: remainingWords, 
    turnStartTime: Date.now() 
  };
};

export const calculateAdvanceTurn = (session: GameSession): GameSession => {
  let updatedSession = { ...session };
  
  // Check for Game Over based on scores
  const playersArray = Object.values(updatedSession.players);
  if (playersArray.some(p => p.score >= updatedSession.winningScore)) {
      return { 
        ...updatedSession, 
        gameState: GameState.GAME_OVER, 
        currentWord: null, 
        turnStartTime: null 
      };
  }

  // Apply Chaos (if any)
  updatedSession = handleBetweenTurnChaos(updatedSession);
  if (updatedSession.gameState === GameState.MINIGAME) {
      return updatedSession;
  }

  // Move to next player
  const nextPlayerIndex = (updatedSession.currentPlayerIndex + 1) % updatedSession.playerOrder.length;
  return {
    ...updatedSession,
    currentPlayerIndex: nextPlayerIndex,
    currentTurnPlayerId: updatedSession.playerOrder[nextPlayerIndex],
    gameState: GameState.IN_GAME,
    currentWord: null, 
    turnStartTime: null,
  };
};

export const calculateGuess = (session: GameSession, guesserId: string, t: (key: string) => string): GameSession => {
    const explainerId = session.currentTurnPlayerId;
    let gameShouldEnd = false;
    const updatedPlayers = { ...session.players };
    
    const guesser = updatedPlayers[guesserId];
    if (guesser) {
        const newScore = Math.max(0, guesser.score + 1);
        updatedPlayers[guesserId] = { ...guesser, score: newScore };
        if (newScore >= session.winningScore) gameShouldEnd = true;
    }

    const explainer = updatedPlayers[explainerId];
    if (explainer) {
        const newScore = Math.max(0, explainer.score + roundHalf(0.5));
        updatedPlayers[explainerId] = { ...explainer, score: newScore };
        if (newScore >= session.winningScore) gameShouldEnd = true;
    }
    
    const remainingWords = [...session.words];
    const nextWord = remainingWords.shift() || null;
    
    if (!nextWord && !gameShouldEnd) {
        // Ideally we don't alert inside a pure function, but for this refactor we keep behavior consistent
        alert(t('noWordsLeft')); 
    }
    
    let updatedSession = { ...session, players: updatedPlayers, currentWord: nextWord, words: remainingWords };
    
    if (gameShouldEnd) return { ...updatedSession, gameState: GameState.GAME_OVER, currentWord: null, turnStartTime: null };
    if (!nextWord) return { ...updatedSession, gameState: GameState.IN_GAME, turnStartTime: null };
    return updatedSession;
};

export const calculateSkip = (session: GameSession, t: (key: string) => string): GameSession => {
    const explainerId = session.currentTurnPlayerId;
    const updatedPlayers = { ...session.players };

    if (updatedPlayers[explainerId]) {
        const explainer = updatedPlayers[explainerId];
        updatedPlayers[explainerId] = { ...explainer, score: Math.max(0, explainer.score - 1) };
    }

    const remainingWords = [...session.words];
    const nextWord = remainingWords.shift() || null;
    
    if (!nextWord) {
        alert(t('noWordsLeft'));
        return { ...session, players: updatedPlayers, currentWord: null, words: remainingWords, gameState: GameState.IN_GAME, turnStartTime: null };
    }
    return { ...session, players: updatedPlayers, currentWord: nextWord, words: remainingWords };
};
