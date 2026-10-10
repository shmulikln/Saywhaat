import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { GameSessionProvider } from './contexts/GameSessionContext';
import { TranslationsProvider } from './contexts/TranslationsContext';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Capacitor } from '@capacitor/core';

// In native Capacitor apps or during local development, ensure local assets are loaded fresh and no stale SW/caches exist
if (Capacitor.isNativePlatform() || import.meta.env.DEV) {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    });
  }
  if ('caches' in window) {
    caches.keys().then((keys) => {
      keys.forEach((key) => caches.delete(key));
    });
  }
} else {
  // Only register service worker when running in a production web browser (PWA)
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
    });
  }
}

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <ErrorBoundary>
      <BrowserRouter>
        <TranslationsProvider>
          <GameSessionProvider>
            <App />
          </GameSessionProvider>
        </TranslationsProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}