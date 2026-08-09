export interface Branch {
  id: string;
  tenant_id: string;
  name: string;
  address: string;
  city: string;
  phone?: string | null;
  is_active: boolean;
  created_at?: string;
}

export interface BranchCreateRequest {
  name: string;
  address: string;
  city: string;
  phone?: string;
}

export interface BranchUpdateRequest {
  name?: string;
  address?: string;
  city?: string;
  phone?: string;
  is_active?: boolean;
}
