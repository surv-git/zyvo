"use client";

import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AuthState, AuthContextType, LoginRequest, User } from '@/types/auth';
import { fetchCSRFToken, loginUser, logoutUser, getErrorMessage } from '@/lib/api';

// Auth reducer actions
type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean };

// Auth reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
}

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const router = useRouter();

  // Check for existing authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        // Check if user data exists in sessionStorage
        const storedUser = sessionStorage.getItem('user_data');
        const storedToken = sessionStorage.getItem('auth_token');
        
        if (storedUser && storedToken) {
          // Parse stored user data and restore session
          try {
            const userData = JSON.parse(storedUser);
            dispatch({ type: 'LOGIN_SUCCESS', payload: userData });
            console.log('🔄 Session restored from storage');
          } catch (parseError) {
            // Invalid stored data, clear it
            console.warn('⚠️ Invalid stored user data, clearing...', parseError);
            sessionStorage.removeItem('user_data');
            sessionStorage.removeItem('auth_token');
            sessionStorage.removeItem('refresh_token');
          }
        }
      } catch (err) {
        console.error('Auth check failed:', err);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    checkAuth();
  }, []);

  // Login function - memoized to prevent infinite re-renders
  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      dispatch({ type: 'LOGIN_START' });

      // Fetch CSRF token
      const csrfToken = await fetchCSRFToken();

      // Perform login
      const response = await loginUser(credentials, csrfToken);

      // Store authentication data securely
      sessionStorage.setItem('auth_token', response.accessToken);
      sessionStorage.setItem('user_data', JSON.stringify(response.user));
      
      if (response.refreshToken) {
        sessionStorage.setItem('refresh_token', response.refreshToken);
      }

      // Update state
      dispatch({ type: 'LOGIN_SUCCESS', payload: response.user });

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      throw error; // Re-throw for form handling
    }
  }, [router]);

  // Logout function - memoized to prevent infinite re-renders
  const logout = useCallback(async () => {
    try {
      // Try to get CSRF token for logout (optional)
      let csrfToken: string | undefined;
      try {
        csrfToken = await fetchCSRFToken();
      } catch (error) {
        // If CSRF token fetch fails, proceed with logout anyway
        console.warn('Could not fetch CSRF token for logout:', error);
      }

      // Call logout API
      await logoutUser(csrfToken);
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local logout even if API call fails
    } finally {
      // Clear all stored authentication data
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('refresh_token');
      sessionStorage.removeItem('user_data');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_data');

      // Update state
      dispatch({ type: 'LOGOUT' });

      // Redirect to login
      router.push('/login');
    }
  }, [router]);

  // Clear error function - memoized to prevent infinite re-renders
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Handle token expiration - clear auth data and redirect to login
  const handleTokenExpiration = useCallback(() => {
    console.log('🔐 Auth Context - handleTokenExpiration called');
    console.log('🔐 Auth Context - Current auth state:', state.isAuthenticated);
    
    // Clear all stored authentication data
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('user_data');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');

    // Update state
    dispatch({ type: 'LOGOUT' });

    // Redirect to login (temporarily disabled for debugging)
    console.log('🔐 Auth Context - Not redirecting to login for debugging purposes');
    // router.push('/login');
  }, [state.isAuthenticated]);

  // Memoize context value to prevent infinite re-renders
  const contextValue: AuthContextType = useMemo(() => ({
    ...state,
    login,
    logout,
    clearError,
    handleTokenExpiration,
  }), [state, login, logout, clearError, handleTokenExpiration]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
