import React from 'react';
import { useGame } from '../contexts/GameSessionContext';
import { useTranslations } from '../contexts/TranslationsContext';
import { Player, Language } from '../types';

interface LocalSetupProps {
  localPlayers: Player[];
  setLocalPlayers: (players: Player[]) => void;
  newLocalPlayerName: string;
  setNewLocalPlayerName: (name: string) => void;
  onAddPlayer: () => void;
  onRemovePlayer: (index: number) => void;
  renderSharedOptions: () => React.ReactNode;
}

const LocalSetup: React.FC<LocalSetupProps> = ({
  localPlayers, setLocalPlayers,
  newLocalPlayerName, setNewLocalPlayerName,
  onAddPlayer, onRemovePlayer,
  renderSharedOptions
}) => {
  const { t, language } = useTranslations();
  const isRtl = language === Language.HE || language === Language.AR;

  const inputBgColor = 'bg-white/10';
  const inputHeight = 'h-[60px]';
  const inputBaseClasses = `w-full ${inputHeight} px-6 border border-white/20 rounded-[30px] focus:ring-2 focus:ring-[#FBBF24] focus:border-[#FBBF24] text-white placeholder-white/30 backdrop-blur-md transition-all outline-none`;

  return (
    <div className="w-full animate-fade-in space-y-8">
      <div className="px-1">
        <label htmlFor="newLocalPlayerName" className="block text-sm font-bold uppercase tracking-widest text-white/60 mb-3 px-2">{t('playerNameLabel')}</label>
        <div className="relative">
          <input 
            id="newLocalPlayerName" 
            type="text" 
            value={newLocalPlayerName} 
            onChange={(e) => setNewLocalPlayerName(e.target.value)} 
            placeholder={t('addPlayerNamePlaceholder')} 
            className={`${inputBaseClasses} ${inputBgColor} ${isRtl ? 'pl-24' : 'pr-24'}`} 
            maxLength={20} 
            onKeyPress={(e) => e.key === 'Enter' && onAddPlayer()} 
          />
          <button 
            onClick={onAddPlayer} 
            disabled={!newLocalPlayerName.trim()} 
            className={`absolute ${isRtl ? 'left-2' : 'right-2'} top-2 bottom-2 px-6 bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-widest text-xs rounded-full disabled:opacity-0 transition-all active:scale-95 border border-white/10`}
          >
            {t('addButton')}
          </button>
        </div>
      </div>

      {localPlayers.length > 0 && (
        <div className="px-1">
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/60 px-2">{t('playersList')}</h3>
              <span className="text-xs font-black bg-white/10 px-3 py-1 rounded-full text-white">{localPlayers.length}</span>
           </div>
           <div className="flex flex-wrap gap-2">
              {localPlayers.map((player, index) => (
                <div key={index} className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/10 animate-fade-in">
                  <span className="text-white font-bold text-sm tracking-tight">{player.name}</span>
                  <button onClick={() => onRemovePlayer(index)} className="text-white/40 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
           </div>
        </div>
      )}

      {renderSharedOptions()}
    </div>
  );
};

export default LocalSetup;