"use client"

import * as React from "react"
import { useEffect, useRef, useMemo, useState, useCallback } from "react"
import { usePathname } from "next/navigation"
import {
  BadgeQuestionMarkIcon,
  Command,
  CreditCard,
  Database,
  Frame,
  LifeBuoy,
  Map,
  MessageSquare,
  Package,
  PieChart,
  Send,
  Settings2,
  SquareTerminal,
  Ticket,
  Users,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { Logo } from "@/components/ui/logo"
import { SidebarScrollProgress } from "@/components/magicui/sidebar-scroll-progress"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { defaultSiteConfig } from "@/config/site"
import { useAuth } from "@/contexts/auth-context"

// Move data outside component to prevent recreation on every render
const sidebarData = {
  navMain: [
    {
      title: "Dashboard",
      icon: SquareTerminal,
      isActive: false,
      items: [
        {
          title: "Overview",
          url: "/dashboard",
        },
        {
          title: "Health Check",
          url: "/health",
        },
      ],
    },
    {
      title: "User Management",
      icon: Users,
      isActive: false,
      items: [
        {
          title: "All Users",
          url: "/users",
        },
        {
          title: "Manage Users",
          url: "/users/manage",
        },
        {
          title: "Registration Trends",
          url: "/users/trends",
        },
        {
          title: "Addresses",
          url: "/addresses",
        },
        {          
          title: "Payment Methods",
          url: "/payment-methods",
        },
        {
          title: "Wallets",
          url: "/wallets",
        },
      ],
    },
    {
      title: "Catalog Management",
      icon: Package,
      isActive: false,
      items: [
        {
          title: "Products",
          url: "/products",
        },
        {
          title: "Product Variants",
          url: "/product-variants",
        },
        {
          title: "Categories",
          url: "/categories",
        },
        {
          title: "Brands",
          url: "/brands",
        },
        {
          title: "Options",
          url: "/options",
        },
      ],
    },
    {
      title: "Inventory & Listings",
      icon: Database,
      isActive: false,
      items: [
        {
          title: "Inventory",
          url: "/inventory",
        },
        {
          title: "Listings",
          url: "/listings",
        },
        {
          title: "Platforms",
          url: "/platforms",
        },
      ],
    },
    {
      title: "Order Management",
      icon: CreditCard,
      isActive: false,
      items: [
        {
          title: "All Orders",
          url: "/orders",
        },
        {
          title: "Order Fulfillment",
          url: "/orders/fulfillment",
        },
        {
          title: "Shopping Carts",
          url: "/carts",
        },
      ],
    },
    {
      title: "Procurement",
      icon: Package,
      isActive: false,
      items: [
        {
          title: "Purchases",
          url: "/purchases",
        },
        {
          title: "Purchase Orders",
          url: "/purchase-orders",
        },
        {
          title: "Suppliers",
          url: "/suppliers",
        },
        {
          title: "Supplier Reports",
          url: "/suppliers/reports",
        },
      ],
    },
    {
      title: "Marketing & Promotions",
      icon: Ticket,
      isActive: false,
      items: [
        {
          title: "Coupons",
          url: "/coupons",
        },
        {
          title: "Create Coupon",
          url: "/coupons/create",
        },
        {
          title: "Campaigns",
          url: "/coupon-campaigns",
        },
        {
          title: "Campaign Analytics",
          url: "/coupon-campaigns/analytics",
        },
        {
          title: "Usage Reports",
          url: "/coupons/reports",
        },
      ],
    },
    {
      title: "Content & Reviews",
      icon: MessageSquare,
      isActive: false,
      items: [
        {
          title: "Reviews",
          url: "/reviews",
        },
        {
          title: "Approve Reviews",
          url: "/reviews/approve",
        },
        {
          title: "Reject Reviews",
          url: "/reviews/reject",
        },
        {
          title: "Report Reviews",
          url: "/reviews/report",
        },
        {
          title: "Blog Posts",
          url: "/blog",
        },
        {
          title: "User Favorites",
          url: "/favorites",
        },
        {
          title: "Dynamic Content",
          url: "/dynamic-contents",
        },
      ],
    },
    {
      title: "Analytics & Reports",
      icon: PieChart,
      isActive: false,
      items: [
        {
          title: "Sales Reports",
          url: "/reports/sales",
        },
        {
          title: "Order Reports",
          url: "/orders/reports",
        },
        {
          title: "Product Analytics",
          url: "/products/stats",
        },
        {
          title: "Category Analytics",
          url: "/categories/stats",
        },
        {
          title: "Brand Analytics",
          url: "/brands/stats",
        },
        {
          title: "Variant Analytics",
          url: "/product-variants/stats",
        },
      ],
    },
    {
      title: "System Administration",
      icon: Settings2,
      isActive: false,
      items: [        
        {
          title: "System Settings",
          url: "/settings",
        },
        {
          title: "Notifications",
          url: "/notifications",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "/support",
      icon: LifeBuoy,
    },
    {
      title: "FAQ",
      url: "/faq",
      icon: BadgeQuestionMarkIcon,
    },
    {
      title: "Feedback",
      url: "/feedback",
      icon: Send,
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
}

// Simple memoized component without complex comparison
const AppSidebarComponent = ({ ...props }: React.ComponentProps<typeof Sidebar>) => {
  const { user } = useAuth()
  const pathname = usePathname()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const savedScrollPositionRef = useRef<number>(0)
  
  // Initialize state from localStorage or determine from pathname
  const [activeNavIndex, setActiveNavIndex] = useState<number | null>(() => {
    // Try to get from localStorage first
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-active-nav')
      if (saved !== null) {
        return parseInt(saved, 10)
      }
    }
    return null
  })

  // Function to determine active nav index from pathname
  const getActiveNavFromPath = (currentPath: string): number | null => {
    let foundIndex: number | null = null
    
    // Check each nav item and its sub-items to find a match
    sidebarData.navMain.forEach((navItem, index) => {
      // Check if current path matches any of the nav item's sub-items
      const hasMatchingSubItem = navItem.items.some(item => 
        currentPath === item.url || currentPath.startsWith(item.url + '/')
      )
      
      if (hasMatchingSubItem) {
        foundIndex = index
      }
    })
    
    return foundIndex
  }

  // Track if we've manually toggled (to prevent auto-setting from pathname changes)
  const manualToggleRef = useRef(false)

  // Function to handle nav item toggle
  const handleNavToggle = useCallback((index: number, isOpen?: boolean) => {
    // Mark that we've manually toggled
    manualToggleRef.current = true
    
    // If isOpen is provided (from onOpenChange), use it to determine behavior
    if (isOpen !== undefined) {
      // This is from the Collapsible onOpenChange
      if (isOpen) {
        // Opening - set this as active (close others)
        setActiveNavIndex(index)
        localStorage.setItem('sidebar-active-nav', index.toString())
      } else {
        // Closing - set none as active
        setActiveNavIndex(null)
        localStorage.removeItem('sidebar-active-nav')
      }
    } else {
      // This is from direct toggle (like clicking the main nav item)
      const newActiveIndex = activeNavIndex === index ? null : index
      setActiveNavIndex(newActiveIndex)
      
      if (newActiveIndex !== null) {
        localStorage.setItem('sidebar-active-nav', newActiveIndex.toString())
      } else {
        localStorage.removeItem('sidebar-active-nav')
      }
    }
    
    // Reset manual toggle flag after a longer delay to handle navigation
    setTimeout(() => {
      manualToggleRef.current = false
    }, 500) // Increased from 100ms to 500ms
  }, [activeNavIndex])

  // Create individual toggle handlers for each nav item
  const createToggleHandler = useCallback((index: number) => {
    return (isOpen?: boolean) => handleNavToggle(index, isOpen)
  }, [handleNavToggle])

  // Determine active nav item based on current pathname and persist it
  useEffect(() => {
    // Don't auto-set if we've recently manually toggled
    if (manualToggleRef.current) {
      return
    }
    
    const newActiveIndex = getActiveNavFromPath(pathname)
    
    // Only update if:
    // 1. We don't have any active nav set yet, AND there's a match for the current path
    // 2. OR we're navigating to a completely different section
    if ((activeNavIndex === null && newActiveIndex !== null) || 
        (newActiveIndex !== null && newActiveIndex !== activeNavIndex)) {
      setActiveNavIndex(newActiveIndex)
      if (newActiveIndex !== null) {
        localStorage.setItem('sidebar-active-nav', newActiveIndex.toString())
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]) // Intentionally excluding activeNavIndex to prevent conflicts with manual toggles

  // Memoize navigation data with active states and toggle handlers
  const navData = useMemo(() => {
    const navWithActiveStates = {
      ...sidebarData,
      navMain: sidebarData.navMain.map((item, index) => ({
        ...item,
        isActive: index === activeNavIndex,
        onToggle: createToggleHandler(index)
      }))
    }
    return navWithActiveStates
  }, [activeNavIndex, createToggleHandler])

  // Aggressive scroll position restoration on every render
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    const savedPosition = localStorage.getItem('sidebar-scroll-position')
    if (savedPosition) {
      const position = parseInt(savedPosition, 10)
      if (scrollContainer.scrollTop !== position) {
        scrollContainer.scrollTop = position
        savedScrollPositionRef.current = position
      }
    }
  })

  // Simple scroll position preservation with more robust handling
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    // Restore saved position immediately and also after a short delay
    const restorePosition = () => {
      const savedPosition = localStorage.getItem('sidebar-scroll-position')
      if (savedPosition) {
        const position = parseInt(savedPosition, 10)
        savedScrollPositionRef.current = position
        scrollContainer.scrollTop = position
      }
    }

    // Restore immediately
    restorePosition()
    
    // Also restore after a brief delay to handle any layout shifts
    const timeoutId = setTimeout(restorePosition, 100)

    // Add scroll listener to save position
    const handleScroll = () => {
      savedScrollPositionRef.current = scrollContainer.scrollTop
      localStorage.setItem('sidebar-scroll-position', scrollContainer.scrollTop.toString())
    }

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      clearTimeout(timeoutId)
      scrollContainer.removeEventListener('scroll', handleScroll)
    }
  }, []) // No dependencies to prevent re-running

  // Format user data for NavUser component - memoized to prevent re-renders
  // Only authenticated admin users should reach this component
  const userData = useMemo(() => {
    if (!user) {
      // This should never happen in an admin panel - redirect to login
      return null
    }
    
    return {
      name: user.name,
      email: user.email,
      avatar: user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`
    }
  }, [user])

  // Memoized header component
  const sidebarHeader = useMemo(() => (
    <SidebarHeader className="h-16 flex items-center">
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" asChild>
            <a href="#">
              <div className="text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg mr-2">
                <Logo 
                  size={32} 
                  fallbackIcon={Command}
                  lightSrc="/images/logo-light.png"
                  darkSrc="/images/logo-dark.png"
                />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{defaultSiteConfig.name}</span>
                <span className="truncate text-xs">Enterprise</span>
              </div>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  ), [])

  // Memoized footer component
  const sidebarFooter = useMemo(() => (
    <SidebarFooter>
      {userData && <NavUser user={userData} />}
    </SidebarFooter>
  ), [userData])

  // Early return if no user - this component should not render for unauthenticated users
  if (!user || !userData) {
    return null
  }

  return (
    <Sidebar {...props}>
      {sidebarHeader}
      <SidebarContent className="relative overflow-hidden">
        <SidebarScrollProgress containerId="sidebar-scroll-container" />
        <div 
          ref={scrollContainerRef}
          className="overflow-y-auto h-full scrollbar-none" 
          id="sidebar-scroll-container" 
          style={{
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            scrollBehavior: 'auto', // Prevent smooth scrolling that might interfere
            overscrollBehavior: 'contain' // Prevent scroll chaining
          }}
          onScroll={(e) => {
            // Save position on every scroll
            const target = e.currentTarget
            savedScrollPositionRef.current = target.scrollTop
            localStorage.setItem('sidebar-scroll-position', target.scrollTop.toString())
          }}
        >
          <NavMain items={navData.navMain} />
          {/* <NavProjects projects={navData.projects} /> */}
          <NavSecondary items={navData.navSecondary} className="mt-auto" />
        </div>
        <SidebarScrollProgress containerId="sidebar-scroll-container" />
      </SidebarContent>
      {sidebarFooter}
    </Sidebar>
  )
}

export const AppSidebar = React.memo(AppSidebarComponent)