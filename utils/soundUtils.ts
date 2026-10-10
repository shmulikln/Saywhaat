import { triggerHaptic } from './nativeUtils';

let countdownAudio: HTMLAudioElement | null = null;
let turnEndedAudio: HTMLAudioElement | null = null;

const getSoundUrl = (fileName: string): string => {
  const base = (import.meta as any).env?.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  return `${cleanBase}sounds/${fileName}`;
};

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

/**
 * Starts playing the 10-second countdown sound (repeats/loops until stopped).
 */
export const start10SecCountdownSound = () => {
  try {
    const audio = getCountdownAudio();
    if (audio) {
      audio.currentTime = 0;
      audio.loop = true;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Fallback if browser blocked unmuted autoplay
          playTickSound(true);
        });
      }
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

// --- Fallback & Feedback Sound Effects ---

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

export const playSuccessSound = () => {
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
