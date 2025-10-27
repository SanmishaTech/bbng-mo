import { apiService } from './apiService';

export interface State {
  id: number;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StatesResponse {
  success: boolean;
  data: {
    states: State[];
    page: number;
    totalPages: number;
    totalStates: number;
  };
  status: number;
}

export interface StateFormData {
  name: string;
}

// Get all states with pagination, search, and sorting
export const getStates = async (
  page: number = 1,
  limit: number = 10,
  search: string = '',
  sortBy: string = 'name',
  sortOrder: 'asc' | 'desc' = 'asc'
): Promise<StatesResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sortBy,
    sortOrder,
    ...(search && { search }),
  });

  return apiService.get<StatesResponse>(`/api/states?${params.toString()}`);
};

// Get a single state by ID
export const getStateById = async (id: string | number): Promise<State> => {
  const response = await apiService.get<{ success: boolean; data: State }>(`/api/states/${id}`);
  return response.data;
};

// Create a new state
export const createState = async (data: StateFormData): Promise<State> => {
  const response = await apiService.post<{ success: boolean; data: State }>('/api/states', data);
  return response.data;
};

// Update an existing state
export const updateState = async (id: string | number, data: StateFormData): Promise<State> => {
  const response = await apiService.put<{ success: boolean; data: State }>(`/api/states/${id}`, data);
  return response.data;
};

// Delete a state
export const deleteState = async (id: number): Promise<void> => {
  await apiService.delete(`/api/states/${id}`);
};
