import { GameSession, Language, TurnChaosEvent, TurnChaosType, ChaosEvent, MinigameCard, MinigameCardActionType, MinigameCardOutcome, GameState } from '../types';
import { generateId, shuffleArray } from './gameUtils';
import { MINIGAME_CARDS_TO_DRAW } from '../constants';

export const CHAOS_NICKNAMES = {
  [Language.EN]: ["the Jester", "Captain Clumsy", "Sir Giggles", "Professor Pudding", "Agent Goofball", "Duke of Doodles", "Madam Mumbles", "The Phantom Whisperer"],
  [Language.HE]: ["הליצן", "קפטן שכחן", "סר צחקוק", "פרופסור פודינג", "סוכן שטותניק", "דוכס השרבוטים", "גברת ממלמלת", "הלוחש המסתורי", "האיירון-מן", "הדוכס", "הדוכסית", "המלך", "גומי-גם", "קרקר יבש", "חומוס", "משמיד הפיצות",
  "נביא הקרואסון","מתחבא במקרר","סוס הפסטה", "מר טוסט","משגיח הכפיות","משגיח החתולים", "מקפלת המגבות", "מרחרחת מגבונים" , "הגרזן", "משחיזת הגדומים", "משגיח הלוויתן", "הארגז", "די כבר", "תמונה של חלבה", "אוכלת יוגורט"]
};

export const TURN_CHAOS_EVENTS: () => TurnChaosEvent[] = () => [
    { type: TurnChaosType.SHORT_TURN, descriptionKey: 'turnChaosShortTurn', value: 30 },
    { type: TurnChaosType.SOUNDS_AND_MIME, descriptionKey: 'turnChaosSoundsAndMime' },
    { type: TurnChaosType.QUESTIONS_ONLY, descriptionKey: 'turnChaosQuestionsOnly' },
    { type: TurnChaosType.RUSSIAN_ACCENT, descriptionKey: 'turnChaosRussianAccent' },
    { type: TurnChaosType.FRENCH_ACCENT, descriptionKey: 'turnChaosFrenchAccent' },
    { type: TurnChaosType.BEAR_ACCENT, descriptionKey: 'turnChaosBearAccent' },
    { type: TurnChaosType.BREAKING_NEWS, descriptionKey: 'turnChaosBreakingNews' },
];

export const createMinigameDeck = (): MinigameCard[] => {
  const deck: MinigameCardOutcome[] = [
    { action: MinigameCardActionType.BONUS_POINTS, value: 3, translationKey: 'cardOutcomeBonusPoints' },
    { action: MinigameCardActionType.LOSE_POINTS, value: 2, translationKey: 'cardOutcomeLosePoints' },
    { action: MinigameCardActionType.STEAL_POINTS, value: 2, translationKey: 'cardOutcomeStealPoints', requiresPlayerChoice: true, playerChoicePromptKey: 'minigamePlayerChoiceSteal' },
    { action: MinigameCardActionType.SWAP_SCORES, value: 0, translationKey: 'cardOutcomeSwapScores', requiresPlayerChoice: true, playerChoicePromptKey: 'minigamePlayerChoiceSwap' },
    { action: MinigameCardActionType.BONUS_POINTS, value: 2, translationKey: 'cardOutcomeBonusPoints' },
    { action: MinigameCardActionType.LOSE_POINTS, value: 1, translationKey: 'cardOutcomeLosePoints' },
    
    // New Cards
    { action: MinigameCardActionType.DOUBLE_POINTS, value: 0, translationKey: 'cardOutcomeDoublePoints' },
    { action: MinigameCardActionType.DOUBLE_TARGET_POINTS, value: 0, translationKey: 'cardOutcomeDoubleTargetPoints', requiresPlayerChoice: true, playerChoicePromptKey: 'minigamePlayerChoiceDoublePoints' },
    { action: MinigameCardActionType.RANDOMIZE_SCORES, value: 0, translationKey: 'cardOutcomeRandomizeScores' },
    { action: MinigameCardActionType.LOSE_HALF_POINTS, value: 0, translationKey: 'cardOutcomeLoseHalfPoints' },
    { action: MinigameCardActionType.GIVE_POINTS, value: 3, translationKey: 'cardOutcomeGivePoints', requiresPlayerChoice: true, playerChoicePromptKey: 'minigamePlayerChoiceGivePoints' },
  ];
  return shuffleArray(deck).map(outcome => ({ id: generateId(), outcome }));
};

/**
 * Determines if a chaos event should occur between turns and modifies the session state accordingly.
 * @param currentSession The current game session.
 * @returns A new game session object, possibly modified with a chaos event.
 */
export const handleBetweenTurnChaos = (currentSession: GameSession): GameSession => {
    if (!currentSession.isChaosMode) return currentSession;
  
    let sessionCopy = { ...currentSession, activeChaosEvent: null, activeTurnChaos: null };
    const chaosRoll = Math.random();
  
    if (chaosRoll < 0.25) { // 25% chance for Turn Modifier
      const turnChaosOptions = TURN_CHAOS_EVENTS();
      sessionCopy.activeTurnChaos = shuffleArray(turnChaosOptions)[0];
      sessionCopy.activeChaosEvent = ChaosEvent.TURN_MODIFIER;
      return sessionCopy;
    }
    
    else if (chaosRoll < 0.50) { // 25% chance for Minigame (total 50% chaos chance)
      const minigamePlayerIndex = sessionCopy.currentPlayerIndex;
      // FIX: Get the player ID from the playerOrder array using the index. The Player object itself doesn't have an `id` property.
      const activePlayerId = sessionCopy.playerOrder[minigamePlayerIndex];
      const fullDeck = createMinigameDeck();
  
      sessionCopy.minigameState = {
        isActive: true,
        activePlayerId: activePlayerId,
        cards: fullDeck.slice(0, MINIGAME_CARDS_TO_DRAW),
        selectedCardId: null, revealedOutcome: null, actionApplied: false,
      };
      sessionCopy.gameState = GameState.MINIGAME;
      sessionCopy.activeChaosEvent = ChaosEvent.MINIGAME_TRIGGER;
      return sessionCopy;
    }
    
    return sessionCopy; // No chaos event this time
};