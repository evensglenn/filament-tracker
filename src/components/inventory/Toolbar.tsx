import { ArrowDown, ArrowUp, ArrowUpDown, Download, Search, Share } from 'lucide-react';
import { FilamentFilters } from '../../hooks/useFilamentFilters';
import { canShareFiles, shareOrSave, useOverviewImage } from '../../hooks/useOverviewImage';
import { FilterOption, SortField } from '../../utils/filaments';
import { MenuItem, Popover } from '../ui/Popover';

const SORT_OPTIONS: { id: SortField; label: string }[] = [
  { id: 'name', label: 'Naam' },
  { id: 'color', label: 'Kleur' },
  { id: 'quantity', label: 'Voorraad' },
];

const chip = (active: boolean) =>
  `h-9 px-3.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0 ${
    active ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
  }`;

interface ToolbarProps {
  filters: FilamentFilters;
  /** Number of filaments that are almost empty, over the whole inventory. */
  lowCount: number;
}

export function Toolbar({ filters, lowCount }: ToolbarProps) {
  const { searchQuery, setSearchQuery, filterType, setFilterType, sortBy, sortOrder, toggleSort, filtered } = filters;

  const filterOptions: { id: FilterOption; label: string }[] = [
    { id: 'All', label: 'Alle' },
    { id: 'PLA', label: 'PLA' },
    { id: 'PETG', label: 'PETG' },
    ...(lowCount > 0 ? [{ id: 'Low' as const, label: `Bijna op · ${lowCount}` }] : []),
  ];

  // The list as shown (search and filters applied), ready to share as an image
  const image = useOverviewImage(filtered);
  const canShare = canShareFiles();

  return (
    <div className="flex flex-col gap-3 mb-5">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="search"
            placeholder="Zoek kleur, type of merk..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
          />
        </div>

        {/* Phones: sorting folds out from a button, so the filters keep their row */}
        <Popover
          className="sm:hidden"
          panelClassName="w-56"
          trigger={({ isOpen, toggle }) => (
            <button
              onClick={toggle}
              aria-expanded={isOpen}
              aria-haspopup="menu"
              aria-label={`Sorteren, nu op ${SORT_OPTIONS.find(o => o.id === sortBy)?.label.toLowerCase()}`}
              className={`h-11 w-11 flex items-center justify-center border rounded-xl transition-colors ${isOpen ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
            >
              <ArrowUpDown size={18} />
            </button>
          )}
        >
          {close => (
            <>
              <p className="px-3 pt-2 pb-1 text-xs font-medium text-gray-500">Sorteren op</p>
              {SORT_OPTIONS.map(sort => (
                <MenuItem
                  key={sort.id}
                  onClick={() => { toggleSort(sort.id); close(); }}
                  trailing={sortBy === sort.id && (
                    <span className="text-emerald-700">
                      {sortOrder === 'asc' ? <ArrowUp size={18} /> : <ArrowDown size={18} />}
                    </span>
                  )}
                >
                  {sort.label}
                </MenuItem>
              ))}
            </>
          )}
        </Popover>

        <button
          onClick={() => image && shareOrSave(image)}
          disabled={!image}
          className="h-11 w-11 flex items-center justify-center bg-white border border-gray-200 rounded-xl text-gray-600 hover:border-gray-300 transition-colors shrink-0 disabled:opacity-50"
          title={canShare ? 'Deel deze lijst als afbeelding' : 'Bewaar deze lijst als afbeelding'}
          aria-label={canShare ? 'Deel deze lijst als afbeelding' : 'Bewaar deze lijst als afbeelding'}
        >
          {canShare ? <Share size={18} /> : <Download size={18} />}
        </button>
      </div>

      {/* Filters (and on larger screens sorting); scrolls sideways if it doesn't fit */}
      <div className="flex items-center gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-1 [scrollbar-width:none]">
        {filterOptions.map(option => (
          <button
            key={option.id}
            onClick={() => setFilterType(option.id)}
            className={option.id === 'Low' && filterType !== 'Low'
              ? `${chip(false)} !text-red-700 !border-red-200`
              : chip(filterType === option.id)}
          >
            {option.label}
          </button>
        ))}

        {/* Larger screens: sorting stays inline */}
        <span className="hidden sm:block w-px h-6 bg-gray-200 mx-1 shrink-0" aria-hidden />

        {SORT_OPTIONS.map(sort => (
          <button key={sort.id} onClick={() => toggleSort(sort.id)} className={`${chip(sortBy === sort.id)} !hidden sm:!flex`}>
            {sort.label}
            {sortBy === sort.id && (sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
          </button>
        ))}
      </div>
    </div>
  );
}
