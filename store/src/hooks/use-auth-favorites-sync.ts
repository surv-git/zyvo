'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { favoritesManager } from '@/lib/isolated-favorites-manager'

/**
 * Hook that automatically re-initializes favorites when user auth state changes
 * This should be used at the app level to ensure favorites are synced with auth
 */
export function useAuthFavoritesSync() {
  const { isAuthenticated, accessToken, isLoading } = useAuth()

  useEffect(() => {
    // Only proceed after auth is loaded
    if (isLoading) return

    console.log('🔄 Auth state changed - syncing favorites...', {
      isAuthenticated,
      hasToken: !!accessToken,
      isLoading
    })

    // Re-initialize favorites when auth state changes
    favoritesManager.forceReinitialize().catch(error => {
      console.error('Failed to re-initialize favorites after auth change:', error)
    })
  }, [isAuthenticated, accessToken, isLoading])
}
