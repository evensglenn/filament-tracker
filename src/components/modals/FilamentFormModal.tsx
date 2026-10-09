import { FormEvent, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Filament, FilamentInput, ManagedType } from '../../types';
import { filamentService } from '../../services/filamentService';
import { formatWeight } from '../../utils/filaments';
import { ATTENTION, Modal, ModalFooter, ModalHeader, PRIMARY_BUTTON, SECONDARY_BUTTON } from '../ui/Modal';
import { useShowError } from '../ui/Toast';
import { ColorSwatch } from '../ui/ColorSwatch';

type FormData = FilamentInput;

const defaultFormData = (types: ManagedType[]): FormData => {
  const type = types.find(t => t.name === 'PLA Basic') ?? types[0];
  return {
    typeId: type?.id ?? '',
    brand: type?.brand ?? 'Bambu Lab',
    colorName: '',
    colorHex: '#000000',
    remainingGrams: 1000,
    spoolWeight: 1000,
    notes: ''
  };
};

const toFormData = (filament: Filament): FormData => ({
  typeId: filament.typeId,
  brand: filament.brand,
  colorName: filament.colorName,
  colorHex: filament.colorHex,
  remainingGrams: filament.remainingGrams,
  spoolWeight: filament.spoolWeight || 1000,
  notes: filament.notes || ''
});

// Grams are stored as whole numbers
const toInput = (data: FormData): FilamentInput => ({ ...data, remainingGrams: Math.max(0, Math.round(data.remainingGrams)) });

const INPUT_CLASS = 'w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-petrol-500/20 focus:border-petrol-500 outline-none transition-all';
const LABEL_CLASS = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';

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
    <Modal isOpen={isOpen} onClose={onClose} className="sm:max-w-lg">
      <FilamentForm filament={filament} types={types} onClose={onClose} onRequestDelete={onRequestDelete} />
    </Modal>
  );
}

