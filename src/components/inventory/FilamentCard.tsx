import { Ref } from 'react';
import { motion } from 'motion/react';
import { Filament } from '../../types';
import { formatSpools, getStockLevel, StockLevel } from '../../utils/filaments';
import { ColorSwatch } from '../ui/ColorSwatch';

const BAR_COLOR: Record<StockLevel, string> = {
  low: 'bg-red-500',
  medium: 'bg-amber-400',
  ok: 'bg-emerald-500',
};

interface FilamentCardProps {
  filament: Filament;
  onEdit: (filament: Filament) => void;
  /** Forwarded so AnimatePresence's popLayout mode can measure the card. */
  ref?: Ref<HTMLButtonElement>;
}

export function FilamentCard({ filament, onEdit, ref }: FilamentCardProps) {
  const level = getStockLevel(filament.spools);
  // The bar shows how full the last spool is; with a spool or more in stock it stays full
  const fill = Math.min(filament.spools, 1) * 100;
  const showBrand = filament.brand && filament.brand !== filament.typeBrand;

  return (
    <motion.button
      ref={ref}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={() => onEdit(filament)}
      className={`flex flex-col text-left bg-white rounded-2xl border p-4 hover:shadow-lg hover:shadow-gray-200/60 transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${level === 'low' ? 'border-red-200' : 'border-gray-200'}`}
    >
      <div className="flex items-start gap-3 w-full">
        <ColorSwatch hex={filament.colorHex} name={filament.colorName} className="w-11 h-11" />

        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-base leading-tight truncate" title={filament.colorName}>
            {filament.colorName.split(' (')[0]}
          </h3>
          <p className="text-sm text-gray-500 truncate mt-0.5">
            {filament.typeName}{showBrand && ` · ${filament.brand}`}
          </p>
        </div>

        <div className="text-right shrink-0">
          <p className="text-xl font-bold leading-none tabular-nums">
            {formatSpools(filament.spools)}
            <span className="text-sm font-medium text-gray-500"> {filament.spools > 1 ? 'rollen' : 'rol'}</span>
          </p>
          <p className="text-xs text-gray-500 mt-1 tabular-nums">{filament.remainingGrams} g</p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 w-full">
        <div className="h-1.5 flex-1 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${BAR_COLOR[level]}`} style={{ width: `${fill}%` }} />
        </div>
        {level === 'low' && (
          <span className="text-xs font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full shrink-0">Bijna op</span>
        )}
      </div>

      {filament.notes && (
        <p className="mt-2 text-xs text-gray-500 italic truncate">{filament.notes}</p>
      )}
    </motion.button>
  );
}
