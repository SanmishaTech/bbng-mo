import { httpClient } from './httpClient';
import { API_CONFIG } from '@/config/api';

/**
 * Main API service for making requests to the backend
 * This service automatically handles authentication, token refresh, and error handling
 */
class ApiService {
  // User related endpoints
  async getUserProfile() {
    return httpClient.get(API_CONFIG.ENDPOINTS.USER_PROFILE, true);
  }

  async updateUserProfile(data: {
    name?: string;
    email?: string;
    [key: string]: any;
  }) {
    return httpClient.put(API_CONFIG.ENDPOINTS.USER_PROFILE, data, true);
  }

  // Generic CRUD operations for any endpoint
  async get<T>(endpoint: string, requiresAuth: boolean = true): Promise<T> {
    return httpClient.get<T>(endpoint, requiresAuth);
  }

  async post<T>(
    endpoint: string,
    data?: any,
    requiresAuth: boolean = true
  ): Promise<T> {
    return httpClient.post<T>(endpoint, data, requiresAuth);
  }

  async put<T>(
    endpoint: string,
    data?: any,
    requiresAuth: boolean = true
  ): Promise<T> {
    return httpClient.put<T>(endpoint, data, requiresAuth);
  }

  async delete<T>(endpoint: string, requiresAuth: boolean = true): Promise<T> {
    return httpClient.delete<T>(endpoint, requiresAuth);
  }

  // Convenience methods for common API patterns
  async fetchList<T>(endpoint: string, params?: Record<string, any>): Promise<T[]> {
    const queryString = params 
      ? '?' + new URLSearchParams(params).toString()
      : '';
    return this.get<T[]>(`${endpoint}${queryString}`);
  }

  async fetchById<T>(endpoint: string, id: string | number): Promise<T> {
    return this.get<T>(`${endpoint}/${id}`);
  }

  async create<T>(endpoint: string, data: any): Promise<T> {
    return this.post<T>(endpoint, data);
  }

  async update<T>(endpoint: string, id: string | number, data: any): Promise<T> {
    return this.put<T>(`${endpoint}/${id}`, data);
  }

  async remove<T>(endpoint: string, id: string | number): Promise<T> {
    return this.delete<T>(`${endpoint}/${id}`);
  }

  // File upload support
  async uploadFile(endpoint: string, file: FormData): Promise<any> {
    return httpClient.request(endpoint, {
      method: 'POST',
      body: file,
      headers: {
        // Don't set Content-Type for FormData, let the browser set it
        'Accept': 'application/json',
      },
    }, true);
  }

  // Batch operations
  async batch<T>(requests: Array<{
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    endpoint: string;
    data?: any;
  }>): Promise<T[]> {
    const promises = requests.map(request => {
      switch (request.method) {
        case 'GET':
          return this.get(request.endpoint);
        case 'POST':
          return this.post(request.endpoint, request.data);
        case 'PUT':
          return this.put(request.endpoint, request.data);
        case 'DELETE':
          return this.delete(request.endpoint);
        default:
          throw new Error(`Unsupported method: ${request.method}`);
      }
    });

    return Promise.all(promises);
  }
}

export const apiService = new ApiService();

// Export for easy importing of specific functions
export const {
  getUserProfile,
  updateUserProfile,
  get,
  post,
  put,
  delete: deleteRequest,
  fetchList,
  fetchById,
  create,
  update,
  remove,
  uploadFile,
  batch,
} = apiService;
