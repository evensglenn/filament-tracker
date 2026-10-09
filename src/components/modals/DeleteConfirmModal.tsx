import { Trash2 } from 'lucide-react';
import { Modal } from '../ui/Modal';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmModal({ isOpen, onCancel, onConfirm }: DeleteConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden p-8 text-center">
      <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <Trash2 size={32} />
      </div>
      <h3 className="text-xl font-bold mb-2">Weet je het zeker?</h3>
      <p className="text-gray-500 mb-8">Dit filament wordt definitief verwijderd uit je voorraad. Dit kan niet ongedaan worden gemaakt.</p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all active:scale-95"
        >
          Annuleer
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-red-100"
        >
          Verwijder
        </button>
      </div>
    </Modal>
  );
}
