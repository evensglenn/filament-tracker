import { useState } from 'react';
import { Minus, PackagePlus, Plus } from 'lucide-react';
import { Filament } from '../../types';
import { formatSpools } from '../../utils/filaments';
import { filamentService } from '../../services/filamentService';
import { Modal, ModalBanner, WIDE_MODAL_CLASS } from '../ui/Modal';
import { SwatchCard, SWATCH_GRID_CLASS } from '../ui/SwatchCard';

interface DeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  filaments: Filament[];
}

/** Register a delivery: add whole spools to several filaments at once. */
export function DeliveryModal({ isOpen, onClose, filaments }: DeliveryModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className={WIDE_MODAL_CLASS}>
      <DeliveryContent onClose={onClose} filaments={filaments} />
    </Modal>
  );
}

function DeliveryContent({ onClose, filaments }: Omit<DeliveryModalProps, 'isOpen'>) {
  const [deliveryQuantities, setDeliveryQuantities] = useState<Record<string, number>>({});

  const handleConfirm = async () => {
    try {
      await filamentService.addSpools(deliveryQuantities);
      onClose();
    } catch (error) {
      console.error('Failed to confirm delivery:', error);
    }
  };

  return (
    <>
      <ModalBanner icon={<PackagePlus size={20} />} title="Nieuwe levering" color="bg-emerald-600" onClose={onClose} />

      <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
        <div className={SWATCH_GRID_CLASS}>
          {filaments.map(f => {
            const pendingQty = deliveryQuantities[f.id] || 0;
            return (
              <SwatchCard key={f.id} filament={f}>
                <p className="text-[10px] font-bold text-gray-400 mt-1">
                  Huidig: {formatSpools(f.spools)}
                </p>

                <div className="mt-2 flex items-center justify-center gap-3">
                  <button
                    onClick={() => setDeliveryQuantities(prev => ({ ...prev, [f.id]: Math.max(0, (prev[f.id] || 0) - 1) }))}
                    disabled={pendingQty === 0}
                    className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${pendingQty > 0 ? 'border-red-200 text-red-600 hover:bg-red-50 active:scale-90' : 'border-gray-100 text-gray-300 cursor-not-allowed'}`}
                  >
                    <Minus size={16} strokeWidth={3} />
                  </button>
                  <span className={`text-lg font-black w-6 ${pendingQty > 0 ? 'text-emerald-600' : 'text-gray-300'}`}>
                    {pendingQty}
                  </span>
                  <button
                    onClick={() => setDeliveryQuantities(prev => ({ ...prev, [f.id]: (prev[f.id] || 0) + 1 }))}
                    className="w-8 h-8 rounded-full flex items-center justify-center border border-emerald-200 text-emerald-600 hover:bg-emerald-50 active:scale-90 transition-all"
                  >
                    <Plus size={16} strokeWidth={3} />
                  </button>
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
          disabled={Object.values(deliveryQuantities).every(v => v === 0)}
          className="flex-[2] px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-100 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
        >
          Bewaar
        </button>
      </div>
    </>
  );
}
