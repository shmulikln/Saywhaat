# Say Whaaat?! - Project Rules & Engineering Guidelines

This document serves as the single source of truth for architectural standards, core engineering rules, state management, mobile performance, and code generation standards for **Say Whaaat?!** (`com.saywhaaat.app`). All AI agents and developers working on this codebase must adhere strictly to these principles.

---

## 1. System Overview & Architecture

### 1.1 Dual-Runtime Hybrid Architecture
"Say Whaaat?!" is built as a unified cross-platform game targeting:
1. **Android Native Application** (`com.saywhaaat.app`): Packaged using **Capacitor 8** targeting modern Android (SDK 34/35) with native haptics, AdMob monetization, deep links, and edge-to-edge support.
2. **Web Application & PWA** (`saywhaaat.web.app`): Deployed on **Firebase Hosting** with offline service worker support via `vite-plugin-pwa`.

### 1.2 Technology Stack
- **Frontend Core**: React 19 (SPA) + TypeScript 5.8 + Vite 6.
- **Styling**: Tailwind CSS 3.4 (PostCSS pipeline) + Custom CSS in `index.html` / `index.css`.
- **Native Bridge**: Capacitor 8 (`@capacitor/core`, `@capacitor/android`, `@capacitor/app`, `@capacitor-community/admob`).
- **Realtime Backend**: Firebase 12 (Realtime Database in `europe-west1`, App Check with reCAPTCHA Enterprise).
- **Typography & Aesthetics**: Google Fonts (`Outfit` for base UI, `Secular One` for Hebrew/Arabic RTL, `Luckiest Guy` for game branding).
- **VFX & Animations**: `@tsparticles/react` & `@tsparticles/slim`, GPU-accelerated CSS 3D transforms.

### 1.3 Game Domain Model & Game Modes
The game supports two parallel gameplay modes sharing the same core state model (`GameSession`):
- **Online Multiplayer (`gameMode: 'online'`)**: Real-time room synchronization across multiple phones using 4-character game codes (e.g., `ABCD`), coordinated through Firebase RTDB.
- **Local Pass-and-Play (`gameMode: 'local'`)**: Single-device offline play where players take turns holding the device. State transitions happen strictly in-memory without database queries.

```
                    ┌─────────────────────────┐
                    │       SetupScreen       │
                    └────────────┬────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
       [ Online Game Mode ]             [ Local Game Mode ]
                 │                               │
                 ▼                               │
          LobbyScreen                            │
                 │                               │
                 └───────────────┬───────────────┘
                                 ▼
                          GameScreen (Ready)
                                 │
                                 ▼
                         TurnScreen (Active)
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
       Between-Turn Chaos:               Between-Turn Chaos:
          Turn Modifier                     Minigame (Cards)
                 │                               │
                 └───────────────┬───────────────┘
                                 ▼
                         GameOverScreen
```

### 1.4 Routing & Deep Linking Standard
- **Router Choice**: `BrowserRouter` from `react-router-dom` is configured across web and native.
- **Native Scheme Configuration**: `capacitor.config.ts` enforces `server.hostname = 'saywhaaat.web.app'` and `server.androidScheme = 'https'`. This ensures native WebView routes match standard web URLs.
- **Deep Linking**:
  - AssetLinks defined at `public/.well-known/assetlinks.json` verify domain ownership for Android App Links.
  - Cold starts (`CapApp.getLaunchUrl()`) and warm starts (`CapApp.addListener('appUrlOpen')`) in `App.tsx` capture `?joinGameId=` and route to `/setup` with auto-join intent.
  - Fallback: Android web users visiting join links are redirected to Google Play Store.

---

## 2. Core Engineering Rules

### 2.1 The "Zero-Script `index.html`" Policy
- **Absolute Rule**: **NEVER** insert inline `<script>` tags, third-party analytics, or DOM-mutating code directly inside `index.html`.
- **Rationale**: React 19 is extremely sensitive to external DOM mutations outside its reconciler. Adding external scripts directly into `index.html` triggers fatal hydration errors (such as React error `#527`).
- **Enforcement**:
  - Dark mode detection, AdMob initialization, Firebase initialization, and service worker updates must execute within React lifecycle hooks (`useEffect`) or context providers.
  - HTML must contain only the `#root` mount node and the initial Vite bundle entry (`index.tsx`).

### 2.2 Native-First Hybrid Thinking
- Always prioritize **Capacitor native plugins** over generic Web APIs when running natively:
  - Use `@capacitor/haptics` for tactile feedback (`triggerHaptic('SUCCESS' | 'WARNING' | 'LIGHT')`).
  - Use `@capacitor/share` for social sharing (`nativeShare`).
  - Use `@capacitor-community/admob` for interstitial ads.
  - Use `@capacitor/app` for app lifecycle and deep link listening.
- Always check `Capacitor.isNativePlatform()` before executing native-only pathways.

