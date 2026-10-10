
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getDatabase, ref, set, get, onValue, Database, DataSnapshot, runTransaction, TransactionResult, remove } from 'firebase/database';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { GameSession, Player } from '../types';
import { getFirebaseConfig } from './firebase-config';

let db: Database | undefined;
let app: FirebaseApp | undefined;

export const initializeFirebase = () => {
  if (app) {
    return;
  }
  try {
    const firebaseConfig = getFirebaseConfig();
    // This pattern robustly initializes Firebase
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    db = getDatabase(app);

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
          provider: new ReCaptchaEnterpriseProvider(firebaseConfig.appCheckSiteKey),
          isTokenAutoRefreshEnabled: true
        });

      } else if (isLocalhost) {
        // For local development in this environment, we avoid initializing with invalid keys
        // to prevent spamming the console with reCAPTCHA errors.

      }
    }

    // Explicitly providing the databaseURL to getDatabase

  } catch (error) {
    console.error("Firebase initialization failed. Please check your configuration in firebase-config.ts.", error);
  }
};

/**
 * Checks if the Firebase Database service was successfully initialized.
 * @returns {boolean} True if the database connection is available.
 */
export const isFirebaseConfigured = (): boolean => {
  return !!db;
};

export const sanitizeForFirebase = <T>(data: T): T => {
  if (data === undefined) return null as any;
  return JSON.parse(JSON.stringify(data));
};

export const createGameInDb = async (gameId: string, session: GameSession): Promise<void> => {
  if (!db) return Promise.reject(new Error("Firebase is not configured."));
  const gameRef = ref(db, `games/${gameId.toUpperCase()}`);
  
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Connection timed out saving session to cloud. Please check your internet connection.")), 15000)
  );

  const cleanSession = sanitizeForFirebase(session);
  await Promise.race([set(gameRef, cleanSession), timeoutPromise]);
};

export const getGameFromDb = async (gameId: string): Promise<GameSession | null> => {
  if (!db) return Promise.reject(new Error("Firebase is not configured."));
  const gameRef = ref(db, `games/${gameId.toUpperCase()}`);
  
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Connection timed out retrieving game from cloud. Please check your internet connection.")), 15000)
  );

  const snapshot = await Promise.race([get(gameRef), timeoutPromise]);
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

  const gameRef = ref(db, `games/${gameId.toUpperCase()}`);
  return runTransaction(gameRef, (currentData) => {
    const updated = updateFn(currentData);
    if (updated === undefined || updated === null) return updated;
    return sanitizeForFirebase(updated);
  });
};

export const listenToGameUpdates = (gameId: string, callback: (session: GameSession | null) => void): (() => void) => {
  if (!db) {
    
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
  await set(pendingPlayerRef, sanitizeForFirebase(player));
};

/**
 * Listens for changes to the 'pendingPlayers' queue.
 */
export const listenToPendingPlayers = (gameId: string, callback: (players: { [id: string]: Player } | null) => void): (() => void) => {
  if (!db) {
    
    return () => {};
  }
  const pendingPlayersRef = ref(db, `games/${gameId.toUpperCase()}/pendingPlayers`);
  const unsubscribe = onValue(pendingPlayersRef, (snapshot: DataSnapshot) => {
    callback(snapshot.exists() ? (snapshot.val() as { [id: string]: Player }) : null);
  });
  return unsubscribe;
};export const clearPendingPlayers = async (gameId: string): Promise<void> => {
  if (!db) return;
  const pendingPlayersRef = ref(db, `games/${gameId.toUpperCase()}/pendingPlayers`);
  await remove(pendingPlayersRef).catch(() => {});
};


/**
 * Listens for changes to the 'liveSign' value.
 */
export const listenToLiveSignUpdates = (callback: (sign: string) => void): (() => void) => {
  if (!db) {
    
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
