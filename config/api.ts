// API Configuration
export const API_CONFIG = {
  // Base URL for your API - update this to your actual API endpoint
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || "https://bbng.3.7.237.251.sslip.io",

  // API Endpoints
  ENDPOINTS: {
    LOGIN: "/api/auth/login",
    LOGOUT: "/api/auth/logout",
    REFRESH_TOKEN: "/api/auth/refresh",
    USER_PROFILE: "/api/user/profile",
  },

  // Redirect URLs after successful login
  REDIRECT_URLS: {
    DEFAULT: "/(tabs)",
    ADMIN: "/(tabs)/settings",
    USER: "/(tabs)",
  },

  // Request timeout in milliseconds
  TIMEOUT: 10000,

  // Headers
  DEFAULT_HEADERS: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};
