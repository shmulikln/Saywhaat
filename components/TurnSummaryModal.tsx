import React from 'react';
import { TurnSummary } from '../types';
import { useTranslations } from '../contexts/TranslationsContext';
import { triggerHaptic } from '../utils/nativeUtils';

interface TurnSummaryModalProps {
  summary: TurnSummary;
  onNext: () => void;
  canAdvance: boolean;
}

const TurnSummaryModal: React.FC<TurnSummaryModalProps> = ({
  summary,
  onNext,
  canAdvance,
}) => {
  const { t } = useTranslations();

  const handleNextClick = () => {
    triggerHaptic('LIGHT');
    onNext();
  };

  const words = summary.words || [];
  const scoresArray = Object.entries(summary.scoresDelta || {}) as [string, { name: string; delta: number }][];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
      <div 
        className="w-full max-w-lg bg-gradient-to-b from-[#3b0764]/95 via-[#2e1065]/95 to-[#1e1b4b]/95 border-2 border-white/20 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col max-h-[88vh] overflow-hidden text-white animate-scale-up"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-white/10 text-center shrink-0">
          <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400">
            {t('turnSummaryTitle')}
          </h2>
          <p className="text-sm text-purple-200/80 font-medium mt-1">
            {summary.explainerName}
          </p>
        </div>

        {/* Scrollable Words List in Chronological Order */}
        <div className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-2.5 min-h-[160px]">
          {words.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-white/50 text-sm italic">
              {t('noWordsAttempted')}
            </div>
          ) : (
            words.map((item, index) => {
              const isGuessed = item.status === 'guessed';
              return (
                <div
                  key={`${item.word}-${index}`}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                    isGuessed
                      ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-100 shadow-[0_4px_15px_rgba(16,185,129,0.15)]'
                      : 'bg-rose-500/15 border-rose-400/40 text-rose-100 shadow-[0_4px_15px_rgba(244,63,94,0.15)]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                        isGuessed
                          ? 'bg-emerald-400 text-[#064e3b]'
                          : 'bg-rose-400 text-[#4c0519]'
                      }`}
                    >
                      {isGuessed ? '✓' : '✕'}
                    </span>
                    <span className="text-base sm:text-lg font-bold truncate">
                      {item.word}
                    </span>
                  </div>

                  <div className="shrink-0 text-right">
                    {isGuessed ? (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                        {item.guesserName
                          ? t('guessedBy', { name: item.guesserName })
                          : t('wordsGuessed')}{' '}
                        (+1)
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-400/20 text-rose-200 border border-rose-400/30">
                        {t('wordsSkipped')} (-1)
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Round Points Recap */}
        {scoresArray.length > 0 && (
          <div className="px-6 py-3.5 bg-black/20 border-t border-white/10 shrink-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-purple-200/60 mb-2">
              {t('roundScores')}
            </p>
            <div className="flex flex-wrap gap-2">
              {scoresArray.map(([id, info]) => {
                const isPositive = info.delta > 0;
                const isNegative = info.delta < 0;
                return (
                  <span
                    key={id}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
                      isPositive
                        ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200'
                        : isNegative
                        ? 'bg-rose-500/20 border-rose-400/40 text-rose-200'
                        : 'bg-white/10 border-white/20 text-white/80'
                    }`}
                  >
                    <span>{info.name}:</span>
                    <span className="font-black">
                      {isPositive ? `+${info.delta}` : info.delta}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer with Localized Next Button */}
        <div className="p-4 sm:p-6 border-t border-white/10 shrink-0">
          {canAdvance ? (
            <button
              onClick={handleNextClick}
              className="w-full h-14 sm:h-16 bg-[#FBBF24] hover:bg-[#f59e0b] active:bg-[#d97706] text-[#3b0764] font-black uppercase tracking-wider text-base sm:text-lg rounded-full shadow-[0_4px_25px_rgba(251,191,36,0.4)] active:scale-95 transition-all flex items-center justify-center"
            >
              <span>{t('nextTurnButton')}</span>
            </button>
          ) : (
            <div className="text-center py-2 text-sm text-purple-200/70 italic">
              {t('waitingForPlayerTurn')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TurnSummaryModal;
