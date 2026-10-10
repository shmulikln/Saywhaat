import React from 'react';
import Modal from './Modal';
import { useTranslations } from '../contexts/TranslationsContext';

interface GameRulesModalProps {
  currentMode?: 'individual' | 'teams' | 'duo';
  onClose: () => void;
}

const GameRulesModal: React.FC<GameRulesModalProps> = ({ currentMode = 'individual', onClose }) => {
  const { t } = useTranslations();

  const modeName = currentMode === 'duo'
    ? (t('duoMode') || 'Co-op Duo')
    : currentMode === 'teams'
    ? (t('teamsMode') || 'Teams')
    : (t('freeForAllMode') || 'Free For All');

  const modeSummary = currentMode === 'duo'
    ? (t('duoRulesSummary') || '2 players work together as one team! Alternate turns explaining and guessing to beat the rounds limit.')
    : currentMode === 'teams'
    ? (t('teamsRulesSummary') || "Two teams take turns. On your team's turn, one player explains and their teammates guess. The other team stays quiet!")
    : (t('ffaRulesSummary') || 'One player describes the word on screen while everyone else competes to shout out the correct answer!');

  const scoringGuessed = currentMode === 'duo'
    ? (t('duoScoringGuessed') || 'Team earns +1 pt.')
    : currentMode === 'teams'
    ? (t('teamsScoringGuessed') || 'Team earns +1 pt.')
    : (t('ffaScoringGuessed') || 'Guesser earns +1 pt. Explainer earns +1 pt.');

  const scoringSkip = currentMode === 'duo'
    ? (t('duoScoringSkip') || 'Team loses -1 pt (skips to next word).')
    : currentMode === 'teams'
    ? (t('teamsScoringSkip') || 'Team loses -1 pt (skips to next word).')
    : (t('ffaScoringSkip') || 'Explainer loses -1 pt (skips to next word).');

  const winningGoal = currentMode === 'duo'
    ? (t('duoWinningGoal') || 'Reach the winning score before the rounds run out!')
    : currentMode === 'teams'
    ? (t('teamsWinningGoal') || 'First team to reach the winning score wins!')
    : (t('ffaWinningGoal') || 'First player to reach the winning score wins!');

  const guessedBadge = '+1';

  return (
    <Modal title={t('gameRulesAndScoring') || 'Rules & Scoring'} onClose={onClose}>
      <div className="space-y-3.5 max-h-[80vh] overflow-y-auto pr-1 text-slate-200">
        
        {/* Active Mode Label */}
        <div className="text-[11px] font-black uppercase tracking-widest text-amber-300">
          {modeName}
        </div>

        {/* How It Works */}
        <p className="text-xs sm:text-sm text-slate-100 leading-relaxed">
          {modeSummary}
        </p>

        {/* The Golden Rules (DO / DON'T) */}
        <div className="space-y-1.5 pt-1 border-t border-white/10">
          <div className="flex items-start gap-2 text-xs leading-snug">
            <span className="text-emerald-400 font-black shrink-0">✓</span>
            <span className="text-slate-200">
              <strong className="text-emerald-300 font-bold ltr:mr-1 rtl:ml-1">DO:</strong>
              {t('rulesDos') || 'Use words, synonyms, hints, and creative clues.'}
            </span>
          </div>

          <div className="flex items-start gap-2 text-xs leading-snug">
            <span className="text-rose-400 font-black shrink-0">✗</span>
            <span className="text-slate-200">
              <strong className="text-rose-300 font-bold ltr:mr-1 rtl:ml-1">DON'T:</strong>
              {t('rulesDonts') || 'Do NOT say any part of the word, rhymes, or spell it out.'}
            </span>
          </div>
        </div>

        {/* Points & Scoring */}
        <div className="border-t border-white/10 pt-2.5 space-y-2">
          <div className="text-[10px] font-black uppercase tracking-widest text-white/50">
            {t('rulesTabScoring') || 'Points & Scoring'}
          </div>

          {/* Guessed Row */}
          <div className="flex items-center justify-between gap-3 py-0.5">
            <div className="min-w-0">
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wide">
                {t('guessedButton') || 'Guessed!'}
              </span>
              <p className="text-[11px] text-slate-300 leading-tight mt-0.5">
                {scoringGuessed}
              </p>
            </div>
            <span className="text-sm font-mono font-black text-emerald-400 shrink-0">
              {guessedBadge}
            </span>
          </div>

          {/* Skip Row */}
          <div className="flex items-center justify-between gap-3 py-0.5">
            <div className="min-w-0">
              <span className="text-xs font-bold text-rose-300 uppercase tracking-wide">
                {t('skipButton') || 'Skip'}
              </span>
              <p className="text-[11px] text-slate-300 leading-tight mt-0.5">
                {scoringSkip}
              </p>
            </div>
            <span className="text-sm font-mono font-black text-rose-400 shrink-0">
              -1
            </span>
          </div>
        </div>

        {/* Winning Condition */}
        <div className="border-t border-white/10 pt-2.5 flex items-center gap-2 text-xs text-amber-200/90 font-medium">
          <span className="text-base shrink-0">🏆</span>
          <span className="leading-snug">{winningGoal}</span>
        </div>

        {/* Close Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white font-bold uppercase tracking-wider text-xs transition-all active:scale-95"
          >
            {t('confirmButton') || 'Got It!'}
          </button>
        </div>

      </div>
    </Modal>
  );
};

export default GameRulesModal;
