import React from 'react';
import { useTranslations } from '../contexts/TranslationsContext';

interface AppHeaderProps {
  size?: 'md' | 'lg' | 'hero';
  className?: string;
  showQuestionMark?: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({ size = 'md', className, showQuestionMark = false }) => {
  const { t } = useTranslations();

  const isHero = size === 'hero';
  const isLg = size === 'lg';

  // Responsive font sizes with proportional em-based margin
  // to ensure consistent spacing without negative vw blowup on PC.
  const sayStyle: React.CSSProperties = {
    fontFamily: "'Luckiest Guy', cursive",
    fontSize: isHero
      ? 'clamp(64px, 32vw, 160px)'
      : isLg
      ? 'clamp(48px, 14vw, 72px)'
      : 'clamp(32px, 10vw, 48px)',
    lineHeight: 0.85,
    letterSpacing: '0.02em',
    textShadow:
      '0px 4px 8px rgba(30, 0, 121, 0.73), 0px 0px 52px rgba(0, 43, 255, 0.25), 0px 0px 44px rgba(0, 0, 0, 0.25), 0px 0px 44px rgba(255, 0, 4, 0.35)',
  };

  const whaaatStyle: React.CSSProperties = {
    fontFamily: "'Luckiest Guy', cursive",
    fontSize: isHero
      ? 'clamp(30px, 15vw, 76px)'
      : isLg
      ? 'clamp(24px, 7vw, 36px)'
      : 'clamp(16px, 5vw, 24px)',
    lineHeight: 0.85,
    letterSpacing: '0.02em',
    marginTop: isHero ? '-0.06em' : '-0.04em',
    background: 'linear-gradient(180deg, #FFDE87 1.92%, #FBBF23 100%)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    filter:
      'drop-shadow(0px 4px 6px rgba(30, 0, 121, 0.75)) drop-shadow(0px 0px 20px rgba(0, 43, 255, 0.25))',
  };

  const defaultClasses = isHero
    ? 'h-[45vh] min-h-[220px] max-h-[45vh] flex flex-col items-center justify-center pt-2 pb-2'
    : isLg
    ? 'pt-3 pb-2 sm:pt-5 sm:pb-3 flex flex-col items-center justify-center'
    : 'pt-2 pb-1 sm:pt-4 sm:pb-2';

  const rotationClass = isHero ? 'rotate-[2deg]' : isLg ? 'rotate-[2.5deg]' : 'rotate-[3deg]';

  return (
    <header
      dir="ltr"
      className={`w-full text-center select-none ${className || defaultClasses}`}
      role="banner"
    >
      <h1
        className={`flex flex-col items-center justify-center font-luckiest-guy leading-[0.85] ${
          isHero ? 'w-full max-w-full' : 'w-full'
        }`}
      >
        <span
          className="font-luckiest-guy brand-text text-white uppercase block w-full text-center"
          style={sayStyle}
        >
          Say
        </span>
        <span
          className={`font-luckiest-guy brand-text uppercase transform ${rotationClass} inline-block text-center`}
          style={whaaatStyle}
        >
          WHAAAT{showQuestionMark ? '?' : ''}
        </span>
      </h1>
    </header>
  );
};

export default React.memo(AppHeader);
