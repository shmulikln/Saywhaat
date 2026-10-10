
import React, { useState } from 'react';

interface ModalProps {
  title: string;
  onClose: () => void;
  isClosing?: boolean;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ title, onClose, isClosing: externalClosing, children }) => {
  const [internalClosing, setInternalClosing] = useState(false);
  const isClosing = externalClosing || internalClosing;

  const handleClose = () => {
    if (isClosing) return;
    setInternalClosing(true);
    setTimeout(() => {
      onClose();
    }, 220);
  };

  return (
    <div 
      className={`fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 ${
        isClosing ? 'animate-modal-backdrop-exit' : 'animate-modal-backdrop-enter'
      }`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className={`w-full max-w-md bg-gradient-to-b from-[#2e1065]/95 to-[#1e1b4b]/95 backdrop-blur-xl p-6 sm:p-7 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.6)] border border-white/20 text-white ${
          isClosing ? 'animate-modal-exit' : 'animate-modal-enter'
        }`}
        onClick={e => e.stopPropagation()} // Prevent clicks inside the modal from closing it
      >
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-white/10">
          <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 ltr:text-left rtl:text-right">
            {title}
          </h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white text-xl transition-colors shrink-0"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

export default Modal;