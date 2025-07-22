"use client"

import { SidebarIcon, Bell, Settings, Mail } from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"

import { SearchForm } from "@/components/search-form"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useSidebar } from "@/components/ui/sidebar"

// Route mapping for better breadcrumb labels
const routeLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/dashboard': 'Dashboard',
  '/users': 'User Management',
  '/users/manage': 'Manage Users',
  '/users/trends': 'Registration Trends',
  '/products': 'Products',
  '/products/stats': 'Product Statistics',
  '/categories': 'Categories',
  '/categories/stats': 'Category Statistics',
  '/brands': 'Brands',
  '/brands/stats': 'Brand Statistics',
  '/product-variants': 'Product Variants',
  '/product-variants/stats': 'Variant Statistics',
  '/options': 'Options',
  '/platforms': 'Platforms',
  '/inventory': 'Inventory Management',
  '/listings': 'Listings',
  '/reviews': 'Reviews Management',
  '/reviews/approve': 'Approve Reviews',
  '/reviews/reject': 'Reject Reviews',
  '/reviews/report': 'Report Reviews',
  '/settings': 'System Settings',
  '/reports/sales': 'Sales Reports',
  '/health': 'Health Check',
  '/notifications': 'Notifications',
};

function generateBreadcrumbs(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = [];
  
  // Always start with Dashboard
  breadcrumbs.push({
    label: 'Dashboard',
    href: '/dashboard',
    isLast: segments.length === 0 || (segments.length === 1 && segments[0] === 'dashboard')
  });
  
  // Build breadcrumbs from path segments
  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const label = routeLabels[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    const isLast = index === segments.length - 1;
    
    // Skip if it's just 'dashboard' since we already added it
    if (currentPath !== '/dashboard') {
      breadcrumbs.push({
        label,
        href: currentPath,
        isLast
      });
    }
  });
  
  return breadcrumbs;
}

export function SiteHeader() {
  const { toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const breadcrumbs = generateBreadcrumbs(pathname);

  return (
    <header className="bg-background sticky top-0 z-50 flex w-full items-center border-b">
      <div className="flex h-16 w-full items-center gap-2 px-4">
        <Button
          className="h-8 w-8"
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
        >
          <SidebarIcon />
        </Button>
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb className="hidden sm:block">
          <BreadcrumbList>
            {breadcrumbs.map((breadcrumb) => (
              <div key={breadcrumb.href} className="flex items-center">
                <BreadcrumbItem>
                  {breadcrumb.isLast ? (
                    <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={breadcrumb.href}>{breadcrumb.label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!breadcrumb.isLast && <BreadcrumbSeparator />}
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex-1 flex justify-center px-4">
          <SearchForm className="w-full max-w-md" />
        </div>
        <div className="flex items-center">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8">
            <Link href="/notifications">
              <Bell className="h-4 w-4" />
              <span className="sr-only">Notifications</span>
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="h-8 w-8">
            <Link href="/notifications">
              <Mail className="h-4 w-4" />
              <span className="sr-only">Settings</span>
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="h-8 w-8">
            <Link href="/notifications">
              <Settings className="h-4 w-4" />
              <span className="sr-only">Settings</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
