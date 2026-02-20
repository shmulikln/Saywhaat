
import { Language } from '../types';

/**
 * Checks if the app is running in a Capacitor native wrapper
 */
export const isNative = (): boolean => {
  return (window as any).Capacitor !== undefined;
};

/**
 * Triggers native haptic feedback
 * Patterns: 'SUCCESS' (Heavy impact), 'WARNING' (Double pulse), 'LIGHT' (Taptic)
 */
export const triggerHaptic = async (type: 'SUCCESS' | 'WARNING' | 'LIGHT') => {
  if (!isNative()) return;
  
  try {
    const { Haptics, ImpactStyle } = (window as any).Capacitor.Plugins;
    if (!Haptics) return;

    switch (type) {
      case 'SUCCESS':
        await Haptics.impact({ style: ImpactStyle.Heavy });
        break;
      case 'WARNING':
        await Haptics.notification({ type: 'error' });
        break;
      case 'LIGHT':
        await Haptics.impact({ style: ImpactStyle.Light });
        break;
    }
  } catch (err) {
    console.warn('Native haptics failed', err);
  }
};

/**
 * Native Social Sharing
 */
export const nativeShare = async (title: string, text: string, url: string) => {
  if (!isNative()) {
    if (navigator.share) {
      return navigator.share({ title, text, url });
    }
    return;
  }

  try {
    const { Share } = (window as any).Capacitor.Plugins;
    await Share.share({ title, text, url, dialogTitle: 'Share with friends' });
  } catch (err) {
    console.error('Native share failed', err);
  }
};
