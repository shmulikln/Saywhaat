
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getDatabase, ref, set, get, onValue, Database, DataSnapshot, runTransaction, TransactionResult } from 'firebase/database';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { GameSession, Player } from '../types';
import { firebaseConfig } from './firebase-config';

let db: Database | undefined;
let app: FirebaseApp | undefined;

try {
  // This pattern robustly initializes Firebase
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);

  // Initialize App Check
  // Note: Only initialize if a valid site key is provided and we are in a browser environment.
  // We check if the key is not the default placeholder to avoid reCAPTCHA errors.
  const hasValidKey = firebaseConfig.appCheckSiteKey && 
                     !firebaseConfig.appCheckSiteKey.startsWith('REPLACE_');

  if (typeof window !== 'undefined') {
    // Detect if we are in a development environment or running locally
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (hasValidKey) {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(firebaseConfig.appCheckSiteKey),
        isTokenAutoRefreshEnabled: true
      });
      console.log("🛡️ Firebase App Check initialized with reCAPTCHA.");
    } else if (isLocalhost) {
      // For local development in this environment, we avoid initializing with invalid keys
      // to prevent spamming the console with reCAPTCHA errors.
      console.warn("⚠️ App Check: No valid site key found. Online database access may be blocked if Enforcement is enabled in Firebase Console.");
    }
  }

  // Explicitly providing the databaseURL to getDatabase
  db = getDatabase(app, firebaseConfig.databaseURL);
  console.log("✅ Firebase initialized successfully.");
} catch (error) {
  console.error("Firebase initialization error:", error);
  console.warn("This error usually indicates an issue with the Firebase project setup. Online functionality will be disabled.");
}

/**
 * Checks if the Firebase Database service was successfully initialized.
 * @returns {boolean} True if the database connection is available.
 */
export const isFirebaseConfigured = (): boolean => {
  return !!db;
};

export const createGameInDb = async (gameId: string, session: GameSession): Promise<void> => {
  if (!db) return Promise.reject(new Error("Firebase is not configured."));
  const gameRef = ref(db, `games/${gameId.toUpperCase()}`);
  await set(gameRef, session);
};

export const getGameFromDb = async (gameId: string): Promise<GameSession | null> => {
  if (!db) return Promise.reject(new Error("Firebase is not configured."));
  const gameRef = ref(db, `games/${gameId.toUpperCase()}`);
  const snapshot = await get(gameRef);
  return snapshot.exists() ? (snapshot.val() as GameSession) : null;
};

/**
 * Performs a safe, transactional update on a game session.
 */
export const runGameTransaction = (
  gameId: string,
  updateFn: (session: GameSession | null) => GameSession | null | undefined
): Promise<TransactionResult> => {
  if (!db) throw new Error("Firebase is not configured.");
  console.log(`[Firebase] Starting transaction for game: ${gameId.toUpperCase()}`);
  const gameRef = ref(db, `games/${gameId.toUpperCase()}`);
  return runTransaction(gameRef, updateFn);
};


export const listenToGameUpdates = (gameId: string, callback: (session: GameSession | null) => void): (() => void) => {
  if (!db) {
    console.error("Firebase not configured. Cannot listen for game updates.");
    return () => {}; 
  }
  const gameRef = ref(db, `games/${gameId.toUpperCase()}`);
  const unsubscribe = onValue(gameRef, (snapshot: DataSnapshot) => {
    callback(snapshot.exists() ? (snapshot.val() as GameSession) : null);
  });
  return unsubscribe;
};

/**
 * Adds a player to the 'pendingPlayers' queue for a game.
 */
export const addPendingPlayer = async (gameId: string, playerId: string, player: Player): Promise<void> => {
  if (!db) return Promise.reject(new Error("Firebase is not configured."));
  const pendingPlayerRef = ref(db, `games/${gameId.toUpperCase()}/pendingPlayers/${playerId}`);
  await set(pendingPlayerRef, player);
};

/**
 * Listens for changes to the 'pendingPlayers' queue.
 */
export const listenToPendingPlayers = (gameId: string, callback: (players: { [id: string]: Player } | null) => void): (() => void) => {
  if (!db) {
    console.error("Firebase not configured. Cannot listen for pending players.");
    return () => {};
  }
  const pendingPlayersRef = ref(db, `games/${gameId.toUpperCase()}/pendingPlayers`);
  const unsubscribe = onValue(pendingPlayersRef, (snapshot: DataSnapshot) => {
    callback(snapshot.exists() ? (snapshot.val() as { [id: string]: Player }) : null);
  });
  return unsubscribe;
};

/**
 * Listens for changes to the 'liveSign' value.
 */
export const listenToLiveSignUpdates = (callback: (sign: string) => void): (() => void) => {
  if (!db) {
    console.error("Firebase not configured. Cannot listen for live sign updates.");
    return () => {};
  }
  const liveSignRef = ref(db, 'liveSign');
  const unsubscribe = onValue(liveSignRef, (snapshot: DataSnapshot) => {
    callback(snapshot.exists() ? (snapshot.val() as string) : '?');
  });
  return unsubscribe;
};

/**
 * Updates the 'liveSign' value in the database.
 */
export const updateLiveSignInDb = async (sign: string): Promise<void> => {
  if (!db) return Promise.reject(new Error("Firebase is not configured."));
  const liveSignRef = ref(db, 'liveSign');
  await set(liveSignRef, sign);
};
