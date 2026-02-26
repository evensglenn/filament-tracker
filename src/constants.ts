import { FilamentType } from './types';

export interface ColorPreset {
  name: string;
  hex: string;
}

export const BAMBU_COLORS: Record<string, ColorPreset[]> = {
  'PLA': [
    { name: 'Jade White', hex: '#F5F5F5' },
    { name: 'Black', hex: '#1A1A1A' },
    { name: 'Grey', hex: '#808080' },
    { name: 'Red', hex: '#E60012' },
    { name: 'Blue', hex: '#0067B1' },
    { name: 'Green', hex: '#009640' },
    { name: 'Yellow', hex: '#FFD100' },
    { name: 'Orange', hex: '#F37021' },
    { name: 'Purple', hex: '#6D2D91' },
    { name: 'Pink', hex: '#E4007F' },
    { name: 'Cyan', hex: '#00A0E9' },
    { name: 'Magenta', hex: '#E4007F' },
    { name: 'Brown', hex: '#734338' },
    { name: 'Silver', hex: '#C0C0C0' },
    { name: 'Gold', hex: '#D4AF37' },
    { name: 'Bronze', hex: '#CD7F32' },
    { name: 'Bambu Green', hex: '#00AE42' },
    { name: 'Mistletoe Green', hex: '#2D5A27' },
    { name: 'Lava Red', hex: '#A61022' },
    { name: 'Ice Blue', hex: '#A5D7E8' },
  ],
  'PETG': [
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Black', hex: '#000000' },
    { name: 'Grey', hex: '#808080' },
    { name: 'Red', hex: '#FF0000' },
    { name: 'Blue', hex: '#0000FF' },
    { name: 'Green', hex: '#008000' },
    { name: 'Yellow', hex: '#FFFF00' },
    { name: 'Orange', hex: '#FFA500' },
    { name: 'Translucent', hex: '#E0E0E0' },
  ],
  'PLA-CF': [
    { name: 'Black', hex: '#1A1A1A' },
    { name: 'Lava Red', hex: '#A61022' },
    { name: 'Dark Blue', hex: '#003366' },
    { name: 'Dark Green', hex: '#004d00' },
    { name: 'Burgundy', hex: '#800020' },
  ],
  'PETG-CF': [
    { name: 'Black', hex: '#1A1A1A' },
    { name: 'Dark Grey', hex: '#404040' },
  ],
  'TPU': [
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Black', hex: '#000000' },
    { name: 'Red', hex: '#FF0000' },
    { name: 'Blue', hex: '#0000FF' },
    { name: 'Green', hex: '#008000' },
    { name: 'Yellow', hex: '#FFFF00' },
    { name: 'Orange', hex: '#FFA500' },
    { name: 'Neon Green', hex: '#39FF14' },
  ]
};
