import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTransitionNavigate } from '../utils/navigationUtils';
import { useTranslations } from '../contexts/TranslationsContext';
import { Language } from '../types';
import { APP_VERSION, AVAILABLE_LANGUAGES } from '../constants';
import AppHeader from './AppHeader';
import { triggerHaptic } from '../utils/nativeUtils';

const WelcomeScreen: React.FC = () => {
  const navigate = useTransitionNavigate();
  const { t, setLanguage, language } = useTranslations();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);

  // Tutorial Video URL (Uses new tutorial.mp4)
  const base = (import.meta as any).env?.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const videoUrl = `${cleanBase}tutorial.mp4`;
  
  const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
  
  const getYouTubeEmbedUrl = (url: string) => {
    let videoId = '';
    if (url.includes('v=')) {
      videoId = url.split('v=')[1].split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0];
    }
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0&showinfo=0`;
  };

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (showTutorial && !isYouTube && videoRef.current) {
      const video = videoRef.current;
      setVideoError(false);
      setIsVideoLoading(true);
      video.load();

      const playAndGoFullscreen = async () => {
        try {
          await video.play();
          if (video.requestFullscreen) {
            await video.requestFullscreen();
          } else if ((video as any).webkitRequestFullscreen) { // Safari
            await (video as any).webkitRequestFullscreen();
          } else if ((video as any).msRequestFullscreen) { // IE11
            await (video as any).msRequestFullscreen();
          }
        } catch (error) {
          console.warn("Autoplay or fullscreen request failed:", error);
          // If autoplay fails, at least the controls are there for the user.
          setIsVideoLoading(false);
        }
      };

      const playTimer = setTimeout(playAndGoFullscreen, 300);

      // When the user exits fullscreen, close the tutorial overlay
      const handleFullscreenChange = () => {
        if (
          !document.fullscreenElement &&
          !(document as any).webkitIsFullScreen && // Safari
          !(document as any).mozFullScreen && // Firefox
          !(document as any).msFullscreenElement // IE11
        ) {
          setShowTutorial(false);
        }
      };
      
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      document.addEventListener('webkitfullscreenchange', handleFullscreenChange); // Safari
      document.addEventListener('mozfullscreenchange', handleFullscreenChange); // Firefox
      document.addEventListener('MSFullscreenChange', handleFullscreenChange); // IE11


      return () => {
        clearTimeout(playTimer);
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
        document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
        document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      };
    }
  }, [showTutorial, isYouTube, videoUrl]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    setDeferredPrompt(null);
  };

  const handleOnlineSelection = (tab: 'create' | 'join') => {
    navigate('/setup', { state: { intent: tab } });
  };

  const currentLangObj = AVAILABLE_LANGUAGES.find(l => l.value === language) || AVAILABLE_LANGUAGES[0];

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-4 pt-safe-top sm:p-6 sm:pt-safe-top relative overflow-x-hidden">
      {/* Top 45% of page: Logo */}
      <AppHeader size="hero" />
      
      {/* Lower section: Controls and Action Buttons */}
      <div className="w-full max-w-sm flex flex-col items-center animate-fade-in mb-auto">
        {/* Top Controls: Tutorial & Language Dropdown */}
        <div dir="ltr" className="w-full max-w-[340px] flex items-center justify-between mb-6 px-1 relative">
           <button
             id="howToPlayBtn"
             onClick={() => { setShowTutorial(true); setVideoError(false); setIsVideoLoading(true); }}
             className="flex items-center gap-2 text-xs font-black uppercase tracking-wider bg-white/15 hover:bg-white/25 text-white px-4 py-2.5 rounded-full transition-all border border-white/20 backdrop-blur-md shadow-md active:scale-95"
           >
             <span className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center -ml-0.5">
               <svg className="w-2.5 h-2.5 text-white fill-current translate-x-[0.5px]" viewBox="0 0 24 24">
                 <path d="M8 5v14l11-7z"/>
               </svg>
             </span>
             {t('howToPlayButton')}
           </button>

           {/* Custom Language Dropdown */}
           <div className="relative" ref={langMenuRef}>
             <button 
               onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
               className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white px-4 py-2.5 rounded-full border border-white/20 backdrop-blur-md shadow-md transition-all active:scale-95"
             >
               <span className="text-xs font-black uppercase tracking-wider text-white">
                 {language === Language.EN ? 'GB' : language.toUpperCase()}
               </span>
               <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 text-white/80 transition-transform duration-200 ${isLangMenuOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                 <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
               </svg>
             </button>

             {isLangMenuOpen && (
               <div className="absolute right-0 mt-2 w-48 bg-[#4c1d95]/90 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl z-[110] overflow-hidden animate-word-snap">
                 <div className="py-1">
                   {AVAILABLE_LANGUAGES.map((lang) => (
                     <button
                       key={lang.value}
                       onClick={() => {
                         setLanguage(lang.value);
                         setIsLangMenuOpen(false);
                       }}
                       className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-left transition-colors ${language === lang.value ? 'bg-white/20 text-[#FBBF24]' : 'text-white hover:bg-white/10'}`}
                     >
                       <span className="text-xl">{lang.flag}</span>
                       <span className="flex-grow">{lang.label}</span>
                       {language === lang.value && (
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#FBBF24]" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                         </svg>
                       )}
                     </button>
                   ))}
                 </div>
               </div>
             )}
           </div>
        </div>

        {/* Action Buttons Stack - Tactile 3D Capsule Buttons */}
        <div className="flex flex-col items-center gap-5 w-full">
          {/* Create New Game Button */}
          <button
            onClick={() => {
              triggerHaptic('LIGHT');
              handleOnlineSelection('create');
            }}
            className="action-capsule-btn action-capsule-btn-create"
          >
            <span className="action-capsule-text">
              {t('createGameTitle')}
            </span>
          </button>

          {/* Join a Game Button */}
          <button
            onClick={() => {
              triggerHaptic('LIGHT');
              handleOnlineSelection('join');
            }}
            className="action-capsule-btn action-capsule-btn-join"
          >
            <span className="action-capsule-text">
              {t('joinGameTitle')}
            </span>
          </button>
        </div>

        {/* Install App Link */}
        {deferredPrompt && (
          <button
            onClick={handleInstallClick}
            className="mt-6 mx-auto flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-300 hover:text-white transition-colors py-2 px-4 rounded-full border border-indigo-500/30 bg-indigo-500/10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {t('installApp')}
          </button>
        )}
      </div>
      
      {/* Footer Info (50% smaller) */}
      <div className="w-full text-center py-3 mt-auto">
        <a href="/privacypolicy.html" target="_blank" rel="noopener noreferrer" className="text-[6px] sm:text-[7px] font-bold tracking-[0.25em] text-white/40 hover:text-white uppercase transition-opacity">
          Privacy Policy
        </a>
      </div>

      {/* Tutorial Overlay */}
      {showTutorial && (
        <div 
          className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowTutorial(false)}
        >
          <div className="w-full max-w-md flex flex-col gap-3" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-4">
               <h3 className="text-white/80 font-black uppercase tracking-[0.4em] text-xs">How to Play</h3>
               <button 
                 onClick={() => setShowTutorial(false)}
                 className="text-white bg-white/10 hover:bg-white/20 p-2 rounded-full border border-white/20 transition-all active:scale-90 cursor-pointer"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
            </div>
            
            <div className="w-full h-[74vh] max-h-[680px] bg-black rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] ring-1 ring-white/10 relative flex items-center justify-center">
              {isVideoLoading && !videoError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 bg-black/50 z-10">
                  <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full mb-4"></div>
                  <p className="text-[10px] font-black tracking-widest uppercase">Loading Video...</p>
                </div>
              )}

              {videoError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 bg-black/50 z-10 p-6 text-center">
                  <p className="text-sm font-bold mb-4">Player encounterd an error.</p>
                  <a 
                    href={videoUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-indigo-600 text-white px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg active:scale-95"
                  >
                    Open Video Manually
                  </a>
                </div>
              )}

              {isYouTube ? (
                <iframe
                  className="w-full h-full"
                  src={getYouTubeEmbedUrl(videoUrl)}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  onLoad={() => setIsVideoLoading(false)}
                ></iframe>
              ) : (
                <video 
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full h-full object-contain"
                  controls
                  playsInline
                  autoPlay
                  preload="auto"
                  onLoadedData={() => setIsVideoLoading(false)}
                  onCanPlay={() => setIsVideoLoading(false)}
                  onWaiting={() => setIsVideoLoading(true)}
                  onPlaying={() => setIsVideoLoading(false)}
                  onError={(e) => { 
                    console.error("Video Error Event:", e);
                    setIsVideoLoading(false);
                    setVideoError(true);
                  }}
                >
                    Your browser does not support the video tag.
                </video>
              )}
            </div>
            
            {!isYouTube && (
              <div className="text-center">
                <a 
                  href={videoUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[9px] text-white/30 uppercase tracking-widest hover:text-white/60 transition-colors"
                >
                  Direct Link: Tutorial Video
                </a>
              </div>
            )}
          </div>
          <div className="mt-8 text-white/20 text-[10px] font-black tracking-[0.5em] uppercase pointer-events-none">
            Tap outside to return
          </div>
        </div>
      )}
    </div>
  );
};

export default WelcomeScreen;