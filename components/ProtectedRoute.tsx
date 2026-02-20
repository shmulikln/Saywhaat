import React from 'react';
import { Navigate } from 'react-router-dom';
import { useGame } from '../contexts/GameSessionContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { gameSession, isLoading } = useGame();

  if (isLoading) {
    // The global LoadingScreen in App.tsx is handling the visual display.
    // We render nothing here and wait for the loading process to complete.
    console.log('[ProtectedRoute] isLoading is true, waiting for session...');
    return null;
  }

  // After loading is finished, we check for a game session.
  if (!gameSession) {
    // If there's no session, the user is not in a valid game.
    // This could be an invalid game ID or they have left the game.
    // Redirect them to the home page.
    console.log('[ProtectedRoute] isLoading is false, but no gameSession found. Redirecting to home.');
    return <Navigate to="/" replace />;
  }

  // If loading is finished and a valid game session exists, render the requested page.
  console.log('[ProtectedRoute] Session found, rendering protected content.');
  return <>{children}</>;
};

export default ProtectedRoute;