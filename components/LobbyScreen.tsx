import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGame } from '../contexts/GameSessionContext';
import { useTranslations } from '../contexts/TranslationsContext';
import QRCodeDisplay from './QRCodeDisplay';
import PlayerChip from './PlayerChip';
import AppHeader from './AppHeader';
import JoinGameChecklistModal from './JoinGameChecklistModal';
import { Language } from '../types';

const LobbyScreen: React.FC = () => {
  const { gameSession, localPlayerId, addPlayer, requestStartGame, leaveGame } = useGame();
  const { t, language } = useTranslations();
  const navigate = useNavigate();
  const location = useLocation();
  const [newPlayerName, setNewPlayerName] = useState('');
  const [copied, setCopied] = useState(false);

  const isLocalPlayerInGame = gameSession?.playerOrder.includes(localPlayerId || '');
  const isRtl = language === Language.HE || language === Language.AR;

  useEffect(() => {
    if (!gameSession) {
      navigate('/');
    }
  }, [gameSession, navigate]);
  
  useEffect(() => {
    const playerNameFromState = location.state?.playerName;
    if (playerNameFromState && !isLocalPlayerInGame) {
      console.log(`[LobbyScreen] Found playerName '${playerNameFromState}' in navigation state. Adding player.`);
      addPlayer(playerNameFromState);
      // Clean up state to prevent re-adding on refresh or re-render
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, addPlayer, isLocalPlayerInGame, navigate]);

  const isHost = localPlayerId === gameSession?.hostId;

  useEffect(() => {
    if (isHost) {
      const hasRefreshed = sessionStorage.getItem('saywhaaat_lobby_refreshed');

      if (!hasRefreshed) {
        console.log('[Host Lobby] Scheduling a one-time refresh in 4 seconds for this session.');
        sessionStorage.setItem('saywhaaat_lobby_refreshed', 'true');
        const timer = setTimeout(() => {
            console.log('[Host Lobby] Refreshing now.');
            window.location.reload();
        }, 4000);

        return () => clearTimeout(timer);
      }
    }
  }, [isHost]);


  if (!gameSession) {
    return null; 
  }

  const handleAddPlayer = async () => {
    if (newPlayerName.trim()) {
      await addPlayer(newPlayerName.trim());
    }
  };

  const gameUrl = window.location.href;
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <>
      <div className="min-h-[100dvh] flex flex-col items-center p-4 pt-8 sm:pt-12 relative overflow-x-hidden overflow-y-auto">
        <AppHeader />
        <div className="w-full max-w-lg bg-white/10 backdrop-blur-md p-6 sm:p-8 rounded-[30px] shadow-2xl border border-white/10 relative z-10 mb-8">
          <h2 className="text-2xl font-black mb-6 text-center text-white uppercase tracking-wider">{t('lobbyTitle')}</h2>
          
          <div className="text-center mb-8 p-6 bg-black/20 rounded-[24px] border border-white/5">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/50 mb-1">{t('gameCode')}</p>
              <p className="text-5xl font-black text-[#FBBF24] tracking-[0.1em]">{gameSession.gameId}</p>
          </div>

          {isHost && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-10">
                <div className="p-2 bg-white rounded-2xl shadow-xl transform rotate-[-2deg]">
                  <QRCodeDisplay url={gameUrl} />
                </div>
                <div className="text-center sm:text-left">
                    <p className="text-sm font-bold text-white/80 leading-relaxed mb-3">{t('scanToJoin')}</p>
                    <button 
                      onClick={() => copyToClipboard(gameUrl)} 
                      className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest py-2.5 px-6 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all active:scale-95 shadow-md"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                        <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                      </svg>
                      {copied ? t('copied') : t('shareLink')}
                    </button>
                </div>
            </div>
          )}

          <div className="mb-10">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] mb-4 text-center text-white/40">{t('players')} ({gameSession.playerCount})</h3>
              <div className="space-y-3">
                  {gameSession.playerOrder.map(playerId => {
                      const player = gameSession.players[playerId];
                      if (!player) return null;
                      return (
                          <PlayerChip 
                              key={playerId}
                              player={{ id: playerId, ...player }}
                              isCurrent={false}
                              isHost={playerId === gameSession.hostId}
                          />
                      )
                  })}
              </div>
          </div>
          
          {!isLocalPlayerInGame && (
            <div className="mb-8">
              <label htmlFor="playerName" className="block text-xs font-black uppercase tracking-widest text-white/60 mb-3 px-4">{t('playerNameLabel')}</label>
              <div className="relative">
                <input
                  id="playerName" 
                  type="text" 
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  placeholder={t('playerPlaceholder')}
                  className={`w-full h-[60px] px-6 border border-white/20 rounded-full bg-white/10 text-white placeholder-white/30 backdrop-blur-md transition-all outline-none focus:ring-2 focus:ring-[#FBBF24] ${isRtl ? 'pl-24' : 'pr-24'}`}
                  maxLength={20}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddPlayer()}
                />
                <button 
                  onClick={handleAddPlayer} 
                  disabled={!newPlayerName.trim()}
                  className={`absolute top-2 bottom-2 px-6 bg-[#FBBF24] text-[#4c1d95] font-black uppercase tracking-widest text-xs rounded-full shadow-lg active:scale-95 transition-all disabled:opacity-0 disabled:scale-90 ${isRtl ? 'left-2' : 'right-2'}`}
                >
                  {t('join')}
                </button>
              </div>
            </div>
          )}

          {isHost && (
              <button 
                  onClick={requestStartGame} 
                  disabled={gameSession.playerCount < 2}
                  className="w-full h-[64px] bg-[#FBBF24] text-[#4c1d95] font-black uppercase tracking-[0.1em] text-lg rounded-full shadow-[0_10px_30px_rgba(251,191,36,0.3)] disabled:opacity-50 disabled:grayscale transition-all transform active:scale-95"
              >
                  {t('startGameButton')}
              </button>
          )}
          {!isHost && isLocalPlayerInGame && (
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center animate-pulse">
                <p className="text-sm font-bold text-white/60 italic tracking-wide">{t('waitingForHost')}</p>
              </div>
          )}
        </div>
        
        <div className="w-full max-w-lg mt-auto flex justify-center pb-12">
          <button 
            onClick={leaveGame} 
            className="flex items-center gap-2 px-8 py-3 rounded-full border-2 border-red-500 text-red-500 font-black uppercase tracking-widest text-[10px] hover:bg-red-500/10 transition-all active:scale-95"
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {t('leaveGame')}
          </button>
        </div>
      </div>
      <JoinGameChecklistModal />
    </>
  );
};

export default LobbyScreen;