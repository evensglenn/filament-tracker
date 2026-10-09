import { LogOut, Settings } from 'lucide-react';
import { UserConfig } from '../../types';
import { ConfigActions } from '../../hooks/useUserConfig';
import { Modal, ModalFooter, ModalHeader } from '../ui/Modal';
import { TypeSettings } from './TypeSettings';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: UserConfig | null;
  configActions: ConfigActions;
  typeUsage: Map<string, number>;
  userEmail: string | null;
  onLogout: () => void;
}

export function SettingsModal({ isOpen, onClose: close, config, configActions, typeUsage, userEmail, onLogout }: SettingsModalProps) {
  const onClose = () => {
    configActions.flush();
    close();
  };

  return (
    <Modal isOpen={isOpen && config !== null} onClose={onClose} zIndex="z-[70]" className="sm:max-w-2xl">
      <ModalHeader title="Instellingen" subtitle="Types, kleuren en je account" icon={<Settings size={20} />} onClose={onClose} />

      <div className="px-5 sm:px-6 py-5 overflow-y-auto flex-1 space-y-8">
        {config && <TypeSettings types={config.types} usage={typeUsage} actions={configActions} />}

        <section>
          <h3 className="font-bold text-gray-900 mb-3">Account</h3>
          <div className="flex items-center justify-between gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-200">
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Ingelogd als</p>
              <p className="text-sm font-semibold text-gray-900 truncate">{userEmail}</p>
            </div>
            <button
              onClick={() => { onClose(); onLogout(); }}
              className="h-10 px-3.5 flex items-center gap-2 text-sm font-semibold text-danger bg-white border border-gray-200 rounded-xl hover:bg-danger-soft hover:border-danger-light transition-colors shrink-0"
            >
              <LogOut size={16} />
              Uitloggen
            </button>
          </div>
        </section>
      </div>

      <ModalFooter>
        <button
          onClick={onClose}
          className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all active:scale-[0.98]"
        >
          Klaar
        </button>
      </ModalFooter>
    </Modal>
  );
}
