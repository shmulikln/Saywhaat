export enum Language {
  EN = 'en',
  HE = 'he',
  PT = 'pt',
  HI = 'hi',
  ID = 'id',
  AR = 'ar',
  ZH = 'zh',
}

export enum GameState {
  LOBBY = 'LOBBY',
  IN_GAME = 'IN_GAME',
  TURN_ACTIVE = 'TURN_ACTIVE',
  GAME_OVER = 'GAME_OVER',
  MINIGAME = 'MINIGAME',
}

export enum ChaosEvent {
  NICKNAMES = 'NICKNAMES',
  MINIGAME_TRIGGER = 'MINIGAME_TRIGGER',
  TURN_MODIFIER = 'TURN_MODIFIER',
}

export enum TurnChaosType {
  SHORT_TURN = 'SHORT_TURN',
  SOUNDS_AND_MIME = 'SOUNDS_AND_MIME',
  QUESTIONS_ONLY = 'QUESTIONS_ONLY',
  RUSSIAN_ACCENT = 'RUSSIAN_ACCENT',
  FRENCH_ACCENT = 'FRENCH_ACCENT',
  BEAR_ACCENT = 'BEAR_ACCENT',
  BREAKING_NEWS = 'BREAKING_NEWS',
}

export type LoadingStatus = 'pending' | 'in-progress' | 'completed' | 'failed';

export interface AppTranslations {
  appName: string;
  setupTitle: string;
  createGameTitle: string;
  joinGameTitle: string;
  hostNameLabel: string;
  playerNameLabel: string;
  addPlayerButton: string;
  winningScoreLabel: string;
  languageLabel: string;
  createGameButton: string;
  joinGameButton: string;
  startGameButton: string;
  nextUp: string;
  startTurnButton: string;
  resetGameButton: string;
  turnScreenTitle: string;
  guessedButton: string;
  skipButton: string;
  endTurnEarlyButton: string;
  selectGuesserTitle: string;
  confirmButton: string;
  gameOverTitle: string;
  winners: string;
  finalScores: string;
  newGameButton: string;
  score: string;
  players: string;
  timeRemaining: string;
  noWordsLeft: string;
  word: string;
  english: string;
  hebrew: string;
  backToGame: string;
  host: string;
  minTwoPlayers: string;
  playerPlaceholder: string;
  yourScore: string;
  currentPlayers: string;
  getReady: string;
  gameLoadingError: string;
  noWordsAvailableError: string;
  player: string;
  pointsSuffix: string;
  secondsSuffix: string;
  startButtonLabel: string;
  nextPlayerPrompt: string;
  addButton: string;
  rematch: string;
  shareApp: string;
  copied: string;
  leadingPlayer: string;
  version: string;
  versionHistoryTitle: string;
  howToPlayButton: string;
  simulateMinigame: string;
  enterGameCodePlaceholder: string;
  gameCode: string;
  lobbyTitle: string;
  scanToJoin: string;
  shareLink: string;
  waitingForHost: string;
  gameNotFound: string;
  nameIsRequired: string;
  join: string;
  or: string;
  isExplaining: string;
  guessingScreenTitle: string;
  waitingForPlayerTurn: string;
  leaveGame: string;
  tryAgainButton: string;
  installApp: string;
  installGuide: string;

  // Loading Steps
  loadingCreatingGame: string;
  loadingJoiningGame: string;
  loadingStepFetchWords: string;
  loadingStepGenerateId: string;
  loadingStepCreateSession: string;
  loadingStepNavigate: string;
  loadingStepVerifyCode: string;
  loadingStepFetchSession: string;
  loadingStepRender: string;
  loadingStepError: string;

  // Join Checklist
  joiningLobbyTitle: string;
  checklistValidating: string;
  checklistGeneratingId: string;
  checklistConfirming: string;
  joinSuccess: string;
  joinFailed: string;

  // How To Play
  howToPlayTitle: string;
  howToPlayTheGoal: string;
  howToPlayTheGoalDesc: string;
  howToPlayTheTurn: string;
  howToPlayTheTurnDesc1: string;
  howToPlayTheTurnDesc2: string;
  howToPlayTheRules: string;
  howToPlayTheRulesRule1: string;
  howToPlayTheRulesRule2: string;
  howToPlayScoring: string;
  howToPlayScoringDesc1: string;
  howToPlayScoringDesc2: string;
  howToPlayWinning: string;
  howToPlayWinningDesc: string;
  howToPlayChaosMode: string;
  howToPlayChaosModeDesc: string;

