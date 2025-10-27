import { apiService } from './apiService';

export interface Location {
  id: number;
  location: string;
  zoneId?: number;
  zoneName?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LocationsResponse {
  success: boolean;
  data: {
    locations: Location[];
    page: number;
    totalPages: number;
    totalLocations: number;
  };
  status: number;
}

export interface LocationFormData {
  location: string;
  zoneId?: number;
}

export interface ZoneOption {
  id: number;
  name: string;
}

// Get all locations with pagination, search, and sorting
export const getLocations = async (
  page: number = 1,
  limit: number = 10,
  search: string = '',
  sortBy: string = 'location',
  sortOrder: 'asc' | 'desc' = 'asc',
  active: string = 'all'
): Promise<LocationsResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sortBy,
    sortOrder,
    search: search || '',
    active,
  });

  return apiService.get<LocationsResponse>(`/api/locations?${params.toString()}`);
};

// Get a single location by ID
export const getLocationById = async (id: string | number): Promise<Location> => {
  const response = await apiService.get<{ success: boolean; data: Location }>(`/api/locations/${id}`);
  return response.data;
};

// Create a new location
export const createLocation = async (data: LocationFormData): Promise<Location> => {
  const response = await apiService.post<{ success: boolean; data: Location }>('/api/locations', data);
  return response.data;
};

// Update an existing location
export const updateLocation = async (id: string | number, data: LocationFormData): Promise<Location> => {
  const response = await apiService.put<{ success: boolean; data: Location }>(`/api/locations/${id}`, data);
  return response.data;
};

// Delete a location
export const deleteLocation = async (id: number): Promise<void> => {
  await apiService.delete(`/api/locations/${id}`);
};

// Toggle location active status
export const toggleLocationStatus = async (id: number, active: boolean): Promise<void> => {
  await apiService.patch(`/api/locations/${id}/status`, { active: !active });
};

// Get all zones for dropdown
export const fetchAllZones = async (): Promise<ZoneOption[]> => {
  const response = await apiService.get<{ success: boolean; data: { zones: ZoneOption[] } }>('/api/zones');
  return response.data.zones;
};
