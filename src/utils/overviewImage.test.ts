import { describe, expect, it } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { Filament } from '../types';
import { overviewHeight } from './overviewImage';

const filament = (id: string, typeName: string): Filament => ({
  id, typeId: typeName, typeName, typeBrand: 'Bambu Lab', brand: 'Bambu Lab', colorName: id, colorHex: '#000000',
  remainingGrams: 1000, spoolWeight: 1000, spools: 1, notes: '', createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
});

describe('overviewHeight', () => {
  it('grows with the number of rows, three colors per row', () => {
    const one = overviewHeight([filament('a', 'PLA')]);
    const three = overviewHeight(['a', 'b', 'c'].map(id => filament(id, 'PLA')));
    const four = overviewHeight(['a', 'b', 'c', 'd'].map(id => filament(id, 'PLA')));
    expect(three).toBe(one);
    expect(four).toBeGreaterThan(three);
  });

  it('adds a section per type', () => {
    const sameType = overviewHeight([filament('a', 'PLA'), filament('b', 'PLA')]);
    const twoTypes = overviewHeight([filament('a', 'PLA'), filament('b', 'PETG')]);
    expect(twoTypes).toBeGreaterThan(sameType);
  });

  it('has room for a message when there is nothing to show', () => {
    expect(overviewHeight([])).toBeGreaterThan(0);
  });
});
