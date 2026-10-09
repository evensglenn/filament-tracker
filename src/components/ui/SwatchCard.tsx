import { ReactNode } from 'react';
import { Filament } from '../../types';

interface SwatchCardProps {
  filament: Filament;
  children?: ReactNode;
}

/** Compact color swatch tile used in the overview, delivery and print grids. */
export function SwatchCard({ filament, children }: SwatchCardProps) {
  return (
    <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center text-center gap-2 relative group">
      <div
        className="w-10 h-10 rounded-full border-2 border-gray-100 shadow-inner"
        style={{ backgroundColor: filament.colorHex }}
      />
      <div className="min-w-0 w-full">
        <p className="text-[10px] font-black text-gray-900 truncate leading-tight uppercase tracking-tighter">
          {filament.colorName}
        </p>
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
          {filament.type}
        </p>
        {children}
      </div>
    </div>
  );
}

export const SWATCH_GRID_CLASS = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3';
