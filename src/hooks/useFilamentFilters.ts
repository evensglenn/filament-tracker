import { useMemo, useState } from 'react';
import { Filament } from '../types';
import { filterAndSortFilaments, FilterOption, SortField, SortOrder } from '../utils/filaments';

export function useFilamentFilters(filaments: Filament[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterOption>('All');
  const [sortBy, setSortBy] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder(field === 'quantity' ? 'desc' : 'asc'); // Default to desc for quantity
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setFilterType('All');
  };

  const filtered = useMemo(
    () => filterAndSortFilaments(filaments, searchQuery, filterType, sortBy, sortOrder),
    [filaments, searchQuery, filterType, sortBy, sortOrder]
  );

  return {
    searchQuery, setSearchQuery,
    filterType, setFilterType,
    sortBy, sortOrder, toggleSort,
    resetFilters,
    isFiltered: searchQuery !== '' || filterType !== 'All',
    filtered,
  };
}

export type FilamentFilters = ReturnType<typeof useFilamentFilters>;
