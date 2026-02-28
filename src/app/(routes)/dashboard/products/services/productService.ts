import axios from 'axios';
import { getAuthHeader } from '@/helper/helper';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export interface ProductVariantDTO {
  color: string;
  size: string;
  price: number;
  stock: number;
  sku?: string;
  discountedPrice?: number;
}

export interface ColorMediaData {
  thumbnailUrl?: string;
  bannerUrls: string[];
  thumbName?: string;
}

export interface ProductDTO {
  _id: string;
  name: string;
  slug?: string;
  category: string;
  price: number;
  discountedPrice?: number;
  stock: number;
  status: 'published' | 'draft' | 'out_of_stock';
  featured?: boolean;
  thumbnailUrl?: string;
  bannerUrls?: string[];
  description?: string;
  shortDescription?: string;
  features?: string;
  productType?: 'single' | 'variant';
  variants?: ProductVariantDTO[];
  colorMedia?: Record<string, ColorMediaData>;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  costPrice?: number;
  vendor?: string;
  metaSchema?: string;
}

export interface ProductUI {
  id: string;
  name: string;
  slug?: string;
  category: string;
  price: number;
  discountedPrice?: number;
  stock: number;
  status: 'published' | 'draft' | 'out_of_stock';
  featured?: boolean;
  thumbnailUrl?: string;
  bannerUrls?: string[];
  description?: string;
  shortDescription?: string;
  features?: string;
  productType?: 'single' | 'variant';
  variants?: ProductVariantDTO[];
  colorMedia?: Record<string, ColorMediaData>;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  costPrice?: number;
  vendor?: string;
  metaSchema?: string;
}

function mapToUI(dto: ProductDTO): ProductUI {
  const absolutize = (u?: string) => {
    if (!u) return u;
    // Fix corrupted URLs with /https:// or /http://
    if (u.startsWith('/https://') || u.startsWith('/http://')) {
      return u.substring(1);
    }
    if (/^https?:\/\//i.test(u)) return u;
    // ensure API_BASE_URL present and single slash join
    const base = (API_BASE_URL || '').replace(/\/$/, '');
    const path = u.startsWith('/') ? u : `/${u}`;
    return `${base}${path}`;
  };
  const absBanners = (dto.bannerUrls ?? []).map((u) => absolutize(u)!) as string[];
  return {
    id: dto._id,
    name: dto.name,
    slug: dto.slug,
    category: dto.category,
    price: dto.price,
    discountedPrice: dto.discountedPrice,
    stock: dto.stock,
    status: dto.status,
    featured: dto.featured,
    thumbnailUrl: absolutize(dto.thumbnailUrl),
    bannerUrls: absBanners,
    description: dto.description,
    shortDescription: dto.shortDescription,
    features: dto.features,
    productType: dto.productType,
    variants: dto.variants ?? [],
    // Process colorMedia URLs through absolutize
    colorMedia: dto.colorMedia ? Object.fromEntries(
      Object.entries(dto.colorMedia).map(([color, media]) => [
        color,
        {
          ...media,
          thumbnailUrl: media.thumbnailUrl ? absolutize(media.thumbnailUrl) : undefined,
          bannerUrls: (media.bannerUrls || []).map((url: string) => absolutize(url)!),
        }
      ])
    ) : undefined,
    metaTitle: dto.metaTitle,
    metaDescription: dto.metaDescription,
    metaKeywords: dto.metaKeywords,
    metaSchema: dto.metaSchema,
    costPrice: dto.costPrice,
    vendor: dto.vendor,
  };
}

export const productService = {
  async listProducts(): Promise<ProductUI[]> {
    try {
      const res = await axios.get(`${API_BASE_URL}/products`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });
      const data = res.data?.data ?? res.data ?? [];
      if (Array.isArray(data)) {
        return (data as ProductDTO[]).map(mapToUI);
      }
      return [];
    } catch (err) {
      console.error('Error fetching products:', err);
      throw err;
    }
  },
  async getProductById(id: string): Promise<ProductUI> {
    try {
      const res = await axios.get(`${API_BASE_URL}/products/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });
      const data = res.data?.data ?? res.data;
      if (!data || typeof data !== 'object') throw new Error('Unexpected getProductById response');
      return mapToUI(data as ProductDTO);
    } catch (err) {
      console.error(`Error fetching product ${id}:`, err);
      throw err;
    }
  },
  async createProduct(formData: FormData): Promise<ProductUI> {
    console.log("formData", formData);
    
    const res = await axios.post(`${API_BASE_URL}/products`, formData, {
      headers: {
        ...getAuthHeader(),
        // Let axios set the correct multipart boundary automatically
        'Content-Type': 'multipart/form-data',
      },
    });
    const data = res.data?.data ?? res.data;
    if (!data || typeof data !== 'object') throw new Error('Unexpected createProduct response');
    return mapToUI(data as ProductDTO);
  },
  async updateProduct(id: string, formData: FormData): Promise<ProductUI> {
    const res = await axios.put(`${API_BASE_URL}/products/${id}`, formData, {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'multipart/form-data',
      },
    });
    const data = res.data?.data ?? res.data;
    if (!data || typeof data !== 'object') throw new Error('Unexpected updateProduct response');
    return mapToUI(data as ProductDTO);
  },
  async deleteProduct(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/products/${id}`, {
      headers: {
        ...getAuthHeader(),
      },
    });
  },
  async toggleProductStatus(id: string, status: 'published' | 'draft'): Promise<ProductUI> {
    try {
      // Try the PATCH endpoint first
      const res = await axios.patch(`${API_BASE_URL}/products/${id}/status`, 
        { status }, 
        {
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
        }
      );
      const data = res.data?.data ?? res.data;
      if (!data || typeof data !== 'object') throw new Error('Unexpected toggleProductStatus response');
      return mapToUI(data as ProductDTO);
    } catch (error: any) {
      // If PATCH /status endpoint doesn't exist, try using the general PUT update endpoint
      if (error.response?.status === 404) {
        console.log('Status endpoint not found, trying general update endpoint');
        const formData = new FormData();
        formData.append('status', status);
        
        const res = await axios.put(`${API_BASE_URL}/products/${id}`, formData, {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'multipart/form-data',
          },
        });
        const data = res.data?.data ?? res.data;
        if (!data || typeof data !== 'object') throw new Error('Unexpected updateProduct response');
        return mapToUI(data as ProductDTO);
      }
      throw error;
    }
  },
  async toggleFeatured(id: string, featured: boolean): Promise<ProductUI> {
    const formData = new FormData();
    formData.append('featured', featured.toString());
    
    const res = await axios.put(`${API_BASE_URL}/products/${id}`, formData, {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'multipart/form-data',
      },
    });
    const data = res.data?.data ?? res.data;
    if (!data || typeof data !== 'object') throw new Error('Unexpected toggleFeatured response');
    return mapToUI(data as ProductDTO);
  },
};
