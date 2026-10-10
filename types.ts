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
  chaosModeNeverKnow: string;
  chaosModeGotIt: string;
  chaosRequiresThreePlayers: string;
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
  cardOutcomeRobinHood: string;
  cardOutcomeUnderdogSurge: string;
  cardOutcomeTaxCollector: string;
  cardOutcomeTheEqualizer: string;
  cardOutcomeDoubleOrNothing: string;
  cardOutcomeRussianRoulette: string;
  minigamePlayerChoiceRoulette: string;
  cardOutcomeMysteryBox: string;

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
  howDoYouWantToPlay: string;
  multipleDevicesLabel: string;
  oneDeviceLabel: string;
  multipleDevicesTip: string;
  oneDeviceTip: string;

  // Turn Summary
  turnSummaryTitle: string;
  wordsGuessed: string;
  wordsSkipped: string;
  noWordsAttempted: string;
  roundScores: string;
  nextTurnButton: string;
  guessedBy: string;

  // Game Mode (Teams vs Free For All vs Duo)
  gameModeLabel: string;
  teamsMode: string;
  freeForAllMode: string;
  team1NameLabel: string;
  team2NameLabel: string;
  defaultTeam1Name: string;
  defaultTeam2Name: string;
  chooseTeamLabel: string;
  teamGuessedButton: string;
  teamWinsTitle: string;
  teamScoreLabel: string;
  minPlayersPerTeam: string;
  selectYourTeam: string;
  switchTeamButton: string;
  joinTeamButton: string;

  // Co-op Duo Mode
  duoMode?: string;
  duoModeDesc?: string;
  duoScoreLabel?: string;
  duoRoundLabel?: string;
  duoVictory?: string;
  duoChallengeOver?: string;
  duoGoodEffort?: string;
  duoRoundsSettingLabel?: string;
  challengeWon?: string;
  yourTurnToExplain?: string;
  yourTeamTurn?: string;
  otherTeamTurn?: string;
  specialRuleActive?: string;
  itsATie?: string;
  noWinners?: string;
  waitingForHostRematch?: string;
  roundsUnit?: string;
  singleRoundUnit?: string;
  defaultRoundIndicator?: string;

  // Game Rules & Scoring Modal
  gameRulesAndScoring?: string;
  rulesTabObjective?: string;
  rulesTabScoring?: string;
  rulesDos?: string;
  rulesDonts?: string;
  earnPointsLabel?: string;
  losePointsLabel?: string;
  winningConditionLabel?: string;
  ffaRulesSummary?: string;
  ffaScoringGuessed?: string;
  ffaScoringSkip?: string;
  ffaWinningGoal?: string;
  teamsRulesSummary?: string;
  teamsScoringGuessed?: string;
  teamsScoringSkip?: string;
  teamsWinningGoal?: string;
  duoRulesSummary?: string;
  duoScoringGuessed?: string;
  duoScoringSkip?: string;
  duoWinningGoal?: string;
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

export interface Team {
  id: 'team1' | 'team2';
  name: string;
  score: number;
  color?: string;
  playerIds?: string[];
}

export interface Player {
  name: string;
  score: number;
  isHost?: boolean;
  chaosNickname?: string;
  teamId?: 'team1' | 'team2';
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
  ROBIN_HOOD = 'ROBIN_HOOD',
  UNDERDOG_SURGE = 'UNDERDOG_SURGE',
  TAX_COLLECTOR = 'TAX_COLLECTOR',
  THE_EQUALIZER = 'THE_EQUALIZER',
  DOUBLE_OR_NOTHING = 'DOUBLE_OR_NOTHING',
  RUSSIAN_ROULETTE = 'RUSSIAN_ROULETTE',
  MYSTERY_BOX = 'MYSTERY_BOX',
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

// Turn Summary Types
export interface TurnWordResult {
  word: string;
  status: 'guessed' | 'skipped';
  guesserName?: string;
  guesserId?: string;
}

export interface GuessEvent {
  id: string;
  word: string;
  guesserName: string;
  points: number;
  timestamp: number;
}

export interface TurnSummary {
  explainerId: string;
  explainerName: string;
  words: TurnWordResult[];
  scoresDelta: { [playerId: string]: { name: string; delta: number } };
}

export interface GameSession {
  gameId: string;
  lastGuessEvent?: GuessEvent | null;
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

  // Synchronization for ad overlay on rematch
  showRematchAd?: boolean;

  // Turn summary state
  turnSummary?: TurnSummary | null;
  isTurnSummaryActive?: boolean;

  // Team Mode state
  playMode?: 'ffa' | 'teams' | 'duo';
  teams?: {
    team1: Team;
    team2: Team;
  };
  activeTeamId?: 'team1' | 'team2';

  // Co-op Duo Mode state
  duoScore?: number;
  duoCurrentRound?: number;
  duoTotalRounds?: number;
}

export type WinningScore = 10 | 15 | 20 | 25 | 30 | 35 | 40 | 45 | 50;