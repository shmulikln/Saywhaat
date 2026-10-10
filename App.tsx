import React, { useEffect, useRef, useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import SetupScreen from './components/SetupScreen';
import GameScreen from './components/GameScreen';
import TurnScreen from './components/TurnScreen';
import GameOverScreen from './components/GameOverScreen';
import CardDrawScreen from './components/CardDrawScreen';
import LobbyScreen from './components/LobbyScreen';
import { useGame } from './contexts/GameSessionContext';
import { useTranslations } from './contexts/TranslationsContext';
import { Language, GameState } from './types';
import { DEFAULT_LANGUAGE } from './constants';
import ParticleBackground from './components/ParticleBackground';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingScreen from './components/LoadingScreen';
import WelcomeScreen from './components/WelcomeScreen';
import PrivacyPolicy from './components/PrivacyPolicy';
import { App as CapApp } from '@capacitor/app'; // Correct import
import { Capacitor } from '@capacitor/core';
import { AdMob, AdOptions, InterstitialAdPluginEvents } from '@capacitor-community/admob';


import { initializeFirebase } from './services/firebaseService';
import { transitionNavigate } from './utils/navigationUtils';
import ScreenTransition from './components/ScreenTransition';

// ... (keep your useKeepScreenAwake code exactly as it is) ...

const App: React.FC = () => {
  const { gameSession, isLoading: isGameLoading } = useGame();
  const { setLanguage, isLoading: isTranslationsLoading, language: currentLang } = useTranslations();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    initializeFirebase();
  }, []);

  useEffect(() => {
    if (localStorage.getItem('saywhaaat_dark_mode') === 'true' ||
        (!('saywhaaat_dark_mode' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // --- WEB JOIN LINK HANDLER ---
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const path = location.pathname;
    let gameId: string | null = null;

    // 1. Check for query parameter
    gameId = searchParams.get('joinGameId');

    // 2. Check for path parameter if no query param found
    if (!gameId && path.startsWith('/join/')) {
      const pathSegments = path.split('/');
      if (pathSegments.length > 2 && pathSegments[2]) {
        gameId = pathSegments[2];
      }
    }

    if (gameId) {
      const isAndroid = /android/i.test(navigator.userAgent);
      if (isAndroid && Capacitor.getPlatform() === 'web') {
        window.location.href = 'https://play.google.com/store/apps/details?id=com.saywhaaat.app';
        return;
      }

      const lang = searchParams.get('lang');

      navigate('/setup', { 
        state: { 
          intent: 'join', 
          gameId: gameId,
          lang: lang
        },
        replace: true 
      });
    }
  }, [location.pathname, location.search, navigate]);
  // --- WEB JOIN LINK HANDLER END ---

// useKeepScreenAwake();

// --- DEEP LINK LISTENER START ---
  useEffect(() => {
    let listenerHandle;

    const setupDeepLinks = async () => {
      // Handle app launch URL (cold start)
      const launchUrl = await CapApp.getLaunchUrl();
      if (launchUrl && launchUrl.url) {

        handleUrl(launchUrl.url);
      }

      // Listen for subsequent URLs while the app is open
      listenerHandle = await CapApp.addListener('appUrlOpen', (data) => {
        handleUrl(data.url);
      });

    };

    function handleUrl(url) {
      try {

        const urlObject = new URL(url);
        const searchParams = urlObject.searchParams;
        const gameIdFromQuery = searchParams.get('gameId');

        if (gameIdFromQuery) {

          navigate('/setup', {
            state: {
              intent: 'join',
              gameId: gameIdFromQuery
            },
            replace: true
          });
          return;
        }
        
        // Fallback for path-based links
        const path = urlObject.pathname;
        if (path.includes('/join/') || path.includes('/lobby/')) {
            const gameIdFromPath = path.split('/').pop();
            if (gameIdFromPath) {

                navigate('/setup', {
                    state: {
                        intent: 'join',
                        gameId: gameIdFromPath
                    },
                    replace: true
                });
                return;
            }
        }
        


      } catch (err) {
        
      }
    }

    setupDeepLinks();

    return () => {
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  }, [navigate]);
  // --- DEEP LINK LISTENER END ---

  // --- NEW: ADMOB HANDLER START ---
  // Initialize AdMob once on mount
  const adMobInitializedRef = useRef(false);

  useEffect(() => {
    if (adMobInitializedRef.current) {
      return;
    }
    adMobInitializedRef.current = true;

    async function initializeAdMob() {
      try {
                await AdMob.initialize({
          tagForChildDirectedTreatment: true,
        });

        prepareAdInitial();
      } catch (e) {
        
      }
    }

    async function prepareAdInitial() {
      try {
        await AdMob.prepareInterstitial({
          adId: 'ca-app-pub-7599308880531325/6231560290',
          isTesting: true
        });

      } catch (e) {
        
      }
    }

    initializeAdMob();
  }, []);
  // --- NEW: ADMOB HANDLER END ---



  useEffect(() => {
    const langToSet = gameSession?.language || DEFAULT_LANGUAGE;
    setLanguage(langToSet);
  }, [gameSession?.language, setLanguage]);

  useEffect(() => {
    if (currentLang === Language.HE || currentLang === Language.AR) {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = currentLang;
    } else {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = currentLang;
    }
  }, [currentLang]);

  useEffect(() => {
    if (isGameLoading) return;
    if (!gameSession) return;

    const gameIdForPath = gameSession.gameMode === 'local' ? 'local' : gameSession.gameId;
    const currentPath = location.pathname; 

    if (gameSession.gameMode === 'local' && gameSession.gameState === GameState.LOBBY) {
      return;
    }

    const routeMapping = {
      [GameState.LOBBY]: `/lobby/${gameIdForPath}`,
      [GameState.IN_GAME]: `/game/${gameIdForPath}`,
      [GameState.TURN_ACTIVE]: `/turn/${gameIdForPath}`,
      [GameState.MINIGAME]: `/minigame/${gameIdForPath}`,
      [GameState.GAME_OVER]: `/gameover/${gameIdForPath}`,
    };
    
    const expectedPath = routeMapping[gameSession.gameState as keyof typeof routeMapping];

    if (expectedPath && currentPath.toUpperCase() !== expectedPath.toUpperCase()) {
      transitionNavigate(navigate, expectedPath, { replace: true });
    }
  }, [gameSession, isGameLoading, location.pathname, navigate]);


  const isChaosActive = !!(gameSession?.activeChaosEvent || gameSession?.activeTurnChaos);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#4c1d95]">
      <ParticleBackground isChaosActive={isChaosActive} />
      {isGameLoading || isTranslationsLoading ? (
        <LoadingScreen />
      ) : (
        <main className="flex-grow relative z-10 flex flex-col">
          <ScreenTransition>
            {(activeLocation) => (
              <Routes location={activeLocation}>
                <Route path="/" element={<WelcomeScreen />} />
                <Route path="/setup" element={<SetupScreen />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route 
                  path="/lobby/:gameId" 
                  element={<ProtectedRoute><LobbyScreen /></ProtectedRoute>} 
                />
                <Route 
                  path="/game/:gameId" 
                  element={<ProtectedRoute><GameScreen /></ProtectedRoute>} 
                />
                <Route 
                  path="/turn/:gameId" 
                  element={<ProtectedRoute><TurnScreen /></ProtectedRoute>} 
                />
                 <Route 
                  path="/minigame/:gameId" 
                  element={<ProtectedRoute><CardDrawScreen /></ProtectedRoute>} 
                />
                <Route 
                  path="/gameover/:gameId" 
                  element={<ProtectedRoute><GameOverScreen /></ProtectedRoute>} 
                />
                {/* Add a /join route if your app logic expects it, or use navigate to lobby directly */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            )}
          </ScreenTransition>
        </main>
      )}
    </div>
  );
};

export default App;