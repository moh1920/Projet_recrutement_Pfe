export interface MenuItem {
  id?: string;
  label: string;
  icon: string;
  route?: string;
  parentId?: string | null;
  sortOrder: number;
  active: boolean;
}

export interface MenuItemDTO extends MenuItem {
  children?: MenuItemDTO[];
  isExpanded?: boolean; // For UI purposes
}
