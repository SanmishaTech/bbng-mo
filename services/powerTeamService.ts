import { apiService } from './apiService';
export interface CategorySummary {
  id: number;
  name: string;
}

export interface SubCategorySummary {
  id: number;
  name: string;
  categoryId: number;
}

export interface Category {
  id: number;
  name: string;
  subCategories?: SubCategorySummary[];
}

export interface PowerTeam {
  id: number;
  name: string;
  categories: CategorySummary[];
  subCategories?: SubCategorySummary[];
  createdAt?: string;
  updatedAt?: string;
}


export interface PowerTeamsResponse {
  success: boolean;
  data: {
    powerTeams: PowerTeam[];
    page: number;
    totalPages: number;
    totalPowerTeams: number;
  };
}

export interface PowerTeamFormData {
  name: string;
  categoryIds: number[];
  subCategoryIds?: number[];
}

// Get all power teams with pagination
export const getPowerTeams = async (params: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<PowerTeamsResponse['data']> => {
  const queryParams = new URLSearchParams({
    page: (params.page || 1).toString(),
    limit: (params.limit || 10).toString(),
    search: params.search || '',
  });

  const response = await apiService.get<PowerTeamsResponse>(`/api/powerteams?${queryParams.toString()}`);
  return response.data;
};

// Get a single power team by ID
export const getPowerTeamById = async (id: string | number): Promise<PowerTeam> => {
  const response = await apiService.get<{ success: boolean; data: PowerTeam }>(`/api/powerteams/${id}`);
  return response.data;
};

// Create a new power team
export const createPowerTeam = async (data: PowerTeamFormData): Promise<PowerTeam> => {
  const response = await apiService.post<{ success: boolean; data: PowerTeam }>('/api/powerteams', data);
  return response.data;
};

// Update an existing power team
export const updatePowerTeam = async (id: string | number, data: PowerTeamFormData): Promise<PowerTeam> => {
  const response = await apiService.put<{ success: boolean; data: PowerTeam }>(`/api/powerteams/${id}`, data);
  return response.data;
};

// Delete a power team
export const deletePowerTeam = async (id: number): Promise<void> => {
  await apiService.delete(`/api/powerteams/${id}`);
};

// Get all categories with subcategories
export const getAllCategories = async (): Promise<Category[]> => {
  const response = await apiService.get<{ success: boolean; data: { categories: Category[] } }>('/api/categories?limit=1000&includeSubCategories=true');
  return response.data.categories;
};

// Get subcategories by category ID
export const getSubCategoriesByCategoryId = async (categoryId: number): Promise<SubCategorySummary[]> => {
  const response = await apiService.get<{ success: boolean; data: SubCategorySummary[] }>(`/api/subcategories/category/${categoryId}`);
  return response.data || [];
};
