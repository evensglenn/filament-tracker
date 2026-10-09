import { useState } from 'react';
import { Printer } from 'lucide-react';
import { Filament } from '../../types';
import { filamentService } from '../../services/filamentService';
import { byRecentUse, formatWeight } from '../../utils/filaments';
import { ATTENTION, Modal, ModalFooter, ModalHeader, PRIMARY_BUTTON, SECONDARY_BUTTON } from '../ui/Modal';
import { FilamentPicker } from '../ui/FilamentPicker';
import { useShowError } from '../ui/Toast';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  filaments: Filament[];
}

/** Register a print: subtract grams used from one or more filaments. */
export function PrintModal({ isOpen, onClose, filaments }: PrintModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="sm:max-w-xl">
      <PrintContent onClose={onClose} filaments={filaments} />
    </Modal>
  );
}

function PrintContent({ onClose, filaments }: Omit<PrintModalProps, 'isOpen'>) {
  const [printUsages, setPrintUsages] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);
  const showError = useShowError();

  const used = Object.values(printUsages).filter(grams => grams > 0);
  const totalGrams = used.reduce((sum, grams) => sum + grams, 0);

  const handleConfirm = async () => {
    setIsSaving(true);
    try {
      await filamentService.logPrint(printUsages);
      onClose();
    } catch (error) {
      showError('Print registreren', error);
      setIsSaving(false);
    }
  };

  return (
    <>
      <ModalHeader
        title="Registreer print"
        subtitle="Hoeveel gram gebruikte elke kleur?"
        icon={<Printer size={20} />}
        onClose={onClose}
      />

      <FilamentPicker
        filaments={filaments}
        sort={byRecentUse}
        isActive={f => (printUsages[f.id] || 0) > 0}
        renderDetail={f => {
          const usage = printUsages[f.id] || 0;
          if (usage <= 0) return `${formatWeight(f.remainingGrams)} over`;
          const left = f.remainingGrams - usage;
          return left < 0
            ? <span className="text-danger font-semibold">{formatWeight(usage - f.remainingGrams)} te weinig</span>
            : <span className="text-petrol-700 dark:text-petrol-400 font-semibold">{formatWeight(f.remainingGrams)} → {formatWeight(left)}</span>;
        }}
        renderControl={f => (
          <label className="relative shrink-0">
            <span className="sr-only">Gram gebruikt van {f.colorName}</span>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              placeholder="0"
              value={printUsages[f.id] || ''}
              onChange={e => setPrintUsages(prev => ({ ...prev, [f.id]: Math.max(0, Number(e.target.value)) }))}
              className="w-24 h-11 pl-3 pr-7 text-right font-bold [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-petrol-500/20 focus:border-petrol-500"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 dark:text-gray-500 pointer-events-none">g</span>
          </label>
        )}
      />

      <ModalFooter>
        <button onClick={onClose} className={SECONDARY_BUTTON}>Annuleer</button>
        <button onClick={handleConfirm} disabled={used.length === 0 || isSaving} className={`${PRIMARY_BUTTON} ${used.length > 0 && !isSaving ? ATTENTION : ''}`}>
          {used.length === 0
            ? 'Bevestig verbruik'
            : `Bevestig ${totalGrams} g${used.length > 1 ? ` (${used.length} kleuren)` : ''}`}
        </button>
      </ModalFooter>
    </>
  );
}
