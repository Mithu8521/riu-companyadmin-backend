export interface FilterGroup {
  filterName: string;   // UI title
  key: string;          // DB key
  options: FilterOption[];
}

export interface FilterOption {
  value: string | number;
  label: string;
  next?: FilterGroup;   // exactly ONE next level
}
