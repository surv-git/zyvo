"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  _id: string
  name: string
  email: string
  role: string
  isActive: boolean
  loginCount: number
  is_email_verified: boolean
  is_phone_verified: boolean
  createdAt: string
  updatedAt: string
  lastLogin?: string
  fullName: string
  id: string
}

interface AuthContextType {
  user: User | null
  accessToken: string | null
  isLoading: boolean
  login: (token: string, userData: User) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in on app start
    const token = localStorage.getItem('accessToken')
    const userData = localStorage.getItem('user')
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setAccessToken(token)
        setUser(parsedUser)
      } catch (error) {
        // Clear invalid data
        localStorage.removeItem('accessToken')
        localStorage.removeItem('user')
      }
    }
    
    setIsLoading(false)
  }, [])

  const login = (token: string, userData: User) => {
    localStorage.setItem('accessToken', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setAccessToken(token)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    setAccessToken(null)
    setUser(null)
    router.push('/login')
  }

  const value = {
    user,
    accessToken,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user && !!accessToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
