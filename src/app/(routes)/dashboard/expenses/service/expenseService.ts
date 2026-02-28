import axios from 'axios';
import { getAuthHeader } from '@/helper/helper';
import type { CreateExpenseData, UpdateExpenseData } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export const expenseService = {
  // Get all expenses
  async getExpenses() {
    try {
      const response = await axios.get(`${API_BASE_URL}/expenses`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });
      return response.data?.data ?? response.data ?? [];
    } catch (error) {
      console.error('Error fetching expenses:', error);
      throw error;
    }
  },

  // Get single expense
  async getExpense(expenseId: string) {
    try {
      const response = await axios.get(`${API_BASE_URL}/expenses/${expenseId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error('Error fetching expense:', error);
      throw error;
    }
  },

  // Get expense summary
  async getExpenseSummary(startDate?: string, endDate?: string) {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await axios.get(
        `${API_BASE_URL}/expenses/summary${params.toString() ? `?${params.toString()}` : ''}`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
        }
      );
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error('Error fetching expense summary:', error);
      throw error;
    }
  },

  // Create expense
  async createExpense(expenseData: CreateExpenseData, receiptFile?: File) {
    try {
      const formData = new FormData();
      formData.append('title', expenseData.title);
      formData.append('amount', String(expenseData.amount));
      formData.append('category', expenseData.category);
      if (expenseData.date) formData.append('date', expenseData.date);
      if (expenseData.paymentMethod) formData.append('paymentMethod', expenseData.paymentMethod);
      if (expenseData.reference) formData.append('reference', expenseData.reference);
      if (expenseData.notes) formData.append('notes', expenseData.notes);
      if (receiptFile) formData.append('receipt', receiptFile);

      const response = await axios.post(`${API_BASE_URL}/expenses`, formData, {
        headers: {
          ...getAuthHeader(),
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    }
  },

  // Update expense
  async updateExpense(expenseId: string, expenseData: UpdateExpenseData, receiptFile?: File, removeReceipt?: boolean) {
    try {
      const formData = new FormData();
      if (expenseData.title !== undefined) formData.append('title', expenseData.title);
      if (expenseData.amount !== undefined) formData.append('amount', String(expenseData.amount));
      if (expenseData.category !== undefined) formData.append('category', expenseData.category);
      if (expenseData.date !== undefined) formData.append('date', expenseData.date);
      if (expenseData.paymentMethod !== undefined) formData.append('paymentMethod', expenseData.paymentMethod);
      if (expenseData.reference !== undefined) formData.append('reference', expenseData.reference);
      if (expenseData.notes !== undefined) formData.append('notes', expenseData.notes);
      if (expenseData.isActive !== undefined) formData.append('isActive', String(expenseData.isActive));
      if (receiptFile) formData.append('receipt', receiptFile);
      if (removeReceipt) formData.append('removeReceipt', 'true');

      const response = await axios.put(`${API_BASE_URL}/expenses/${expenseId}`, formData, {
        headers: {
          ...getAuthHeader(),
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  },

  // Delete expense
  async deleteExpense(expenseId: string) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/expenses/${expenseId}`, {
        headers: {
          ...getAuthHeader(),
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  },

  // Update expense status
  async updateExpenseStatus(expenseId: string, isActive: boolean) {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/expenses/${expenseId}/status`,
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
      console.error('Error updating expense status:', error);
      throw error;
    }
  },
};
