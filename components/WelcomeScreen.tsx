import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslations } from '../contexts/TranslationsContext';
import { Language } from '../types';
import { APP_VERSION, AVAILABLE_LANGUAGES } from '../constants';
import AppHeader from './AppHeader';

const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { t, setLanguage, language } = useTranslations();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);

  // Tutorial Video URLs
  const TUTORIAL_HEB = "https://firebasestorage.googleapis.com/v0/b/saywhaaat.firebasestorage.app/o/tutorials%2FTutorial-Heb.mp4?alt=media&token=00ca21ee-65e3-49ef-9d94-c1ad07392054";
  const TUTORIAL_EN = "https://firebasestorage.googleapis.com/v0/b/saywhaaat.firebasestorage.app/o/tutorials%2FTutorial_En.mp4?alt=media&token=5b4e1c96-81d8-4c92-919c-ee1b3996f890";

  // Select video based on language (Hebrew gets Hebrew, everyone else gets English)
  const videoUrl = language === Language.HE ? TUTORIAL_HEB : TUTORIAL_EN;
  
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
      setVideoError(false);
      setIsVideoLoading(true);
      videoRef.current.load();
      const playTimer = setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().catch(error => {
            console.warn("Autoplay blocked or failed:", error);
            setIsVideoLoading(false);
          });
        }
      }, 300);
      return () => clearTimeout(playTimer);
    }
  }, [showTutorial, isYouTube, videoUrl]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    setDeferredPrompt(null);
  };

  const handleOnlineSelection = (tab: 'create' | 'join') => {
    navigate('/setup', { state: { mode: 'online', defaultTab: tab } });
  };

  const handleLocalSelection = () => {
    navigate('/setup', { state: { mode: 'local' } });
  }

  const currentLangObj = AVAILABLE_LANGUAGES.find(l => l.value === language) || AVAILABLE_LANGUAGES[0];

  return (
    <div className="min-h-screen flex flex-col items-center p-6 relative overflow-x-hidden">
      <AppHeader size="lg" />
      
      <div className="w-full max-w-md flex-grow flex flex-col justify-start animate-fade-in">
        {/* Top Controls: Tutorial & Language Dropdown */}
        <div dir="ltr" className="w-full flex items-center justify-between mb-10 px-2 mt-4 relative">
           <button
             onClick={() => { setShowTutorial(true); setVideoError(false); setIsVideoLoading(true); }}
             className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-full transition-all border border-white/20 backdrop-blur-md shadow-lg active:scale-95"
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-300" viewBox="0 0 20 20" fill="currentColor">
               <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
             </svg>
             {t('howToPlayButton')}
           </button>

           {/* Custom Language Dropdown */}
           <div className="relative" ref={langMenuRef}>
             <button 
               onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
               className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-full border border-white/20 backdrop-blur-md shadow-lg transition-all active:scale-95"
             >
               <span className="text-lg">{currentLangObj.flag}</span>
               <span className="text-xs font-bold uppercase tracking-widest hidden sm:inline">{currentLangObj.label}</span>
               <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-white/50 transition-transform duration-300 ${isLangMenuOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
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

        {/* Action Buttons Stack */}
        <div className="flex flex-col items-center gap-5 w-full">
          {/* Create Game Button */}
          <button
            onClick={() => handleOnlineSelection('create')}
            className="w-full max-w-[320px] group relative flex items-center justify-center bg-gradient-to-r from-indigo-600/40 to-indigo-500/40 backdrop-blur-xl py-4 px-8 rounded-full border border-white/20 hover:border-indigo-300/50 hover:from-indigo-600/60 hover:to-indigo-500/60 transition-all shadow-xl active:scale-95 overflow-hidden"
          >
            <h2 className="text-xl font-bold text-white tracking-tight">{t('createGameTitle')}</h2>
          </button>

          {/* Join Game Button */}
          <button
            onClick={() => handleOnlineSelection('join')}
            className="w-full max-w-[320px] group relative flex items-center justify-center bg-gradient-to-r from-emerald-600/40 to-emerald-500/40 backdrop-blur-xl py-4 px-8 rounded-full border border-white/20 hover:border-emerald-300/50 hover:from-emerald-600/60 hover:to-emerald-500/60 transition-all shadow-xl active:scale-95"
          >
            <h2 className="text-xl font-bold text-white tracking-tight">{t('joinGameTitle')}</h2>
          </button>

          {/* Separator */}
          <div className="flex items-center gap-4 my-2 px-2 w-full max-w-[320px]">
            <div className="flex-grow h-px bg-white/10"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">{t('or')}</span>
            <div className="flex-grow h-px bg-white/10"></div>
          </div>

          {/* Local Play Button */}
          <button
            onClick={handleLocalSelection}
            className="w-full max-w-[320px] group relative flex items-center justify-center bg-white/10 backdrop-blur-xl py-4 px-8 rounded-full border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all shadow-xl active:scale-95"
          >
            <h2 className="text-xl font-bold text-white tracking-tight">{t('playOnOneDevice')}</h2>
          </button>
        </div>

        {/* Install App Link */}
        {deferredPrompt && (
          <button
            onClick={handleInstallClick}
            className="mt-10 mx-auto flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-300 hover:text-white transition-colors py-2 px-4 rounded-full border border-indigo-500/30 bg-indigo-500/10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {t('installApp')}
          </button>
        )}
      </div>
      
      {/* Footer Info */}
      <div className="w-full text-center py-6 opacity-30 select-none pointer-events-none">
        <span className="text-[10px] font-mono font-bold tracking-[0.3em] text-white">{APP_VERSION}</span>
      </div>

      {/* Tutorial Overlay */}
      {showTutorial && (
        <div 
          className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowTutorial(false)}
        >
          <div className="w-full max-w-4xl flex flex-col gap-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-4">
               <h3 className="text-white/80 font-black uppercase tracking-[0.4em] text-xs">How to Play</h3>
               <button 
                 onClick={() => setShowTutorial(false)}
                 className="text-white bg-white/10 hover:bg-white/20 p-2 rounded-full border border-white/20 transition-all active:scale-90"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
            </div>
            
            <div className="w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] ring-1 ring-white/10 relative flex items-center justify-center">
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
                  muted
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