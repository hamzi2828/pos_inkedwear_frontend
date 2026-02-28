import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
import { getAuthHeader } from "@/helper/helper";

export interface CategoryDTO {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  thumbnailUrl?: string;
  bannerUrl?: string;
  active: boolean;
  featured?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryInput {
  name: string;
  slug: string;
  description?: string;
  thumbnailUrl?: string;
  bannerUrl?: string;
  active: boolean;
  featured?: boolean;
}

// Map backend category to frontend shape used in UI
function mapCategory(dto: CategoryDTO) {
  const absolutize = (url?: string) => {
    if (!url) return url;
    if (/^https?:\/\//i.test(url)) return url;
    const base = (API_BASE_URL || '').replace(/\/$/, '');
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${base}${path}`;
  };

  return {
    id: dto._id,
    name: dto.name,
    slug: dto.slug,
    description: dto.description ?? '',
    thumbnailUrl: absolutize(dto.thumbnailUrl),
    bannerUrl: absolutize(dto.bannerUrl),
    active: dto.active,
    featured: dto.featured ?? false,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function isCategoryDTO(v: unknown): v is CategoryDTO {
  if (!isObject(v)) return false;
  return typeof v._id === 'string' && typeof v.name === 'string' && typeof v.slug === 'string' && typeof v.active === 'boolean';
}

export const categoryService = {
  // Fetch all categories
  async listCategories(): Promise<Array<ReturnType<typeof mapCategory>>> {
    try {
      const res = await axios.get(`${API_BASE_URL}/categories`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });
      const data = res.data?.data ?? res.data ?? [];
      // If backend returns array of DTOs
      if (Array.isArray(data)) {
        return (data as unknown[])
          .filter((v) => isCategoryDTO(v))
          .map((c) => mapCategory(c as CategoryDTO));
      }
      return [];
    } catch (err) {
      console.error('Error fetching categories:', err);
      throw err;
    }
  },

  // Create a new category
  async createCategory(payload: CategoryInput | FormData): Promise<ReturnType<typeof mapCategory>> {
    try {
      const isFormData = payload instanceof FormData;
      const headers = isFormData 
        ? { ...getAuthHeader(), 'Content-Type': 'multipart/form-data' }
        : { 'Content-Type': 'application/json', ...getAuthHeader() };

      const res = await axios.post(`${API_BASE_URL}/categories`, payload, { headers });
      const created = res.data?.data ?? res.data;
      if (isCategoryDTO(created)) return mapCategory(created);
      throw new Error('Unexpected createCategory response shape');
    } catch (err) {
      console.error('Error creating category:', err);
      throw err;
    }
  },

  // Update an existing category
  async updateCategory(id: string, payload: Partial<CategoryInput> | FormData): Promise<ReturnType<typeof mapCategory>> {
    try {
      const isFormData = payload instanceof FormData;
      const headers = isFormData 
        ? { ...getAuthHeader(), 'Content-Type': 'multipart/form-data' }
        : { 'Content-Type': 'application/json', ...getAuthHeader() };

      const res = await axios.put(`${API_BASE_URL}/categories/${id}`, payload, { headers });
      const updated = res.data?.data ?? res.data;
      if (isCategoryDTO(updated)) return mapCategory(updated);
      throw new Error('Unexpected updateCategory response shape');
    } catch (err) {
      console.error('Error updating category:', err);
      throw err;
    }
  },

  // Delete a category
  async deleteCategory(id: string): Promise<boolean> {
    try {
      await axios.delete(`${API_BASE_URL}/categories/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });
      return true;
    } catch (err) {
      console.error('Error deleting category:', err);
      throw err;
    }
  },

  // Set active flag (helper around update)
  async setActive(id: string, active: boolean): Promise<ReturnType<typeof mapCategory>> {
    return this.updateCategory(id, { active });
  },

  // Set featured flag (helper around update)
  async setFeatured(id: string, featured: boolean): Promise<ReturnType<typeof mapCategory>> {
    return this.updateCategory(id, { featured });
  },
};
