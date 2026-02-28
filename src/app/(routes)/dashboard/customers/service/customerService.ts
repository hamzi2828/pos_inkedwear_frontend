import axios from 'axios';
import { getAuthHeader } from '@/helper/helper';
import type { CreateCustomerData, UpdateCustomerData } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export const customerService = {
  // Get all customers
  async getCustomers() {
    try {
      const response = await axios.get(`${API_BASE_URL}/customers`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });
      return response.data?.data ?? response.data ?? [];
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  },

  // Get single customer
  async getCustomer(customerId: string) {
    try {
      const response = await axios.get(`${API_BASE_URL}/customers/${customerId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw error;
    }
  },

  // Create customer
  async createCustomer(customerData: CreateCustomerData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/customers`, customerData, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  },

  // Update customer
  async updateCustomer(customerId: string, customerData: UpdateCustomerData) {
    try {
      const response = await axios.put(`${API_BASE_URL}/customers/${customerId}`, customerData, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  },

  // Delete customer
  async deleteCustomer(customerId: string) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/customers/${customerId}`, {
        headers: {
          ...getAuthHeader(),
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  },

  // Update customer status
  async updateCustomerStatus(customerId: string, isActive: boolean) {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/customers/${customerId}/status`,
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
      console.error('Error updating customer status:', error);
      throw error;
    }
  },
};
