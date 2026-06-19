import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = true,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="organic-card max-w-md w-full p-0 overflow-hidden animate-scale-in flex flex-col shadow-2xl">
        <div className="p-6 flex flex-col items-center text-center">
          <div className={`p-4 rounded-full mb-4 ${isDestructive ? 'bg-alert/10 text-alert' : 'bg-primary/10 text-primary-dark'}`}>
            <AlertTriangle size={32} />
          </div>
          <h3 className="text-xl font-bold text-text-primary mb-2">{title}</h3>
          <p className="text-text-secondary">{message}</p>
        </div>
        <div className="flex border-t border-border bg-background/50">
          <button
            onClick={onClose}
            className="flex-1 py-4 font-medium text-text-secondary hover:bg-background hover:text-text-primary transition-colors border-r border-border"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 py-4 font-bold transition-colors ${
              isDestructive
                ? 'text-alert hover:bg-alert/10'
                : 'text-emerald hover:bg-emerald/10'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
