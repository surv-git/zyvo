"use client";

import { useState, useEffect, useCallback } from 'react';
import { fetchCSRFToken } from '@/lib/api';

interface UseCSRFReturn {
  csrfToken: string | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for managing CSRF token
 * Automatically fetches token on mount and provides refetch functionality
 */
export function useCSRF(): UseCSRFReturn {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchToken = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = await fetchCSRFToken();
      setCsrfToken(token);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch CSRF token';
      setError(errorMessage);
      console.error('CSRF token fetch failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch token on mount
  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  return {
    csrfToken,
    isLoading,
    error,
    refetch: fetchToken,
  };
}