function FilamentForm({ filament, types, onClose, onRequestDelete }: Omit<FilamentFormModalProps, 'isOpen'>) {
  const [initialData] = useState<FormData>(() => filament ? toFormData(filament) : defaultFormData(types));
  const [formData, setFormData] = useState<FormData>(initialData);
  // Something to save: a change to an existing filament, or a color name for a new one
  const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialData) && formData.colorName.trim() !== '';
  const [isSaving, setIsSaving] = useState(false);
  const showError = useShowError();
  const isEditing = filament !== null;
  const selectedType = types.find(t => t.id === formData.typeId);
  const presets = selectedType?.presets || [];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (filament) {
        await filamentService.updateFilament(filament.id, toInput(formData));
      } else {
        await filamentService.addFilament(toInput(formData));
      }
      onClose();
    } catch (error) {
      // The form stays open with everything filled in, so saving can simply be retried
      showError(isEditing ? 'Bewaren' : 'Toevoegen', error);
      setIsSaving(false);
    }
  };

  return (
    <>
      <ModalHeader title={isEditing ? 'Bewerk filament' : 'Voeg filament toe'} onClose={onClose} />

      <form id="filament-form" onSubmit={handleSubmit} className="px-5 sm:px-6 py-5 overflow-y-auto flex-1 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className={LABEL_CLASS}>Type</span>
            <select
              required
              value={formData.typeId}
              onChange={e => {
                const type = types.find(t => t.id === e.target.value);
                setFormData({
                  ...formData,
                  typeId: e.target.value,
                  brand: type?.brand || formData.brand
                });
              }}
              className={INPUT_CLASS}
            >
              {/* Keep an unknown type selectable, instead of silently showing another one */}
              {!types.some(t => t.id === formData.typeId) && <option value={formData.typeId}>{filament?.typeName ?? 'Kies een type'}</option>}
              {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
          <label>
            <span className={LABEL_CLASS}>Merk</span>
            <input
              type="text"
              required
              value={formData.brand}
              onChange={e => setFormData({ ...formData, brand: e.target.value })}
              className={INPUT_CLASS}
            />
          </label>
        </div>

        {/* Preset Colors */}
        {presets.length > 0 && (
          <fieldset>
            <legend className={LABEL_CLASS}>Kleuren van {selectedType?.name}</legend>
            <div className="flex flex-wrap gap-2.5 p-1 -m-1">
              {presets.map(preset => {
                const isSelected = formData.colorHex.toLowerCase() === preset.hex.toLowerCase() && formData.colorName === preset.name;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, colorName: preset.name, colorHex: preset.hex })}
                    // A dark ring with white space around it reads on every color, also white and green
                    className={`flex w-9 h-9 rounded-full transition-transform ${isSelected ? 'ring-2 ring-gray-900 dark:ring-gray-100 ring-offset-2' : 'hover:scale-110'}`}
                    title={preset.name}
                    aria-label={preset.name}
                    aria-pressed={isSelected}
                  >
                    <ColorSwatch hex={preset.hex} name={preset.name} className="w-full h-full" />
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        <div className="flex gap-3 items-end">
          <label className="flex-1 min-w-0">
            <span className={LABEL_CLASS}>Kleurnaam</span>
            <input
              type="text"
              required
              placeholder="bijv. Jadewit"
              value={formData.colorName}
              onChange={e => setFormData({ ...formData, colorName: e.target.value })}
              className={INPUT_CLASS}
            />
          </label>
          <label className="shrink-0">
            <span className="sr-only">Eigen kleur</span>
            <span className="relative block w-[46px] h-[46px] rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-1.5 cursor-pointer" title="Kies een eigen kleur">
              <ColorSwatch hex={formData.colorHex} name={formData.colorName} className="w-full h-full" />
              <input
                type="color"
                value={formData.colorHex}
                onChange={e => setFormData({ ...formData, colorHex: e.target.value })}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </span>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className={LABEL_CLASS}>Voorraad</span>
            <span className="relative block">
              <input
                type="number"
                inputMode="numeric"
                step="any"
                min="0"
                value={formData.remainingGrams}
                onChange={e => setFormData({ ...formData, remainingGrams: Number(e.target.value) })}
                className={`${INPUT_CLASS} font-semibold pr-8`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 dark:text-gray-500 pointer-events-none">g</span>
            </span>
            {formData.remainingGrams >= 1000 && <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">= {formatWeight(formData.remainingGrams)}</span>}
          </label>
          <label>
            <span className={LABEL_CLASS}>Gewicht per levering</span>
            <span className="relative block">
              <input
                type="number"
                inputMode="numeric"
                step="any"
                min="1"
                value={formData.spoolWeight}
                onChange={e => setFormData({ ...formData, spoolWeight: Number(e.target.value) })}
                className={`${INPUT_CLASS} font-semibold pr-8`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 dark:text-gray-500 pointer-events-none">g</span>
            </span>
            <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">Komt erbij per tik in Registreer levering</span>
          </label>
        </div>

        <label className="block">
          <span className={LABEL_CLASS}>Notities</span>
          <textarea
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
            rows={2}
            placeholder="bijv. AMS slot 1"
            className={`${INPUT_CLASS} resize-none`}
          />
        </label>
      </form>

      <ModalFooter>
        {isEditing && (
          <button
            type="button"
            onClick={() => onRequestDelete(filament.id)}
            aria-label="Verwijder filament"
            title="Verwijder filament"
            className="w-12 shrink-0 flex items-center justify-center text-danger border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-danger-soft hover:border-danger-light transition-colors"
          >
            <Trash2 size={18} />
          </button>
        )}
        <button type="button" onClick={onClose} className={SECONDARY_BUTTON}>Annuleer</button>
        <button type="submit" form="filament-form" disabled={isSaving} className={`${PRIMARY_BUTTON} ${hasChanges && !isSaving ? ATTENTION : ''}`}>
          {isEditing ? 'Bewaar' : 'Voeg toe'}
        </button>
      </ModalFooter>
    </>
  );
}
