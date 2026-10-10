import React from 'react';
import Modal from './Modal';

interface ConfirmationModalProps {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ title, message, confirmText, cancelText, onConfirm, onCancel }) => {
  return (
    <Modal title={title} onClose={onCancel}>
      <div className="text-center p-4">
        <p className="text-slate-200 mb-8">
          {message}
        </p>
        <div className="flex justify-center gap-3">
            <button
              onClick={onCancel}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white font-black uppercase tracking-wider py-3.5 px-6 rounded-full border border-white/20 active:scale-95 transition-all text-sm"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 bg-[#FBBF24] hover:bg-[#F59E0B] text-[#4c1d95] font-black uppercase tracking-wider py-3.5 px-6 rounded-full shadow-[0_4px_20px_rgba(251,191,36,0.35)] active:scale-95 transition-all text-sm"
            >
              {confirmText}
            </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
