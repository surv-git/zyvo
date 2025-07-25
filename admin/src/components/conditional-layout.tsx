"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { AppSidebar } from "@/components/app-sidebar"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Loader2 } from "lucide-react"

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isLoading, isAuthenticated } = useAuth()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)
  const [redirectCountdown, setRedirectCountdown] = useState(0)
  
  // Pages that should render without sidebar (full screen) and don't require authentication
  const publicPages = ['/login', '/signup', '/forgot-password', '/reset-password']
  const isPublicPage = publicPages.includes(pathname)
  
  // Debug logging (remove in production)
  useEffect(() => {
    if (!user && !isPublicPage && !isLoading && hasCheckedAuth) {
      console.log('⚠️ ConditionalLayout: No auth for protected route', { pathname, isRedirecting, hasCheckedAuth })
    } else if (user && !isPublicPage) {
      console.log('✅ ConditionalLayout: Authenticated access', { pathname, user: user.name, hasCheckedAuth })
    }
  }, [pathname, isPublicPage, user, isLoading, isRedirecting, hasCheckedAuth])
  
  // Track when initial auth check is complete
  useEffect(() => {
    if (!isLoading && !hasCheckedAuth) {
      setHasCheckedAuth(true)
    }
  }, [isLoading, hasCheckedAuth])
  
  // Handle authentication for protected routes
  useEffect(() => {
    // Don't redirect while auth is still loading OR we haven't completed initial auth check
    if (isLoading || !hasCheckedAuth) {
      setIsRedirecting(false)
      return
    }
    
    // If user is authenticated and we were redirecting, stop redirecting
    if (user && isAuthenticated) {
      setIsRedirecting(false)
      return
    }
    
    // Only redirect if we've completed the initial auth check and there's no authenticated user
    if (!isPublicPage && !isLoading && hasCheckedAuth && (!user || !isAuthenticated)) {
      console.log('Redirecting to login - no user/auth after auth check complete (30s delay for slow network simulation)')
      setIsRedirecting(true)
      setRedirectCountdown(30)
      
      // Start countdown timer
      const countdownInterval = setInterval(() => {
        setRedirectCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval)
            router.push('/login')
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
      // Cleanup function to clear interval if component unmounts
      return () => clearInterval(countdownInterval)
    }
    
    setIsRedirecting(false)
  }, [user, isLoading, isAuthenticated, isPublicPage, router, pathname, hasCheckedAuth])
  
  // Show loading state while auth is loading or we haven't completed initial auth check
  if (isLoading || !hasCheckedAuth) {
    return (
      <div className="h-screen w-screen flex items-center justify-center theme-container">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }
  
  if (isPublicPage) {
    // Full screen layout for public pages (login, etc.)
    return (
      <div className="h-screen w-screen theme-container">
        {children}
      </div>
    )
  }
  
  // If not authenticated and trying to access protected route, show loading or redirect
  if (!user || !isAuthenticated) {
    if (isRedirecting) {
      // Show loading state during redirect with countdown
      return (
        <div className="h-screen w-screen flex items-center justify-center theme-container">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
            <div className="text-center">
              <p className="text-lg font-semibold text-muted-foreground">Access Denied</p>
              <p className="text-sm text-muted-foreground mt-1">
                You need to be logged in to access this page
              </p>
              <p className="text-sm text-muted-foreground mt-3">
                Redirecting to login in <span className="font-mono font-bold text-blue-500">{redirectCountdown}</span> seconds...
              </p>
            </div>
          </div>
        </div>
      )
    }
    return null
  }
  
  // Admin layout with sidebar for authenticated users on protected routes
  return (
    <div className="h-screen flex overflow-hidden theme-container">
      <SidebarProvider>
        <AppSidebar />
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
      </SidebarProvider>
    </div>
  )
}
