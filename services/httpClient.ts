import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, getApiUrl } from '@/config/api';

export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
} as const;

class HttpClient {
  private refreshPromise: Promise<string | null> | null = null;

  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private async refreshAuthToken(): Promise<string | null> {
    // Prevent multiple concurrent refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();
    const result = await this.refreshPromise;
    this.refreshPromise = null;
    return result;
  }

  private async performTokenRefresh(): Promise<string | null> {
    try {
      const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (!refreshToken) {
        return null;
      }

      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.REFRESH_TOKEN), {
        method: 'POST',
        headers: API_CONFIG.DEFAULT_HEADERS,
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      
      if (data.success && data.token) {
        await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
        
        if (data.refreshToken) {
          await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
        }
        
        return data.token;
      }

      return null;
    } catch (error) {
      console.error('Token refresh error:', error);
      // Clear invalid tokens
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
      ]);
      return null;
    }
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    requiresAuth: boolean = false
  ): Promise<T> {
    const url = getApiUrl(endpoint);
    let authToken: string | null = null;

    // Get auth token if required
    if (requiresAuth) {
      authToken = await this.getAuthToken();
      if (!authToken) {
        throw {
          message: 'Authentication required',
          status: 401,
          code: 'AUTH_REQUIRED',
        } as ApiError;
      }
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
        ...options.headers,
      },
    };

    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
    config.signal = controller.signal;

    try {
      console.log('HttpClient: Making request to:', url);
      const response = await fetch(url, config);
      clearTimeout(timeoutId);
      
      console.log('HttpClient: Response status:', response.status);

      // Handle 401 errors with token refresh
      if (response.status === 401 && requiresAuth && authToken) {
        const newToken = await this.refreshAuthToken();
        
        if (newToken) {
          // Retry request with new token
          const retryConfig = {
            ...config,
            headers: {
              ...config.headers,
              Authorization: `Bearer ${newToken}`,
            },
          };
          
          const retryResponse = await fetch(url, retryConfig);
          
          if (!retryResponse.ok) {
            const errorData = await retryResponse.json().catch(() => ({}));
            throw {
              message: errorData.message || `HTTP ${retryResponse.status}: ${retryResponse.statusText}`,
              status: retryResponse.status,
              code: errorData.code,
            } as ApiError;
          }
          
          return await retryResponse.json();
        } else {
          // Token refresh failed, user needs to login again
          throw {
            message: 'Session expired. Please login again.',
            status: 401,
            code: 'SESSION_EXPIRED',
          } as ApiError;
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        const apiError: ApiError & { [key: string]: any } = {
          message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
          code: errorData.code,
        };
        
        // Include additional error data for validation errors
        if (response.status === 400) {
          Object.assign(apiError, errorData);
        }
        
        throw apiError;
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw {
          message: 'Request timeout',
          status: 408,
          code: 'TIMEOUT',
        } as ApiError;
      }

      if (error.message?.includes('Network request failed')) {
        throw {
          message: 'Network error. Please check your connection.',
          status: 0,
          code: 'NETWORK_ERROR',
        } as ApiError;
      }

      throw error;
    }
  }

  // Convenience methods
  async get<T>(endpoint: string, requiresAuth: boolean = false): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' }, requiresAuth);
  }

  async post<T>(
    endpoint: string,
    data?: any,
    requiresAuth: boolean = false
  ): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      },
      requiresAuth
    );
  }

  async put<T>(
    endpoint: string,
    data?: any,
    requiresAuth: boolean = false
  ): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      },
      requiresAuth
    );
  }

  async delete<T>(endpoint: string, requiresAuth: boolean = false): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' }, requiresAuth);
  }
}

export const httpClient = new HttpClient();
