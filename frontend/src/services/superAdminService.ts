import { api } from './api';
import { User } from '../types/auth';
import { Branch } from '../types/branch';
import { MasterMenuItem } from '../types/menu';

export interface Tenant {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

export interface GlobalTelemetry {
  total_tenants: number;
  total_branches: number;
  total_users: number;
  total_owners: number;
  total_staff: number;
  total_customers: number;
  total_orders: number;
  total_revenue: number;
}

export const superAdminService = {
  async getTelemetry(): Promise<GlobalTelemetry> {
    const response = await api.get<GlobalTelemetry>('/users/super-admin/telemetry');
    return response.data;
  },

  async getTenants(): Promise<Tenant[]> {
    const response = await api.get<Tenant[]>('/users/super-admin/tenants');
    return response.data;
  },

  async getUsers(role?: string): Promise<User[]> {
    const response = await api.get<User[]>('/users/super-admin/users', {
      params: role ? { role } : undefined,
    });
    return response.data;
  },

  async getTenantBranches(tenantId: string): Promise<Branch[]> {
    const response = await api.get<Branch[]>('/branches');
    return response.data.filter((b) => b.tenant_id === tenantId);
  },

  async getTenantMasterMenu(tenantId: string): Promise<MasterMenuItem[]> {
    const response = await api.get<MasterMenuItem[]>(`/menu/master/tenant/${tenantId}`);
    return response.data;
  },
};
