export type UserRole = 'SUPER_ADMIN' | 'CAFE_OWNER' | 'BRANCH_STAFF' | 'CUSTOMER';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  tenant_id?: string | null;
  branch_id?: string | null;
  is_active: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  email: string;
  role: UserRole;
  tenant_id?: string | null;
  branch_id?: string | null;
}

export interface UserLoginRequest {
  email: string;
  password: string;
}

export interface UserRegisterRequest {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
  tenant_name?: string;
  branch_id?: string;
}
