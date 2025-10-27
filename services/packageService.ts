import { apiService } from './apiService';

export interface Package {
  id: number;
  packageName: string;
  periodMonths: number;
  isVenueFee: boolean;
  chapterId?: number;
  chapterName?: string;
  basicFees: number;
  gstRate: number;
  gstAmount: number;
  totalFees: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PackagesResponse {
  success: boolean;
  data: {
    packages: Package[];
    page: number;
    totalPages: number;
    totalPackages: number;
  };
  status: number;
}

export interface PackageFormData {
  packageName: string;
  periodMonths: number;
  isVenueFee: boolean;
  chapterId?: number | null;
  basicFees: number;
  gstRate: number;
  active: boolean;
}

export interface ChapterOption {
  id: number;
  name: string;
}

// Get all packages with pagination, search, and sorting
export const getPackages = async (
  page: number = 1,
  limit: number = 10,
  search: string = '',
  sortBy: string = 'packageName',
  sortOrder: 'asc' | 'desc' = 'asc'
): Promise<PackagesResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sortBy,
    sortOrder,
    search: search || '',
  });

  return apiService.get<PackagesResponse>(`/api/packages?${params.toString()}`);
};

// Get a single package by ID
export const getPackageById = async (id: string | number): Promise<Package> => {
  const response = await apiService.get<{ success: boolean; data: Package }>(`/api/packages/${id}`);
  return response.data;
};

// Create a new package
export const createPackage = async (data: PackageFormData): Promise<Package> => {
  const response = await apiService.post<{ success: boolean; data: Package }>('/api/packages', data);
  return response.data;
};

// Update an existing package
export const updatePackage = async (id: string | number, data: PackageFormData): Promise<Package> => {
  const response = await apiService.put<{ success: boolean; data: Package }>(`/api/packages/${id}`, data);
  return response.data;
};

// Delete a package
export const deletePackage = async (id: number): Promise<void> => {
  await apiService.delete(`/api/packages/${id}`);
};

// Get all chapters for dropdown
export const fetchAllChapters = async (): Promise<ChapterOption[]> => {
  const response = await apiService.get<{ success: boolean; data: { chapters: ChapterOption[] } }>('/api/chapters?limit=100');
  return response.data.chapters;
};
