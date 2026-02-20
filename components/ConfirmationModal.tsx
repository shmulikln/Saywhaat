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
        <div className="flex justify-center gap-4">
            <button
              onClick={onCancel}
              className="flex-1 bg-slate-600/80 hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-md transition-transform transform hover:scale-105"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-md transition-transform transform hover:scale-105"
            >
              {confirmText}
            </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
