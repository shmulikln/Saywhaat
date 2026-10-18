import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTransitionNavigate } from '../utils/navigationUtils';
import { useGame } from '../contexts/GameSessionContext';
import { useTranslations } from '../contexts/TranslationsContext';
import { Language, WinningScore, Player } from '../types';
import { DEFAULT_WINNING_SCORE, WINNING_SCORES } from '../constants';
import ChaosModeInfoModal from './ChaosModeInfoModal';
import AppHeader from './AppHeader';
import { isFirebaseConfigured, getGameFromDb } from '../services/firebaseService';
import OnlineSetup from './OnlineSetup';
import LocalSetup from './LocalSetup';

import phone1Svg from '../assets/phone1.svg';
import phone2Svg from '../assets/phone2.svg';

// Illustration for "Use one phone" using user-provided phone1.svg
const SinglePhoneIllustration: React.FC = () => (
  <div className="relative mb-3 flex items-center justify-center transform -rotate-6 transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3 pointer-events-none">
    <img
      src={phone1Svg}
      alt="Use one phone"
      className="h-[74px] sm:h-[84px] w-auto object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.55)] select-none"
      draggable={false}
    />
  </div>
);

// Illustration for "Everyone on their phone" using user-provided phone2.svg (3 phones)
const MultiPhoneIllustration: React.FC = () => (
  <div className="relative -mt-10 sm:-mt-12 mb-2 sm:mb-3 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 pointer-events-none">
    <img
      src={phone2Svg}
      alt="Everyone on their phone"
      className="h-[74px] sm:h-[84px] w-auto object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.55)] select-none"
      draggable={false}
    />
  </div>
);

