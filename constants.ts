
import { Language, WinningScore } from './types';

export const APP_VERSION = "lang-2.1";
// This ID helps verify that the latest code changes are active
export const BUILD_ID = "REV-210-UPDATE";

export const DEFAULT_WINNING_SCORE: WinningScore = 10;
export const DEFAULT_LANGUAGE: Language = Language.EN;
export const TURN_DURATION_SECONDS: number = 60;
export const DUO_TURN_DURATION_SECONDS: number = 30;

export const getDuoTotalRounds = (winningScore: number): number => {
  return Math.max(2, Math.round(winningScore / 5));
};

// Chaos Mode Constants
export const CHAOS_EVENT_CHANCE = 0.50; // 50% chance for ANY chaos event
export const MINIGAME_CARDS_TO_DRAW = 3;

export const WINNING_SCORES: WinningScore[] = [10, 15, 20, 25, 30, 35, 40, 45, 50];

export const AVAILABLE_LANGUAGES: { value: Language; label: string; flag: string }[] = [
  { value: Language.EN, label: "English", flag: "🇬🇧" },
  { value: Language.HE, label: "עברית", flag: "🇮🇱" },
  { value: Language.PT, label: "Português", flag: "🇵🇹" },
  { value: Language.HI, label: "हिन्दी", flag: "🇮🇳" },
  { value: Language.ID, label: "Bahasa Indonesia", flag: "🇮🇩" },
  { value: Language.AR, label: "العربية", flag: "🇸🇦" },
  { value: Language.ZH, label: "繁體中文", flag: "🇹🇼" },
];
