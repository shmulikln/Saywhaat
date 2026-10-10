import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from '../contexts/TranslationsContext';

interface ChaosModeInfoModalProps {
  onClose: () => void;
}

const ChaosModeInfoModal: React.FC<ChaosModeInfoModalProps> = ({ onClose }) => {
  const { t } = useTranslations();
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 220);
  }, [isClosing, onClose]);

  // Handle ESC key to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col justify-between items-center px-6 pb-6 pt-safe-top sm:p-10 select-none overflow-hidden ${
        isClosing ? 'animate-modal-backdrop-exit' : 'animate-modal-backdrop-enter'
      }`}
      style={{
        backgroundColor: '#0b0517',
        backgroundImage: 'radial-gradient(circle at 50% 32%, rgba(249, 115, 22, 0.38) 0%, rgba(220, 38, 38, 0.22) 38%, rgba(124, 58, 237, 0.18) 72%, #0b0517 100%)',
      }}
      role="dialog"
      aria-modal="true"
      aria-label={t('chaosModeInfoTitle')}
    >
      {/* Top Header / Dismiss Row */}
      <div className="w-full max-w-4xl flex items-center justify-between z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/40 shadow-[0_0_20px_rgba(249,115,22,0.3)]">
          <span className="text-base">🔥</span>
          <span className="text-xs sm:text-sm font-black text-amber-300 uppercase tracking-widest">
            {t('chaosMode')}
          </span>
        </div>

        <button
          type="button"
          onClick={handleClose}
          className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 border border-white/20 text-white/90 hover:text-white flex items-center justify-center text-3xl transition-all shadow-lg cursor-pointer backdrop-blur-md"
          aria-label="Close"
        >
          &times;
        </button>
      </div>

      {/* Hero Center - Disruptive, Bigger & Bolder */}
      <div 
        className={`w-full max-w-3xl flex flex-col items-center justify-center my-auto px-4 py-6 text-center z-10 transition-all ${
          isClosing ? 'animate-modal-exit' : 'animate-chaos-card-zoom'
        }`}
      >
        {/* Flame Badge */}
        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-600 flex items-center justify-center text-5xl sm:text-7xl shadow-[0_0_70px_rgba(249,115,22,0.85),inset_0_2px_4px_rgba(255,255,255,0.7)] border-2 border-amber-300 transform animate-bounce mb-5 sm:mb-7">
          🔥
        </div>

        {/* Title: What is Chaos Mode? */}
        <h2 className="font-luckiest-guy text-4xl sm:text-6xl md:text-7xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 drop-shadow-[0_8px_30px_rgba(249,115,22,0.7)] uppercase tracking-tight leading-[1.1] mb-5 sm:mb-6">
          {t('chaosModeInfoTitle')}
        </h2>

        {/* Main description: When enabled, random chaos events can occur between turns, shaking up the game! */}
        <p className="text-xl sm:text-3xl md:text-4xl font-black text-white leading-snug sm:leading-normal drop-shadow-[0_4px_14px_rgba(0,0,0,0.9)] max-w-2xl mb-6 sm:mb-8">
          {t('chaosModeInfoDescription')}
        </p>

        {/* Punchline Banner: You never know what might happen… */}
        <div className="px-6 sm:px-10 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-red-600/30 via-orange-500/25 to-purple-600/30 border-2 border-orange-500/70 shadow-[0_0_35px_rgba(249,115,22,0.45)] backdrop-blur-md transform -rotate-1 hover:rotate-0 transition-transform">
          <p className="text-lg sm:text-2xl md:text-3xl font-black text-amber-300 uppercase italic tracking-wide drop-shadow">
            {t('chaosModeNeverKnow')}
          </p>
        </div>
      </div>

      {/* Bottom CTA Action Button */}
      <div className="w-full max-w-md flex justify-center pb-2 z-10">
        <button
          type="button"
          onClick={handleClose}
          className="w-full h-16 sm:h-18 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 text-white font-black text-xl sm:text-2xl uppercase tracking-widest shadow-[0_12px_35px_rgba(249,115,22,0.6),inset_0_2px_3px_rgba(255,255,255,0.7)] active:scale-95 hover:brightness-110 transition-all border border-amber-300/50 flex items-center justify-center cursor-pointer"
        >
          {t('chaosModeGotIt')}
        </button>
      </div>
    </div>
  );
};

export default ChaosModeInfoModal;