### 2.3 Strict i18n & Bidirectional (RTL/LTR) Enforcement
- **Supported Languages**: English (`en`), Hebrew (`he`), Portuguese (`pt`), Hindi (`hi`), Indonesian (`id`), Arabic (`ar`), Chinese (`zh`).
- **RTL Handling**:
  - When `currentLang === Language.HE || currentLang === Language.AR`, the app sets `document.documentElement.dir = 'rtl'` and dynamically replaces fonts with `Secular One`.
  - Use logical Tailwind CSS utilities or bidirectional-aware classes (e.g. flex ordering and inset alignments that do not break in RTL).
- **Localization Files**:
  - User-facing strings must never be hardcoded. Always use `t('translationKey', replacements)` from `useTranslations()`.
  - Word dictionaries live in `/data/words_{lang}.json` and are loaded dynamically to avoid bundling tens of thousands of words into the main JavaScript bundle.

### 2.4 Separation of Concerns
1. **Domain & Business Logic (`utils/`)**:
   - `turnLogic.ts`: Pure functions for calculating turn start, turn advancement, score increments, skips, and win conditions (`calculateStartTurn`, `calculateAdvanceTurn`, `calculateGuess`, `calculateSkip`).
   - `minigameLogic.ts`: Pure functions for applying card outcomes (`applyMinigameOutcome`).
   - `chaosUtils.ts`: Pure functions for rolling chaos events, deck creation, and turn modifiers.
   - **Rule**: Game logic calculations must be pure and decoupled from React rendering.
2. **Context & State Management (`contexts/`)**:
   - Orchestrates network subscriptions, database transactions, routing transitions, and local storage.
3. **Presentational Layer (`components/`)**:
   - Components must remain lean, accepting props or reading from `useGame()` / `useTranslations()`.

### 2.5 Build & Android Sync Discipline
Whenever frontend code or assets are modified for native testing or production:
```bash
# 1. Clean build output and compile production bundle
npm run build

# 2. Sync web assets and plugins to Android native project
npx cap sync android
```

---

## 3. Firebase & State Management

### 3.1 Single Source of Truth (`GameSessionContext`)
- `GameSessionContext.tsx` is the central state hub. Components must consume `useGame()` rather than managing ad-hoc session state.
- Both `online` and `local` sessions use the exact same `GameSession` schema, ensuring identical component behavior regardless of network mode.

### 3.2 European Realtime Database Configuration
- The Firebase Realtime Database is hosted in Europe West:
  ```ts
  databaseURL: "https://saywhaaat-default-rtdb.europe-west1.firebasedatabase.app"
  ```
- Firebase config is selected dynamically based on platform (`getFirebaseConfig()` in `services/firebase-config.ts` distinguishes Android API keys from Web API keys).
- **App Check**: Enabled with reCAPTCHA Enterprise. To prevent local console spam during testing, App Check only initializes in production or non-localhost environments with valid keys.

### 3.3 Atomic Transactions vs. Blind Writes
- **CRITICAL RULE**: **NEVER** use blind `set()` to mutate shared game state during active gameplay.
- Any action that modifies shared state (points, current word, skipped words, rematch reset, minigame outcomes, player leaves) **MUST** use `runGameTransaction(gameId, updateFn)`:
  ```ts
  export const runGameTransaction = (
    gameId: string,
    updateFn: (session: GameSession | null) => GameSession | null | undefined
  ): Promise<TransactionResult> => {
    const gameRef = ref(db, `games/${gameId.toUpperCase()}`);
    return runTransaction(gameRef, updateFn);
  };
  ```
- **Transaction Safety**:
  - `updateFn` must be a pure function.
  - Return `undefined` to cleanly abort the transaction if the state is invalid or nonexistent.
  - Return `null` only when intentionally deleting a session (e.g. when the last player leaves).

### 3.4 Host-as-Authority Join Queue
To prevent race conditions when multiple players join a room simultaneously:
1. Joiners push their player profile to `/games/{GAMEID}/pendingPlayers/{playerId}` using `addPendingPlayer()`.
2. The Host's device listens to `listenToPendingPlayers()`.
3. The Host executes a single atomic transaction on `/games/{GAMEID}`, merging `pendingPlayers` into `players` and `playerOrder`, incrementing `playerCount`, and clearing `pendingPlayers`.
4. Joiners observe their ID added to `playerOrder` and complete their join checklist.

### 3.5 Listener Lifecycles & Ghost State Prevention
- All Firebase `onValue` subscriptions must be stored in `useRef` handles (`unsubscribeListenerRef`, `unsubscribePendingPlayersRef`).
- Always clean up subscriptions inside `useEffect` cleanup blocks.
- Use an `isLeavingRef` flag when a player exits a room to immediately ignore incoming database snapshot events before the route transition finishes.

---

## 4. Mobile Performance & Battery Conservation

