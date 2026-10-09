import { ArrowLeft, ChevronRight, Plus, Trash2, X } from 'lucide-react';
import { ManagedType } from '../../types';
import { ConfigActions } from '../../hooks/useUserConfig';
import { ColorSwatch } from '../ui/ColorSwatch';

const BACK_BUTTON = 'w-11 h-11 -ml-2 items-center justify-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors shrink-0';
const SMALL_BUTTON = 'h-10 px-3.5 text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-50';
const INPUT = 'w-full h-11 px-3.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-petrol-500/20 focus:border-petrol-500 outline-none';

interface SettingsPageProps {
  types: ManagedType[];
  /** Number of filaments per type id; a type in use can't be deleted. */
  usage: Map<string, number>;
  actions: ConfigActions;
  /** The type being edited (from the address), if any. */
  selectedTypeId?: string;
  onSelectType: (typeId: string | undefined) => void;
  onBack: () => void;
}

/**
 * Filament types and their colors, as a page. Larger screens show the list and the selected type
 * side by side; phones show the list first and open a type on its own.
 */
export function SettingsPage({ types, usage, actions, selectedTypeId, onSelectType, onBack }: SettingsPageProps) {
  const selected = types.find(t => t.id === selectedTypeId);
  // Larger screens always show a type next to the list; phones only when one is chosen
  const shown = selected ?? types[0];


  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* One back button: on phones with a type open it returns to the list, otherwise to the inventory */}
        <button onClick={onBack} aria-label="Ga terug naar de voorraad" title="Ga terug naar de voorraad" className={`${BACK_BUTTON} ${selected ? 'hidden lg:flex' : 'flex'}`}>
          <ArrowLeft size={20} />
        </button>
        {selected && (
          <button onClick={() => onSelectType(undefined)} aria-label="Toon alle types" title="Toon alle types" className={`${BACK_BUTTON} flex lg:hidden`}>
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold leading-tight truncate">
            {selected ? <><span className="lg:hidden">{selected.name || 'Naamloos type'}</span><span className="hidden lg:inline">Filamenttypes</span></> : 'Filamenttypes'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{selected ? <><span className="lg:hidden">Filamenttype</span><span className="hidden lg:inline">Types en hun kleuren</span></> : 'Types en hun kleuren'}</p>
        </div>
        {/* On phones only in the list, not above an open type */}
        <div className={`${selected ? 'hidden lg:flex' : 'flex'} w-full sm:w-auto`}>
          <button onClick={() => onSelectType(actions.addType())} className={`${SMALL_BUTTON} w-full sm:w-auto justify-center whitespace-nowrap text-white bg-petrol-600 hover:bg-petrol-700`}>
            <Plus size={16} />
            Voeg type toe
          </button>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(300px,360px)_1fr] lg:gap-6 lg:items-start">
        <ul className={`space-y-1.5 ${selected ? 'hidden lg:block' : ''}`} aria-label="Types">
          {types.map(type => (
            <li key={type.id}>
              <button
                onClick={() => onSelectType(type.id)}
                aria-current={shown?.id === type.id ? 'true' : undefined}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-colors ${
                  shown?.id === type.id ? 'lg:bg-white dark:lg:bg-gray-900 lg:border-gray-900 dark:lg:border-gray-100 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{type.name || 'Naamloos type'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {type.brand} · {type.presets.length} {type.presets.length === 1 ? 'kleur' : 'kleuren'}
                    {(usage.get(type.id) ?? 0) > 0 && ` · ${usage.get(type.id)} in voorraad`}
                  </p>
                </div>
                <div className="flex -space-x-1.5 shrink-0">
                  {type.presets.slice(0, 4).map(p => (
                    <ColorSwatch key={p.id} hex={p.hex} name={p.name} className="w-5 h-5 ring-2 ring-white dark:ring-gray-900" />
                  ))}
                </div>
                <ChevronRight size={18} className="text-gray-300 dark:text-gray-600 shrink-0 lg:hidden" />
              </button>
            </li>
          ))}
        </ul>

        {shown && (
          <div className={selected ? '' : 'hidden lg:block'}>
            <TypeEditor
              key={shown.id}
              type={shown}
              usedBy={usage.get(shown.id) ?? 0}
              actions={actions}
              onDeleted={() => onSelectType(undefined)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

interface TypeEditorProps {
  type: ManagedType;
  usedBy: number;
  actions: ConfigActions;
  onDeleted: () => void;
}

function TypeEditor({ type, usedBy, actions, onDeleted }: TypeEditorProps) {
  return (
    <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 space-y-6" aria-label={`Type ${type.name}`}>

      <div className="grid sm:grid-cols-2 gap-3">
        <label>
          <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Naam</span>
          <input type="text" value={type.name} onChange={e => actions.updateType(type.id, { name: e.target.value })} className={`${INPUT} font-semibold`} />
        </label>
        <label>
          <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Merk</span>
          <input type="text" value={type.brand} onChange={e => actions.updateType(type.id, { brand: e.target.value })} className={INPUT} />
        </label>
      </div>

      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Kleuren <span className="text-gray-400 dark:text-gray-500">{type.presets.length}</span></p>
          <button onClick={() => actions.addPreset(type.id)} className={`${SMALL_BUTTON} -mr-2 text-petrol-700 dark:text-petrol-400 hover:bg-petrol-50 dark:hover:bg-petrol-950`}>
            <Plus size={16} />
            Voeg kleur toe
          </button>
        </div>
        <div className="grid sm:grid-cols-2 gap-2">
          {type.presets.map(preset => (
            <div key={preset.id} className="flex items-center gap-2 pl-2 pr-1 h-11 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus-within:border-petrol-500 focus-within:ring-2 focus-within:ring-petrol-500/20">
              <label className="relative shrink-0 w-7 h-7 cursor-pointer" title="Kies een kleur">
                <ColorSwatch hex={preset.hex} name={preset.name} className="w-7 h-7" />
                <input
                  type="color"
                  value={preset.hex}
                  onChange={e => actions.updatePreset(type.id, preset.id, { hex: e.target.value })}
                  aria-label={`Kleur van ${preset.name}`}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </label>
              <input
                type="text"
                value={preset.name}
                onChange={e => actions.updatePreset(type.id, preset.id, { name: e.target.value })}
                aria-label="Naam van de kleur"
                className="flex-1 min-w-0 text-sm outline-none bg-transparent"
              />
              <button
                onClick={() => actions.removePreset(type.id, preset.id)}
                aria-label={`Verwijder ${preset.name}`}
                title={`Verwijder ${preset.name}`}
                className="w-9 h-9 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-danger hover:bg-danger-soft rounded-lg transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
        {type.presets.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400 py-2">Nog geen kleuren.</p>}
      </div>

      <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
        <button
          onClick={() => { actions.deleteType(type.id); onDeleted(); }}
          disabled={usedBy > 0}
          title={usedBy > 0 ? `In gebruik door ${usedBy} filament${usedBy === 1 ? '' : 'en'}` : undefined}
          className={`${SMALL_BUTTON} text-danger hover:bg-danger-soft disabled:text-gray-400 dark:disabled:text-gray-500 disabled:hover:bg-transparent disabled:cursor-not-allowed`}
        >
          <Trash2 size={16} />
          {usedBy > 0 ? `In gebruik door ${usedBy} filament${usedBy === 1 ? '' : 'en'}` : 'Verwijder type'}
        </button>
      </div>
    </section>
  );
}
