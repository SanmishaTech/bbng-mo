import { apiService } from './apiService';

export interface Chapter {
  id: number;
  name: string;
  zoneId: number;
  zoneName?: string;
  locationId: number;
  locationName?: string;
  date: string;
  meetingday: string;
  status: boolean;
  venue: string;
  bankopeningbalance?: number | null;
  bankclosingbalance?: number | null;
  cashopeningbalance?: number | null;
  cashclosingbalance?: number | null;
  createdAt?: string;
  updatedAt?: string;
  location?: {
    id: number;
    location: string;
  };
  zones?: {
    id: number;
    name: string;
  };
}

export interface ChaptersResponse {
  success: boolean;
  data: {
    chapters: Chapter[];
    page: number;
    totalPages: number;
    totalChapters: number;
  };
  status: number;
}

export interface ChapterFormData {
  name: string;
  zoneId: number;
  locationId: number;
  date: string;
  meetingday: string;
  status: boolean;
  venue: string;
  bankopeningbalance?: number | null;
  bankclosingbalance?: number | null;
  cashopeningbalance?: number | null;
  cashclosingbalance?: number | null;
}

export interface ZoneOption {
  id: number;
  name: string;
}

export interface LocationOption {
  id: number;
  location: string;
  zoneId: number;
}

// Get all chapters with pagination, search, and sorting
export const getChapters = async (
  page: number = 1,
  limit: number = 10,
  search: string = '',
  sortBy: string = 'name',
  sortOrder: 'asc' | 'desc' = 'asc'
): Promise<ChaptersResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sortBy,
    sortOrder,
    search: search || '',
  });

  return apiService.get<ChaptersResponse>(`/api/chapters?${params.toString()}`);
};

// Get a single chapter by ID
export const getChapterById = async (id: string | number): Promise<Chapter> => {
  const response = await apiService.get<{ success: boolean; data: Chapter }>(`/api/chapters/${id}`);
  return response.data;
};

// Create a new chapter
export const createChapter = async (data: ChapterFormData): Promise<Chapter> => {
  const response = await apiService.post<{ success: boolean; data: Chapter }>('/api/chapters', data);
  return response.data;
};

// Update an existing chapter
export const updateChapter = async (id: string | number, data: ChapterFormData): Promise<Chapter> => {
  const response = await apiService.put<{ success: boolean; data: Chapter }>(`/api/chapters/${id}`, data);
  return response.data;
};

// Delete a chapter
export const deleteChapter = async (id: number): Promise<void> => {
  await apiService.delete(`/api/chapters/${id}`);
};

// Get all zones for dropdown
export const fetchAllZones = async (): Promise<ZoneOption[]> => {
  const response = await apiService.get<{ success: boolean; data: { zones: ZoneOption[] } }>('/api/zones');
  return response.data.zones;
};

// Get all locations for dropdown
export const fetchAllLocations = async (): Promise<LocationOption[]> => {
  const response = await apiService.get<{ success: boolean; data: { locations: LocationOption[] } }>('/api/locations');
  return response.data.locations;
};
