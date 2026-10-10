import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Location } from 'react-router-dom';

interface ScreenTransitionProps {
  children: (activeLocation: Location) => React.ReactNode;
}

const ScreenTransition: React.FC<ScreenTransitionProps> = ({ children }) => {
  const location = useLocation();
  const [displayedLocation, setDisplayedLocation] = useState<Location>(location);
  const [stage, setStage] = useState<'idle' | 'fade-out' | 'fade-in'>('idle');
  const timerRef = useRef<number | null>(null);

  // Keep reference to latest requested location to avoid stale closures
  const latestLocationRef = useRef<Location>(location);
  latestLocationRef.current = location;

  useEffect(() => {
    // Only transition when the screen path actually changes
    if (location.pathname !== displayedLocation.pathname) {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }

      // 1. Quick soft fade out of the current screen
      setStage('fade-out');

      // 2. Switch to the next screen and softly fade it in
      timerRef.current = window.setTimeout(() => {
        window.scrollTo(0, 0);
        setDisplayedLocation(latestLocationRef.current);
        setStage('fade-in');

        // 3. Complete transition, return to idle
        timerRef.current = window.setTimeout(() => {
          setStage('idle');
          timerRef.current = null;
        }, 220);
      }, 160);
    } else if (
      location.search !== displayedLocation.search ||
      location.hash !== displayedLocation.hash ||
      location.key !== displayedLocation.key ||
      location.state !== displayedLocation.state
    ) {
      // Same path but state/search changed (e.g. cleared location.state) -> update immediately
      setDisplayedLocation(location);
    }
  }, [location, displayedLocation]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const animationClass =
    stage === 'fade-out'
      ? 'animate-screen-fade-out'
      : stage === 'fade-in'
      ? 'animate-screen-fade-in'
      : '';

  return (
    <div className={`w-full flex-grow flex flex-col ${animationClass}`}>
      {children(displayedLocation)}
    </div>
  );
};

export default ScreenTransition;
