import { Timestamp } from 'firebase/firestore';

export interface ColorPreset {
  id: string;
  name: string;
  hex: string;
}

export interface ManagedType {
  id: string;
  name: string;
  brand: string;
  presets: ColorPreset[];
}

/** users/{uid} */
export interface UserConfig {
  types: ManagedType[];
}

/** users/{uid}/filaments/{id} */
export interface FilamentDoc {
  id: string;
  typeId: string; // ManagedType.id
  brand: string;
  colorName: string;
  colorHex: string;
  remainingGrams: number; // Integer, total over all spools of this filament
  spoolWeight: number; // Grams added per tap in a delivery: the weight of a new spool (e.g., 1000, 250)
  notes: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastUsedAt?: Timestamp; // Last print that used this filament
}

/** The editable fields of a filament. */
export type FilamentInput = Pick<FilamentDoc, 'typeId' | 'brand' | 'colorName' | 'colorHex' | 'remainingGrams' | 'spoolWeight' | 'notes'>;

/** A filament as shown in the UI: joined with its type. */
export interface Filament extends FilamentDoc {
  typeName: string;
  typeBrand: string;
}

/** users/{uid}/prints/{id} */
export interface PrintLog {
  id: string;
  createdAt: Timestamp;
  items: PrintItem[];
}

/** One filament used in a print. Name and color are copied so the log survives deleting the filament. */
export interface PrintItem {
  filamentId: string;
  typeId: string;
  colorName: string;
  colorHex: string;
  grams: number;
}
