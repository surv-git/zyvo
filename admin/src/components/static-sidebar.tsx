"use client"

import * as React from "react"
import { useEffect, useRef } from "react"
import {
  Command,
  Database,
  LifeBuoy,
  MessageSquare,
  Package,
  Send,
  Settings2,
  SquareTerminal,
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

// Static data that never changes
const staticSidebarData = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "Admin Dashboard",
          url: "/dashboard",
        },
      ],
    },
    {
      title: "User Management",
      url: "/users",
      icon: Users,
      isActive: true,
      items: [
        {
          title: "All Users",
          url: "/users",
        },
        {
          title: "User Management",
          url: "/users/manage",
        },
        {
          title: "Registration Trends",
          url: "/users/trends",
        },
      ],
    },
    {
      title: "Product Catalog",
      url: "/products",
      icon: Package,
      isActive: true,
      items: [
        {
          title: "Products",
          url: "/products",
        },
        {
          title: "Product Stats",
          url: "/products/stats",
        },
        {
          title: "Categories",
          url: "/categories",
        },
        {
          title: "Category Tree",
          url: "/categories/tree",
        },
        {
          title: "Category Stats",
          url: "/categories/stats",
        },
        {
          title: "Brands",
          url: "/brands",
        },
        {
          title: "Brand Stats",
          url: "/brands/stats",
        },
        {
          title: "Product Variants",
          url: "/product-variants",
        },
        {
          title: "Variant Stats",
          url: "/product-variants/stats",
        },
        {
          title: "Options",
          url: "/options",
        },
      ],
    },
    {
      title: "Purchases & Suppliers",
      url: "/purchases",
      icon: Package,
      isActive: true,
      items: [
        {
          title: "All Purchases",
          url: "/purchases",
        },
        {
          title: "Suppliers",
          url: "/suppliers",
        },
        {
          title: "Purchase Orders",
          url: "/purchase-orders",
        },
        {
          title: "Supplier Reports",
          url: "/suppliers/reports",
        },
      ],
    },
    {
      title: "Platform & Inventory",
      url: "/platforms",
      icon: Database,
      isActive: true,
      items: [
        {
          title: "Platforms",
          url: "/platforms",
        },
        {
          title: "Inventory",
          url: "/inventory",
        },
        {
          title: "Listings",
          url: "/listings",
        },
      ],
    },
    {
      title: "Reviews Management",
      url: "/reviews",
      icon: MessageSquare,
      isActive: true,
      items: [
        {
          title: "All Reviews",
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
      ],
    },
    {
      title: "System Settings & Reports",
      url: "/settings",
      icon: Settings2,
      isActive: true,
      items: [
        {
          title: "Notifications",
          url: "/notifications",
        },
        {
          title: "System Settings",
          url: "/settings",
        },
        {
          title: "Sales Reports",
          url: "/reports/sales",
        },
        {
          title: "Health Check",
          url: "/health",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "#",
      icon: Send,
    },
  ],
}

// Static user data for sidebar
const staticUserData = {
  name: "Admin User",
  email: "admin@example.com",
  avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Admin"
}

// Component that never re-renders
function StaticSidebarComponent({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const savedScrollPositionRef = useRef<number>(0)

  // Scroll position preservation - only runs once
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    // Restore saved position immediately and with delays
    const restorePosition = () => {
      const savedPosition = localStorage.getItem('sidebar-scroll-position')
      if (savedPosition) {
        const position = parseInt(savedPosition, 10)
        savedScrollPositionRef.current = position
        scrollContainer.scrollTop = position
      }
    }

    restorePosition()
    setTimeout(restorePosition, 50)
    setTimeout(restorePosition, 100)
    
    // Save scroll position on scroll
    const handleScroll = () => {
      savedScrollPositionRef.current = scrollContainer.scrollTop
      localStorage.setItem('sidebar-scroll-position', scrollContainer.scrollTop.toString())
    }

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Restore scroll position on every render
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

  return (
    <Sidebar {...props}>
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
      <SidebarContent className="relative overflow-hidden">
        <SidebarScrollProgress containerId="sidebar-scroll-container" />
        <div 
          ref={scrollContainerRef}
          className="overflow-y-auto h-full scrollbar-none" 
          id="sidebar-scroll-container" 
          style={{
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            scrollBehavior: 'auto',
            overscrollBehavior: 'contain'
          }}
          onScroll={(e) => {
            const target = e.currentTarget
            savedScrollPositionRef.current = target.scrollTop
            localStorage.setItem('sidebar-scroll-position', target.scrollTop.toString())
          }}
        >
          <NavMain items={staticSidebarData.navMain} />
          <NavSecondary items={staticSidebarData.navSecondary} className="mt-auto" />
        </div>
        <SidebarScrollProgress containerId="sidebar-scroll-container" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={staticUserData} />
      </SidebarFooter>
    </Sidebar>
  )
}

// Export with explicit displayName
StaticSidebarComponent.displayName = 'StaticSidebar'

export { StaticSidebarComponent as StaticSidebar }