const SetupScreen: React.FC = () => {
  const location = useLocation();
  const navigate = useTransitionNavigate();
  const { createNewGame, joinGame, createLocalGame, isLoading: isProcessing } = useGame();
  const { t, language, setLanguage } = useTranslations();

  const intent = location.state?.intent || location.state?.defaultTab || 'create';
  
  // Game Type State
  const [deviceMode, setDeviceMode] = useState<'multiple' | 'one' | null>(
    intent === 'join' ? 'multiple' : (location.state?.defaultDeviceMode || null)
  );
  const [playMode, setPlayMode] = useState<'ffa' | 'teams'>(location.state?.defaultPlayMode || 'ffa');
  const isOnlineMode = intent === 'join' || deviceMode === 'multiple';

  // Ref to the revealed setup section for auto-scrolling
  const revealedUiRef = useRef<HTMLDivElement>(null);

  const handleSelectDeviceMode = (mode: 'one' | 'multiple') => {
    setDeviceMode(mode);
    setTimeout(() => {
      revealedUiRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  };
  
  // Teams State
  const [team1Name, setTeam1Name] = useState('');
  const [team2Name, setTeam2Name] = useState('');

  // Online State
  const [hostName, setHostName] = useState('');
  const [joinPlayerName, setJoinPlayerName] = useState('');
  const [joinGameCode, setJoinGameCode] = useState('');
  const [detectedGameMode, setDetectedGameMode] = useState<'ffa' | 'teams' | null>(null);
  const [detectedTeams, setDetectedTeams] = useState<{ team1: { name: string }; team2: { name: string } } | null>(null);
  const [selectedJoinTeamId, setSelectedJoinTeamId] = useState<'team1' | 'team2'>('team1');
  const [roomCodeError, setRoomCodeError] = useState<string | null>(null);
  const [isCheckingRoomCode, setIsCheckingRoomCode] = useState(false);

  // Local State
  const [localPlayers, setLocalPlayers] = useState<Player[]>([]);
  const [newLocalPlayerName, setNewLocalPlayerName] = useState('');

  // Shared State
  const [selectedWinningScore, setSelectedWinningScore] = useState<WinningScore>(DEFAULT_WINNING_SCORE);
  const [isChaosModeEnabled, setChaosModeEnabled] = useState(false);

  // Custom rounds for Duo mode (defaults to winningScore / 5)
  const [customDuoRounds, setCustomDuoRounds] = useState<number>(Math.max(1, Math.round(DEFAULT_WINNING_SCORE / 5)));

  useEffect(() => {
    setCustomDuoRounds(Math.max(1, Math.round(selectedWinningScore / 5)));
  }, [selectedWinningScore]);

  // Co-op Duo check (Local mode, not teams, exactly 2 players)
  const isDuo = !isOnlineMode && playMode !== 'teams' && localPlayers.length === 2;

  // Automatically disable Chaos Mode in Co-op Duo mode
  useEffect(() => {
    if (isDuo && isChaosModeEnabled) {
      setChaosModeEnabled(false);
    }
  }, [isDuo, isChaosModeEnabled]);
  
  // Modal State
  const [isChaosInfoVisible, setChaosInfoVisible] = useState(false);
  const [isOnlineModeAvailable, setIsOnlineModeAvailable] = useState(true);
  
  useEffect(() => {
    setIsOnlineModeAvailable(isFirebaseConfigured());
  }, []);

  useEffect(() => {
    const langFromState = location.state?.lang;
    if (langFromState && Object.values(Language).includes(langFromState)) {
      setLanguage(langFromState as Language);
    }
  }, [location.state?.lang, setLanguage]);
  

  // --- NEW: Pre-fill game code from URL state ---
  useEffect(() => {
    if (location.state?.gameId) {
      setJoinGameCode(location.state.gameId.toUpperCase());
    }
  }, [location.state?.gameId]);
  // --- END NEW ---

  // Detect game mode when joining with code
  useEffect(() => {
    const code = joinGameCode.trim().toUpperCase();
    if (intent === 'join' && (code === 'DEMO' || code === 'TEST')) {
      setDetectedGameMode('ffa');
      setDetectedTeams(null);
      setRoomCodeError(null);
      setIsCheckingRoomCode(false);
      return;
    }
    if (intent === 'join' && code.length === 4) {
      setIsCheckingRoomCode(true);
      setRoomCodeError(null);
      let isCurrent = true;
      getGameFromDb(code).then((session) => {
        if (!isCurrent) return;
        setIsCheckingRoomCode(false);
        if (session) {
          setRoomCodeError(null);
          if (session.playMode === 'teams') {
            setDetectedGameMode('teams');
            if (session.teams) {
              setDetectedTeams({
                team1: { name: session.teams.team1.name },
                team2: { name: session.teams.team2.name },
              });
            }
          } else {
            setDetectedGameMode('ffa');
            setDetectedTeams(null);
          }
        } else {
          setDetectedGameMode(null);
          setDetectedTeams(null);
          setRoomCodeError(t('gameNotFound'));
        }
      }).catch(() => {
        if (!isCurrent) return;
        setIsCheckingRoomCode(false);
        setDetectedGameMode(null);
        setDetectedTeams(null);
        setRoomCodeError(t('gameNotFound'));
      });
      return () => {
        isCurrent = false;
      };
    } else {
      setDetectedGameMode(null);
      setDetectedTeams(null);
      setRoomCodeError(null);
      setIsCheckingRoomCode(false);
    }
  }, [intent, joinGameCode, t]);

  // --- Handlers ---
  const handleCreateOnlineGame = useCallback(async () => {
    if (playMode === 'ffa' && !hostName.trim()) {
      alert(t('nameIsRequired'));
      return;
    }
    if (isProcessing) return;
    const finalChaosMode = playMode === 'teams' ? false : isChaosModeEnabled;
    await createNewGame(hostName, language, selectedWinningScore, finalChaosMode, playMode, team1Name, team2Name);
  }, [hostName, language, selectedWinningScore, isChaosModeEnabled, playMode, team1Name, team2Name, createNewGame, t, isProcessing]);

  const handleJoinOnlineGame = useCallback(async () => {
    if (!joinGameCode.trim() || isProcessing) return;
    const code = joinGameCode.trim().toUpperCase();
    const isDemo = code === 'DEMO' || code === 'TEST';
    if (isDemo) {
      await joinGame(code, joinPlayerName.trim() || 'Reviewer');
      return;
    }
    if (detectedGameMode === 'teams') {
      const session = await joinGame(joinGameCode, '', selectedJoinTeamId);
      if (!session) {
        setRoomCodeError(t('gameNotFound'));
      }
    } else {
      if (!joinPlayerName.trim()) {
        alert(t('nameIsRequired'));
        return;
      }
      const session = await joinGame(joinGameCode, joinPlayerName);
      if (!session) {
        setRoomCodeError(t('gameNotFound'));
      }
    }
  }, [joinGame, joinGameCode, joinPlayerName, detectedGameMode, selectedJoinTeamId, isProcessing, t]);
  
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
    if (playMode === 'ffa' && localPlayers.length < 2) {
      alert(t('minTwoPlayersLocal'));
      return;
    }
    const playerNames = localPlayers.map(p => p.name);
    const isDuo = playMode !== 'teams' && localPlayers.length === 2;
    const finalPlayMode = isDuo ? 'duo' : playMode;
    const finalChaosMode = (isDuo || playMode === 'teams') ? false : isChaosModeEnabled;
    await createLocalGame(playerNames, language, selectedWinningScore, finalChaosMode, finalPlayMode, team1Name, team2Name, isDuo ? customDuoRounds : undefined);
  }, [localPlayers, language, selectedWinningScore, isChaosModeEnabled, playMode, team1Name, team2Name, customDuoRounds, createLocalGame, t]);

  const inputBgColor = 'bg-white/10';
  
  const renderSharedOptions = () => {
    const minScore = WINNING_SCORES[0];
    const maxScore = WINNING_SCORES[WINNING_SCORES.length - 1];
    const percentage = ((selectedWinningScore - minScore) / (maxScore - minScore)) * 100;

    const isRtl = language === Language.HE || language === Language.AR;
    const gradientDir = isRtl ? 'to left' : 'to right';

    const sliderBackgroundStyle = {
      background: `linear-gradient(${gradientDir}, #FBBF24 0%, #FBBF24 ${percentage}%, rgba(255, 255, 255, 0.2) ${percentage}%, rgba(255, 255, 255, 0.2) 100%)`
    };

    return (
      <div className="space-y-6">
        {/* Winning Score Section */}
        <div className="px-1">
          <div className="flex items-center justify-between mb-3 px-2">
            <label htmlFor="winningScore" className="block text-sm font-bold uppercase tracking-widest text-white/70">
              {t('winningScoreLabel')}
            </label>
            <span className="text-xl font-black text-[#FBBF24] bg-black/30 px-3.5 py-1 rounded-full border border-[#FBBF24]/30 shadow-inner">
              {selectedWinningScore} {t('pointsSuffix')}
            </span>
          </div>
          
          <div className={`w-full p-5 rounded-[28px] ${inputBgColor} border border-white/20 backdrop-blur-md relative shadow-lg`}>
              <div className="relative w-full h-8 flex items-center">
                <input 
                    id="winningScore" 
                    type="range" 
                    min={minScore} 
                    max={maxScore} 
                    step={5}
                    value={selectedWinningScore} 
                    onChange={(e) => setSelectedWinningScore(Number(e.target.value) as WinningScore)} 
                    style={sliderBackgroundStyle}
                    className="w-full relative z-10 cursor-pointer accent-[#FBBF24]"
                />
              </div>
              
              {/* Score Quick Chips */}
              <div className="flex justify-between items-center w-full mt-4 gap-1 overflow-x-auto py-1">
                {WINNING_SCORES.map(score => {
                  const isSelected = selectedWinningScore === score;
                  return (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setSelectedWinningScore(score)}
                      className={`flex-1 py-1.5 px-1 rounded-xl text-xs font-black transition-all ${
                        isSelected 
                          ? 'bg-[#FBBF24] text-[#4c1d95] shadow-md scale-105' 
                          : 'bg-white/10 hover:bg-white/20 text-white/70'
                      }`}
                    >
                      {score}
                    </button>
                  );
                })}
              </div>
          </div>
        </div>

        {/* Co-op Duo Rounds Dropdown (when 2 players detected) */}
        {isDuo && (
          <div className="px-1 animate-fade-in">
            <div className="flex items-center justify-between mb-2.5 px-2">
              <label htmlFor="duo-rounds-select" className="block text-sm font-bold uppercase tracking-widest text-emerald-300">
                {t('duoRoundsSettingLabel') || 'Rounds'}
              </label>
              <span className="text-xs font-bold text-white/60">
                30s / {t('singleRoundUnit') || 'round'}
              </span>
            </div>
            
            <div className="relative">
              <select
                id="duo-rounds-select"
                value={customDuoRounds}
                onChange={(e) => setCustomDuoRounds(Number(e.target.value))}
                className={`w-full p-4 rounded-2xl ${inputBgColor} border border-emerald-400/40 text-white font-black text-sm backdrop-blur-md appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all shadow-md`}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => {
                  const isDefault = num === Math.max(1, Math.round(selectedWinningScore / 5));
                  const unit = num === 1 ? (t('singleRoundUnit') || 'round') : (t('roundsUnit') || 'rounds');
                  return (
                    <option key={num} value={num} className="bg-[#2D0B5A] text-white font-bold py-1">
                      {num} {unit} {isDefault ? `(${t('defaultRoundIndicator') || 'Default'})` : ''}
                    </option>
                  );
                })}
              </select>
              <div className="pointer-events-none absolute inset-y-0 ltr:right-4 rtl:left-4 flex items-center text-emerald-300">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* Chaos Mode Card */}
        {(() => {
          const isChaosDisabled = isDuo || playMode === 'teams';
          return (
            <div className={`relative p-5 rounded-[28px] transition-all duration-300 border ${
              isChaosDisabled
                ? 'bg-white/5 border-white/10 opacity-70 cursor-not-allowed'
                : isChaosModeEnabled 
                  ? 'bg-gradient-to-r from-orange-600/30 via-red-600/20 to-purple-600/30 border-orange-500/50 shadow-[0_8px_25px_rgba(251,101,36,0.25)]' 
                  : `${inputBgColor} border-white/20`
            } backdrop-blur-md flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl transition-all shadow-inner ${
                    isChaosDisabled 
                      ? 'bg-white/5 text-white/40 grayscale' 
                      : isChaosModeEnabled 
                        ? 'bg-orange-500/30 text-orange-300 border border-orange-400/40' 
                        : 'bg-white/10 text-white/70'
                  }`}>
                    🔥
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className={`block text-sm font-black uppercase tracking-wider ${isChaosDisabled ? 'text-white/60' : 'text-white'}`}>
                        {t('chaosMode')}
                      </span>
                      <button 
                        type="button" 
                        onClick={() => setChaosInfoVisible(true)} 
                        className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white/80 text-[10px] font-black flex items-center justify-center transition-all cursor-pointer"
                        aria-label={t('chaosModeInfoTitle')}
                      >
                        ?
                      </button>
                    </div>
                    {isDuo && (
                      <span className="text-[11px] font-bold text-amber-300/90 tracking-tight mt-0.5 animate-fade-in">
                        {t('chaosRequiresThreePlayers')}
                      </span>
                    )}
                    {playMode === 'teams' && (
                      <span className="text-[11px] font-bold text-amber-300/90 tracking-tight mt-0.5 animate-fade-in">
                        {t('chaosDisabledForTeams') || 'Not available in Teams mode'}
                      </span>
                    )}
                  </div>
                </div>

                <label 
                  htmlFor="chaos-toggle" 
                  className={`flex items-center select-none ${isChaosDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                >
                    <div dir="ltr" className="relative inline-flex items-center">
                        <input 
                          id="chaos-toggle" 
                          type="checkbox" 
                          className="sr-only" 
                          disabled={isChaosDisabled}
                          checked={!isChaosDisabled && isChaosModeEnabled} 
                          onChange={() => {
                            if (!isChaosDisabled) {
                              setChaosModeEnabled(!isChaosModeEnabled);
                            }
                          }} 
                        />
                        <div 
                          className={`w-14 h-8 rounded-full transition-all duration-300 border ${
                            !isChaosDisabled && isChaosModeEnabled 
                              ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 border-amber-300/80 shadow-[0_0_15px_rgba(249,115,22,0.6)]' 
                              : 'bg-white/20 border-white/20'
                          }`}
                        ></div>
                        <div 
                          className={`absolute left-1 top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-transform duration-300 ease-out flex items-center justify-center ${
                            !isChaosDisabled && isChaosModeEnabled ? 'transform translate-x-6' : 'transform translate-x-0'
                          }`}
                        >
                          {!isChaosDisabled && isChaosModeEnabled && (
                            <span className="text-[10px] leading-none select-none">🔥</span>
                          )}
                        </div>
                    </div>
                </label>
            </div>
          );
        })()}
      </div>
    );
  };

  const isFormValid = () => {
    if (intent === 'create' && !deviceMode) return false;
    if (isOnlineMode) {
      if (intent === 'create') {
        if (playMode === 'teams') return true;
        return hostName.trim().length > 0;
      }
      if (roomCodeError) return false;
      const code = joinGameCode.trim().toUpperCase();
      if (code === 'DEMO' || code === 'TEST') {
        return true;
      }
      if (detectedGameMode === 'teams') {
        return joinGameCode.length === 4;
      }
      return detectedGameMode === 'ffa' && joinPlayerName.trim().length > 0 && joinGameCode.length === 4;
    }
    if (playMode === 'teams') return true;
    return localPlayers.length >= 2;
  };

  const handleMainAction = () => {
    if (isOnlineMode) {
        if (intent === 'create') handleCreateOnlineGame();
        else handleJoinOnlineGame();
    } else {
        handleCreateLocalGame();
    }
  };

  const getButtonText = () => {
    if (isOnlineMode) {
        return intent === 'create' ? t('createGameButton') : t('joinGameButton');
    }
    return t('startGameButton');
  };

  return (
    <>
      <div className="h-[100dvh] flex flex-col items-center px-6 pb-6 pt-safe-top relative overflow-x-hidden overflow-y-auto">
        <button onClick={() => navigate('/')} className="absolute top-safe-top mt-2 ltr:left-6 rtl:right-6 z-20 text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-colors backdrop-blur-md border border-white/10" aria-label="Back to home">
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

        <div className="w-full max-w-lg flex flex-col mt-4 space-y-8 pb-20">
          <div className="w-full">
            {intent === 'create' && (
              <div className="mb-8">
                {/* Heading: Centered with spaced lettering, not uppercase */}
                <h2 className="text-center text-base sm:text-lg font-bold text-white/80 tracking-[0.16em] mb-7">
                  {t('howDoYouWantToPlay')}
                </h2>

                <div className="flex flex-col space-y-8 sm:space-y-10">
                  {/* Top Card: Use one phone */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectDeviceMode('one')}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelectDeviceMode('one'); }}
                    className={`group relative p-7 sm:p-8 rounded-[32px] transition-all duration-300 cursor-pointer select-none flex flex-col items-center justify-center text-center border active:scale-[0.98] ${
                      deviceMode === 'one'
                        ? 'bg-[#3B0E75]/75 border-[#FBBF24] ring-2 ring-[#FBBF24]/50 shadow-[0_16px_40px_rgba(251,191,36,0.25)] scale-[1.01]'
                        : 'bg-[#2D0B5A]/50 hover:bg-[#3B0E75]/55 border-white/15 hover:border-white/30 shadow-[0_12px_32px_rgba(0,0,0,0.35)] backdrop-blur-md'
                    }`}
                  >
                    <SinglePhoneIllustration />
                    <h3 className="text-2xl sm:text-[26px] font-black text-white leading-tight mb-2 tracking-tight">
                      {t('oneDeviceLabel')}
                    </h3>
                    <p className="text-xs sm:text-sm text-white/70 font-medium leading-relaxed max-w-xs">
                      {t('oneDeviceTip')}
                    </p>
                  </div>

                  {/* Bottom Card: Everyone on their phone */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectDeviceMode('multiple')}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelectDeviceMode('multiple'); }}
                    className={`group relative p-7 sm:p-8 pt-7 sm:pt-8 rounded-[32px] transition-all duration-300 cursor-pointer select-none flex flex-col items-center justify-center text-center border overflow-visible active:scale-[0.98] ${
                      deviceMode === 'multiple'
                        ? 'bg-[#3B0E75]/75 border-[#FBBF24] ring-2 ring-[#FBBF24]/50 shadow-[0_16px_40px_rgba(251,191,36,0.25)] scale-[1.01]'
                        : 'bg-[#2D0B5A]/50 hover:bg-[#3B0E75]/55 border-white/15 hover:border-white/30 shadow-[0_12px_32px_rgba(0,0,0,0.35)] backdrop-blur-md'
                    }`}
                  >
                    <MultiPhoneIllustration />
                    <h3 className="text-2xl sm:text-[26px] font-black text-white leading-tight mb-2 tracking-tight max-w-[240px]">
                      {t('multipleDevicesLabel').split('\n').map((line, idx) => (
                        <span key={idx} className="block">{line}</span>
                      ))}
                    </h3>
                    <p className="text-xs sm:text-sm text-white/70 font-medium leading-relaxed max-w-xs">
                      {t('multipleDevicesTip')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* When deviceMode is selected (or intent === 'join'), slide in the rest of the setup */}
            {(intent === 'join' || deviceMode !== null) && (
              <div 
                ref={revealedUiRef}
                className={intent === 'create' ? "space-y-8 animate-setup-slide-in scroll-mt-6" : "space-y-8"}
              >
                {intent === 'create' && (
                  /* Game Mode Selection (Teams vs Free For All) */
                  <div className="p-4 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <span className="text-xs font-black uppercase tracking-[0.2em] text-white/60 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FBBF24]"></span>
                        {t('gameModeLabel')}
                      </span>
                    </div>
                    <div className="flex gap-2 p-1.5 bg-black/25 rounded-full border border-white/10" role="tablist">
                      <button 
                        type="button"
                        onClick={() => setPlayMode('ffa')} 
                        className={`w-1/2 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center ${
                          playMode === 'ffa' 
                            ? 'bg-[#FBBF24] text-[#4c1d95] shadow-lg scale-[1.01]' 
                            : 'text-white/50 hover:text-white/80'
                        }`} 
                        role="tab"
                      >
                        <span>{t('freeForAllMode')}</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => setPlayMode('teams')} 
                        className={`w-1/2 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center ${
                          playMode === 'teams' 
                            ? 'bg-[#FBBF24] text-[#4c1d95] shadow-lg scale-[1.01]' 
                            : 'text-white/50 hover:text-white/80'
                        }`} 
                        role="tab"
                      >
                        <span>{t('teamsMode')}</span>
                      </button>
                    </div>
                  </div>
                )}

                {isOnlineMode ? (
                  <OnlineSetup 
                    intent={intent as 'create' | 'join'}
                    playMode={playMode}
                    team1Name={team1Name} setTeam1Name={setTeam1Name}
                    team2Name={team2Name} setTeam2Name={setTeam2Name}
                    hostName={hostName} setHostName={setHostName}
                    joinPlayerName={joinPlayerName} setJoinPlayerName={setJoinPlayerName}
                    joinGameCode={joinGameCode} setJoinGameCode={setJoinGameCode}
                    detectedGameMode={detectedGameMode}
                    detectedTeams={detectedTeams}
                    selectedJoinTeamId={selectedJoinTeamId}
                    setSelectedJoinTeamId={setSelectedJoinTeamId}
                    renderSharedOptions={renderSharedOptions}
                    roomCodeError={roomCodeError}
                    isCheckingRoomCode={isCheckingRoomCode}
                  />
                ) : (
                  <LocalSetup
                    playMode={playMode}
                    team1Name={team1Name} setTeam1Name={setTeam1Name}
                    team2Name={team2Name} setTeam2Name={setTeam2Name}
                    localPlayers={localPlayers} setLocalPlayers={setLocalPlayers}
                    newLocalPlayerName={newLocalPlayerName} setNewLocalPlayerName={setNewLocalPlayerName}
                    onAddPlayer={handleAddLocalPlayer} onRemovePlayer={handleRemoveLocalPlayer}
                    renderSharedOptions={renderSharedOptions}
                  />
                )}

                <div className="w-full max-w-md mx-auto pt-2">
                  <button 
                    onClick={handleMainAction} 
                    disabled={isProcessing || !isFormValid()}
                    className={`w-full h-[60px] rounded-full bg-[#FBBF24] text-[#4c1d95] font-black uppercase tracking-widest text-lg shadow-[0_10px_30px_rgba(251,191,36,0.3)] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:scale-100 disabled:cursor-not-allowed`}
                  >
                    {isProcessing ? "..." : getButtonText()}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isChaosInfoVisible && <ChaosModeInfoModal onClose={() => setChaosInfoVisible(false)} />}
    </>
  );
};

export default SetupScreen;