export interface Permission {
  id?: string;
  role: string;
  menuItemIds: string[];
}

export interface PermissionRequest {
  role: string;
  menuItemIds: string[];
}
