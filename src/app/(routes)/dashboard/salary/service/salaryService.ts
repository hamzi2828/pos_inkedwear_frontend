import axios from 'axios';
import { getAuthHeader } from '@/helper/helper';
import type { CreateSalaryData, UpdateSalaryData, CreatePaymentData } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export const salaryService = {
  // Get all salaries with optional filters
  async getSalaries(filters?: { month?: string; year?: number; employeeId?: string }) {
    try {
      const response = await axios.get(`${API_BASE_URL}/salaries`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        params: filters,
      });
      return response.data?.data ?? response.data ?? [];
    } catch (error) {
      console.error('Error fetching salaries:', error);
      throw error;
    }
  },

  // Get single salary with payment history
  async getSalary(salaryId: string) {
    try {
      const response = await axios.get(`${API_BASE_URL}/salaries/${salaryId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error('Error fetching salary:', error);
      throw error;
    }
  },

  // Create salary record
  async createSalary(salaryData: CreateSalaryData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/salaries`, salaryData, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating salary:', error);
      throw error;
    }
  },

  // Update salary record
  async updateSalary(salaryId: string, salaryData: UpdateSalaryData) {
    try {
      const response = await axios.put(`${API_BASE_URL}/salaries/${salaryId}`, salaryData, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error updating salary:', error);
      throw error;
    }
  },

  // Delete salary record
  async deleteSalary(salaryId: string) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/salaries/${salaryId}`, {
        headers: {
          ...getAuthHeader(),
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting salary:', error);
      throw error;
    }
  },

  // Add payment to salary
  async addPayment(salaryId: string, paymentData: CreatePaymentData) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/salaries/${salaryId}/payments`,
        paymentData,
        {
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error adding payment:', error);
      throw error;
    }
  },

  // Remove payment from salary
  async removePayment(salaryId: string, paymentId: string) {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/salaries/${salaryId}/payments/${paymentId}`,
        {
          headers: {
            ...getAuthHeader(),
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error removing payment:', error);
      throw error;
    }
  },
};
