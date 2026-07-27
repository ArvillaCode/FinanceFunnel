import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm">
      <div className="flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-full bg-[#080C14] border border-[#00E5FF]/40 text-[#00E5FF] flex items-center justify-center mb-4 uf-glow-sm">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-[#FFFFFF] mb-2">
          {title}
        </h3>
        <p className="text-sm text-[#94A3B8] mb-6">
          {description}
        </p>

        <div className="flex items-center justify-end gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-[#94A3B8]/30 text-[#94A3B8] font-bold text-sm hover:text-[#FFFFFF] transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm bg-[#00E5FF] text-[#080C14] hover:bg-[#00E5FF]/90 transition-colors uf-glow-sm"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
