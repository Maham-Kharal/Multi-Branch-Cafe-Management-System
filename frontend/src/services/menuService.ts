import { api } from './api';
import {
  BranchMenuItem,
  BranchMenuItemCreate,
  BranchMenuItemUpdate,
  MasterMenuItem,
  MasterMenuItemCreate,
} from '../types/menu';

export const menuService = {
  // Master Menu Catalog
  async getMasterMenu(): Promise<MasterMenuItem[]> {
    const response = await api.get<MasterMenuItem[]>('/menu/master');
    return response.data;
  },

  async getMasterMenuByTenant(tenantId: string): Promise<MasterMenuItem[]> {
    const response = await api.get<MasterMenuItem[]>(`/menu/master/tenant/${tenantId}`);
    return response.data;
  },

  async createMasterMenuItem(data: MasterMenuItemCreate): Promise<MasterMenuItem> {
    const response = await api.post<MasterMenuItem>('/menu/master', data);
    return response.data;
  },

  async updateMasterMenuItem(id: string, data: Partial<MasterMenuItemCreate> & { is_active?: boolean }): Promise<MasterMenuItem> {
    const response = await api.put<MasterMenuItem>(`/menu/master/${id}`, data);
    return response.data;
  },

  async deleteMasterMenuItem(id: string): Promise<void> {
    await api.delete(`/menu/master/${id}`);
  },

  // Branch Menu Items
  async getBranchMenu(branchId: string): Promise<BranchMenuItem[]> {
    const response = await api.get<BranchMenuItem[]>(`/menu/branch/${branchId}`);
    return response.data;
  },

  async addBranchMenuItem(data: BranchMenuItemCreate): Promise<BranchMenuItem> {
    const response = await api.post<BranchMenuItem>('/menu/branch', data);
    return response.data;
  },

  async updateBranchMenuItem(itemId: string, data: BranchMenuItemUpdate): Promise<BranchMenuItem> {
    const response = await api.patch<BranchMenuItem>(`/menu/branch/${itemId}`, data);
    return response.data;
  },

  async deleteBranchMenuItem(itemId: string): Promise<void> {
    await api.delete(`/menu/branch/${itemId}`);
  },
};
