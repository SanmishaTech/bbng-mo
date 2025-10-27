import { apiService } from './apiService';

export interface Category {
  id: number;
  name: string;
  description?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoriesResponse {
  success: boolean;
  data: {
    categories: Category[];
    page: number;
    totalPages: number;
    totalCategories: number;
  };
  status: number;
}

export interface CategoryFormData {
  name: string;
  description?: string;
}

// Get all categories with pagination, search, and sorting
export const getCategories = async (
  page: number = 1,
  limit: number = 10,
  search: string = '',
  sortBy: string = 'name',
  sortOrder: 'asc' | 'desc' = 'asc'
): Promise<CategoriesResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sortBy,
    sortOrder,
    search: search || '',
  });

  return apiService.get<CategoriesResponse>(`/api/categories?${params.toString()}`);
};

// Get a single category by ID
export const getCategoryById = async (id: string | number): Promise<Category> => {
  const response = await apiService.get<{ success: boolean; data: Category }>(`/api/categories/${id}`);
  return response.data;
};

// Create a new category
export const createCategory = async (data: CategoryFormData): Promise<Category> => {
  const response = await apiService.post<{ success: boolean; data: Category }>('/api/categories', data);
  return response.data;
};

// Update an existing category
export const updateCategory = async (id: string | number, data: CategoryFormData): Promise<Category> => {
  const response = await apiService.put<{ success: boolean; data: Category }>(`/api/categories/${id}`, data);
  return response.data;
};

// Delete a category
export const deleteCategory = async (id: number): Promise<void> => {
  await apiService.delete(`/api/categories/${id}`);
};
