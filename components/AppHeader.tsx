import React from 'react';
import { useTranslations } from '../contexts/TranslationsContext';

interface AppHeaderProps {
  size?: 'md' | 'lg';
}

const AppHeader: React.FC<AppHeaderProps> = ({ size = 'md' }) => {
  const { t } = useTranslations();

  const textShadowStyle = {
    textShadow: '0px 4px 8px rgba(30, 0, 121, 0.73), 0px 0px 52px rgba(0, 43, 255, 0.25), 0px 0px 44px rgba(0, 0, 0, 0.25), 0px 0px 44px rgba(255, 0, 4, 0.35)',
  };

  const isLarge = size === 'lg';

  const sayClasses = isLarge 
    ? "brand-text text-white text-[50px] sm:text-[68px] uppercase" 
    : "brand-text text-white text-[28px] sm:text-[38px] uppercase";
  
  const whaaatClasses = isLarge
    ? "brand-text text-[#FBBF24] text-[60px] sm:text-[82px] uppercase transform rotate-[4deg] mt-0 inline-block"
    : "brand-text text-[#FBBF24] text-[34px] sm:text-[46px] uppercase transform rotate-[4deg] mt-0 inline-block";

  return (
    <header 
      dir="ltr" 
      className={`w-full text-center select-none ${isLarge ? 'pt-8 pb-4 sm:pt-12 sm:pb-6' : 'pt-2 pb-1 sm:pt-4 sm:pb-2'}`} 
      role="banner"
    >
      <h1 
        className="flex flex-col items-center justify-center font-luckiest-guy leading-[0.8] tracking-tight"
        style={textShadowStyle}
      >
        <span className={sayClasses}>
          Say
        </span>
        <span className={whaaatClasses}>
          Whaaat?
        </span>
      </h1>
    </header>
  );
};

export default React.memo(AppHeader);
