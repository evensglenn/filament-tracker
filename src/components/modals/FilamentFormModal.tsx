import { FormEvent, useState } from 'react';
import { Check, Trash2 } from 'lucide-react';
import { Filament, FilamentInput, ManagedType } from '../../types';
import { filamentService } from '../../services/filamentService';
import { spoolsToGrams } from '../../utils/filaments';
import { Modal } from '../ui/Modal';

/** The form edits the quantity in spools; it is stored in grams. */
type FormData = Omit<FilamentInput, 'remainingGrams'> & { spools: number };

const defaultFormData = (types: ManagedType[]): FormData => {
  const type = types.find(t => t.name === 'PLA Basic') ?? types[0];
  return {
    typeId: type?.id ?? '',
    brand: type?.brand ?? 'Bambu Lab',
    colorName: '',
    colorHex: '#000000',
    spools: 1,
    spoolWeight: 1000,
    notes: ''
  };
};

const toFormData = (filament: Filament): FormData => ({
  typeId: filament.typeId,
  brand: filament.brand,
  colorName: filament.colorName,
  colorHex: filament.colorHex,
  spools: Number(filament.spools.toFixed(3)),
  spoolWeight: filament.spoolWeight || 1000,
  notes: filament.notes || ''
});

const toInput = ({ spools, ...rest }: FormData): FilamentInput => ({
  ...rest,
  remainingGrams: spoolsToGrams(spools, rest.spoolWeight)
});

const INPUT_CLASS = 'w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all';
const LABEL_CLASS = 'text-xs font-bold text-gray-500 uppercase tracking-wider';

interface FilamentFormModalProps {
  isOpen: boolean;
  /** The filament being edited, or null to add a new one. */
  filament: Filament | null;
  types: ManagedType[];
  onClose: () => void;
  onRequestDelete: (id: string) => void;
}

export function FilamentFormModal({ isOpen, filament, types, onClose, onRequestDelete }: FilamentFormModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden">
      <FilamentForm filament={filament} types={types} onClose={onClose} onRequestDelete={onRequestDelete} />
    </Modal>
  );
}

function FilamentForm({ filament, types, onClose, onRequestDelete }: Omit<FilamentFormModalProps, 'isOpen'>) {
  const [formData, setFormData] = useState<FormData>(() => filament ? toFormData(filament) : defaultFormData(types));
  const isEditing = filament !== null;
  const presets = types.find(t => t.id === formData.typeId)?.presets || [];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (filament) {
      await filamentService.updateFilament(filament.id, toInput(formData));
    } else {
      await filamentService.addFilament(toInput(formData));
    }
    onClose();
  };

  return (
    <div className="p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
      <h2 className="text-2xl font-bold mb-6">{isEditing ? 'Bewerk' : 'Voeg toe'}</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className={LABEL_CLASS}>Merk</label>
            <input
              type="text"
              required
              value={formData.brand}
              onChange={e => setFormData({ ...formData, brand: e.target.value })}
              className={INPUT_CLASS}
            />
          </div>
          <div className="space-y-1.5">
            <label className={LABEL_CLASS}>Type</label>
            <select
              required
              value={formData.typeId}
              onChange={e => {
                const selectedType = types.find(t => t.id === e.target.value);
                setFormData({
                  ...formData,
                  typeId: e.target.value,
                  brand: selectedType?.brand || formData.brand
                });
              }}
              className={INPUT_CLASS}
            >
              {/* Keep an unknown type selectable, instead of silently showing another one */}
              {!types.some(t => t.id === formData.typeId) && <option value={formData.typeId}>{filament?.typeName ?? 'Kies een type'}</option>}
              {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>

        {/* Preset Colors */}
        {presets.length > 0 && (
          <div className="space-y-2">
            <label className={LABEL_CLASS}>Bambu Lab Presets</label>
            <div className="flex flex-wrap gap-2">
              {presets.map(preset => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, colorName: preset.name, colorHex: preset.hex })}
                  className={`group relative w-8 h-8 rounded-full border-2 transition-all ${formData.colorHex === preset.hex ? 'border-emerald-500 scale-110 shadow-md' : 'border-transparent hover:scale-110'}`}
                  style={{ backgroundColor: preset.hex }}
                  title={preset.name}
                >
                  {formData.colorHex === preset.hex && (
                    <Check size={14} className={`absolute inset-0 m-auto ${preset.hex === '#F5F5F5' || preset.hex === '#FFFFFF' ? 'text-gray-900' : 'text-white'}`} />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-1.5">
            <label className={LABEL_CLASS}>Kleurnaam</label>
            <input
              type="text"
              required
              placeholder="bijv. Jade White"
              value={formData.colorName}
              onChange={e => setFormData({ ...formData, colorName: e.target.value })}
              className={INPUT_CLASS}
            />
          </div>
          <div className="space-y-1.5">
            <label className={LABEL_CLASS}>Kleur</label>
            <div className="flex items-center gap-2 h-[46px]">
              <input
                type="color"
                value={formData.colorHex}
                onChange={e => setFormData({ ...formData, colorHex: e.target.value })}
                className="w-12 h-full p-1 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer"
              />
              <span className="text-xs font-mono text-gray-400 uppercase">{formData.colorHex}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className={LABEL_CLASS}>Aantal Rollen</label>
            <input
              type="number"
              step="any"
              min="0"
              value={formData.spools}
              onChange={e => setFormData({ ...formData, spools: Number(e.target.value) })}
              className={`${INPUT_CLASS} font-bold`}
            />
            <p className="text-[10px] text-gray-400 font-medium px-1">
              = {spoolsToGrams(formData.spools, formData.spoolWeight)} g
            </p>
          </div>
          <div className="space-y-1.5">
            <label className={LABEL_CLASS}>Gewicht per rol (g)</label>
            <input
              type="number"
              step="any"
              min="1"
              value={formData.spoolWeight}
              onChange={e => setFormData({ ...formData, spoolWeight: Number(e.target.value) })}
              className={`${INPUT_CLASS} font-bold`}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className={LABEL_CLASS}>Notities</label>
          <textarea
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
            rows={2}
            className={`${INPUT_CLASS} resize-none`}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all active:scale-95"
          >
            Annuleer
          </button>
          <button
            type="submit"
            className="flex-1 px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-100"
          >
            {isEditing ? 'Bewaar' : 'Voeg toe'}
          </button>
        </div>

        {isEditing && (
          <div className="pt-2 border-t border-gray-100 mt-4">
            <button
              type="button"
              onClick={() => onRequestDelete(filament.id)}
              className="w-full px-6 py-3 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Trash2 size={18} />
              Verwijder
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
