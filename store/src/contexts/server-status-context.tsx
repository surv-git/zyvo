'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { API_CONFIG } from '@/lib/api-config'

interface ServerStatusContextType {
  isServerReachable: boolean
  isChecking: boolean
  checkServerStatus: () => Promise<void>
}

const ServerStatusContext = createContext<ServerStatusContextType | undefined>(undefined)

export function useServerStatus() {
  const context = useContext(ServerStatusContext)
  if (context === undefined) {
    throw new Error('useServerStatus must be used within a ServerStatusProvider')
  }
  return context
}

interface ServerStatusProviderProps {
  children: React.ReactNode
}

export function ServerStatusProvider({ children }: ServerStatusProviderProps) {
  const [isServerReachable, setIsServerReachable] = useState(true)
  const [isChecking, setIsChecking] = useState(true)

  const checkServerStatus = async () => {
    try {
      // Only set checking to true during manual checks, not automatic background checks
      const wasChecking = isChecking
      if (!wasChecking) {
        setIsChecking(true)
      }
      
      // Try to reach a simple health check endpoint or any basic endpoint
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
      
      // Check if running in development (localhost) or production
      const isDevelopment = process.env.NODE_ENV === 'development'
      let testUrl = `${API_CONFIG.BASE_URL}/api/v1/categories`
      
      // If in development and the base URL is localhost:3100, check if that server is running
      if (isDevelopment && API_CONFIG.BASE_URL.includes('localhost:3100')) {
        // Try to ping the API server
        testUrl = `${API_CONFIG.BASE_URL}/api/v1/categories`
      }
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
      const newReachableStatus = response.ok || response.status === 401 || response.status === 403 || response.status === 404
      
      // Only update state if the status actually changed
      if (newReachableStatus !== isServerReachable) {
        setIsServerReachable(newReachableStatus)
      }
    } catch (error) {
      console.error('Server connectivity check failed:', error)
      
      let newReachableStatus = true
      
      // If we're in development and the error is network-related, assume server is down
      if (error instanceof Error && (
        error.name === 'AbortError' || 
        error.message.includes('fetch') ||
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('Failed to fetch')
      )) {
        newReachableStatus = false
      }
      
      // Only update state if the status actually changed
      if (newReachableStatus !== isServerReachable) {
        setIsServerReachable(newReachableStatus)
      }
    } finally {
      // Only set checking to false if we set it to true in this function
      setIsChecking(false)
    }
  }

  const checkServerStatusBackground = async () => {
    try {
      // Background checks don't show loading state
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const isDevelopment = process.env.NODE_ENV === 'development'
      let testUrl = `${API_CONFIG.BASE_URL}/api/v1/categories`
      
      if (isDevelopment && API_CONFIG.BASE_URL.includes('localhost:3100')) {
        testUrl = `${API_CONFIG.BASE_URL}/api/v1/categories`
      }
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
      const newReachableStatus = response.ok || response.status === 401 || response.status === 403 || response.status === 404
      
      // Only update state if the status actually changed
      if (newReachableStatus !== isServerReachable) {
        setIsServerReachable(newReachableStatus)
      }
    } catch (error) {
      let newReachableStatus = true
      
      if (error instanceof Error && (
        error.name === 'AbortError' || 
        error.message.includes('fetch') ||
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('Failed to fetch')
      )) {
        newReachableStatus = false
      }
      
      // Only update state if the status actually changed
      if (newReachableStatus !== isServerReachable) {
        setIsServerReachable(newReachableStatus)
      }
    }
  }

  useEffect(() => {
    let isMounted = true
    
    const performInitialCheck = async () => {
      try {
        setIsChecking(true)
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        const isDevelopment = process.env.NODE_ENV === 'development'
        let testUrl = `${API_CONFIG.BASE_URL}/api/v1/categories`
        
        if (isDevelopment && API_CONFIG.BASE_URL.includes('localhost:3100')) {
          testUrl = `${API_CONFIG.BASE_URL}/api/v1/categories`
        }
        
        const response = await fetch(testUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        })
        
        clearTimeout(timeoutId)
        
        if (isMounted) {
          const newReachableStatus = response.ok || response.status === 401 || response.status === 403 || response.status === 404
          setIsServerReachable(newReachableStatus)
        }
      } catch (error) {
        if (isMounted) {
          let newReachableStatus = true
          
          if (error instanceof Error && (
            error.name === 'AbortError' || 
            error.message.includes('fetch') ||
            error.message.includes('ECONNREFUSED') ||
            error.message.includes('Failed to fetch')
          )) {
            newReachableStatus = false
          }
          
          setIsServerReachable(newReachableStatus)
        }
      } finally {
        if (isMounted) {
          setIsChecking(false)
        }
      }
    }

    const performBackgroundCheck = async () => {
      if (!isMounted) return
      
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        const isDevelopment = process.env.NODE_ENV === 'development'
        let testUrl = `${API_CONFIG.BASE_URL}/api/v1/categories`
        
        if (isDevelopment && API_CONFIG.BASE_URL.includes('localhost:3100')) {
          testUrl = `${API_CONFIG.BASE_URL}/api/v1/categories`
        }
        
        const response = await fetch(testUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        })
        
        clearTimeout(timeoutId)
        
        if (isMounted) {
          const newReachableStatus = response.ok || response.status === 401 || response.status === 403 || response.status === 404
          setIsServerReachable(prev => prev === newReachableStatus ? prev : newReachableStatus)
        }
      } catch (error) {
        if (isMounted) {
          let newReachableStatus = true
          
          if (error instanceof Error && (
            error.name === 'AbortError' || 
            error.message.includes('fetch') ||
            error.message.includes('ECONNREFUSED') ||
            error.message.includes('Failed to fetch')
          )) {
            newReachableStatus = false
          }
          
          setIsServerReachable(prev => prev === newReachableStatus ? prev : newReachableStatus)
        }
      }
    }

    // Initial check
    performInitialCheck()

    // Set up periodic background checks every 30 seconds
    const interval = setInterval(performBackgroundCheck, 30000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  return (
    <ServerStatusContext.Provider 
      value={{ 
        isServerReachable, 
        isChecking, 
        checkServerStatus 
      }}
    >
      {children}
    </ServerStatusContext.Provider>
  )
}
