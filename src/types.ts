export type FilamentType = 'PLA Basic' | 'PLA Matte' | 'PLA Glow' | 'PETG-HF' | 'PETG Basic' | 'PLA-CF' | 'PETG-CF' | 'TPU';

export interface Filament {
  id: string;
  uid: string;
  ownerName?: string;
  brand: string;
  type: FilamentType;
  colorName: string;
  colorHex: string;
  quantity: number; // Number of spools (e.g., 1.5, 2)
  notes?: string;
  lastUsed?: string;
  createdAt?: string;
}

export interface FilamentFormData {
  brand: string;
  type: FilamentType;
  colorName: string;
  colorHex: string;
  quantity: number;
  notes?: string;
}
