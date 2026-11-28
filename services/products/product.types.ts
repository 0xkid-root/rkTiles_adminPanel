export interface BackendProductCategory {
  _id: string;
  name: string;
  slug?: string;
  image?: string;
  isActive?: boolean;
  isVisible?: boolean;
}

export interface BackendProduct {
  _id: string;
  name: string;
  slug: string;
  SKU: string;
  category: BackendProductCategory | string;
  description?: string;
  images?: string[];
  size?: string;
  finish?: string;
  surface?: string;
  color?: string;
  price?: number;
  stockQuantity: number;
  lowStockThreshold: number;
  isFeatured?: boolean;
  isActive: boolean;
  isVisible: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductPayload {
  name: string;
  SKU: string;
  category: string;
  description?: string;
  images?: string[];
  size?: string;
  finish?: string;
  surface?: string;
  color?: string;
  price?: number;
  stockQuantity?: number;
  lowStockThreshold?: number;
  isFeatured?: boolean;
  isActive?: boolean;
  isVisible?: boolean;
}

export interface UpdateProductPayload {
  name?: string;
  SKU?: string;
  category?: string;
  description?: string;
  images?: string[];
  size?: string;
  finish?: string;
  surface?: string;
  color?: string;
  price?: number;
  stockQuantity?: number;
  lowStockThreshold?: number;
  isFeatured?: boolean;
  isActive?: boolean;
  isVisible?: boolean;
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  size?: string;
  finish?: string;
  surface?: string;
  color?: string;
  isFeatured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
}
