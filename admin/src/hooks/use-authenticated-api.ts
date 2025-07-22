"use client";

import { useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { buildUrl, getHeaders } from '@/config/api';

export function useAuthenticatedApi() {
  const { handleTokenExpiration } = useAuth();

  const authenticatedRequest = useCallback(async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> => {
    // Get auth token from session storage
    const authToken = sessionStorage.getItem('auth_token');
    
    if (!authToken) {
      handleTokenExpiration();
      throw new Error('No authentication token found');
    }

    const url = buildUrl(endpoint);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getHeaders({ authToken }),
        ...options.headers,
      },
      credentials: 'include',
    });

    // Handle token expiration
    if (response.status === 401) {
      handleTokenExpiration();
      throw new Error('Authentication required');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }, [handleTokenExpiration]);

  return {
    get: useCallback(<T>(endpoint: string, options?: RequestInit) => 
      authenticatedRequest<T>(endpoint, { ...options, method: 'GET' }), [authenticatedRequest]),
    
    post: useCallback(<T>(endpoint: string, data?: any, options?: RequestInit) => 
      authenticatedRequest<T>(endpoint, {
        ...options,
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      }), [authenticatedRequest]),
    
    put: useCallback(<T>(endpoint: string, data?: any, options?: RequestInit) => 
      authenticatedRequest<T>(endpoint, {
        ...options,
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      }), [authenticatedRequest]),
    
    patch: useCallback(<T>(endpoint: string, data?: any, options?: RequestInit) => 
      authenticatedRequest<T>(endpoint, {
        ...options,
        method: 'PATCH',
        body: data ? JSON.stringify(data) : undefined,
      }), [authenticatedRequest]),
    
    delete: useCallback(<T>(endpoint: string, options?: RequestInit) => 
      authenticatedRequest<T>(endpoint, { ...options, method: 'DELETE' }), [authenticatedRequest]),
  };
}
