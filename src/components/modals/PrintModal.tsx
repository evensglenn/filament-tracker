import { useState } from 'react';
import { Minus, Plus, Printer } from 'lucide-react';
import { Filament } from '../../types';
import { formatSpools } from '../../utils/filaments';
import { filamentService } from '../../services/filamentService';
import { Modal, ModalBanner, WIDE_MODAL_CLASS } from '../ui/Modal';
import { SwatchCard, SWATCH_GRID_CLASS } from '../ui/SwatchCard';

const STEP_GRAMS = 10;

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  filaments: Filament[];
}

/** Register a print: subtract grams used from one or more filaments. */
export function PrintModal({ isOpen, onClose, filaments }: PrintModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className={WIDE_MODAL_CLASS}>
      <PrintContent onClose={onClose} filaments={filaments} />
    </Modal>
  );
}

function PrintContent({ onClose, filaments }: Omit<PrintModalProps, 'isOpen'>) {
  const [printUsages, setPrintUsages] = useState<Record<string, number>>({});

  const handleConfirm = async () => {
    try {
      await filamentService.logPrint(printUsages);
      onClose();
    } catch (error) {
      console.error('Failed to confirm print:', error);
    }
  };

  return (
    <>
      <ModalBanner icon={<Printer size={20} />} title="Nieuwe print" color="bg-blue-600" onClose={onClose} />

      <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
        <div className={SWATCH_GRID_CLASS}>
          {filaments.map(f => {
            const usage = printUsages[f.id] || 0;
            return (
              <SwatchCard key={f.id} filament={f}>
                <p className="text-[10px] font-bold text-gray-400 mt-1">
                  Voorraad: {formatSpools(f.spools)} rollen ({f.remainingGrams} g)
                </p>

                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPrintUsages(prev => ({ ...prev, [f.id]: Math.max(0, (prev[f.id] || 0) - STEP_GRAMS) }))}
                      disabled={usage === 0}
                      className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all ${usage > 0 ? 'border-red-200 text-red-600 hover:bg-red-50 active:scale-90' : 'border-gray-100 text-gray-300 cursor-not-allowed'}`}
                    >
                      <Minus size={14} strokeWidth={3} />
                    </button>
                    <input
                      type="number"
                      value={usage || ''}
                      placeholder="0"
                      onChange={(e) => setPrintUsages(prev => ({ ...prev, [f.id]: Number(e.target.value) }))}
                      className="w-16 text-center font-black text-blue-600 bg-blue-50/50 rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <button
                      onClick={() => setPrintUsages(prev => ({ ...prev, [f.id]: (prev[f.id] || 0) + STEP_GRAMS }))}
                      className="w-7 h-7 rounded-full flex items-center justify-center border border-blue-200 text-blue-600 hover:bg-blue-50 active:scale-90 transition-all"
                    >
                      <Plus size={14} strokeWidth={3} />
                    </button>
                  </div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">gram gebruikt</p>
                </div>
              </SwatchCard>
            );
          })}
        </div>
      </div>

      <div className="p-4 bg-white border-t border-gray-100 flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all active:scale-95"
        >
          Annuleer
        </button>
        <button
          onClick={handleConfirm}
          disabled={Object.values(printUsages).every(v => v === 0)}
          className="flex-[2] px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-100 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
        >
          Bevestig verbruik
        </button>
      </div>
    </>
  );
}
