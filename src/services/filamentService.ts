import { Filament, FilamentFormData } from '../types';

const STORAGE_KEY = 'filament_inventory';

export const filamentService = {
  getFilaments: (): Filament[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveFilaments: (filaments: Filament[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filaments));
  },

  addFilament: (formData: FilamentFormData): Filament => {
    const filaments = filamentService.getFilaments();
    const newFilament: Filament = {
      ...formData,
      id: Date.now(),
      lastUsed: new Date().toISOString()
    };
    filaments.unshift(newFilament);
    filamentService.saveFilaments(filaments);
    return newFilament;
  },

  updateFilament: (id: number, formData: FilamentFormData): Filament | null => {
    const filaments = filamentService.getFilaments();
    const index = filaments.findIndex(f => f.id === id);
    if (index === -1) return null;

    const updatedFilament = {
      ...filaments[index],
      ...formData,
      lastUsed: new Date().toISOString()
    };
    filaments[index] = updatedFilament;
    filamentService.saveFilaments(filaments);
    return updatedFilament;
  },

  deleteFilament: (id: number) => {
    const filaments = filamentService.getFilaments();
    const filtered = filaments.filter(f => f.id !== id);
    filamentService.saveFilaments(filtered);
  }
};
