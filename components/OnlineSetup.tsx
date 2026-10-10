
import React from 'react';
import { useTranslations } from '../contexts/TranslationsContext';
import { isFirebaseConfigured } from '../services/firebaseService';

interface OnlineSetupProps {
  intent: 'create' | 'join';
  playMode: 'ffa' | 'teams';
  team1Name: string;
  setTeam1Name: (name: string) => void;
  team2Name: string;
  setTeam2Name: (name: string) => void;
  hostName: string;
  setHostName: (name: string) => void;
  joinPlayerName: string;
  setJoinPlayerName: (name: string) => void;
  joinGameCode: string;
  setJoinGameCode: (code: string) => void;
  detectedGameMode?: 'ffa' | 'teams' | null;
  detectedTeams?: { team1: { name: string }; team2: { name: string } } | null;
  selectedJoinTeamId: 'team1' | 'team2';
  setSelectedJoinTeamId: (teamId: 'team1' | 'team2') => void;
  renderSharedOptions: () => React.ReactNode;
}

const OnlineSetup: React.FC<OnlineSetupProps> = ({
  intent,
  playMode,
  team1Name, setTeam1Name,
  team2Name, setTeam2Name,
  hostName, setHostName,
  joinPlayerName, setJoinPlayerName,
  joinGameCode, setJoinGameCode,
  detectedGameMode,
  detectedTeams,
  selectedJoinTeamId,
  setSelectedJoinTeamId,
  renderSharedOptions
}) => {
  const { t } = useTranslations();
  const isOnlineAvailable = isFirebaseConfigured();
  
  const inputBgColor = 'bg-white/10';
  const inputHeight = 'h-[60px]';
  const inputBaseClasses = `w-full ${inputHeight} px-6 border border-white/20 rounded-full focus:ring-2 focus:ring-[#FBBF24] focus:border-[#FBBF24] text-white placeholder-white/30 backdrop-blur-md transition-all outline-none`;

  return (
    <div className={`w-full transition-opacity duration-300 ${!isOnlineAvailable ? 'opacity-50 pointer-events-none' : ''}`}>
      <div role="tabpanel">
        {intent === 'create' && (
          <div className="animate-fade-in space-y-6">
            {playMode === 'teams' ? (
              <>
                <div className="px-1">
                  <label htmlFor="onlineTeam1Name" className="block text-sm font-bold uppercase tracking-widest text-white/70 mb-3 px-2 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-cyan-400 inline-block shadow-[0_0_8px_rgba(34,211,238,0.8)]"></span>
                    {t('team1NameLabel')}
                  </label>
                  <input 
                    id="onlineTeam1Name" 
                    type="text" 
                    value={team1Name} 
                    onChange={(e) => setTeam1Name(e.target.value)} 
                    placeholder={t('defaultTeam1Name')} 
                    className={`${inputBaseClasses} ${inputBgColor}`} 
                    maxLength={20} 
                  />
                </div>

                <div className="px-1">
                  <label htmlFor="onlineTeam2Name" className="block text-sm font-bold uppercase tracking-widest text-white/70 mb-3 px-2 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-400 inline-block shadow-[0_0_8px_rgba(251,191,36,0.8)]"></span>
                    {t('team2NameLabel')}
                  </label>
                  <input 
                    id="onlineTeam2Name" 
                    type="text" 
                    value={team2Name} 
                    onChange={(e) => setTeam2Name(e.target.value)} 
                    placeholder={t('defaultTeam2Name')} 
                    className={`${inputBaseClasses} ${inputBgColor}`} 
                    maxLength={20} 
                  />
                </div>
              </>
            ) : (
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
            )}
            {renderSharedOptions()}
          </div>
        )}
        {intent === 'join' && (
          <div className="animate-fade-in space-y-6">
            <div className="px-1">
              <label htmlFor="joinGameCode" className="block text-sm font-bold uppercase tracking-widest text-white/60 mb-3 px-2">{t('gameCode')}</label>
              <input 
                id="joinGameCode"
                type="text" 
                value={joinGameCode} 
                onChange={(e) => setJoinGameCode(e.target.value.toUpperCase())} 
                placeholder="ABCD" 
                maxLength={4} 
                className={`${inputBaseClasses} ${inputBgColor} font-mono tracking-[0.35em] text-center font-black text-3xl text-[#FBBF24] placeholder-white/20`}
              />
            </div>

            {detectedGameMode === 'teams' ? (
              <div className="px-1 space-y-3 animate-fade-in">
                <label className="block text-xs font-black uppercase tracking-widest text-white/70 px-2 text-center">
                  {t('selectYourTeam')}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedJoinTeamId('team1')}
                    className={`py-3.5 px-4 rounded-full font-black text-sm uppercase tracking-wider transition-all border-2 flex items-center justify-center gap-2 ${
                      selectedJoinTeamId === 'team1'
                        ? 'bg-cyan-500/30 border-cyan-400 text-white shadow-[0_0_20px_rgba(34,211,238,0.4)] scale-102'
                        : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0"></span>
                    <span className="truncate">{detectedTeams?.team1.name || t('defaultTeam1Name')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedJoinTeamId('team2')}
                    className={`py-3.5 px-4 rounded-full font-black text-sm uppercase tracking-wider transition-all border-2 flex items-center justify-center gap-2 ${
                      selectedJoinTeamId === 'team2'
                        ? 'bg-amber-500/30 border-amber-400 text-white shadow-[0_0_20px_rgba(251,191,36,0.4)] scale-102'
                        : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0"></span>
                    <span className="truncate">{detectedTeams?.team2.name || t('defaultTeam2Name')}</span>
                  </button>
                </div>
              </div>
            ) : detectedGameMode === 'ffa' || (!detectedGameMode && joinGameCode.length < 4) ? (
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
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default OnlineSetup;
