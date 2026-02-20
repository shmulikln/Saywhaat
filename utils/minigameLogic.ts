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
