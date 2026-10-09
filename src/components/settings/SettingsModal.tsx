import { X } from 'lucide-react';
import { UserConfig } from '../../types';
import { ConfigActions } from '../../hooks/useUserConfig';
import { Modal } from '../ui/Modal';
import { SharingSettings } from './SharingSettings';
import { TypeSettings } from './TypeSettings';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: UserConfig | null;
  configActions: ConfigActions;
  sharedEmails: string[];
  onAddShare: (email: string) => void;
  onRemoveShare: (email: string) => void;
}

export function SettingsModal({ isOpen, onClose, config, configActions, sharedEmails, onAddShare, onRemoveShare }: SettingsModalProps) {
  return (
    <Modal
      isOpen={isOpen && config !== null}
      onClose={onClose}
      zIndex="z-[70]"
      className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
    >
      <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
        <div>
          <h2 className="text-xl font-bold">Instellingen</h2>
          <p className="text-sm text-gray-500">Beheer je account en collectie</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="p-6 overflow-y-auto flex-1 space-y-10">
        <SharingSettings sharedEmails={sharedEmails} onAdd={onAddShare} onRemove={onRemoveShare} />
        {config && <TypeSettings types={config.types} actions={configActions} />}
      </div>

      <div className="p-6 bg-gray-50 border-t border-gray-100">
        <button
          onClick={onClose}
          className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all active:scale-95"
        >
          Klaar
        </button>
      </div>
    </Modal>
  );
}
