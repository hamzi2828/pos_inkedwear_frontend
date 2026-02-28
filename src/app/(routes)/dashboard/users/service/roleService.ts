import axios from 'axios';
import { getAuthHeader } from '@/helper/helper';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export interface Role {
  _id: string;
  name: string;
  description?: string;
  permissions?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const roleService = {
  // Get all roles
  async getRoles(): Promise<Role[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/roles`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });
      return response.data?.data ?? [];
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  },

  // Get active roles only (for dropdowns)
  async getActiveRoles(): Promise<Role[]> {
    try {
      const roles = await this.getRoles();
      return roles.filter((role) => role.isActive);
    } catch (error) {
      console.error('Error fetching active roles:', error);
      throw error;
    }
  },
};
