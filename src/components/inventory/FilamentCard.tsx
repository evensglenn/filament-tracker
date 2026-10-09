import { Ref } from 'react';
import { motion } from 'motion/react';
import { Filament } from '../../types';
import { formatSpools, getStockStatus, StockStatus } from '../../utils/filaments';
import { ColorSwatch } from '../ui/ColorSwatch';

const STATUS_STYLE: Record<StockStatus, { label: string; border: string; badge: string; amount: string }> = {
  almostEmpty: { label: 'Bijna op', border: 'border-danger-light', badge: 'text-white bg-danger', amount: 'text-danger-strong' },
  limited: { label: 'Beperkt', border: 'border-amber-400', badge: 'text-white bg-amber-600', amount: 'text-amber-700' },
};

interface FilamentCardProps {
  filament: Filament;
  onEdit: (filament: Filament) => void;
  /** Forwarded so AnimatePresence's popLayout mode can measure the card. */
  ref?: Ref<HTMLButtonElement>;
}

export function FilamentCard({ filament, onEdit, ref }: FilamentCardProps) {
  // Only low stock stands out; otherwise the color swatch is the only color on the card
  const status = getStockStatus(filament.remainingGrams);
  const style = status && STATUS_STYLE[status];
  const showBrand = filament.brand && filament.brand !== filament.typeBrand;

  return (
    <motion.button
      ref={ref}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={() => onEdit(filament)}
      className={`flex flex-col text-left bg-white rounded-2xl border p-4 hover:shadow-lg hover:shadow-gray-200/60 transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${style ? style.border : 'border-gray-200'}`}
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
          <p className={`text-xl font-bold leading-none tabular-nums ${style ? style.amount : ''}`}>
            {formatSpools(filament.spools)}
            <span className="text-sm font-medium text-gray-500"> {filament.spools > 1 ? 'rollen' : 'rol'}</span>
          </p>
          <p className="text-xs text-gray-500 mt-1 tabular-nums">{filament.remainingGrams} g</p>
        </div>
      </div>

      {style && (
        <span className={`mt-2 self-start text-[13px] font-semibold px-2.5 py-0.5 rounded-full ${style.badge}`}>{style.label}</span>
      )}

      {filament.notes && (
        <p className="mt-2 text-xs text-gray-500 italic truncate">{filament.notes}</p>
      )}
    </motion.button>
  );
}
