import { get, post, del, apiService } from './apiService';

export interface Training {
  id: number;
  date: string;
  title: string;
  time: string;
  venue: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingResponse {
  trainings: Training[];
  page: number;
  totalPages: number;
  totalTrainings: number;
}

export interface TrainingFormData {
  date: string;
  title: string;
  time: string;
  venue: string;
}

/**
 * Fetch trainings with pagination, sorting, and search
 */
export const getTrainings = async (
  page: number = 1,
  sortBy: string = 'date',
  sortOrder: string = 'desc',
  search: string = '',
  limit: number = 10
): Promise<TrainingResponse> => {
  const response = await get<{ success: boolean; data: TrainingResponse }>(
    `/api/trainings?page=${page}&sortBy=${sortBy}&sortOrder=${sortOrder}&search=${search}&limit=${limit}`
  );
  return response.data;
};

/**
 * Fetch a single training by ID
 */
export const getTrainingById = async (id: number): Promise<Training> => {
  const response = await get<{ success: boolean; data: Training }>(`/api/trainings/${id}`);
  return response.data;
};

/**
 * Create a new training
 */
export const createTraining = async (data: TrainingFormData): Promise<Training> => {
  const response = await post<{ success: boolean; data: Training }>('/api/trainings', data);
  return response.data;
};

/**
 * Update an existing training
 */
export const updateTraining = async (id: number, data: TrainingFormData): Promise<Training> => {
  const response = await apiService.put<{ success: boolean; data: Training }>(`/api/trainings/${id}`, data);
  return response.data;
};

/**
 * Delete a training
 */
export const deleteTraining = async (id: number): Promise<void> => {
  await del(`/api/trainings/${id}`);
};
