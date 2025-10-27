import { apiService } from './apiService';

export interface SubCategory {
  id: number;
  name: string;
  categoryId: number;
  categoryName?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubCategoriesResponse {
  success: boolean;
  data: {
    categories: SubCategory[];
    page: number;
    totalPages: number;
    totalCategories: number;
  };
  status: number;
}

export interface SubCategoryFormData {
  name: string;
  categoryId: number;
}

export interface CategoryOption {
  id: number;
  name: string;
}

// Get all subcategories with pagination, search, and sorting
export const getSubCategories = async (
  page: number = 1,
  limit: number = 10,
  search: string = '',
  sortBy: string = 'name',
  sortOrder: 'asc' | 'desc' = 'asc'
): Promise<SubCategoriesResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sortBy,
    sortOrder,
    search: search || '',
  });

  return apiService.get<SubCategoriesResponse>(`/api/subcategories?${params.toString()}`);
};

// Get a single subcategory by ID
export const getSubCategoryById = async (id: string | number): Promise<SubCategory> => {
  const response = await apiService.get<{ success: boolean; data: SubCategory }>(`/api/subcategories/${id}`);
  return response.data;
};

// Create a new subcategory
export const createSubCategory = async (data: SubCategoryFormData): Promise<SubCategory> => {
  const response = await apiService.post<{ success: boolean; data: SubCategory }>('/api/subcategories', data);
  return response.data;
};

// Update an existing subcategory
export const updateSubCategory = async (id: string | number, data: SubCategoryFormData): Promise<SubCategory> => {
  const response = await apiService.put<{ success: boolean; data: SubCategory }>(`/api/subcategories/${id}`, data);
  return response.data;
};

// Delete a subcategory
export const deleteSubCategory = async (id: number): Promise<void> => {
  await apiService.delete(`/api/subcategories/${id}`);
};

// Get all categories for dropdown
export const fetchAllCategories = async (): Promise<CategoryOption[]> => {
  const response = await apiService.get<{ success: boolean; data: { categories: CategoryOption[] } }>('/api/categories');
  return response.data.categories;
};
