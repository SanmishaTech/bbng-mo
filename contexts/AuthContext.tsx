import { API_CONFIG } from "@/config/api";
import {
  authService,
  LoginRequest,
  LoginResponse,
} from "@/services/authService";
import { parseApiValidationErrors } from "@/utils/validation";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

interface User {
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
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{
    success: boolean;
    redirectUrl?: string;
    error?: string;
    validationErrors?: {
      email?: string;
      password?: string;
      [key: string]: string | undefined;
    };
  }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  token: string | null;
  refreshAuthToken: () => Promise<boolean>;
}

const STORAGE_KEYS = {
  USER: "user_data",
  TOKEN: "auth_token",
  REFRESH_TOKEN: "refresh_token",
} as const;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    checkAuthState();
  }, []);

  // Debug auth state changes to identify reload causes
  useEffect(() => {
    console.log("=== AUTH STATE CHANGE ===");
    console.log("User:", user ? "logged in" : "logged out");
    console.log("isLoading:", isLoading);
    console.log("isSigningIn:", isSigningIn);
    console.log("isAuthenticated:", !!user && !!token);
    console.log("========================");
  }, [user, isLoading, isSigningIn, token]);

  const checkAuthState = async () => {
    try {
      const [userData, authToken, refreshToken] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER),
        AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
      ]);

      if (userData && authToken) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setToken(authToken);

        // Try to refresh token if we have a refresh token
        if (refreshToken) {
          try {
            await refreshAuthToken();
          } catch (error) {
            console.warn("Token refresh failed during init:", error);
            // Don't clear data here, let the user stay logged in with current token
          }
        }
      }
    } catch (error) {
      console.error("Error checking auth state:", error);
      // Clear potentially corrupted data
      await clearAuthData();
    } finally {
      setIsLoading(false);
    }
  };

  const clearAuthData = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.USER),
        AsyncStorage.removeItem(STORAGE_KEYS.TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
      ]);
      setUser(null);
      setToken(null);
    } catch (error) {
      console.error("Error clearing auth data:", error);
    }
  };

  const signIn = async (
    email: string,
    password: string
  ): Promise<{
    success: boolean;
    redirectUrl?: string;
    error?: string;
    validationErrors?: {
      email?: string;
      password?: string;
      [key: string]: string | undefined;
    };
  }> => {
    // Prevent multiple simultaneous login attempts
    if (isSigningIn) {
      return { success: false, error: "Login already in progress" };
    }

    try {
      console.log("AuthContext: Starting signIn process");
      setIsSigningIn(true);

      // Handle admin login locally
      // if (email.toLowerCase() === "admin") {
      //   console.log("AuthContext: Admin login attempt detected");

      //   if (password === "admin") {
      //     console.log("AuthContext: Admin credentials correct");

      //     const adminUser: User = {
      //       id: 1,
      //       email: "admin@bbng.com",
      //       name: "Administrator",
      //       role: "admin",
      //       active: true,
      //       lastLogin: new Date().toISOString(),
      //       createdAt: new Date().toISOString(),
      //       updatedAt: new Date().toISOString(),
      //       policyAccepted: true,
      //       policyAcceptedAt: new Date().toISOString(),
      //       policyAcceptedVersion: "1.0",
      //       memberId: null,
      //       member: null,
      //     };

      //     const adminToken = "admin_token_" + Date.now();

      //     // Store admin data locally
      //     await Promise.all([
      //       AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(adminUser)),
      //       AsyncStorage.setItem(STORAGE_KEYS.TOKEN, adminToken),
      //     ]);

      //     setUser(adminUser);
      //     setToken(adminToken);

      //     console.log("AuthContext: Admin login successful");
      //     return {
      //       success: true,
      //       redirectUrl: "/(tabs)/",
      //     };
      //   } else {
      //     console.log("AuthContext: Admin password incorrect");
      //     return {
      //       success: false,
      //       error: "Invalid admin credentials. Please try again.",
      //     };
      //   }
      // }

      // Admin bypass removed - all logins now go through API authentication
      // This ensures valid tokens are used for API requests

      const loginRequest: LoginRequest = { email, password };
      const response = (await authService.login(
        loginRequest
      )) as LoginResponse & { validationErrors?: any };

      console.log("AuthContext: Received response:", {
        success: response.success,
        hasData: !!response.data,
        hasValidationErrors: !!response.validationErrors,
        error: response.error,
        message: response.message,
        fullResponse: response, // Log the complete response for debugging
      });

      if (response.success && response.data) {
        console.log("AuthContext: Login successful, storing user data");
        console.log("AuthContext: Full response data:", JSON.stringify(response.data, null, 2));
        
        // Extract data from the actual API response structure
        const userData = response.data.user;
        const authToken = response.data.token;
        const refreshToken = response.data.refreshToken;
        const redirectUrl = response.data.redirectUrl;

        console.log("AuthContext: User data to store:", JSON.stringify(userData, null, 2));
        console.log("AuthContext: Token:", authToken);

        // Store user data and tokens
        await Promise.all([
          AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData)),
          AsyncStorage.setItem(STORAGE_KEYS.TOKEN, authToken),
          refreshToken
            ? AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
            : Promise.resolve(),
        ]);

        setUser(userData);
        setToken(authToken);

        return {
          success: true,
          redirectUrl: redirectUrl || API_CONFIG.REDIRECT_URLS.DEFAULT,
        };
      }

      // Handle validation errors from API response
      if (response.validationErrors) {
        console.log(
          "AuthContext: Handling validation errors:",
          response.validationErrors
        );
        const validationErrors = parseApiValidationErrors(
          response.validationErrors
        );

        return {
          success: false,
          validationErrors,
          error: response.message || response.error || "Validation failed",
        };
      }

      // Handle general API error messages
      console.log(
        "AuthContext: Login failed with error:",
        response.error || response.message
      );
      return {
        success: false,
        error:
          response.error ||
          response.message ||
          "Login failed. Please try again.",
      };
    } catch (error: any) {
      console.error("AuthContext: Unexpected error in signIn:", error);

      // This should rarely happen now since AuthService handles all errors
      return {
        success: false,
        error: "An unexpected error occurred. Please try again.",
      };
    } finally {
      console.log("AuthContext: Setting isSigningIn to false");
      setIsSigningIn(false);
    }
  };

  const refreshAuthToken = async (): Promise<boolean> => {
    try {
      const refreshToken = await AsyncStorage.getItem(
        STORAGE_KEYS.REFRESH_TOKEN
      );
      if (!refreshToken) {
        return false;
      }

      const response = await authService.refreshToken(refreshToken);

      if (response.success && response.token) {
        await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, response.token);
        setToken(response.token);

        if (response.refreshToken) {
          await AsyncStorage.setItem(
            STORAGE_KEYS.REFRESH_TOKEN,
            response.refreshToken
          );
        }

        return true;
      }

      // If refresh fails, clear auth data
      await clearAuthData();
      return false;
    } catch (error) {
      console.error("Token refresh error:", error);
      await clearAuthData();
      return false;
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);

      // Call logout API if we have a token
      if (token) {
        try {
          await authService.logout(token);
        } catch (error) {
          console.warn("Logout API call failed:", error);
          // Continue with local logout even if API call fails
        }
      }

      await clearAuthData();
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading: isLoading, // Only use app initialization loading, not sign-in loading
    signIn,
    signOut,
    refreshAuthToken,
    isAuthenticated: !!user && !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
