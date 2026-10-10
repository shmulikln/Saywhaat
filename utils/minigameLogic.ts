import { GameSession, MinigameCardActionType } from '../types';
import { shuffleArray } from './gameUtils';

export const applyMinigameOutcome = (session: GameSession, targetPlayerId?: string): GameSession => {
  if (!session.minigameState || !session.minigameState.revealedOutcome) return session;

  const { revealedOutcome, activePlayerId } = session.minigameState;
  const newPlayers = { ...session.players };

  switch (revealedOutcome.action) {
    case MinigameCardActionType.BONUS_POINTS:
      if (newPlayers[activePlayerId]) {
        const player = newPlayers[activePlayerId];
        newPlayers[activePlayerId] = { ...player, score: Math.max(0, player.score + revealedOutcome.value) };
      }
      break;
    case MinigameCardActionType.LOSE_POINTS:
      if (newPlayers[activePlayerId]) {
        const player = newPlayers[activePlayerId];
        newPlayers[activePlayerId] = { ...player, score: Math.max(0, player.score - revealedOutcome.value) };
      }
      break;
    case MinigameCardActionType.STEAL_POINTS:
      if (targetPlayerId && newPlayers[targetPlayerId] && newPlayers[activePlayerId]) {
        const stolenAmount = Math.min(newPlayers[targetPlayerId].score, revealedOutcome.value);
        const target = newPlayers[targetPlayerId];
        newPlayers[targetPlayerId] = { ...target, score: Math.max(0, target.score - stolenAmount) };
        const active = newPlayers[activePlayerId];
        newPlayers[activePlayerId] = { ...active, score: active.score + stolenAmount };
      }
      break;
    case MinigameCardActionType.SWAP_SCORES:
      if (targetPlayerId && newPlayers[targetPlayerId] && newPlayers[activePlayerId]) {
        const activePlayer = newPlayers[activePlayerId];
        const targetPlayer = newPlayers[targetPlayerId];
        const activePlayerOldScore = activePlayer.score;
        newPlayers[activePlayerId] = { ...activePlayer, score: targetPlayer.score };
        newPlayers[targetPlayerId] = { ...targetPlayer, score: activePlayerOldScore };
      }
      break;
    case MinigameCardActionType.DOUBLE_POINTS:
      if (newPlayers[activePlayerId]) {
        const player = newPlayers[activePlayerId];
        newPlayers[activePlayerId] = { ...player, score: player.score * 2 };
      }
      break;
    case MinigameCardActionType.DOUBLE_TARGET_POINTS:
      if (targetPlayerId && newPlayers[targetPlayerId]) {
        const player = newPlayers[targetPlayerId];
        newPlayers[targetPlayerId] = { ...player, score: player.score * 2 };
      }
      break;
    case MinigameCardActionType.RANDOMIZE_SCORES:
      const scores = session.playerOrder.map(id => newPlayers[id]?.score ?? 0);
      const shuffledScores = shuffleArray(scores);
      session.playerOrder.forEach((id, index) => {
        if (newPlayers[id]) {
          const player = newPlayers[id];
          newPlayers[id] = { ...player, score: shuffledScores[index] };
        }
      });
      break;
    case MinigameCardActionType.LOSE_HALF_POINTS:
      if (newPlayers[activePlayerId]) {
        const player = newPlayers[activePlayerId];
        newPlayers[activePlayerId] = { ...player, score: Math.floor(player.score / 2) };
      }
      break;
    case MinigameCardActionType.GIVE_POINTS:
      if (targetPlayerId && newPlayers[targetPlayerId] && newPlayers[activePlayerId]) {
        const pointsToGive = Math.min(newPlayers[activePlayerId].score, revealedOutcome.value);
        const activePlayer = newPlayers[activePlayerId];
        const targetPlayer = newPlayers[targetPlayerId];
        newPlayers[activePlayerId] = { ...activePlayer, score: Math.max(0, activePlayer.score - pointsToGive) };
        newPlayers[targetPlayerId] = { ...targetPlayer, score: targetPlayer.score + pointsToGive };
      }
      break;
    case MinigameCardActionType.ROBIN_HOOD: {
      const playerIds = Object.keys(newPlayers);
      if (playerIds.length > 1) {
        let maxId = playerIds[0];
        let minId = playerIds[0];
        playerIds.forEach(id => {
          if (newPlayers[id].score > newPlayers[maxId].score) maxId = id;
          if (newPlayers[id].score < newPlayers[minId].score) minId = id;
        });
        if (maxId !== minId && newPlayers[maxId].score > 0) {
          const transfer = Math.min(newPlayers[maxId].score, 2);
          newPlayers[maxId] = { ...newPlayers[maxId], score: newPlayers[maxId].score - transfer };
          newPlayers[minId] = { ...newPlayers[minId], score: newPlayers[minId].score + transfer };
        }
      }
      break;
    }
    case MinigameCardActionType.UNDERDOG_SURGE: {
      if (newPlayers[activePlayerId]) {
        const playerIds = Object.keys(newPlayers);
        const minScore = Math.min(...playerIds.map(id => newPlayers[id].score));
        const isUnderdog = newPlayers[activePlayerId].score <= minScore;
        const gain = isUnderdog ? 4 : 1;
        newPlayers[activePlayerId] = { ...newPlayers[activePlayerId], score: newPlayers[activePlayerId].score + gain };
      }
      break;
    }
    case MinigameCardActionType.TAX_COLLECTOR: {
      if (newPlayers[activePlayerId]) {
        const activeScore = newPlayers[activePlayerId].score;
        let collectedTotal = 0;
        Object.keys(newPlayers).forEach(id => {
          if (id !== activePlayerId && newPlayers[id].score > activeScore && newPlayers[id].score > 0) {
            newPlayers[id] = { ...newPlayers[id], score: newPlayers[id].score - 1 };
            collectedTotal += 1;
          }
        });
        newPlayers[activePlayerId] = { ...newPlayers[activePlayerId], score: activeScore + collectedTotal };
      }
      break;
    }
    case MinigameCardActionType.THE_EQUALIZER: {
      const playerIds = Object.keys(newPlayers);
      if (playerIds.length > 0) {
        const total = playerIds.reduce((sum, id) => sum + (newPlayers[id]?.score ?? 0), 0);
        const average = Math.round(total / playerIds.length);
        playerIds.forEach(id => {
          if (newPlayers[id]) {
            newPlayers[id] = { ...newPlayers[id], score: average };
          }
        });
      }
      break;
    }
    case MinigameCardActionType.DOUBLE_OR_NOTHING: {
      if (newPlayers[activePlayerId]) {
        const isWin = Math.random() >= 0.5;
        const current = newPlayers[activePlayerId].score;
        newPlayers[activePlayerId] = {
          ...newPlayers[activePlayerId],
          score: isWin ? current + 5 : Math.max(0, current - 4)
        };
      }
      break;
    }
    case MinigameCardActionType.RUSSIAN_ROULETTE: {
      if (targetPlayerId && newPlayers[targetPlayerId] && newPlayers[activePlayerId]) {
        const activeWins = Math.random() >= 0.5;
        const delta = 3;
        if (activeWins) {
          const stolen = Math.min(newPlayers[targetPlayerId].score, delta);
          newPlayers[targetPlayerId] = { ...newPlayers[targetPlayerId], score: newPlayers[targetPlayerId].score - stolen };
          newPlayers[activePlayerId] = { ...newPlayers[activePlayerId], score: newPlayers[activePlayerId].score + stolen };
        } else {
          const lost = Math.min(newPlayers[activePlayerId].score, delta);
          newPlayers[activePlayerId] = { ...newPlayers[activePlayerId], score: newPlayers[activePlayerId].score - lost };
          newPlayers[targetPlayerId] = { ...newPlayers[targetPlayerId], score: newPlayers[targetPlayerId].score + lost };
        }
      }
      break;
    }
    case MinigameCardActionType.MYSTERY_BOX: {
      if (newPlayers[activePlayerId]) {
        const options = [-3, -2, -1, 2, 3, 4, 5];
        const randomDelta = options[Math.floor(Math.random() * options.length)];
        newPlayers[activePlayerId] = {
          ...newPlayers[activePlayerId],
          score: Math.max(0, newPlayers[activePlayerId].score + randomDelta)
        };
      }
      break;
    }
  }

  return { 
    ...session, 
    players: newPlayers, 
    minigameState: { 
      ...session.minigameState, 
      actionApplied: true 
    } 
  };
};
