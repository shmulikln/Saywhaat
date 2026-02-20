import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameSessionContext';
import { useTranslations } from '../contexts/TranslationsContext';
import PlayerChip from './PlayerChip';
import AppHeader from './AppHeader';
import ConfettiOverlay from './ConfettiOverlay';
import { PlayerWithId } from '../types';

const GameOverScreen: React.FC = () => {
  const { gameSession, leaveGame, startRematch, localPlayerId, isLoading } = useGame();
  const { t } = useTranslations();
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();

  if (!gameSession || (gameSession.gameMode === 'online' && gameSession.gameId !== gameId)) {
    return (
         <div className="flex items-center justify-center min-h-screen p-4">
            <div className="text-xl text-slate-100">{t('getReady')}...</div>
        </div>
    );
  }

  const isHost = localPlayerId === gameSession.hostId;
  const isOnlineGame = gameSession.gameMode === 'online';

  const playersArray: PlayerWithId[] = Object.entries(gameSession.players).map(([id, player]) => ({ id, ...player }));

  const winners = playersArray
    .filter(p => p.score >= gameSession.winningScore)
    .sort((a, b) => b.score - a.score); 

  const sortedPlayers = [...playersArray].sort((a, b) => b.score - a.score);
  const leadingScore = sortedPlayers[0]?.score ?? 0;

  const playersWithLeadingStatus = sortedPlayers.map(p => ({
    ...p,
    isLeading: p.score === leadingScore && leadingScore > 0,
  }));

  const textShadowStyle = {
    textShadow: '0 4px 10px rgba(0,0,0,0.5)',
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 pt-4 sm:pt-6 relative">
      <ConfettiOverlay />
      <AppHeader />
      
      <div className="w-full max-w-lg mt-4 px-2 text-center animate-fade-in relative z-10">
        <div className="mb-10">
          <h2 className="text-xs font-bold uppercase tracking-[0.4em] text-white/50 mb-2">{t('gameOverTitle')}</h2>
          <div className="flex flex-col items-center justify-center py-4">
             <span className="text-4xl mb-2">🏆</span>
             <h3 className="text-3xl font-black text-white uppercase tracking-tight" style={textShadowStyle}>
               {t('winners')}
             </h3>
          </div>
          
          <div className="flex flex-col gap-2 mt-4">
            {winners.length > 0 ? (
              winners.map(winner => (
                <p key={winner.id} className="text-2xl font-black text-yellow-300 uppercase tracking-tighter">
                  {winner.name}
                  <span className="text-sm font-bold text-white/70 block lowercase tracking-normal">
                    {winner.score} {t('pointsSuffix')}
                  </span>
                </p>
              ))
            ) : (
              <p className="text-xl text-slate-300 italic">No winners this time!</p>
            )}
          </div>
        </div>

        <div className="mb-10">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/40 mb-4 px-4">{t('finalScores')}</h3>
          <div className="flex flex-col gap-3">
            {playersWithLeadingStatus.map(player => (
              <PlayerChip 
                key={player.id} 
                player={player} 
                isCurrent={false} 
                isHost={player.id === gameSession.hostId}
                isLeading={player.isLeading}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 items-center pb-12">
          <button
            onClick={startRematch}
            disabled={(isOnlineGame && !isHost) || isLoading}
            className={`w-full h-[60px] rounded-[30px] bg-[#FBBF24] text-[#4c1d95] font-black uppercase tracking-widest text-lg shadow-[0_10px_30px_rgba(251,191,36,0.3)] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:scale-100 disabled:cursor-not-allowed`}
          >
            {isLoading ? "..." : t('rematch')}
          </button>
          
          <button
            onClick={leaveGame}
            className="px-8 py-3 rounded-full border-2 border-red-500 text-red-500 font-bold uppercase tracking-widest text-xs hover:bg-red-500/10 transition-colors active:scale-95 bg-transparent"
          >
            {t('leaveGame')}
          </button>

          {isOnlineGame && !isHost && (
            <p className="text-[10px] text-white/30 uppercase tracking-widest mt-2">
              Waiting for host to start rematch
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameOverScreen;