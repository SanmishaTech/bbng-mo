// Mock service for testing during development
export class MockService {
  static async mockLogin(email: string, password: string) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock validation errors for testing
    if (!email.includes('@')) {
      throw {
        status: 400,
        message: 'Validation failed',
        errors: {
          email: {
            type: 'validation',
            message: 'Invalid Email format'
          }
        },
        error: {
          email: {
            type: 'validation', 
            message: 'Invalid Email format'
          }
        }
      };
    }

    if (password.length < 6) {
      throw {
        status: 400,
        message: 'Validation failed',
        errors: {
          password: {
            type: 'validation',
            message: 'Password must be at least 6 characters'
          }
        },
        error: {
          password: {
            type: 'validation',
            message: 'Password must be at least 6 characters'
          }
        }
      };
    }

    // Mock successful login
    if (email === 'test@example.com' && password === 'password123') {
      return {
        success: true,
        data: {
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
            role: 'user'
          },
          token: 'mock_token_12345',
          refreshToken: 'mock_refresh_token_12345'
        }
      };
    }

    // Mock invalid credentials
    throw {
      status: 401,
      message: 'Invalid credentials',
      success: false
    };
  }
}

// Function to check if we should use mock service
export const shouldUseMockService = () => {
  return __DEV__ && process.env.EXPO_PUBLIC_ENABLE_MOCKS === 'true';
};
