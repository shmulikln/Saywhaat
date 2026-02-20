import React from 'react';
import { useGame } from '../contexts/GameSessionContext';
import { useTranslations } from '../contexts/TranslationsContext';
import { LoadingStep } from '../types';

const SpinnerIcon = React.memo(() => (
  <svg className="animate-spin h-6 w-6 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
));

const CheckIcon = React.memo(() => (
  <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
  </svg>
));

const PendingIcon = React.memo(() => (
    <div className="h-6 w-6 flex items-center justify-center">
        <div className="h-2 w-2 rounded-full bg-slate-500"></div>
    </div>
));

const ErrorIcon = React.memo(() => (
    <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
    </svg>
));

const LoadingStepRow: React.FC<{ step: LoadingStep }> = ({ step }) => {
    const { t } = useTranslations();
    
    const getIcon = () => {
        switch (step.status) {
            case 'completed': return <CheckIcon />;
            case 'in-progress': return <SpinnerIcon />;
            case 'failed': return <ErrorIcon />;
            case 'pending':
            default: return <PendingIcon />;
        }
    };

    return (
        <div className="flex items-center p-2 bg-black/10 rounded-md">
            <div className="w-6 h-6 me-4 flex items-center justify-center flex-shrink-0">
                {getIcon()}
            </div>
            <span className={`transition-colors duration-300 ${
                step.status === 'pending' ? 'text-slate-400' : 'text-slate-100'
            } ${
                step.status === 'failed' ? 'font-semibold text-red-300' : ''
            }`}>
                {t(step.key)}
            </span>
        </div>
    );
};

const LoadingScreen: React.FC = () => {
  const { loadingTitle, loadingSteps, resetLoadingState } = useGame();
  const { t } = useTranslations();
  
  const title = loadingTitle || t('getReady') + '...';
  const hasFailedStep = loadingSteps.some(step => step.status === 'failed');

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-sm bg-slate-800/90 p-6 sm:p-8 rounded-xl shadow-2xl border border-white/20 text-center">
        <h2 className="text-2xl font-semibold mb-6 text-white">{title}</h2>
        
        {loadingSteps.length > 0 ? (
            <div className="space-y-3">
                {loadingSteps.map(step => <LoadingStepRow key={step.key} step={step} />)}
            </div>
        ) : (
            <div className="flex justify-center">
                <SpinnerIcon />
            </div>
        )}

        {hasFailedStep && (
            <div className="mt-6 pt-4 border-t border-white/20">
                <button 
                    onClick={resetLoadingState}
                    className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-md transition-colors"
                >
                    {t('tryAgainButton')}
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default LoadingScreen;