"use client";

import { useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { buildUrl } from '@/config/api';

export function useApi() {
  const { handleTokenExpiration } = useAuth();

  const apiRequest = useCallback(async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> => {
    const url = buildUrl(endpoint);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
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
      apiRequest<T>(endpoint, { ...options, method: 'GET' }), [apiRequest]),
    
    post: useCallback(<T>(endpoint: string, data?: any, options?: RequestInit) => 
      apiRequest<T>(endpoint, {
        ...options,
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      }), [apiRequest]),
    
    put: useCallback(<T>(endpoint: string, data?: any, options?: RequestInit) => 
      apiRequest<T>(endpoint, {
        ...options,
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      }), [apiRequest]),
    
    patch: useCallback(<T>(endpoint: string, data?: any, options?: RequestInit) => 
      apiRequest<T>(endpoint, {
        ...options,
        method: 'PATCH',
        body: data ? JSON.stringify(data) : undefined,
      }), [apiRequest]),
    
    delete: useCallback(<T>(endpoint: string, options?: RequestInit) => 
      apiRequest<T>(endpoint, { ...options, method: 'DELETE' }), [apiRequest]),
  };
}
