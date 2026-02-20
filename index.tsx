import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { GameSessionProvider } from './contexts/GameSessionContext';
import { TranslationsProvider } from './contexts/TranslationsContext';
import { HashRouter } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <ErrorBoundary>
      <HashRouter>
        <TranslationsProvider>
          <GameSessionProvider>
            <App />
          </GameSessionProvider>
        </TranslationsProvider>
      </HashRouter>
    </ErrorBoundary>
  );
}