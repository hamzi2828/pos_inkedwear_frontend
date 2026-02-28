import axios from 'axios';
import { getAuthHeader } from '@/helper/helper';
import type { CreateBankData, UpdateBankData } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export const bankService = {
  // Get all banks
  async getBanks() {
    try {
      const response = await axios.get(`${API_BASE_URL}/banks`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });
      return response.data?.data ?? response.data ?? [];
    } catch (error) {
      console.error('Error fetching banks:', error);
      throw error;
    }
  },

  // Get single bank
  async getBank(bankId: string) {
    try {
      const response = await axios.get(`${API_BASE_URL}/banks/${bankId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error('Error fetching bank:', error);
      throw error;
    }
  },

  // Create bank
  async createBank(bankData: CreateBankData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/banks`, bankData, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating bank:', error);
      throw error;
    }
  },

  // Update bank
  async updateBank(bankId: string, bankData: UpdateBankData) {
    try {
      const response = await axios.put(`${API_BASE_URL}/banks/${bankId}`, bankData, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error updating bank:', error);
      throw error;
    }
  },

  // Delete bank
  async deleteBank(bankId: string) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/banks/${bankId}`, {
        headers: {
          ...getAuthHeader(),
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting bank:', error);
      throw error;
    }
  },

  // Update bank status
  async updateBankStatus(bankId: string, isActive: boolean) {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/banks/${bankId}/status`,
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
      console.error('Error updating bank status:', error);
      throw error;
    }
  },
};
