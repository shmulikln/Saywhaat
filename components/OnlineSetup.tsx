
import React from 'react';
import { useGame } from '../contexts/GameSessionContext';
import { useTranslations } from '../contexts/TranslationsContext';
import { isFirebaseConfigured } from '../services/firebaseService';

interface OnlineSetupProps {
  activeTab: 'create' | 'join';
  setActiveTab: (tab: 'create' | 'join') => void;
  hostName: string;
  setHostName: (name: string) => void;
  joinPlayerName: string;
  setJoinPlayerName: (name: string) => void;
  joinGameCode: string;
  setJoinGameCode: (code: string) => void;
  renderSharedOptions: () => React.ReactNode;
}

const OnlineSetup: React.FC<OnlineSetupProps> = ({
  activeTab, setActiveTab,
  hostName, setHostName,
  joinPlayerName, setJoinPlayerName,
  joinGameCode, setJoinGameCode,
  renderSharedOptions
}) => {
  const { t } = useTranslations();
  const isOnlineAvailable = isFirebaseConfigured();
  
  const inputBgColor = 'bg-white/10';
  const inputHeight = 'h-[60px]';
  const inputBaseClasses = `w-full ${inputHeight} px-6 border border-white/20 rounded-[30px] focus:ring-2 focus:ring-[#FBBF24] focus:border-[#FBBF24] text-white placeholder-white/30 backdrop-blur-md transition-all outline-none`;

  return (
    <div className={`w-full transition-opacity duration-300 ${!isOnlineAvailable ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex mb-10 gap-2 p-1 bg-white/5 rounded-full backdrop-blur-sm border border-white/10" role="tablist">
        <button 
          onClick={() => setActiveTab('create')} 
          className={`w-1/2 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'create' ? 'bg-white/20 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`} 
          role="tab"
        >
          {t('createGameTitle')}
        </button>
        <button 
          onClick={() => setActiveTab('join')} 
          className={`w-1/2 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'join' ? 'bg-white/20 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`} 
          role="tab"
        >
          {t('joinGameTitle')}
        </button>
      </div>
      
      <div role="tabpanel">
        {activeTab === 'create' && (
          <div className="animate-fade-in space-y-6">
            <div className="px-1">
              <label htmlFor="hostName" className="block text-sm font-bold uppercase tracking-widest text-white/60 mb-3 px-2">{t('hostNameLabel')}</label>
              <input 
                id="hostName" 
                type="text" 
                value={hostName} 
                onChange={(e) => setHostName(e.target.value)} 
                placeholder={t('playerPlaceholder')} 
                className={`${inputBaseClasses} ${inputBgColor}`} 
                maxLength={20} 
              />
            </div>
            {renderSharedOptions()}
          </div>
        )}
        {activeTab === 'join' && (
          <div className="animate-fade-in space-y-6">
            <div className="px-1">
              <label htmlFor="joinPlayerName" className="block text-sm font-bold uppercase tracking-widest text-white/60 mb-3 px-2">{t('playerNameLabel')}</label>
              <input 
                id="joinPlayerName" 
                type="text" 
                value={joinPlayerName} 
                onChange={(e) => setJoinPlayerName(e.target.value)} 
                placeholder={t('playerPlaceholder')} 
                className={`${inputBaseClasses} ${inputBgColor}`} 
                maxLength={20}
              />
            </div>
            <div className="px-1">
              <label htmlFor="joinGameCode" className="block text-sm font-bold uppercase tracking-widest text-white/60 mb-3 px-2">{t('gameCode')}</label>
              <input 
                id="joinGameCode"
                type="text" 
                value={joinGameCode} 
                onChange={(e) => setJoinGameCode(e.target.value.toUpperCase())} 
                placeholder={t('enterGameCodePlaceholder')} 
                maxLength={4} 
                className={`${inputBaseClasses} ${inputBgColor} tracking-[1em] text-center font-black text-2xl`}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnlineSetup;
