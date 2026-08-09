import { api } from './api';
import { Branch, BranchCreateRequest, BranchUpdateRequest } from '../types/branch';

export const branchService = {
  async getBranches(): Promise<Branch[]> {
    const response = await api.get<Branch[]>('/branches');
    return response.data;
  },

  async getPublicBranches(): Promise<Branch[]> {
    const response = await api.get<Branch[]>('/branches/public');
    return response.data || [];
  },

  async getBranchById(id: string): Promise<Branch> {
    const response = await api.get<Branch>(`/branches/${id}`);
    return response.data;
  },

  async createBranch(data: BranchCreateRequest): Promise<Branch> {
    const response = await api.post<Branch>('/branches', data);
    return response.data;
  },

  async updateBranch(id: string, data: BranchUpdateRequest): Promise<Branch> {
    const response = await api.put<Branch>(`/branches/${id}`, data);
    return response.data;
  },

  async deleteBranch(id: string): Promise<void> {
    await api.delete(`/branches/${id}`);
  },
};
