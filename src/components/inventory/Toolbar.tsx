import { motion } from 'motion/react';
import { ArrowDown, ArrowUp, Disc, Search } from 'lucide-react';
import { FilamentFilters } from '../../hooks/useFilamentFilters';
import { FilterOption, SortField } from '../../utils/filaments';

const FILTER_OPTIONS: { id: FilterOption; label: string }[] = [
  { id: 'All', label: 'Alle' },
  { id: 'PLA', label: 'PLA' },
  { id: 'PETG', label: 'PETG' },
];

const SORT_OPTIONS: { id: SortField; label: string }[] = [
  { id: 'name', label: 'Naam' },
  { id: 'color', label: 'Kleur' },
  { id: 'quantity', label: 'Voorraad' },
];

interface ToolbarProps {
  filters: FilamentFilters;
  onOpenOverview: () => void;
}

export function Toolbar({ filters, onOpenOverview }: ToolbarProps) {
  const { searchQuery, setSearchQuery, filterType, setFilterType, sortBy, sortOrder, toggleSort, filtered } = filters;

  return (
    <div className="flex flex-col gap-5 mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 lg:max-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Zoek..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-[36px] pl-10 pr-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm font-medium text-xs"
          />
        </div>

        <div className="flex flex-wrap gap-3 flex-1 lg:justify-end">
          {/* Filter Button Bar */}
          <div className="inline-flex p-1 bg-gray-100 rounded-xl shrink-0">
            {FILTER_OPTIONS.map(option => (
              <button
                key={option.id}
                onClick={() => setFilterType(option.id)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${filterType === option.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Sort Button Bar */}
          <div className="inline-flex p-1 bg-gray-100 rounded-xl shrink-0">
            {SORT_OPTIONS.map(sort => (
              <button
                key={sort.id}
                onClick={() => toggleSort(sort.id)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${sortBy === sort.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {sort.label}
                {sortBy === sort.id && (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Total Quantity & Spools */}
      <div className="flex justify-end">
        <motion.button
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          key={`${filterType}-${searchQuery}`}
          onClick={onOpenOverview}
          className="flex items-center gap-3 shrink-0 cursor-pointer hover:opacity-70 transition-opacity"
          title="Bekijk overzicht"
        >
          <div className="flex -space-x-2">
            {filtered.slice(0, 5).map((f, i) => (
              <div
                key={f.id}
                className="w-6 h-6 rounded-full border-2 border-white shadow-sm flex items-center justify-center"
                style={{ backgroundColor: f.colorHex, zIndex: 5 - i }}
              >
                <Disc size={10} className="text-white/20" />
              </div>
            ))}
            {filtered.length > 5 && (
              <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-50 flex items-center justify-center text-[8px] font-black text-gray-400 z-0 shadow-sm">
                +{filtered.length - 5}
              </div>
            )}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-black text-gray-900">
              {filtered.reduce((acc, f) => acc + f.spools, 0).toFixed(1)}
            </span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Rollen</span>
          </div>
        </motion.button>
      </div>
    </div>
  );
}
