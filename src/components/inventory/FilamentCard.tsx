import { Ref } from 'react';
import { motion } from 'motion/react';
import { Disc } from 'lucide-react';
import { Filament } from '../../types';
import { formatSpools, getQuantityColor } from '../../utils/filaments';

interface FilamentCardProps {
  filament: Filament;
  onEdit: (filament: Filament) => void;
  /** Forwarded so AnimatePresence's popLayout mode can measure the card. */
  ref?: Ref<HTMLDivElement>;
}

export function FilamentCard({ filament, onEdit, ref }: FilamentCardProps) {
  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={() => onEdit(filament)}
      className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:shadow-gray-200/50 transition-all group flex cursor-pointer"
    >
      <div className="flex-1 p-4 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-12 h-12 rounded-full border-4 border-gray-50 shadow-inner shrink-0"
            style={{ backgroundColor: filament.colorHex }}
          />
          <div className="min-w-0">
            <h3 className="font-bold text-lg leading-tight truncate" title={filament.colorName}>
              {filament.colorName.split(' (')[0]}
            </h3>
            <div className="mt-1 flex flex-wrap gap-1">
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded uppercase tracking-wider inline-block">
                {filament.typeName}
              </span>
            </div>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mt-0.5 truncate">
              {filament.brand}
            </p>
          </div>
        </div>

        {filament.notes && (
          <div className="mt-3 text-[10px] text-gray-400 italic line-clamp-1">
            {filament.notes}
          </div>
        )}
      </div>

      <div className={`w-14 flex flex-col items-center justify-center gap-1 transition-all shrink-0 ${getQuantityColor(filament.spools)}`}
        title={`${filament.remainingGrams} g`}
      >
        <Disc size={18} />
        <p className="text-xl font-black leading-none">{formatSpools(filament.spools)}</p>
      </div>
    </motion.div>
  );
}
