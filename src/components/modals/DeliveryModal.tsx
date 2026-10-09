import { useState } from 'react';
import { Minus, PackagePlus, Plus } from 'lucide-react';
import { Filament } from '../../types';
import { filamentService } from '../../services/filamentService';
import { formatWeight } from '../../utils/filaments';
import { ATTENTION, Modal, ModalFooter, ModalHeader, PRIMARY_BUTTON, SECONDARY_BUTTON } from '../ui/Modal';
import { FilamentPicker } from '../ui/FilamentPicker';
import { useShowError } from '../ui/Toast';

const byName = (a: Filament, b: Filament) => a.colorName.localeCompare(b.colorName);

interface DeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  filaments: Filament[];
}

/** Register a delivery: add whole spools to several filaments at once. */
export function DeliveryModal({ isOpen, onClose, filaments }: DeliveryModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="sm:max-w-xl">
      <DeliveryContent onClose={onClose} filaments={filaments} />
    </Modal>
  );
}

function DeliveryContent({ onClose, filaments }: Omit<DeliveryModalProps, 'isOpen'>) {
  const [deliveryQuantities, setDeliveryQuantities] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);
  const showError = useShowError();

  // Each tap adds the filament's delivery weight (a new spool)
  const totalGrams = filaments.reduce((sum, f) => sum + (deliveryQuantities[f.id] || 0) * f.spoolWeight, 0);
  const change = (id: string, delta: number) =>
    setDeliveryQuantities(prev => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) }));

  const handleConfirm = async () => {
    setIsSaving(true);
    try {
      await filamentService.addSpools(deliveryQuantities);
      onClose();
    } catch (error) {
      showError('Levering registreren', error);
      setIsSaving(false);
    }
  };

  return (
    <>
      <ModalHeader
        title="Registreer levering"
        subtitle="Wat kwam er binnen?"
        icon={<PackagePlus size={20} />}
        onClose={onClose}
      />

      <FilamentPicker
        filaments={filaments}
        sort={byName}
        isActive={f => (deliveryQuantities[f.id] || 0) > 0}
        renderDetail={f => {
          const added = deliveryQuantities[f.id] || 0;
          return added > 0
            ? <span className="text-petrol-700 dark:text-petrol-400 font-semibold">{formatWeight(f.remainingGrams)} → {formatWeight(f.remainingGrams + added * f.spoolWeight)}</span>
            : formatWeight(f.remainingGrams);
        }}
        renderControl={f => {
          const pending = deliveryQuantities[f.id] || 0;
          return (
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => change(f.id, -1)}
                disabled={pending === 0}
                aria-label={`${formatWeight(f.spoolWeight)} minder ${f.colorName}`}
                className="w-10 h-10 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-90 transition-all disabled:text-gray-300 dark:disabled:text-gray-600 disabled:hover:bg-transparent"
              >
                <Minus size={18} />
              </button>
              <span className={`min-w-14 text-center text-sm font-bold tabular-nums ${pending > 0 ? 'text-petrol-700 dark:text-petrol-400' : 'text-gray-300 dark:text-gray-600'}`}>
                {pending > 0 ? `+${formatWeight(pending * f.spoolWeight)}` : '0'}
              </span>
              <button
                onClick={() => change(f.id, 1)}
                aria-label={`${formatWeight(f.spoolWeight)} meer ${f.colorName}`}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-petrol-50 dark:bg-petrol-950 text-petrol-700 dark:text-petrol-400 hover:bg-petrol-100 dark:hover:bg-petrol-900 active:scale-90 transition-all"
              >
                <Plus size={18} />
              </button>
            </div>
          );
        }}
      />

      <ModalFooter>
        <button onClick={onClose} className={SECONDARY_BUTTON}>Annuleer</button>
        <button onClick={handleConfirm} disabled={totalGrams === 0 || isSaving} className={`${PRIMARY_BUTTON} ${totalGrams > 0 && !isSaving ? ATTENTION : ''}`}>
          {totalGrams === 0 ? 'Bewaar' : `Voeg ${formatWeight(totalGrams)} toe`}
        </button>
      </ModalFooter>
    </>
  );
}
