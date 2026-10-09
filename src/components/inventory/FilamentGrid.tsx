import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search } from 'lucide-react';
import { Filament } from '../../types';
import { FilamentCard } from './FilamentCard';

interface FilamentGridProps {
  filaments: Filament[];
  /** Whether the unfiltered inventory has any filaments at all. */
  hasInventory: boolean;
  isFiltered: boolean;
  onEdit: (filament: Filament) => void;
  onAdd: () => void;
  onResetFilters: () => void;
}

export function FilamentGrid({ filaments, hasInventory, isFiltered, onEdit, onAdd, onResetFilters }: FilamentGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      <AnimatePresence mode="popLayout">
        {filaments.map((filament) => (
          <FilamentCard
            key={filament.id}
            filament={filament}
            onEdit={onEdit}
          />
        ))}

        {filaments.length === 0 && hasInventory && (
          <motion.div
            key="no-results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="col-span-full py-12 text-center"
          >
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mx-auto mb-4">
              <Search size={32} />
            </div>
            <p className="text-gray-500 font-bold">Geen resultaten gevonden</p>
            <p className="text-sm text-gray-400 mt-1">Probeer een andere zoekterm of filter.</p>
            {isFiltered && (
              <div className="mt-6 flex flex-col items-center gap-2">
                <button
                  onClick={onResetFilters}
                  className="text-emerald-600 font-bold text-sm hover:underline py-1"
                >
                  Wis alle filters
                </button>
                <button
                  onClick={onAdd}
                  className="text-emerald-600 font-bold text-sm hover:underline py-1"
                >
                  Voeg filament toe
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Add New Card */}
        {(filaments.length > 0 || !hasInventory) && (
          <motion.button
            key="add-new"
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={onAdd}
            className="group relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all min-h-[100px]"
          >
            <div className="w-10 h-10 bg-gray-50 group-hover:bg-emerald-100 rounded-full flex items-center justify-center text-gray-400 group-hover:text-emerald-600 transition-colors mb-2">
              <Plus size={20} strokeWidth={3} />
            </div>
            <span className="text-xs font-bold text-gray-400 group-hover:text-emerald-600 transition-colors">Voeg toe</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
