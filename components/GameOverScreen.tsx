import React, { useRef, useState, useLayoutEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameSessionContext';
import { useTranslations } from '../contexts/TranslationsContext';
import PlayerChip from './PlayerChip';
import AppHeader from './AppHeader';
import ConfettiOverlay from './ConfettiOverlay';
import { PlayerWithId, Language } from '../types';

interface AutoFitWinnerNameProps {
  name: string;
  language?: Language;
}

const AutoFitWinnerName: React.FC<AutoFitWinnerNameProps> = ({ name, language }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState<number>(64);

  const fontClass = language === Language.HE ? 'font-secular-one' : 'font-outfit';

  useLayoutEffect(() => {
    const calculateSize = () => {
      if (!containerRef.current || !measureRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      const measuredWidth = measureRef.current.offsetWidth;

      if (containerWidth > 0 && measuredWidth > 0) {
        // Available width filling container (which is max-w-[800px] w-full)
        // Keep 4% buffer against subpixel clipping
        const availableWidth = containerWidth * 0.96;
        const widthBasedSize = Math.floor((availableWidth / measuredWidth) * 100);

        // Clamped: min 28px, max 100px so short names stay nicely balanced and majestic
        const clamped = Math.max(28, Math.min(widthBasedSize, 100));
        setFontSize(clamped);
      }
    };

    calculateSize();
    if (document.fonts?.ready) {
      document.fonts.ready.then(calculateSize);
    }
    window.addEventListener('resize', calculateSize);
    return () => window.removeEventListener('resize', calculateSize);
  }, [name, language]);

  return (
    <div
      ref={containerRef}
      className="w-full max-w-[800px] mx-auto overflow-hidden flex items-center justify-center py-2 px-2"
    >
      {/* Hidden off-screen measurement probe at 100px base font size */}
      <div
        ref={measureRef}
        aria-hidden="true"
        className={`absolute opacity-0 pointer-events-none uppercase font-black text-[100px] leading-none whitespace-nowrap ${fontClass}`}
        style={{ visibility: 'hidden', top: -9999, left: -9999 }}
      >
        {name}
      </div>

      {/* Visible scaled winner name filling width up to 800px */}
      <h1
        className={`w-full text-center font-black uppercase tracking-tight leading-tight text-yellow-300 select-none whitespace-nowrap ${fontClass}`}
        style={{
          fontSize: `${fontSize}px`,
          textShadow: '0 4px 20px rgba(251, 191, 36, 0.4), 0 2px 4px rgba(0,0,0,0.8)'
        }}
      >
        {name}
      </h1>
    </div>
  );
};

const GameOverScreen: React.FC = () => {
  const { gameSession, leaveGame, startRematch, localPlayerId, isLoading } = useGame();
  const { t, language, setLanguage } = useTranslations();
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (gameSession?.language && gameSession.language !== language) {
      setLanguage(gameSession.language, false);
    }
  }, [gameSession?.language, language, setLanguage]);

  if (!gameSession || (gameSession.gameMode === 'online' && gameSession.gameId !== gameId)) {
    return (
         <div className="flex items-center justify-center min-h-screen p-4">
            <div className="text-xl text-slate-100">{t('getReady')}...</div>
        </div>
    );
  }

  const isHost = localPlayerId === gameSession.hostId;
  const isOnlineGame = gameSession.gameMode === 'online';

  const isTeamsMode = gameSession.playMode === 'teams';
  const isDuoMode = gameSession.playMode === 'duo';
  const isDuoWin = (gameSession.duoScore || 0) >= gameSession.winningScore;
  const duoPartnersName = Object.values(gameSession.players).map(p => p.name).join(' & ');
  const team1 = gameSession.teams?.team1;
  const team2 = gameSession.teams?.team2;
  const winningTeam = (team1 && team2) ? (team1.score > team2.score ? team1 : (team2.score > team1.score ? team2 : null)) : null;

  const playersArray: PlayerWithId[] = Object.entries(gameSession.players).map(([id, player]) => ({ id, ...player }));

  const winners = playersArray
    .filter(p => p.score >= gameSession.winningScore)
    .sort((a, b) => b.score - a.score); 

  const sortedPlayers = [...playersArray].sort((a, b) => b.score - a.score);
  const leadingScore = sortedPlayers[0]?.score ?? 0;

  const displayWinners = winners.length > 0 
    ? winners 
    : (leadingScore > 0 ? sortedPlayers.filter(p => p.score === leadingScore) : []);

  const playersWithLeadingStatus = sortedPlayers.map(p => ({
    ...p,
    isLeading: p.score === leadingScore && leadingScore > 0,
  }));

  const textShadowStyle = {
    textShadow: '0 4px 10px rgba(0,0,0,0.5)',
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 pt-safe-top relative">
      {(isDuoMode ? isDuoWin : true) && <ConfettiOverlay />}
      <AppHeader />
      
      <div className="w-full max-w-[800px] mt-4 px-2 text-center animate-fade-in relative z-10">
        {isDuoMode ? (
          <div className="py-12 sm:py-16 flex flex-col items-center justify-center animate-fade-in text-center">
            <div className="w-28 h-28 sm:w-36 sm:h-36 mb-6 sm:mb-8 rounded-full bg-emerald-500/20 border-2 border-emerald-400/50 flex items-center justify-center text-6xl sm:text-7xl shadow-[0_0_50px_rgba(16,185,129,0.4)] animate-bounce">
              {isDuoWin ? '🏆' : '⏱️'}
            </div>
            <h1 
              className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-300 drop-shadow-[0_4px_25px_rgba(251,191,36,0.6)] uppercase px-4 leading-tight mb-4"
              style={textShadowStyle}
            >
              {isDuoWin ? (t('challengeWon') || 'Challenge Won!') : (t('duoChallengeOver') || 'Challenge Over!')}
            </h1>
            {!isDuoWin && (
              <p className="text-base sm:text-xl text-emerald-200/90 font-bold max-w-sm mx-auto mb-6 drop-shadow">
                {t('duoGoodEffort') || 'Good effort! Play again to beat the clock!'}
              </p>
            )}
            <div className="p-4 bg-emerald-950/60 border border-emerald-500/30 rounded-2xl mb-8 flex items-center justify-between max-w-xs mx-auto w-full">
              <span className="text-xs text-emerald-300 font-bold uppercase tracking-wider">{t('duoScoreLabel') || 'Team Score'}</span>
              <span className="text-2xl font-black text-[#FBBF24] font-mono">{gameSession.duoScore || 0} / {gameSession.winningScore} {t('pointsSuffix')}</span>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-10">
              <h2 className="text-xs font-bold uppercase tracking-[0.4em] text-white/50 mb-2">{t('gameOverTitle')}</h2>
              <div className="flex flex-col items-center justify-center py-3">
                 <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight" style={textShadowStyle}>
                   {t('winners')}
                 </h3>
              </div>
              
              {isTeamsMode ? (
                <div className="flex flex-col gap-2 mt-4 w-full max-w-[800px] mx-auto">
                  {winningTeam ? (
                    <AutoFitWinnerName name={winningTeam.name} language={language} />
                  ) : (
                    <p className="text-2xl font-black text-yellow-300 uppercase tracking-tight">
                      {t('itsATie') || "It's a Tie!"}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2 mt-4 w-full max-w-[800px] mx-auto">
                  {displayWinners.length > 0 ? (
                    displayWinners.map(winner => (
                      <AutoFitWinnerName key={winner.id} name={winner.name} language={language} />
                    ))
                  ) : (
                    <p className="text-xl text-slate-300 italic">{t('noWinners') || "No winners this time!"}</p>
                  )}
                </div>
              )}
            </div>

            {isTeamsMode && team1 && team2 ? (
              <div className="mb-10 space-y-4 max-w-md mx-auto w-full">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/40 mb-4 px-4">{t('finalScores')}</h3>
                <div className="grid grid-cols-2 gap-3">
                  {/* Team 1 Score */}
                  <div className={`p-5 rounded-[24px] border backdrop-blur-md ${
                    team1.score >= gameSession.winningScore 
                      ? 'bg-cyan-950/70 border-cyan-400 ring-2 ring-cyan-400/50 shadow-[0_0_20px_rgba(34,211,238,0.3)]' 
                      : 'bg-white/5 border-white/10'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-3 h-3 rounded-full bg-cyan-400"></span>
                      <h4 className="text-sm font-black text-white uppercase tracking-tight truncate">{team1.name}</h4>
                    </div>
                    <p className="text-4xl font-black text-cyan-300 font-mono mt-2">{team1.score}</p>
                    <p className="text-xs text-white/50 font-bold mt-1">{t('pointsSuffix')}</p>
                  </div>

                  {/* Team 2 Score */}
                  <div className={`p-5 rounded-[24px] border backdrop-blur-md ${
                    team2.score >= gameSession.winningScore 
                      ? 'bg-amber-950/70 border-amber-400 ring-2 ring-amber-400/50 shadow-[0_0_20px_rgba(251,191,36,0.3)]' 
                      : 'bg-white/5 border-white/10'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                      <h4 className="text-sm font-black text-white uppercase tracking-tight truncate">{team2.name}</h4>
                    </div>
                    <p className="text-4xl font-black text-amber-300 font-mono mt-2">{team2.score}</p>
                    <p className="text-xs text-white/50 font-bold mt-1">{t('pointsSuffix')}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-10 max-w-md mx-auto w-full">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/40 mb-4 px-4">{t('finalScores')}</h3>
                <div className="flex flex-col gap-3">
                  {playersWithLeadingStatus.map(player => (
                    <PlayerChip 
                      key={player.id} 
                      player={player} 
                      isCurrent={false} 
                      isHost={player.id === gameSession.hostId}
                      isLeading={false}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="flex flex-col gap-4 items-center pb-12 max-w-md mx-auto w-full">
          <button
            onClick={startRematch}
            disabled={(isOnlineGame && !isHost) || isLoading}
            className={`w-full h-[60px] rounded-full bg-[#FBBF24] text-[#4c1d95] font-black uppercase tracking-widest text-lg shadow-[0_10px_30px_rgba(251,191,36,0.3)] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:scale-100 disabled:cursor-not-allowed`}
          >
            {isLoading ? "..." : t('rematch')}
          </button>
          
          <button
            onClick={leaveGame}
            className="px-8 py-3 rounded-full border-2 border-red-500 text-red-500 font-black uppercase tracking-widest text-xs hover:bg-red-500/10 transition-colors active:scale-95 bg-transparent"
          >
            {t('leaveGame')}
          </button>

          {isOnlineGame && !isHost && (
            <p className="text-[10px] text-white/30 uppercase tracking-widest mt-2">
              {t('waitingForHostRematch') || 'Waiting for host to start rematch'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameOverScreen;