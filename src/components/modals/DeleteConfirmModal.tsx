import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Modal } from '../ui/Modal';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteConfirmModal({ isOpen, onCancel, onConfirm }: DeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const confirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onCancel} className="sm:max-w-sm">
      <div className="p-6 sm:p-8 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center">
        <div className="w-14 h-14 bg-danger-soft text-danger rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 size={26} />
        </div>
        <h3 className="text-xl font-bold mb-2">Weet je het zeker?</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Dit filament wordt definitief verwijderd uit je voorraad. Dit kan niet ongedaan worden gemaakt.</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-5 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-[0.98]"
          >
            Annuleer
          </button>
          <button
            onClick={confirm}
            disabled={isDeleting}
            className="flex-1 px-5 py-3 bg-danger-fill text-white font-bold rounded-xl hover:bg-danger-strong transition-all active:scale-[0.98] disabled:opacity-50"
          >
            Verwijder
          </button>
        </div>
      </div>
    </Modal>
  );
}
