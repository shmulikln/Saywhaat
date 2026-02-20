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
import { App as CapApp } from '@capacitor/app'; // Correct import

// ... (keep your useKeepScreenAwake code exactly as it is) ...

const App: React.FC = () => {
  const { gameSession, isLoading: isGameLoading } = useGame();
  const { setLanguage, isLoading: isTranslationsLoading, language: currentLang } = useTranslations();
  const location = useLocation();
  const navigate = useNavigate();

// useKeepScreenAwake();

// --- NEW: DEEP LINK LISTENER START ---
  useEffect(() => {
    let listenerHandle;

    const setupDeepLinks = async () => {
      // 1. Handle "cold start" (App was closed)
      const launchUrl = await CapApp.getLaunchUrl();
      if (launchUrl?.url) {
        handleUrl(launchUrl.url);
      }

      // 2. Handle links while app is open (await the promise here!)
      listenerHandle = await CapApp.addListener('appUrlOpen', (data) => {
        handleUrl(data.url);
      });
    };

    function handleUrl(url) {
      try {
        // Remove 'saywhaaat://' scheme if present, leaving just the path
        let path = url.replace(/^saywhaaat:\/\//, '');

        // If it starts with //, convert to single /
        if (path.startsWith('//')) {
          path = path.replace(/^\/\//, '/');
        }

        // Handle /join/gameId paths by converting to /lobby/gameId
        if (path.includes('/join/')) {
          path = path.replace('/join/', '/lobby/');
        }

        // Ensure path starts with /
        if (!path.startsWith('/')) {
          path = '/' + path;
        }

        console.log("Deep Link Success! Navigating to:", path);
        navigate(path);
      } catch (err) {
        console.error("Deep Link Error parsing URL:", err);
      }
    }

    setupDeepLinks();

    // 3. Clean up correctly
    return () => {
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  }, [navigate]);
  // --- NEW: DEEP LINK LISTENER END ---

  // ... (Keep the rest of your existing useEffects for language and routing) ...

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
      navigate(expectedPath, { replace: true });
    }
  }, [gameSession, isGameLoading, location.pathname, navigate]);


  if (isGameLoading || isTranslationsLoading) {
    return (
      <div className="min-h-screen bg-[#4c1d95]">
        <ParticleBackground />
        <LoadingScreen />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <ParticleBackground />
      <main className="flex-grow relative z-10">
        <Routes>
          <Route path="/" element={<WelcomeScreen />} />
          <Route path="/setup" element={<SetupScreen />} />
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
      </main>
    </div>
  );
};

export default App;