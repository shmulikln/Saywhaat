import { triggerHaptic } from './nativeUtils';

// --- Web Audio API Engine & Decoded Audio Buffer Cache ---
let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

// Resolved sound URL: always resolves to domain root (/sounds/...)
// to prevent sub-route resolution bugs (e.g. /turn/sounds/...) on mobile WebViews
export const getSoundUrl = (fileName: string): string => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/sounds/${fileName}`;
  }
  return `/sounds/${fileName}`;
};

// Memory cache of pre-decoded raw PCM buffers for zero-latency, overlapping playback
const audioBuffers: Record<string, AudioBuffer | null> = {};
const loadingPromises: Record<string, Promise<AudioBuffer | null>> = {};

const loadAudioBuffer = async (key: string, fileName: string): Promise<AudioBuffer | null> => {
  if (audioBuffers[key]) return audioBuffers[key];
  if (loadingPromises[key]) return loadingPromises[key];

  const ctx = getAudioContext();
  if (!ctx) return null;

  loadingPromises[key] = (async () => {
    try {
      const url = getSoundUrl(fileName);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const arrayBuffer = await res.arrayBuffer();
      const decoded = await ctx.decodeAudioData(arrayBuffer);
      audioBuffers[key] = decoded;
      return decoded;
    } catch (e) {
      console.warn(`[SoundUtils] WebAudio buffer load failed for ${fileName}, will use HTML5 fallback:`, e);
      return null;
    }
  })();

  return loadingPromises[key];
};

/**
 * Preloads and decodes all sound assets into memory.
 * Call this early or on user gestures to ensure instantaneous, reliable audio.
 */
export const preloadAllSounds = () => {
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    loadAudioBuffer('right-answer', 'right-answer.mp3');
    loadAudioBuffer('airhorn', 'airhorn.mp3');
    loadAudioBuffer('turnended', 'turnended.mp3');
    loadAudioBuffer('10sectoend', '10sectoend.mp3');
  } catch (e) {}
};

// Auto-unlock audio and pre-decode on the first user interaction anywhere in the app
if (typeof window !== 'undefined') {
  const unlock = () => {
    preloadAllSounds();
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('touchstart', unlock);
    window.removeEventListener('click', unlock);
  };
  window.addEventListener('pointerdown', unlock, { passive: true, once: true });
  window.addEventListener('touchstart', unlock, { passive: true, once: true });
  window.addEventListener('click', unlock, { passive: true, once: true });
  // Start preloading immediately as well
  setTimeout(preloadAllSounds, 300);
}

const playBuffer = (buffer: AudioBuffer, volume = 1.0, loop = false): AudioBufferSourceNode | null => {
  const ctx = getAudioContext();
  if (!ctx) return null;
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = loop;
  const gain = ctx.createGain();
  gain.gain.value = volume;
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start(0);
  return source;
};

// --- HTML5 Audio Element Fallbacks ---
let countdownAudio: HTMLAudioElement | null = null;
let turnEndedAudio: HTMLAudioElement | null = null;
let airhornAudio: HTMLAudioElement | null = null;
let rightAnswerAudio: HTMLAudioElement | null = null;
let activeCountdownSource: AudioBufferSourceNode | null = null;

const getCountdownAudio = (): HTMLAudioElement | null => {
  if (typeof window === 'undefined') return null;
  if (!countdownAudio) {
    countdownAudio = new Audio(getSoundUrl('10sectoend.mp3'));
    countdownAudio.loop = true;
    countdownAudio.preload = 'auto';
  }
  return countdownAudio;
};

const getTurnEndedAudio = (): HTMLAudioElement | null => {
  if (typeof window === 'undefined') return null;
  if (!turnEndedAudio) {
    turnEndedAudio = new Audio(getSoundUrl('turnended.mp3'));
    turnEndedAudio.loop = false;
    turnEndedAudio.preload = 'auto';
  }
  return turnEndedAudio;
};

const getAirhornAudio = (): HTMLAudioElement | null => {
  if (typeof window === 'undefined') return null;
  if (!airhornAudio) {
    airhornAudio = new Audio(getSoundUrl('airhorn.mp3'));
    airhornAudio.loop = false;
    airhornAudio.preload = 'auto';
  }
  return airhornAudio;
};

const getRightAnswerAudio = (): HTMLAudioElement | null => {
  if (typeof window === 'undefined') return null;
  if (!rightAnswerAudio) {
    rightAnswerAudio = new Audio(getSoundUrl('right-answer.mp3'));
    rightAnswerAudio.loop = false;
    rightAnswerAudio.preload = 'auto';
  }
  return rightAnswerAudio;
};

// --- Public Sound Trigger Functions ---

/**
 * Starts playing the 10-second countdown sound (repeats/loops until stopped).
 */
export const start10SecCountdownSound = () => {
  try {
    stop10SecCountdownSound();
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // 1. Web Audio Buffer (immune to autoplay restrictions once context is running)
    if (audioBuffers['10sectoend']) {
      activeCountdownSource = playBuffer(audioBuffers['10sectoend'], 1.0, true);
      return;
    }

    // 2. HTML5 Audio instance fallback
    const audio = getCountdownAudio();
    if (audio) {
      audio.currentTime = 0;
      audio.loop = true;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          playTickSound(true);
        });
      }
    } else {
      playTickSound(true);
    }
  } catch (e) {
    playTickSound(true);
  }
};

/**
 * Stops the 10-second countdown sound immediately.
 */
export const stop10SecCountdownSound = () => {
  try {
    if (activeCountdownSource) {
      activeCountdownSource.stop();
      activeCountdownSource.disconnect();
      activeCountdownSource = null;
    }
    const audio = getCountdownAudio();
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  } catch (e) {}
};

/**
 * Plays the turn ended sound once (and stops the 10-sec countdown).
 */
export const playTurnEndedSound = () => {
  try {
    stop10SecCountdownSound();
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // 1. Web Audio Buffer
    if (audioBuffers['turnended']) {
      playBuffer(audioBuffers['turnended'], 1.0, false);
      triggerHaptic('WARNING');
      return;
    }

    // 2. HTML5 Audio fallback
    const audio = getTurnEndedAudio();
    if (audio) {
      audio.currentTime = 0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          playBuzzerSound();
        });
      }
    } else {
      playBuzzerSound();
    }
    triggerHaptic('WARNING');
  } catch (e) {
    playBuzzerSound();
  }
};

/**
 * Plays the right answer sound when guessing a word correctly.
 */
export const playSuccessSound = () => {
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // 1. Web Audio Buffer (Zero latency, overlaps cleanly on rapid taps)
    if (audioBuffers['right-answer']) {
      playBuffer(audioBuffers['right-answer'], 1.0, false);
      return;
    }

    // 2. HTML5 Audio fallback
    const audio = getRightAnswerAudio();
    if (audio) {
      audio.currentTime = 0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          playFallbackSuccessSynth();
        });
      }
    } else {
      playFallbackSuccessSynth();
    }
  } catch (e) {
    playFallbackSuccessSynth();
  }
};

/**
 * Plays the stadium air horn when the other team steals a word in Teams mode.
 */
export const playHornSound = () => {
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // 1. Web Audio Buffer
    if (audioBuffers['airhorn']) {
      playBuffer(audioBuffers['airhorn'], 1.0, false);
      triggerHaptic('MEDIUM');
      return;
    }

    // 2. HTML5 Audio fallback
    const audio = getAirhornAudio();
    if (audio) {
      audio.currentTime = 0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          playFallbackHornSound();
        });
      }
    } else {
      playFallbackHornSound();
    }
    triggerHaptic('MEDIUM');
  } catch (e) {
    playFallbackHornSound();
  }
};

// --- Synthesized Audio Effects & Fallbacks ---

export const playTickSound = (isUrgent = false) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = isUrgent ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(isUrgent ? 1100 : 750, ctx.currentTime);
    if (isUrgent) {
      osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.06);
    }

    gain.gain.setValueAtTime(isUrgent ? 0.35 : 0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (isUrgent ? 0.09 : 0.05));

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + (isUrgent ? 0.09 : 0.05));

    if (isUrgent) {
      triggerHaptic('LIGHT');
    }
  } catch (e) {}
};

export const playBuzzerSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';

    osc1.frequency.setValueAtTime(180, ctx.currentTime);
    osc2.frequency.setValueAtTime(230, ctx.currentTime);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.45);
    osc2.stop(ctx.currentTime + 0.45);

    triggerHaptic('WARNING');
  } catch (e) {}
};

export const playFallbackSuccessSynth = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [587.33, 880];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

      gain.gain.setValueAtTime(0.25, ctx.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.08);
      osc.stop(ctx.currentTime + idx * 0.08 + 0.18);
    });
  } catch (e) {}
};

export const playSkipSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(260, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (e) {}
};

export const playFallbackHornSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const freqs = [233.08, 293.66, 349.23, 466.16];

    freqs.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.linearRampToValueAtTime(freq * 1.01, now + 0.04);
      osc.frequency.linearRampToValueAtTime(freq * 0.97, now + 0.35);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.02);
      gain.gain.setValueAtTime(0.18, now + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.38);
    });

    triggerHaptic('MEDIUM');
  } catch (e) {}
};
