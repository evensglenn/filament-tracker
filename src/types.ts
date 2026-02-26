export type FilamentType = 'PLA' | 'PETG' | 'PLA-CF' | 'PETG-CF' | 'TPU' | 'Other';

export interface Filament {
  id: number;
  brand: string;
  type: FilamentType;
  colorName: string;
  colorHex: string;
  quantity: number; // Number of spools (e.g., 1.5, 2)
  notes?: string;
  lastUsed?: string;
}

export interface FilamentFormData {
  brand: string;
  type: FilamentType;
  colorName: string;
  colorHex: string;
  quantity: number;
  notes?: string;
}
