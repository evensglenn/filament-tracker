import { Settings } from 'lucide-react';
import { Filament } from '../../types';
import { Modal, ModalBanner, WIDE_MODAL_CLASS } from '../ui/Modal';
import { SwatchCard, SWATCH_GRID_CLASS } from '../ui/SwatchCard';

interface OverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  filaments: Filament[];
}

/** Compact, screenshot-friendly overview of the currently filtered filaments. */
export function OverviewModal({ isOpen, onClose, filaments }: OverviewModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className={WIDE_MODAL_CLASS}>
      <ModalBanner icon={<Settings size={20} />} title="Overzicht" color="bg-emerald-600" onClose={onClose} />

      <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
        <div className={SWATCH_GRID_CLASS}>
          {filaments.map(f => <SwatchCard key={f.id} filament={f} />)}
        </div>
      </div>
    </Modal>
  );
}
