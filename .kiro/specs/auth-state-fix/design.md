# Design Document

## Overview

This design addresses critical authentication state management issues in the React Native application that cause page reloading and infinite re-renders. The solution focuses on fixing state management logic, consolidating loading states, preventing navigation loops, and adding proper debugging capabilities.

The current AuthContext implementation has several architectural flaws:

- Unused `isSigningIn` state that should be consolidated with `isLoading`
- Missing guards against multiple simultaneous login attempts
- Navigation logic in `_layout.tsx` that can trigger loops
- Insufficient debugging visibility for state transitions

## Architecture

### Current State Management Issues

The AuthContext currently maintains multiple loading states:

- `isLoading`: Used for initial auth check and signOut
- `isSigningIn`: Used during login process but not exposed in context value

This creates inconsistency where the UI shows `isLoading` but login operations use `isSigningIn`, leading to UI state mismatches.

### Proposed State Management Architecture

```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean; // Consolidated loading state
  isInitialized: boolean; // Track if initial auth check completed
}

interface AuthActions {
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  refreshAuthToken: () => Promise<boolean>;
}
```

### Navigation Control Architecture

The navigation logic in `_layout.tsx` needs to be refactored to prevent loops:

```typescript
interface NavigationState {
  hasInitialized: boolean;
  lastAuthState: boolean | null;
}
```

## Components and Interfaces

### 1. Enhanced AuthContext Interface

```typescript
interface AuthContextType {
  // State
  user: User | null;
  token: string | null;
  isLoading: boolean; // Consolidated loading state
  isAuthenticated: boolean;
  isInitialized: boolean; // New: tracks if auth check completed

  // Actions
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  refreshAuthToken: () => Promise<boolean>;

  // Debug utilities (development only)
  debugState?: AuthDebugState;
}

interface AuthResult {
  success: boolean;
  redirectUrl?: string;
  error?: string;
  validationErrors?: ValidationErrors;
}

interface AuthDebugState {
  lastStateChange: string;
  stateHistory: AuthStateChange[];
}
```

### 2. State Management Hooks

```typescript
// Custom hook for managing auth state transitions
const useAuthState = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isInitialized: false,
  });

  const updateState = (updates: Partial<AuthState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  return { state, updateState };
};
```

### 3. Navigation Guard Component

```typescript
// Component to handle navigation logic with proper guards
const AuthNavigationGuard: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, isLoading, isInitialized } = useAuth();
  const [navigationState, setNavigationState] = useState({
    hasInitialized: false,
    lastAuthState: null as boolean | null,
  });

  // Navigation logic with proper guards
  useEffect(() => {
    if (!isInitialized) return; // Wait for auth initialization

    // Prevent navigation loops by checking state changes
    if (navigationState.lastAuthState === isAuthenticated) return;

    // Handle navigation...
  }, [isAuthenticated, isInitialized]);

  return children;
};
```

## Data Models

### Authentication State Model

```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isInitialized: boolean;
}

interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
}
```

### State Transition Model

```typescript
interface AuthStateTransition {
  from: Partial<AuthState>;
  to: Partial<AuthState>;
  action: "INIT" | "SIGN_IN" | "SIGN_OUT" | "REFRESH_TOKEN";
  timestamp: number;
}
```

### Debug State Model

```typescript
interface AuthDebugState {
  currentState: AuthState;
  lastTransition: AuthStateTransition;
  transitionHistory: AuthStateTransition[];
  navigationEvents: NavigationEvent[];
}

interface NavigationEvent {
  type: "REDIRECT" | "REPLACE" | "PUSH";
  from: string;
  to: string;
  reason: string;
  timestamp: number;
}
```

## Error Handling

### 1. State Management Errors

```typescript
class AuthStateError extends Error {
  constructor(
    message: string,
    public code: "INVALID_TRANSITION" | "STORAGE_ERROR" | "NETWORK_ERROR",
    public context?: any
  ) {
    super(message);
    this.name = "AuthStateError";
  }
}
```

### 2. Navigation Loop Prevention

```typescript
const NavigationGuard = {
  maxRedirects: 3,
  redirectHistory: [] as string[],

  canNavigate(to: string): boolean {
    const recentRedirects = this.redirectHistory.slice(-this.maxRedirects);
    return !recentRedirects.includes(to);
  },

  recordNavigation(to: string) {
    this.redirectHistory.push(to);
    if (this.redirectHistory.length > this.maxRedirects * 2) {
      this.redirectHistory = this.redirectHistory.slice(-this.maxRedirects);
    }
  },
};
```

### 3. Concurrent Operation Prevention

```typescript
class OperationLock {
  private operations = new Set<string>();

  async execute<T>(key: string, operation: () => Promise<T>): Promise<T> {
    if (this.operations.has(key)) {
      throw new AuthStateError(
        "Operation already in progress",
        "INVALID_TRANSITION"
      );
    }

    this.operations.add(key);
    try {
      return await operation();
    } finally {
      this.operations.delete(key);
    }
  }
}
```

## Testing Strategy

### 1. Unit Tests

**AuthContext State Management:**

- Test state transitions (loading → authenticated → unauthenticated)
- Test concurrent operation prevention
- Test error handling and recovery
- Test storage operations

**Navigation Logic:**

- Test initial route determination
- Test auth state change navigation
- Test navigation loop prevention
- Test edge cases (rapid state changes)

### 2. Integration Tests

**Authentication Flow:**

- Test complete login flow with state changes
- Test logout flow with cleanup
- Test token refresh scenarios
- Test error scenarios (network failures, invalid tokens)

**Navigation Integration:**

- Test navigation behavior during auth state changes
- Test deep linking with authentication
- Test app backgrounding/foregrounding scenarios

### 3. Debug Testing

**State Visibility:**

- Test debug state tracking
- Test state transition logging
- Test navigation event logging
- Test error state debugging

### 4. Performance Tests

**Re-render Prevention:**

- Test that state changes only trigger necessary re-renders
- Test that navigation doesn't cause infinite loops
- Test memory usage during state transitions
- Test app startup performance

## Implementation Phases

### Phase 1: State Management Consolidation

- Consolidate `isLoading` and `isSigningIn` states
- Add `isInitialized` tracking
- Implement operation locking for concurrent requests
- Add state transition logging

### Phase 2: Navigation Loop Prevention

- Refactor `_layout.tsx` navigation logic
- Add navigation guards and loop detection
- Implement proper dependency management in useEffect
- Add navigation event logging

### Phase 3: Debug and Monitoring

- Add comprehensive debug state tracking
- Implement state transition history
- Add navigation event monitoring
- Create debug utilities for development

### Phase 4: Error Handling Enhancement

- Improve error boundaries for auth failures
- Add retry mechanisms for network errors
- Implement graceful degradation for storage errors
- Add user-friendly error messages

This design ensures that authentication state management is robust, predictable, and debuggable while preventing the page reloading issues caused by infinite re-renders and navigation loops.
