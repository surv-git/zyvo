'use client'

import { useAuthFavoritesSync } from '@/hooks/use-auth-favorites-sync'

/**
 * Component that handles automatic favorites synchronization with auth state
 * This runs at the app level to ensure favorites are properly synced
 */
export function FavoritesAuthSync() {
  useAuthFavoritesSync()
  return null // This component doesn't render anything
}
