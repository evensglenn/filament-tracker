import { ChevronDown, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { ManagedType } from '../../types';
import { ConfigActions } from '../../hooks/useUserConfig';
import { ColorSwatch } from '../ui/ColorSwatch';

const SMALL_BUTTON = 'h-9 px-3 text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5';

interface TypeSettingsProps {
  types: ManagedType[];
  /** Number of filaments per type id; a type in use can't be deleted. */
  usage: Map<string, number>;
  actions: ConfigActions;
}

export function TypeSettings({ types, usage, actions }: TypeSettingsProps) {
  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h3 className="font-bold text-gray-900">Filamenttypes en kleuren</h3>
        <div className="flex gap-2">
          <button
            onClick={actions.importBambuDefaults}
            title="Voegt de standaard Bambu Lab-types toe en zet hun kleuren terug naar de standaard"
            className={`${SMALL_BUTTON} text-gray-700 bg-gray-100 hover:bg-gray-200`}
          >
            <RefreshCw size={14} />
            Bambu Lab-kleuren
          </button>
          <button onClick={actions.addType} className={`${SMALL_BUTTON} text-emerald-700 bg-emerald-50 hover:bg-emerald-100`}>
            <Plus size={16} />
            Nieuw type
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {types.map((type) => (
          <TypeEditor key={type.id} type={type} usedBy={usage.get(type.id) ?? 0} actions={actions} />
        ))}
      </div>
    </section>
  );
}

/** A type, collapsed to one line with a preview of its colors until opened. */
function TypeEditor({ type, usedBy, actions }: { type: ManagedType; usedBy: number; actions: ConfigActions }) {
  return (
    <details className="group bg-gray-50 rounded-2xl border border-gray-200 open:bg-white">
      <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900 truncate">{type.name || 'Naamloos type'}</p>
          <p className="text-xs text-gray-500 truncate">
            {type.brand} · {type.presets.length} {type.presets.length === 1 ? 'kleur' : 'kleuren'}
            {usedBy > 0 && ` · ${usedBy} in voorraad`}
          </p>
        </div>
        <div className="hidden sm:flex -space-x-1.5 shrink-0">
          {type.presets.slice(0, 6).map(p => (
            <ColorSwatch key={p.id} hex={p.hex} name={p.name} className="w-5 h-5 ring-2 ring-white" />
          ))}
        </div>
        <ChevronDown size={18} className="text-gray-400 transition-transform group-open:rotate-180 shrink-0" />
      </summary>

      <div className="px-4 pb-4 pt-1 space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <label className="flex-1">
            <span className="text-xs font-medium text-gray-500">Merk</span>
            <input
              type="text"
              value={type.brand}
              onChange={(e) => actions.updateType(type.id, { brand: e.target.value })}
              className="mt-1 w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            />
          </label>
          <label className="flex-1">
            <span className="text-xs font-medium text-gray-500">Naam</span>
            <input
              type="text"
              value={type.name}
              onChange={(e) => actions.updateType(type.id, { name: e.target.value })}
              className="mt-1 w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            />
          </label>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-500 mb-1.5">Kleuren</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {type.presets.map((preset) => (
              <div key={preset.id} className="flex items-center gap-2 pl-1.5 pr-1 h-10 bg-white border border-gray-200 rounded-xl">
                <input
                  type="color"
                  value={preset.hex}
                  onChange={(e) => actions.updatePreset(type.id, preset.id, { hex: e.target.value })}
                  aria-label={`Kleur van ${preset.name}`}
                  className="w-7 h-7 p-0 border-none bg-transparent cursor-pointer rounded-md overflow-hidden shrink-0"
                />
                <input
                  type="text"
                  value={preset.name}
                  onChange={(e) => actions.updatePreset(type.id, preset.id, { name: e.target.value })}
                  aria-label="Naam van de kleur"
                  className="flex-1 min-w-0 text-sm outline-none bg-transparent"
                />
                <button
                  onClick={() => actions.removePreset(type.id, preset.id)}
                  aria-label={`Verwijder ${preset.name}`}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <button onClick={() => actions.addPreset(type.id)} className={`${SMALL_BUTTON} text-emerald-700 hover:bg-emerald-50 -ml-3`}>
            <Plus size={16} />
            Kleur toevoegen
          </button>
          <button
            onClick={() => actions.deleteType(type.id)}
            disabled={usedBy > 0}
            title={usedBy > 0 ? `In gebruik door ${usedBy} filament${usedBy === 1 ? '' : 'en'}` : undefined}
            className={`${SMALL_BUTTON} text-red-600 hover:bg-red-50 disabled:text-gray-400 disabled:hover:bg-transparent disabled:cursor-not-allowed`}
          >
            <Trash2 size={16} />
            {usedBy > 0 ? 'In gebruik' : 'Type verwijderen'}
          </button>
        </div>
      </div>
    </details>
  );
}
