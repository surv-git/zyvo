'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { useServerStatus } from '@/contexts/server-status-context'

export function ServerUnavailableScreen() {
  const { checkServerStatus, isChecking } = useServerStatus()

  const handleRetry = async () => {
    await checkServerStatus()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-100 rounded-full">
              <WifiOff className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Server Unavailable
          </CardTitle>
          <CardDescription className="text-gray-600 mt-2">
            We&apos;re having trouble connecting to our servers. Please check your internet connection and try again.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">What you can do:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Check your internet connection</li>
                  <li>Try refreshing the page</li>
                  <li>Wait a few moments and try again</li>
                </ul>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={handleRetry}
            disabled={isChecking}
            className="w-full"
            size="lg"
          >
            {isChecking ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Checking Connection...
              </>
            ) : (
              <>
                <Wifi className="h-4 w-4 mr-2" />
                Try Again
              </>
            )}
          </Button>
          
          <div className="text-center">
            <p className="text-xs text-gray-500">
              If the problem persists, please contact our support team.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
