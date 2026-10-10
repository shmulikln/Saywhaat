import React, { useState, useEffect } from 'react';
import { AdMob, AdOptions, InterstitialAdPluginEvents } from '@capacitor-community/admob';

interface AdOverlayProps {
  onAdClosed: () => void;
}

const AdOverlay: React.FC<AdOverlayProps> = ({ onAdClosed }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const showAd = async () => {
      try {
        await AdMob.prepareInterstitial({
          adId: 'ca-app-pub-7599308880531325/6231560290',
          isTesting: true,
        });
        setIsLoading(false);
        await AdMob.showInterstitial();
      } catch (e) {
        console.error("AD LOG: Show failed", e);
        setError('Ad failed to load');
        onAdClosed();
      }
    };

    const adClosedListener = AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
      onAdClosed();
    });

    showAd();

    return () => {
      adClosedListener.remove();
    };
  }, [onAdClosed]);

  if (error) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="text-white">Loading Ad...</div>
      </div>
    );
  }

  return null;
};

export default AdOverlay;
