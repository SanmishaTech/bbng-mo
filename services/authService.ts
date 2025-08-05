import { API_CONFIG, getApiUrl } from "@/config/api";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data?: {
    user: {
      id: number;
      email: string;
      name: string;
      role?: string;
      active?: boolean;
      lastLogin?: string;
      createdAt?: string;
      updatedAt?: string;
      policyAccepted?: boolean;
      policyAcceptedAt?: string | null;
      policyAcceptedVersion?: string | null;
      memberId?: string | null;
      member?: any;
    };
    token: string;
    refreshToken?: string;
    redirectUrl?: string;
    message?: string;
    roles?: any[];
    accessibleChapters?: any[];
    requiresPolicyAcceptance?: boolean;
    memberDetails?: any;
  };
  message?: string;
  error?: string;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  responseBody?: any; // Full response body for debugging
}

class AuthService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    allowErrorResponses: boolean = false
  ): Promise<T> {
    const url = getApiUrl(endpoint);

    const config: RequestInit = {
      ...options,
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
        ...options.headers,
      },
    };

    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
    config.signal = controller.signal;

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      // For auth endpoints, we want to process error responses (like 401) as valid responses
      if (!response.ok && !allowErrorResponses) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          message:
            errorData.message ||
            `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
          code: errorData.code,
          responseBody: errorData, // Include the full response body
        } as ApiError;
      }

      // Always try to parse JSON response, even for error status codes
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === "AbortError") {
        throw {
          message: "Request timeout",
          status: 408,
          code: "TIMEOUT",
        } as ApiError;
      }

      if (error.message?.includes("Network request failed")) {
        throw {
          message: "Network error. Please check your connection.",
          status: 0,
          code: "NETWORK_ERROR",
        } as ApiError;
      }

      throw error;
    }
  }

  async login(
    credentials: LoginRequest
  ): Promise<LoginResponse & { validationErrors?: any }> {
    try {
      const response = await this.makeRequest<any>(
        API_CONFIG.ENDPOINTS.LOGIN,
        {
          method: "POST",
          body: JSON.stringify(credentials),
        },
        true // Allow error responses (like 401) to be processed as valid responses
      );

      console.log("Raw API response:", response);

      // Handle successful response
      if (response.success === true) {
        return response as LoginResponse;
      }

      // Handle API error response structure
      if (response.success === false) {
        let errorMessage = "Login failed";
        let validationErrors = null;

        // Log the full error response structure for debugging
        console.log("API Error Response Structure:", JSON.stringify(response, null, 2));

        // Extract error message from different possible structures
        if (response.error) {
          if (typeof response.error === "string") {
            errorMessage = response.error;
          } else if (response.error.message) {
            errorMessage = response.error.message;
          } else if (typeof response.error === "object") {
            // Handle other nested error structures
            errorMessage = JSON.stringify(response.error);
          }
        } else if (response.errors) {
          if (typeof response.errors === "string") {
            errorMessage = response.errors;
          } else if (response.errors.message) {
            errorMessage = response.errors.message;
          } else if (typeof response.errors === "object") {
            // Handle other nested error structures
            errorMessage = JSON.stringify(response.errors);
          }
        } else if (response.message) {
          errorMessage = response.message;
        }

        // Check for validation errors (usually in a different field)
        if (response.validationErrors || response.validation_errors) {
          validationErrors =
            response.validationErrors || response.validation_errors;
        }

        // Include the full response for debugging
        const result: any = {
          success: false,
          error: errorMessage,
          validationErrors,
        };
        
        // Attach the full response for debugging purposes
        if (process.env.NODE_ENV === 'development') {
          result._debug = {
            fullResponse: response,
            status: response.status,
          };
        }

        return result;
      }

      // Fallback for unexpected response structure
      return {
        success: false,
        error: "Unexpected response from server",
      };
    } catch (error: any) {
      console.error("Login API network error:", error);
      
      // Log the full response body if available
      if (error.responseBody) {
        console.error("Error response body:", error.responseBody);
      }

      // Handle network/connection errors
      if (error && typeof error === "object") {
        if (error.status) {
          // Include response body data in the return if available
          const result: any = {
            success: false,
            error: error.message || "Network error occurred",
          };
          
          // Extract validation errors from response body if present
          if (error.responseBody) {
            if (error.responseBody.validationErrors || error.responseBody.validation_errors) {
              result.validationErrors = error.responseBody.validationErrors || error.responseBody.validation_errors;
            }
            // Include any other error details from the response
            if (error.responseBody.errors) {
              result.errors = error.responseBody.errors;
            }
          }
          
          return result;
        }

        if (error.message) {
          return {
            success: false,
            error: error.message,
          };
        }
      }

      return {
        success: false,
        error: "An unexpected error occurred. Please try again.",
      };
    }
  }

  async logout(token: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await this.makeRequest<{
        success: boolean;
        message?: string;
      }>(API_CONFIG.ENDPOINTS.LOGOUT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response;
    } catch (error) {
      console.error("Logout API error:", error);
      return {
        success: false,
        message: "Logout failed, but local session will be cleared.",
      };
    }
  }

  async refreshToken(refreshToken: string): Promise<{
    success: boolean;
    token?: string;
    refreshToken?: string;
    error?: string;
  }> {
    try {
      const response = await this.makeRequest<{
        success: boolean;
        token?: string;
        refreshToken?: string;
      }>(API_CONFIG.ENDPOINTS.REFRESH_TOKEN, {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      });

      return response;
    } catch (error: any) {
      console.error("Token refresh error:", error);
      return {
        success: false,
        error: error?.message || "Token refresh failed",
      };
    }
  }
}

export const authService = new AuthService();