### 4.1 Particle System (`@tsparticles`) Optimization
- The ambient background (`ParticleBackground.tsx`) must never degrade frame rates:
  - `fpsLimit: 60` and `detectRetina: true` must be maintained.
  - Interactivity (`onHover`, `onClick`) **must remain disabled** to eliminate continuous pointer event listeners.
  - Keep particle count low: `80` particles during normal play, boosting to `150` strictly during chaos events.
  - Particles must use `@tsparticles/slim` rather than the bloated full bundle.

### 4.2 GPU-Accelerated 3D Transforms & Zero-Jank Card Flips
- For interactive elements like `FlippableCard.tsx`:
  - Always use `transform-gpu` to force GPU compositing layer creation.
  - Apply `transformStyle: 'preserve-3d'` and `backfaceVisibility: 'hidden'`.
  - **Never** animate `width`, `height`, `margin`, `top`, or `left`. Animate exclusively `transform` and `opacity`.
  - Wrap cards in `React.memo` to prevent re-rendering when sibling state changes.

### 4.3 Clock Drift & Frame-Accurate Timers
- **Anti-Pattern**: Do NOT track turn countdowns by subtracting 1 from a React state inside `setInterval` (leads to clock drift and battery drain).
- **Required Pattern**: Store `turnStartTime` (timestamp in milliseconds) on the game session. Calculate remaining time by comparing `Date.now() - session.turnStartTime`:
  ```ts
  const elapsed = Math.floor((Date.now() - gameSession.turnStartTime) / 1000);
  const remaining = Math.max(0, turnDuration - elapsed);
  ```
- Always clear intervals in cleanup callbacks when turns end or components unmount.

### 4.4 Mobile Touch & Interaction Hygiene
- **No Tap Delay**: Tap highlight is removed globally (`-webkit-tap-highlight-color: transparent`).
- **Prevent Scroll Bounce / Pull-to-Refresh**:
  ```css
  body {
    overscroll-behavior-y: contain;
    user-select: none;
    -webkit-user-select: none;
  }
  ```
- Inputs and textareas must re-enable text selection: `input, textarea { user-select: text; }`.

### 4.5 Android 15+ Edge-to-Edge & Safe Area Insets
- `capacitor.config.ts` enforces `adjustMarginsForEdgeToEdge: 'auto'` to properly adapt to Android 15's mandatory edge-to-edge windowing.
- In `index.html` and CSS:
  ```css
  :root {
    --safe-area-top: env(safe-area-inset-top);
    --safe-area-bottom: env(safe-area-inset-bottom);
  }
  ```
  Ensure interactive buttons and headers respect safe area boundaries (`viewport-fit=cover`).

---

## 5. Code Generation & Output Standards

### 5.1 Strict TypeScript & Typings
- All new features and models must be typed in `types.ts`.
- Avoid `any` types. If dynamic index access requires casting, explicitly document why and guard the access.
- Correctly type Capacitor plugin listener promises:
  ```ts
  // Proper listener cleanup pattern
  useEffect(() => {
    let listenerHandle: PluginListenerHandle | undefined;
    const setup = async () => {
      listenerHandle = await AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
        onAdClosed();
      });
    };
    setup();
    return () => {
      listenerHandle?.remove();
    };
  }, [onAdClosed]);
  ```

### 5.2 AdMob Integration & Anti-Freeze Protections
- **Pre-loading Rule**: Interstitial ads must be pre-loaded with `AdMob.prepareInterstitial()` before `AdMob.showInterstitial()` is called.
- **Fail-Safe Requirement**: Never let an ad failure trap the user. If an ad fails to load, fails to prepare, or throws an error, the `onAdClosed()` / `continueRematch()` callback **must execute immediately** to allow gameplay to proceed without hanging.

### 5.3 Error Boundary & Resilience
- All top-level UI trees are wrapped with `ErrorBoundary`.
- Components should never throw uncaught exceptions on missing data. Always handle:
  - Network disconnect / offline state.
  - `gameSession` momentarily null during navigation.
  - Unknown player IDs or empty word arrays.

### 5.4 Component File Size & Modularity
- Keep components focused and under ~300-400 lines where possible.
- Extract complex modal sheets and overlays into dedicated components inside `components/`.
- Maintain consistent PascalCase for components (`CardDrawScreen.tsx`) and camelCase for utilities (`turnLogic.ts`).

---

## 6. Verification Checklist for Changes

Before finalizing any modifications to this repository, verify:
1. **React 19 Hydration**: Did you avoid adding `<script>` tags or raw DOM modifications to `index.html`?
2. **Capacitor Safety**: Are native plugin calls safely guarded or abstracted through `nativeUtils.ts`?
3. **Atomic State**: Did you use `runGameTransaction` for all multiplayer state mutations instead of raw `set()`?
4. **Subscription Cleanup**: Are all `onValue`, `setInterval`, and event listeners cleaned up in returns?
5. **RTL & Languages**: Does the UI layout preserve alignment and legibility in Hebrew/Arabic?
6. **Mobile Build**: If native functionality was affected, did you verify with `npm run build && npx cap sync android`?
