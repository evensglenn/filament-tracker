import { Ref } from 'react';
import { motion } from 'motion/react';
import { Filament } from '../../types';
import { getStockStatus, StockStatus, weightParts } from '../../utils/filaments';
import { ColorSwatch } from '../ui/ColorSwatch';

// Soft labels in the color of the border, with dark text (light text in dark mode)
const STATUS_STYLE: Record<StockStatus, { label: string; border: string; badge: string }> = {
  almostEmpty: { label: 'Bijna op', border: 'border-danger-light', badge: 'text-danger bg-danger-light' },
  limited: { label: 'Beperkt', border: 'border-warning-light', badge: 'text-warning bg-warning-light' },
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
  const weight = weightParts(filament.remainingGrams);
  const showBrand = filament.brand && filament.brand !== filament.typeBrand;

  return (
    <motion.button
      ref={ref}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={() => onEdit(filament)}
      className={`relative overflow-hidden flex flex-col text-left bg-white dark:bg-gray-900 rounded-2xl border p-4 hover:shadow-lg hover:shadow-gray-200/60 dark:hover:shadow-black/40 transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-500 ${style ? style.border : 'border-gray-200 dark:border-gray-700'}`}
    >
      <div className="flex items-start gap-3 w-full">
        <ColorSwatch hex={filament.colorHex} name={filament.colorName} className="w-11 h-11" />

        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-base leading-tight truncate" title={filament.colorName}>
            {filament.colorName.split(' (')[0]}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
            {filament.typeName}{showBrand && ` · ${filament.brand}`}
          </p>
        </div>

        <p className="shrink-0 text-xl font-bold leading-none tabular-nums">
          {weight.value}
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400"> {weight.unit}</span>
        </p>
      </div>

      {/* A tab in the bottom-right corner, following the card's rounded corner; it adds no height */}
      {style && (
        <span className={`absolute bottom-0 right-0 text-xs font-semibold leading-none px-3 py-1.5 rounded-tl-xl ${style.badge}`}>{style.label}</span>
      )}
    </motion.button>
  );
}
