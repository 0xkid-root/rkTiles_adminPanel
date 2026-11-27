export interface BackendCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  displayOrder?: number;
  isActive: boolean;
  isVisible?: boolean;
  productCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCategoryPayload {
  name: string;
  description?: string;
  image?: string;
  displayOrder?: number;
  isActive?: boolean;
  isVisible?: boolean;
}

export interface UpdateCategoryPayload {
  name?: string;
  description?: string;
  image?: string;
  displayOrder?: number;
  isActive?: boolean;
  isVisible?: boolean;
}
