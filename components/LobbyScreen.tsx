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
  const { gameSession, localPlayerId, addPlayer, switchTeam, requestStartGame, leaveGame } = useGame();
  const { t, language } = useTranslations();
  const navigate = useNavigate();
  const location = useLocation();
  const [newPlayerName, setNewPlayerName] = useState('');
  const [copied, setCopied] = useState(false);

  const isLocalPlayerInGame = gameSession?.playerOrder.includes(localPlayerId || '');
  const isRtl = language === Language.HE || language === Language.AR;
  const hasAttemptedJoinRef = React.useRef(false);

  useEffect(() => {
    if (!gameSession) {
      navigate('/');
    }
  }, [gameSession, navigate]);
  
  useEffect(() => {
    const playerNameFromState = location.state?.playerName;
    const teamIdFromState = location.state?.teamId;
    if (hasAttemptedJoinRef.current) return;

    if (!isLocalPlayerInGame && (playerNameFromState || (gameSession?.playMode === 'teams' && teamIdFromState))) {
      hasAttemptedJoinRef.current = true;
      addPlayer(playerNameFromState || '', teamIdFromState);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, addPlayer, isLocalPlayerInGame, navigate, gameSession?.playMode]);

  const isHost = localPlayerId === gameSession?.hostId;
  const [codeCopied, setCodeCopied] = useState(false);

  const copyCodeOnly = (code: string) => {
    navigator.clipboard.writeText(code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleAddPlayer = async () => {
    if (newPlayerName.trim()) {
      await addPlayer(newPlayerName.trim());
    }
  };

  const getGameUrl = () => {
    const devHost = import.meta.env.VITE_DEV_HOST;
    const url = new URL(window.location.origin);

    if (devHost && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      url.hostname = devHost;
      // Also respect the port from the original URL in dev mode
      url.port = window.location.port;
    }
    
    url.pathname = `/join/${gameSession.gameId}`;
    url.searchParams.append('lang', language); // Add language to query params
    return url.toString();
  };
  const gameUrl = getGameUrl();
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const isTeamsMode = gameSession.playMode === 'teams';
  const team1 = gameSession.teams?.team1;
  const team2 = gameSession.teams?.team2;
  const team1Players = isTeamsMode ? gameSession.playerOrder.filter(pid => gameSession.players[pid]?.teamId === 'team1') : [];
  const team2Players = isTeamsMode ? gameSession.playerOrder.filter(pid => gameSession.players[pid]?.teamId === 'team2') : [];
  const myTeamId = localPlayerId ? gameSession.players[localPlayerId]?.teamId : undefined;

  const canStartGame = isTeamsMode 
    ? (team1Players.length >= 1 && team2Players.length >= 1)
    : gameSession.playerCount >= 2;

  return (
    <>
      <div className="min-h-[100dvh] flex flex-col items-center p-4 pt-safe-top relative overflow-x-hidden overflow-y-auto">
        <AppHeader />
        <div className="w-full max-w-lg bg-white/10 backdrop-blur-md p-6 sm:p-8 rounded-[30px] shadow-2xl border border-white/10 relative z-10 mb-8">
          <h2 className="text-2xl font-black mb-6 text-center text-white uppercase tracking-wider">{t('lobbyTitle')}</h2>
          
          {/* Game Code Box */}
          <div className="text-center mb-8 p-6 bg-black/30 backdrop-blur-md rounded-[28px] border border-white/10 shadow-inner relative group">
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/50 mb-2">{t('gameCode')}</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-5xl font-black text-[#FBBF24] tracking-[0.15em] select-all font-mono drop-shadow-[0_2px_10px_rgba(251,191,36,0.3)]">
                  {gameSession.gameId}
                </span>
                <button
                  onClick={() => copyCodeOnly(gameSession.gameId)}
                  className="p-2.5 bg-white/10 hover:bg-white/20 active:scale-90 text-white rounded-full transition-all border border-white/10 shadow-sm"
                  title="Copy Code"
                  aria-label="Copy Code"
                >
                  {codeCopied ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
              {codeCopied && (
                <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/30 animate-fade-in">
                  {t('copied')}
                </span>
              )}
          </div>

          {isHost && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-10 p-5 bg-white/5 rounded-[24px] border border-white/10">
                <div className="p-3 bg-white rounded-2xl shadow-2xl ring-4 ring-white/10">
                  <QRCodeDisplay url={gameUrl} />
                </div>
                <div className="text-center sm:text-left flex flex-col items-center sm:items-start gap-2">
                    <p className="text-sm font-semibold text-white/90 leading-relaxed max-w-[200px]">{t('scanToJoin')}</p>
                    <button 
                      onClick={() => copyToClipboard(gameUrl)} 
                      className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider py-2.5 px-5 rounded-full bg-white/15 hover:bg-white/25 text-white border border-white/20 transition-all active:scale-95 shadow-lg"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#FBBF24]" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                        <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                      </svg>
                      {copied ? t('copied') : t('shareLink')}
                    </button>
                </div>
            </div>
          )}

          {/* Teams Mode View */}
          {isTeamsMode ? (
            <div className="space-y-6 mb-8">
              {/* Team 1 Card */}
              <div className="p-5 rounded-[24px] bg-cyan-950/40 border border-cyan-500/30 shadow-[0_4px_20px_rgba(6,182,212,0.15)] backdrop-blur-md">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.9)]"></span>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">{team1?.name || t('defaultTeam1Name')}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {team1Players.length}
                    </span>
                    {isLocalPlayerInGame && myTeamId === 'team2' && (
                      <button
                        onClick={() => switchTeam(localPlayerId!, 'team1')}
                        className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-cyan-500 hover:bg-cyan-400 text-cyan-950 transition-all active:scale-95 shadow"
                      >
                        {t('switchTeamButton')}
                      </button>
                    )}
                    {isLocalPlayerInGame && myTeamId === 'team1' && (
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        You
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {team1Players.length === 0 ? (
                    <p className="text-xs text-white/40 italic py-2">No players yet</p>
                  ) : (
                    team1Players.map((pid, idx) => {
                      const isMe = pid === localPlayerId;
                      const isPlayerHost = pid === gameSession.hostId;
                      return (
                        <div key={pid} className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all ${
                          isMe ? 'bg-cyan-500/30 border-cyan-400 text-white shadow-[0_0_10px_rgba(34,211,238,0.4)]' : 'bg-white/10 border-white/10 text-white/80'
                        }`}>
                          <span>{isPlayerHost ? '👑 ' : ''}Player {idx + 1}{isMe ? ' (You)' : ''}</span>
                          {isHost && !isMe && (
                            <button
                              onClick={() => switchTeam(pid, 'team2')}
                              className="text-white/40 hover:text-amber-300 transition-colors p-0.5 text-[10px] ml-1"
                              title="Move to Team 2"
                            >
                              ⇄
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Team 2 Card */}
              <div className="p-5 rounded-[24px] bg-amber-950/40 border border-amber-500/30 shadow-[0_4px_20px_rgba(245,158,11,0.15)] backdrop-blur-md">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.9)]"></span>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">{team2?.name || t('defaultTeam2Name')}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {team2Players.length}
                    </span>
                    {isLocalPlayerInGame && myTeamId === 'team1' && (
                      <button
                        onClick={() => switchTeam(localPlayerId!, 'team2')}
                        className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-amber-500 hover:bg-amber-400 text-amber-950 transition-all active:scale-95 shadow"
                      >
                        {t('switchTeamButton')}
                      </button>
                    )}
                    {isLocalPlayerInGame && myTeamId === 'team2' && (
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        You
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {team2Players.length === 0 ? (
                    <p className="text-xs text-white/40 italic py-2">No players yet</p>
                  ) : (
                    team2Players.map((pid, idx) => {
                      const isMe = pid === localPlayerId;
                      const isPlayerHost = pid === gameSession.hostId;
                      return (
                        <div key={pid} className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all ${
                          isMe ? 'bg-amber-500/30 border-amber-400 text-white shadow-[0_0_10px_rgba(251,191,36,0.4)]' : 'bg-white/10 border-white/10 text-white/80'
                        }`}>
                          <span>{isPlayerHost ? '👑 ' : ''}Player {idx + 1}{isMe ? ' (You)' : ''}</span>
                          {isHost && !isMe && (
                            <button
                              onClick={() => switchTeam(pid, 'team1')}
                              className="text-white/40 hover:text-cyan-300 transition-colors p-0.5 text-[10px] ml-1"
                              title="Move to Team 1"
                            >
                              ⇄
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* If not joined yet, pick a team */}
              {!isLocalPlayerInGame && (
                <div className="p-5 bg-white/10 backdrop-blur-md rounded-[24px] border border-white/15 text-center">
                  <h3 className="text-xs font-black uppercase tracking-widest text-white/80 mb-4">{t('chooseTeamLabel')}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => addPlayer('', 'team1')}
                      className="py-4 px-4 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border-2 border-cyan-400/50 rounded-2xl font-black text-xs uppercase tracking-wider transition-all active:scale-95 shadow-lg flex flex-col items-center gap-1.5"
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                      <span>{team1?.name || t('defaultTeam1Name')}</span>
                    </button>
                    <button
                      onClick={() => addPlayer('', 'team2')}
                      className="py-4 px-4 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border-2 border-amber-400/50 rounded-2xl font-black text-xs uppercase tracking-wider transition-all active:scale-95 shadow-lg flex flex-col items-center gap-1.5"
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                      <span>{team2?.name || t('defaultTeam2Name')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* FFA Mode View */
            <>
              {gameSession.playerCount === 2 && (
                <div className="mb-6 p-4 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 rounded-2xl border border-emerald-400/40 text-center animate-fade-in shadow-md">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="text-xl">🤝</span>
                    <span className="font-black text-emerald-300 text-sm uppercase tracking-wider">
                      {t('duoMode') || 'Co-op Duo Mode Active'}
                    </span>
                  </div>
                  <p className="text-xs text-white/80 font-medium">
                    {t('duoRulesSummary') || t('duoWinningGoal')}
                  </p>
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
            </>
          )}

          {isHost && (
            <div className="space-y-3">
              <button 
                  onClick={requestStartGame} 
                  disabled={!canStartGame}
                  className="w-full h-[64px] bg-[#FBBF24] hover:bg-[#F59E0B] text-[#4c1d95] font-black uppercase tracking-[0.1em] text-lg rounded-full shadow-[0_10px_30px_rgba(251,191,36,0.3)] disabled:opacity-40 disabled:cursor-not-allowed transition-all transform active:scale-95 flex items-center justify-center gap-2"
              >
                  <span>{t('startGameButton')}</span>
              </button>
              {!canStartGame && (
                <p className="text-center text-xs font-bold text-[#FBBF24]/80 animate-pulse">
                  {isTeamsMode ? t('minPlayersPerTeam') : t('minTwoPlayers')}
                </p>
              )}
            </div>
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