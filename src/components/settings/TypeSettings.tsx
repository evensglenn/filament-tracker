import { Disc, Plus, Trash2, X } from 'lucide-react';
import { ManagedType } from '../../types';
import { ConfigActions } from '../../hooks/useUserConfig';

interface TypeSettingsProps {
  types: ManagedType[];
  /** Number of filaments per type id; a type in use can't be deleted. */
  usage: Map<string, number>;
  actions: ConfigActions;
}

export function TypeSettings({ types, usage, actions }: TypeSettingsProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <Disc size={18} className="text-emerald-600" />
          Filament Types & Presets
        </h3>
        <div className="flex gap-2">
          <button
            onClick={actions.importBambuDefaults}
            className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
          >
            Bambu Lab Sync
          </button>
          <button
            onClick={actions.addType}
            className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1"
          >
            <Plus size={12} strokeWidth={3} />
            Nieuw Type
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {types.map((type) => (
          <TypeEditor key={type.id} type={type} usedBy={usage.get(type.id) ?? 0} actions={actions} />
        ))}
      </div>
    </section>
  );
}

function TypeEditor({ type, usedBy, actions }: { type: ManagedType; usedBy: number; actions: ConfigActions }) {
  return (
    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Merk"
          value={type.brand}
          onChange={(e) => actions.updateType(type.id, { brand: e.target.value })}
          className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none"
        />
        <input
          type="text"
          placeholder="Type Naam"
          value={type.name}
          onChange={(e) => actions.updateType(type.id, { name: e.target.value })}
          className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none"
        />
        <button
          onClick={() => actions.deleteType(type.id)}
          disabled={usedBy > 0}
          title={usedBy > 0 ? `In gebruik door ${usedBy} filament${usedBy === 1 ? '' : 'en'}` : 'Verwijder type'}
          className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors shrink-0 disabled:text-gray-300 disabled:hover:bg-transparent disabled:cursor-not-allowed"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Presets</label>
          <button
            onClick={() => actions.addPreset(type.id)}
            className="text-[10px] font-bold text-emerald-600 hover:underline"
          >
            Voeg Preset toe
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {type.presets.map((preset) => (
            <div key={preset.id} className="group relative flex items-center gap-2 p-1 bg-white border border-gray-200 rounded-lg">
              <input
                type="color"
                value={preset.hex}
                onChange={(e) => actions.updatePreset(type.id, preset.id, { hex: e.target.value })}
                className="w-6 h-6 p-0 border-none bg-transparent cursor-pointer rounded overflow-hidden"
              />
              <input
                type="text"
                value={preset.name}
                onChange={(e) => actions.updatePreset(type.id, preset.id, { name: e.target.value })}
                className="flex-1 min-w-0 text-[10px] font-bold outline-none bg-transparent"
              />
              <button
                onClick={() => actions.removePreset(type.id, preset.id)}
                className="opacity-0 group-hover:opacity-100 absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center transition-opacity"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
