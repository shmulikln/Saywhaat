import React from 'react';
import { useTranslations } from '../contexts/TranslationsContext';
import { Player, Language } from '../types';

interface LocalSetupProps {
  playMode: 'ffa' | 'teams';
  team1Name: string;
  setTeam1Name: (name: string) => void;
  team2Name: string;
  setTeam2Name: (name: string) => void;
  localPlayers: Player[];
  setLocalPlayers: (players: Player[]) => void;
  newLocalPlayerName: string;
  setNewLocalPlayerName: (name: string) => void;
  onAddPlayer: () => void;
  onRemovePlayer: (index: number) => void;
  renderSharedOptions: () => React.ReactNode;
}

const LocalSetup: React.FC<LocalSetupProps> = ({
  playMode,
  team1Name, setTeam1Name,
  team2Name, setTeam2Name,
  localPlayers, setLocalPlayers,
  newLocalPlayerName, setNewLocalPlayerName,
  onAddPlayer, onRemovePlayer,
  renderSharedOptions
}) => {
  const { t, language } = useTranslations();
  const isRtl = language === Language.HE || language === Language.AR;

  const inputBgColor = 'bg-white/10';
  const inputHeight = 'h-[60px]';
  const inputBaseClasses = `w-full ${inputHeight} px-6 border border-white/20 rounded-full focus:ring-2 focus:ring-[#FBBF24] focus:border-[#FBBF24] text-white placeholder-white/30 backdrop-blur-md transition-all outline-none`;

  if (playMode === 'teams') {
    return (
      <div className="w-full animate-fade-in space-y-6">
        <div className="px-1">
          <label htmlFor="team1Name" className="block text-sm font-bold uppercase tracking-widest text-white/70 mb-3 px-2 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-cyan-400 inline-block shadow-[0_0_8px_rgba(34,211,238,0.8)]"></span>
            {t('team1NameLabel')}
          </label>
          <input 
            id="team1Name" 
            type="text" 
            value={team1Name} 
            onChange={(e) => setTeam1Name(e.target.value)} 
            placeholder={t('defaultTeam1Name')} 
            className={`${inputBaseClasses} ${inputBgColor}`} 
            maxLength={20} 
          />
        </div>

        <div className="px-1">
          <label htmlFor="team2Name" className="block text-sm font-bold uppercase tracking-widest text-white/70 mb-3 px-2 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-400 inline-block shadow-[0_0_8px_rgba(251,191,36,0.8)]"></span>
            {t('team2NameLabel')}
          </label>
          <input 
            id="team2Name" 
            type="text" 
            value={team2Name} 
            onChange={(e) => setTeam2Name(e.target.value)} 
            placeholder={t('defaultTeam2Name')} 
            className={`${inputBaseClasses} ${inputBgColor}`} 
            maxLength={20} 
          />
        </div>

        {renderSharedOptions()}
      </div>
    );
  }

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
            className={`absolute ${isRtl ? 'left-2' : 'right-2'} top-2 bottom-2 px-6 bg-[#FBBF24] text-[#4c1d95] font-black uppercase tracking-widest text-xs rounded-full shadow-lg active:scale-95 transition-all disabled:opacity-0 disabled:scale-90`}
          >
            {t('addButton')}
          </button>
        </div>
      </div>

      {localPlayers.length > 0 && (
        <div className="px-1">
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/60 px-2">{t('playersList')}</h3>
              <span className={`text-xs font-black px-3 py-1 rounded-full ${localPlayers.length >= 2 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-white/10 text-white'}`}>
                {localPlayers.length}
              </span>
           </div>
           <div className="flex flex-wrap gap-2">
              {localPlayers.map((player, index) => (
                <div key={index} className="flex items-center gap-3 bg-white/15 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/20 shadow-sm animate-fade-in">
                  <span className="text-white font-bold text-sm tracking-tight">{player.name}</span>
                  <button onClick={() => onRemovePlayer(index)} className="text-white/40 hover:text-red-400 transition-colors p-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
           </div>
        </div>
      )}

      {localPlayers.length === 2 && playMode !== 'teams' && (
        <div className="px-2 animate-fade-in">
          <div className="bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 border border-emerald-400/40 rounded-2xl py-3 px-4 flex items-center gap-3 shadow-md backdrop-blur-md">
            <span className="text-xl">🤝</span>
            <div className="text-left rtl:text-right">
              <p className="text-xs font-black uppercase tracking-wider text-emerald-300">
                {t('duoMode') || 'Co-op Duo Mode Active'}
              </p>
              <p className="text-[11px] font-semibold text-white/80">
                {t('duoModeDesc') || '2 Players: Work together against the clock! (30s rounds)'}
              </p>
            </div>
          </div>
        </div>
      )}

      {localPlayers.length < 2 && (
        <div className="px-2">
          <p className="text-xs text-amber-200/90 font-semibold bg-amber-500/10 border border-amber-500/20 rounded-2xl py-2.5 px-4 flex items-center gap-2">
            <span>⚠️</span> {t('minTwoPlayersLocal')}
          </p>
        </div>
      )}

      {renderSharedOptions()}
    </div>
  );
};

export default LocalSetup;