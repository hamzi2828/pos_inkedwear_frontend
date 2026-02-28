import axios from 'axios';
import { getAuthHeader } from '@/helper/helper';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export interface CarBrand {
  _id: string;
  name: string;
  models: string[];
}

export const carBrandService = {
  // Get all car brands with models
  async getAllBrands(): Promise<CarBrand[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/car-brands`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data?.data ?? [];
    } catch (error) {
      console.error('Error fetching car brands:', error);
      throw error;
    }
  },

  // Get models for a specific brand
  async getModelsByBrand(brandName: string): Promise<string[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/car-brands/${encodeURIComponent(brandName)}/models`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data?.data ?? [];
    } catch (error) {
      console.error('Error fetching models:', error);
      throw error;
    }
  },

  // Search brands and models
  async searchBrands(query: string): Promise<CarBrand[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/car-brands/search`, {
        params: { q: query },
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data?.data ?? [];
    } catch (error) {
      console.error('Error searching brands:', error);
      throw error;
    }
  },

  // Add new brand (admin)
  async createBrand(name: string, models: string[] = []): Promise<CarBrand> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/car-brands`,
        { name, models },
        {
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
        }
      );
      return response.data?.data;
    } catch (error) {
      console.error('Error creating brand:', error);
      throw error;
    }
  },

  // Add model to brand (admin)
  async addModelToBrand(brandId: string, model: string): Promise<CarBrand> {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/car-brands/${brandId}/models`,
        { model },
        {
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
        }
      );
      return response.data?.data;
    } catch (error) {
      console.error('Error adding model:', error);
      throw error;
    }
  },
};
