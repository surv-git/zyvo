'use client'

import React from 'react'
import { useServerStatus } from '@/contexts/server-status-context'
import { ServerUnavailableScreen } from '@/components/server-unavailable-screen'
import { Loader2 } from 'lucide-react'

interface AppContentWrapperProps {
  children: React.ReactNode
}

export function AppContentWrapper({ children }: AppContentWrapperProps) {
  const { isServerReachable, isChecking } = useServerStatus()

  // Show loading spinner during initial server check
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Connecting to server...</p>
        </div>
      </div>
    )
  }

  // Show server unavailable screen if server is not reachable
  if (!isServerReachable) {
    return <ServerUnavailableScreen />
  }

  // Show normal app content if server is reachable
  return <>{children}</>
}
