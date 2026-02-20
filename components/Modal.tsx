
import React from 'react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ title, onClose, children }) => {
  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="w-full max-w-md bg-slate-800/80 backdrop-blur-lg p-6 rounded-xl shadow-2xl border border-white/20"
        onClick={e => e.stopPropagation()} // Prevent clicks inside the modal from closing it
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-white ltr:text-left rtl:text-right">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white text-3xl"
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