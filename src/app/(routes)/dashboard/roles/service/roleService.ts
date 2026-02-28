import axios from 'axios';
import { getAuthHeader } from '@/helper/helper';
import type { CreateRoleData, UpdateRoleData } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export const roleService = {
  // Get all roles
  async getRoles() {
    try {
      const response = await axios.get(`${API_BASE_URL}/roles`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });
      return response.data?.data ?? response.data ?? [];
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  },

  // Get single role
  async getRole(roleId: string) {
    try {
      const response = await axios.get(`${API_BASE_URL}/roles/${roleId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error('Error fetching role:', error);
      throw error;
    }
  },

  // Create role
  async createRole(roleData: CreateRoleData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/roles`, roleData, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating role:', error);
      throw error;
    }
  },

  // Update role
  async updateRole(roleId: string, roleData: UpdateRoleData) {
    try {
      const response = await axios.put(`${API_BASE_URL}/roles/${roleId}`, roleData, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error updating role:', error);
      throw error;
    }
  },

  // Delete role
  async deleteRole(roleId: string) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/roles/${roleId}`, {
        headers: {
          ...getAuthHeader(),
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting role:', error);
      throw error;
    }
  },

  // Update role status
  async updateRoleStatus(roleId: string, isActive: boolean) {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/roles/${roleId}/status`,
        { isActive },
        {
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating role status:', error);
      throw error;
    }
  },
};
