
import React from 'react';
import Modal from './Modal';
import { useTranslations } from '../contexts/TranslationsContext';
import { APP_VERSION } from '../constants';

interface VersionHistoryModalProps {
  onClose: () => void;
}

const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({ onClose }) => {
  const { t } = useTranslations();

  const versions = [
    {
      version: "v2.0.2-light",
      title: "Performance & Optimization",
      changes: [
        "Massive code refactor to improve performance and stability.",
        "Reduced logic complexity for smoother gameplay.",
        "Optimized assets for faster loading times."
      ]
    },
    {
      version: "v2.0.1",
      title: "Polishing & Stability",
      changes: [
        "General bug fixes and performance improvements.",
        "Ensured version synchronization with latest revisions."
      ]
    },
    {
      version: "v2.0.0",
      title: "Online Multiplayer!",
      changes: [
        "Major architectural upgrade to support real-time online games.",
        "Replaced local storage with a Firebase Realtime Database backend.",
        "Added a new Home screen to create or join games using a 4-letter code.",
        "Created a pre-game Lobby for players to gather before starting.",
        "Implemented player-specific views: Explainers see the word, Guessers see a spectator screen.",
      ]
    },
    {
      version: "v1.4.1",
      title: "Code Quality & Maintenance",
      changes: [
        "Centralized the app version number into a single constant for consistency and easier updates.",
        "Performed a code review to ensure best practices.",
        "Identified and flagged unused project files for removal.",
      ]
    },
    {
      version: "v1.4.0",
      title: "Chaos Minigame!",
      changes: [
        "Introduced a new Chaos Event: The Card Draw Minigame!",
        "One lucky player gets to draw a card to win points, steal from others, or swap scores.",
        "Created a new animated, flippable card component.",
        "Added new game state and logic to handle the minigame flow.",
        "Fixed various bugs and improved type safety.",
      ]
    },
    {
      version: "v1.3.0",
      title: "Code Refactor & Optimization",
      changes: [
        "Performed a major refactor to improve app structure and modularity.",
        "Externalized large data sets (words, translations, nicknames) into JSON files to reduce initial load and improve processing speed.",
        "Created a dedicated context for handling translations.",
        "Refactored complex game logic into smaller, more manageable functions.",
      ]
    },
  ];

  return (
    <Modal title={t('versionHistoryTitle')} onClose={onClose}>
      <div className="space-y-6 max-h-[60vh] overflow-y-auto p-1 pr-3 text-slate-600 dark:text-slate-300">
        {versions.map((item, index) => (
          <div key={index} className="ltr:pl-4 rtl:pr-4 ltr:border-l-2 rtl:border-r-2 border-indigo-200 dark:border-indigo-700">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{item.title}</h3>
            <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mb-2">{item.version}</p>
            <ul className="list-disc ltr:pl-5 rtl:pr-5 space-y-1 text-sm">
              {item.changes.map((change, cIndex) => (
                <li key={cIndex}>{change}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Modal>
  );
};

export default VersionHistoryModal;
