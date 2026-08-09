export interface MasterMenuItem {
  id: string;
  tenant_id: string;
  name: string;
  description?: string | null;
  category: string;
  base_price: number;
  image_url?: string | null;
  is_active: boolean;
}

export interface MasterMenuItemCreate {
  name: string;
  description?: string;
  category: string;
  base_price: number;
  image_url?: string;
}

export interface BranchMenuItem {
  id: string;
  branch_id: string;
  master_menu_item_id?: string | null;
  name: string;
  category: string;
  effective_price: number;
  price_override?: number | null;
  is_available: boolean;
}

export interface BranchMenuItemCreate {
  branch_id: string;
  master_menu_item_id?: string;
  name?: string;
  category?: string;
  price_override?: number;
  is_available?: boolean;
}

export interface BranchMenuItemUpdate {
  price_override?: number | null;
  is_available?: boolean;
}
