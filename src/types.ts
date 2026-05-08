export type FilamentType = string;

export interface ColorPreset {
  name: string;
  hex: string;
}

export interface ManagedType {
  id: string;
  name: string;
  brand: string;
  presets: ColorPreset[];
}

export interface UserConfig {
  uid: string;
  types: ManagedType[];
}

export interface Filament {
  id: string;
  uid: string;
  ownerName?: string;
  brand: string;
  type: FilamentType;
  colorName: string;
  colorHex: string;
  quantity: number; // Number of spools (e.g., 1.5, 2)
  spoolWeight: number; // Weight of a full spool in grams (e.g., 1000, 250)
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
  spoolWeight: number;
  notes?: string;
}
