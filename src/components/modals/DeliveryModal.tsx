import { useState } from 'react';
import { Minus, PackagePlus, Plus } from 'lucide-react';
import { Filament } from '../../types';
import { filamentService } from '../../services/filamentService';
import { formatSpoolsWithUnit } from '../../utils/filaments';
import { Modal, ModalFooter, ModalHeader, PRIMARY_BUTTON, SECONDARY_BUTTON } from '../ui/Modal';
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

  const totalSpools = Object.values(deliveryQuantities).reduce((sum, n) => sum + n, 0);
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
        title="Levering registreren"
        subtitle="Hoeveel nieuwe rollen kwamen er binnen?"
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
            ? <span className="text-emerald-700 font-semibold">{formatSpoolsWithUnit(f.spools)} → {formatSpoolsWithUnit(f.spools + added)}</span>
            : formatSpoolsWithUnit(f.spools);
        }}
        renderControl={f => {
          const pending = deliveryQuantities[f.id] || 0;
          return (
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => change(f.id, -1)}
                disabled={pending === 0}
                aria-label={`Eén rol minder ${f.colorName}`}
                className="w-10 h-10 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 active:scale-90 transition-all disabled:text-gray-300 disabled:hover:bg-transparent"
              >
                <Minus size={18} />
              </button>
              <span className={`w-6 text-center text-lg font-bold tabular-nums ${pending > 0 ? 'text-emerald-700' : 'text-gray-300'}`}>
                {pending}
              </span>
              <button
                onClick={() => change(f.id, 1)}
                aria-label={`Eén rol meer ${f.colorName}`}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:scale-90 transition-all"
              >
                <Plus size={18} />
              </button>
            </div>
          );
        }}
      />

      <ModalFooter>
        <button onClick={onClose} className={SECONDARY_BUTTON}>Annuleer</button>
        <button onClick={handleConfirm} disabled={totalSpools === 0 || isSaving} className={PRIMARY_BUTTON}>
          {totalSpools === 0 ? 'Bewaar' : `Voeg ${totalSpools} ${totalSpools === 1 ? 'rol' : 'rollen'} toe`}
        </button>
      </ModalFooter>
    </>
  );
}
