import React, { useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameSessionContext';
import { useTranslations } from '../contexts/TranslationsContext';
import { Language, WinningScore, Player } from '../types';
import { DEFAULT_WINNING_SCORE, WINNING_SCORES } from '../constants';
import ChaosModeInfoModal from './ChaosModeInfoModal';
import AppHeader from './AppHeader';
import { isFirebaseConfigured } from '../services/firebaseService';
import OnlineSetup from './OnlineSetup';
import LocalSetup from './LocalSetup';

const SetupScreen: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { createNewGame, joinGame, createLocalGame, isLoading: isProcessing } = useGame();
  const { t, language } = useTranslations();

  const mode = location.state?.mode ?? 'online';
  const isOnlineMode = mode === 'online';
  
  // Online State
  const [hostName, setHostName] = useState('');
  const [joinPlayerName, setJoinPlayerName] = useState('');
  const [joinGameCode, setJoinGameCode] = useState('');
  const defaultTab = location.state?.defaultTab || 'create';
  const [activeTab, setActiveTab] = useState<'create' | 'join'>(defaultTab);

  // Local State
  const [localPlayers, setLocalPlayers] = useState<Player[]>([]);
  const [newLocalPlayerName, setNewLocalPlayerName] = useState('');

  // Shared State
  const [selectedWinningScore, setSelectedWinningScore] = useState<WinningScore>(DEFAULT_WINNING_SCORE);
  const [isChaosModeEnabled, setChaosModeEnabled] = useState(false);
  
  // Modal State
  const [isChaosInfoVisible, setChaosInfoVisible] = useState(false);
  const [isOnlineModeAvailable, setIsOnlineModeAvailable] = useState(true);
  
  useEffect(() => {
    setIsOnlineModeAvailable(isFirebaseConfigured());
  }, []);

  // --- Handlers ---
  const handleCreateOnlineGame = useCallback(async () => {
    if (!hostName.trim() || isProcessing) {
      alert(t('nameIsRequired'));
      return;
    }
    await createNewGame(hostName, language, selectedWinningScore, isChaosModeEnabled);
  }, [hostName, language, selectedWinningScore, isChaosModeEnabled, createNewGame, t, isProcessing]);

  const handleJoinOnlineGame = useCallback(async () => {
    if (!joinGameCode.trim() || !joinPlayerName.trim() || isProcessing) {
      if (!joinPlayerName.trim()) alert(t('nameIsRequired'));
      return;
    }
    await joinGame(joinGameCode, joinPlayerName);
  }, [joinGame, joinGameCode, joinPlayerName, isProcessing, t]);
  
  const handleAddLocalPlayer = () => {
    if (newLocalPlayerName.trim()) {
      setLocalPlayers([...localPlayers, { name: newLocalPlayerName.trim(), score: 0 }]);
      setNewLocalPlayerName('');
    }
  };

  const handleRemoveLocalPlayer = (index: number) => {
    setLocalPlayers(localPlayers.filter((_, i) => i !== index));
  };

  const handleCreateLocalGame = useCallback(async () => {
    if (localPlayers.length < 2) {
      alert(t('minTwoPlayersLocal'));
      return;
    }
    const playerNames = localPlayers.map(p => p.name);
    await createLocalGame(playerNames, language, selectedWinningScore, isChaosModeEnabled);
  }, [localPlayers, language, selectedWinningScore, isChaosModeEnabled, createLocalGame, t]);

  const inputBgColor = 'bg-white/10';
  
  const renderSharedOptions = () => {
    const minScore = WINNING_SCORES[0];
    const maxScore = WINNING_SCORES[WINNING_SCORES.length - 1];
    const percentage = ((selectedWinningScore - minScore) / (maxScore - minScore)) * 100;

    const isRtl = language === Language.HE || language === Language.AR;
    const gradientDir = isRtl ? 'to left' : 'to right';

    // Conventional Logic: Track color fills in the direction of handle movement.
    const sliderBackgroundStyle = {
      background: `linear-gradient(${gradientDir}, #FBBF24 0%, #FBBF24 ${percentage}%, rgba(255, 255, 255, 0.2) ${percentage}%, rgba(255, 255, 255, 0.2) 100%)`
    };

    return (
      <div className="space-y-6">
        <div className="px-1">
          <label htmlFor="winningScore" className="block text-sm font-bold uppercase tracking-widest text-white/60 mb-3 px-2">{t('winningScoreLabel')}</label>
          
          <div className={`w-full min-h-[110px] flex flex-col justify-center px-6 rounded-[30px] ${inputBgColor} border border-white/20 backdrop-blur-md relative pb-4`}>
              <div className="relative w-full h-10 flex items-center mt-3">
                <input 
                    id="winningScore" 
                    type="range" 
                    min={minScore} 
                    max={maxScore} 
                    step={5}
                    value={selectedWinningScore} 
                    onChange={(e) => setSelectedWinningScore(Number(e.target.value) as WinningScore)} 
                    style={sliderBackgroundStyle}
                    className="w-full relative z-10"
                />
              </div>
              
              {/* Segments Display */}
              <div className="flex justify-between w-full mt-6 px-1 pointer-events-none relative">
                {WINNING_SCORES.map(score => (
                  <div key={score} className="flex flex-col items-center">
                    <div className={`w-2 h-2 rounded-full mb-1.5 transition-colors duration-300 ${selectedWinningScore >= score ? 'bg-[#FBBF24]' : 'bg-white/10'}`}></div>
                    <span className={`text-[11px] font-black transition-all duration-300 ${selectedWinningScore === score ? 'text-[#FBBF24] scale-125' : 'text-white/25'}`}>
                      {score}
                    </span>
                  </div>
                ))}
              </div>
          </div>
        </div>

        <div className={`relative px-6 h-[60px] rounded-[30px] transition-all duration-300 ${inputBgColor} border border-white/20 backdrop-blur-md flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <label className="block text-sm font-bold uppercase tracking-widest text-white/60">{t('chaosMode')}</label>
              <button onClick={() => setChaosInfoVisible(true)} className="text-indigo-300 text-xs font-black p-1">?</button>
            </div>
            <label htmlFor="chaos-toggle" className="flex items-center cursor-pointer">
                <div className="relative">
                    <input id="chaos-toggle" type="checkbox" className="sr-only" checked={isChaosModeEnabled} onChange={() => setChaosModeEnabled(!isChaosModeEnabled)} />
                    <div className={`block w-12 h-6 rounded-full transition-colors ${isChaosModeEnabled ? 'bg-[#FB6524]' : 'bg-white/20'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isChaosModeEnabled ? 'transform translate-x-6' : ''}`}></div>
                </div>
            </label>
        </div>
      </div>
    );
  };

  const isFormValid = () => {
    if (isOnlineMode) {
        if (activeTab === 'create') return hostName.trim().length > 0;
        return joinPlayerName.trim().length > 0 && joinGameCode.length === 4;
    }
    return localPlayers.length >= 2;
  };

  const handleMainAction = () => {
    if (isOnlineMode) {
        if (activeTab === 'create') handleCreateOnlineGame();
        else handleJoinOnlineGame();
    } else {
        handleCreateLocalGame();
    }
  };

  const getButtonText = () => {
    if (isOnlineMode) {
        return activeTab === 'create' ? t('createGameButton') : t('joinGameButton');
    }
    return t('startGameButton');
  };

  return (
    <>
      <div className="h-[100dvh] flex flex-col items-center p-6 relative overflow-x-hidden overflow-y-auto">
        <button onClick={() => navigate('/')} className="absolute top-12 ltr:left-6 rtl:right-6 z-20 text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-colors backdrop-blur-md border border-white/10" aria-label="Back to home">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform ltr:scale-x-100 rtl:-scale-x-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <AppHeader size="lg" />

        {!isOnlineModeAvailable && isOnlineMode && (
          <div className="w-full max-w-lg mb-6 p-4 text-center text-yellow-200 bg-yellow-900/60 border border-yellow-700 rounded-2xl shadow-lg">
            <p className="font-semibold text-lg">Online Services Unavailable</p>
          </div>
        )}

        <div className="w-full max-w-lg flex flex-col mt-4 space-y-12 pb-20">
          <div className="w-full">
            {isOnlineMode ? (
              <OnlineSetup 
                activeTab={activeTab} setActiveTab={setActiveTab}
                hostName={hostName} setHostName={setHostName}
                joinPlayerName={joinPlayerName} setJoinPlayerName={setJoinPlayerName}
                joinGameCode={joinGameCode} setJoinGameCode={setJoinGameCode}
                renderSharedOptions={renderSharedOptions}
              />
            ) : (
              <LocalSetup
                localPlayers={localPlayers} setLocalPlayers={setLocalPlayers}
                newLocalPlayerName={newLocalPlayerName} setNewLocalPlayerName={setNewLocalPlayerName}
                onAddPlayer={handleAddLocalPlayer} onRemovePlayer={handleRemoveLocalPlayer}
                renderSharedOptions={renderSharedOptions}
              />
            )}
          </div>

          <div className="w-full max-w-md mx-auto">
              <button 
                  onClick={handleMainAction} 
                  disabled={isProcessing || !isFormValid()}
                  className={`w-full h-[60px] rounded-[30px] bg-[#FBBF24] text-[#4c1d95] font-black uppercase tracking-widest text-lg shadow-[0_10px_30px_rgba(251,191,36,0.3)] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:scale-100 disabled:cursor-not-allowed`}
              >
                  {isProcessing ? "..." : getButtonText()}
              </button>
          </div>
        </div>
      </div>

      {isChaosInfoVisible && <ChaosModeInfoModal onClose={() => setChaosInfoVisible(false)} />}
    </>
  );
};

export default SetupScreen;