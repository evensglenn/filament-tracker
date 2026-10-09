import { LayoutGrid } from 'lucide-react';
import { Filament } from '../../types';
import { formatSpoolsWithUnit } from '../../utils/filaments';
import { Modal, ModalHeader } from '../ui/Modal';
import { ColorSwatch } from '../ui/ColorSwatch';

interface OverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  filaments: Filament[];
}

/** Compact, screenshot-friendly overview of the currently filtered filaments. */
export function OverviewModal({ isOpen, onClose, filaments }: OverviewModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="sm:max-w-4xl">
      <ModalHeader
        title="Overzicht"
        subtitle={`${filaments.length} ${filaments.length === 1 ? 'kleur' : 'kleuren'}`}
        icon={<LayoutGrid size={20} />}
        onClose={onClose}
      />

      <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-gray-50 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3">
          {filaments.map(f => (
            <div key={f.id} className="bg-white p-3 rounded-xl border border-gray-200 flex flex-col items-center text-center gap-2">
              <ColorSwatch hex={f.colorHex} name={f.colorName} className="w-10 h-10" />
              <div className="min-w-0 w-full">
                <p className="text-xs font-bold text-gray-900 leading-tight line-clamp-2">{f.colorName}</p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{f.typeName}</p>
                <p className="text-xs text-gray-400 truncate">{formatSpoolsWithUnit(f.spools)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
