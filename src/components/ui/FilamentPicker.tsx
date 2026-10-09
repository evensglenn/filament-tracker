import { ReactNode, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Filament } from '../../types';
import { matchesSearch } from '../../utils/filaments';
import { ColorSwatch } from './ColorSwatch';

interface FilamentPickerProps {
  filaments: Filament[];
  /** Order of the list, e.g. most recently used first. */
  sort: (a: Filament, b: Filament) => number;
  /** Highlights a row that has a value entered. */
  isActive: (filament: Filament) => boolean;
  /** Small line under the name, e.g. the stock. */
  renderDetail: (filament: Filament) => ReactNode;
  /** Control on the right of the row, e.g. an input. */
  renderControl: (filament: Filament) => ReactNode;
}

/** Searchable, compact list of filaments with a control per row. Rows with a value stay visible while searching. */
export function FilamentPicker({ filaments, sort, isActive, renderDetail, renderControl }: FilamentPickerProps) {
  const [query, setQuery] = useState('');

  // A stable order, so a row never moves away from the input you are typing in
  const sorted = useMemo(() => [...filaments].sort(sort), [filaments, sort]);
  const rows = sorted.filter(f => isActive(f) || matchesSearch(f, query));

  return (
    <>
      <div className="px-5 sm:px-6 py-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
          <input
            type="search"
            placeholder="Zoek kleur, type of merk..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-petrol-500/20 focus:border-petrol-500 transition-all text-sm"
          />
        </div>
      </div>

      <ul className="overflow-y-auto flex-1 px-3 sm:px-4 py-2">
        {rows.map(f => (
          <li
            key={f.id}
            className={`flex items-center gap-3 px-2 py-2.5 rounded-xl transition-colors ${isActive(f) ? 'bg-petrol-50 dark:bg-petrol-950' : ''}`}
          >
            <ColorSwatch hex={f.colorHex} name={f.colorName} className="w-9 h-9" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{f.colorName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{f.typeName} · {renderDetail(f)}</p>
            </div>
            {renderControl(f)}
          </li>
        ))}
        {rows.length === 0 && (
          <li className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">Geen filament gevonden voor "{query}".</li>
        )}
      </ul>
    </>
  );
}