  // Chaos Mode
  chaosMode: string;
  chaosModeTooltip: string;
  chaosModeInfoTitle: string;
  chaosModeInfoDescription: string;
  chaosEventNicknames: string;
  chaosEventStarted: string;
  chaosEventMinigame: string;
  chaosEventTurnModifier: string;

  // Turn Chaos
  turnChaosTitle: string;
  turnChaosStartButton: string;
  turnChaosShortTurn: string;
  turnChaosSoundsAndMime: string;
  turnChaosQuestionsOnly: string;
  turnChaosRussianAccent: string;
  turnChaosFrenchAccent: string;
  turnChaosBearAccent: string;
  turnChaosBreakingNews: string;

  // Minigame
  minigameTitle: string;
  minigamePickACard: string;
  minigameWaiting: string;
  minigameContinueButton: string;
  minigameRevealPrompt: string;
  minigamePlayerChoiceSteal: string;
  minigamePlayerChoiceSwap: string;
  minigameChoosePlayerButton: string;
  cardOutcomeBonusPoints: string;
  cardOutcomeLosePoints: string;
  cardOutcomeStealPoints: string;
  cardOutcomeSwapScores: string;
  cardOutcomeDoublePoints: string;
  cardOutcomeDoubleTargetPoints: string;
  minigamePlayerChoiceDoublePoints: string;
  cardOutcomeRandomizeScores: string;
  cardOutcomeLoseHalfPoints: string;
  cardOutcomeGivePoints: string;
  minigamePlayerChoiceGivePoints: string;

  // Confirmation Modal
  confirmStartGameLowPlayersTitle: string;
  confirmStartGameLowPlayersMessage: string;
  confirmYes: string;
  confirmNo: string;

  // Local (Offline) Mode
  playOnOneDevice: string;
  localGameSetupTitle: string;
  playersList: string;
  addPlayerNamePlaceholder: string;
  minTwoPlayersLocal: string;
  startTurnButtonLocal: string;
  readyScreenTitle: string;
  readyScreenMessage: string;
  showWordButton: string;
}

export interface LoadingStep {
  key: keyof AppTranslations;
  status: LoadingStatus;
}

export interface TurnChaosEvent {
  type: TurnChaosType;
  descriptionKey: keyof AppTranslations;
  value?: number;
}

export interface Player {
  name: string;
  score: number;
  isHost?: boolean;
  chaosNickname?: string;
}

export interface PlayerWithId extends Player {
    id: string;
    isLeading?: boolean;
}


// Minigame Types
export enum MinigameCardActionType {
  STEAL_POINTS = 'STEAL_POINTS',
  SWAP_SCORES = 'SWAP_SCORES',
  BONUS_POINTS = 'BONUS_POINTS',
  LOSE_POINTS = 'LOSE_POINTS',
  DOUBLE_POINTS = 'DOUBLE_POINTS',
  DOUBLE_TARGET_POINTS = 'DOUBLE_TARGET_POINTS',
  RANDOMIZE_SCORES = 'RANDOMIZE_SCORES',
  LOSE_HALF_POINTS = 'LOSE_HALF_POINTS',
  GIVE_POINTS = 'GIVE_POINTS',
}

export interface MinigameCardOutcome {
  translationKey: string;
  value: number;
  action: MinigameCardActionType;
  requiresPlayerChoice?: boolean;
  playerChoicePromptKey?: keyof AppTranslations;
}

export interface MinigameCard {
  id: string;
  outcome: MinigameCardOutcome;
}

export interface MinigameState {
  isActive: boolean;
  activePlayerId: string;
  cards: MinigameCard[];
  selectedCardId: string | null;
  revealedOutcome: MinigameCardOutcome | null;
  actionApplied: boolean;
}

export interface GameSession {
  gameId: string;
  hostId?: string; // Optional for local games
  players: { [playerId: string]: Player };
  playerOrder: string[];
  language: Language;
  winningScore: number;
  currentPlayerIndex: number;
  currentTurnPlayerId: string;
  words: string[];
  turnTimer: number;
  gameState: GameState;
  
  // Turn-specific state
  currentWord: string | null;
  turnStartTime: number | null;
  
  // Chaos Mode state
  isChaosMode: boolean;
  activeChaosEvent: ChaosEvent | null;
  activeTurnChaos: TurnChaosEvent | null;

  // Minigame state
  minigameState: MinigameState | null;

  // Player count state
  playerCount: number;

  // Player join queue
  pendingPlayers?: { [playerId: string]: Player } | null;

  // New property to differentiate game types
  gameMode: 'online' | 'local';
}

export type WinningScore = 10 | 15 | 20 | 25 | 30 | 35 | 40 | 45 | 50;