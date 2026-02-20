
import React, { createContext, useContext, useState, useEffect } from 'react';
import { listenToLiveSignUpdates, updateLiveSignInDb, isFirebaseConfigured } from '../services/firebaseService';

const SIGNS = ['!', '⚡', '✨', '🔥', '🤔', '😎', '🎉', '🎤'];

interface LiveSignContextType {
  liveSign: string;
}

const LiveSignContext = createContext<LiveSignContextType | undefined>(undefined);

export const LiveSignProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [liveSign, setLiveSign] = useState('?');

  useEffect(() => {
    if (!isFirebaseConfigured()) return;

    // Listen for updates pushed from any client
    const unsubscribe = listenToLiveSignUpdates(setLiveSign);

    // This client will also attempt to update the sign periodically.
    // Firebase handles the concurrent writes, with the last one winning.
    const intervalId = setInterval(() => {
      const randomSign = SIGNS[Math.floor(Math.random() * SIGNS.length)];
      updateLiveSignInDb(randomSign);
    }, 3000);

    // Cleanup listeners and intervals on component unmount
    return () => {
      unsubscribe();
      clearInterval(intervalId);
    };
  }, []);

  return (
    <LiveSignContext.Provider value={{ liveSign }}>
      {children}
    </LiveSignContext.Provider>
  );
};

export const useLiveSign = (): LiveSignContextType => {
  const context = useContext(LiveSignContext);
  if (context === undefined) {
    throw new Error('useLiveSign must be used within a LiveSignProvider');
  }
  return context;
};
