'use client';

import React, { useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';

// Import all page components that exist
import HomePage from '@/app/page';
import DashboardPage from '@/app/dashboard/page';
import BrandsPage from '@/app/brands/page';
import CategoriesPage from '@/app/categories/page';
import ProductsPage from '@/app/products/page';
import ProductVariantsPage from '@/app/product-variants/page';
import OptionsPage from '@/app/options/page';
import ListingsPage from '@/app/listings/page';
import PlatformsPage from '@/app/platforms/page';
import InventoryPage from '@/app/inventory/page';
import ReviewsPage from '@/app/reviews/page';
import UsersPage from '@/app/users/page';
import SettingsPage from '@/app/settings/page';
import HealthPage from '@/app/health/page';

interface SPANavigationWrapperProps {
  children: ReactNode;
  initialPath: string;
}

// Define all available page components
const pageComponents: Record<string, () => ReactNode> = {
  '/': () => <HomePage />,
  '/dashboard': () => <DashboardPage />,
  '/brands': () => <BrandsPage />,
  '/categories': () => <CategoriesPage />,
  '/products': () => <ProductsPage />,
  '/product-variants': () => <ProductVariantsPage />,
  '/options': () => <OptionsPage />,
  '/listings': () => <ListingsPage />,
  '/platforms': () => <PlatformsPage />,
  '/inventory': () => <InventoryPage />,
  '/reviews': () => <ReviewsPage />,
  '/users': () => <UsersPage />,
  '/settings': () => <SettingsPage />,
  '/health': () => <HealthPage />,
};

export function SPANavigationWrapper({ children, initialPath }: SPANavigationWrapperProps) {
  const [currentContent, setCurrentContent] = useState<ReactNode>(null);
  const [currentPath, setCurrentPath] = useState(initialPath);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollPositions = useRef<Record<string, number>>({});
  const pathname = usePathname();
  const router = useRouter();

  // Save scroll position for current page
  const saveScrollPosition = (path: string) => {
    if (contentRef.current) {
      scrollPositions.current[path] = contentRef.current.scrollTop;
    }
  };

  // Restore scroll position for target page
  const restoreScrollPosition = (path: string) => {
    if (contentRef.current) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        if (contentRef.current) {
          contentRef.current.scrollTop = scrollPositions.current[path] || 0;
        }
      });
    }
  };

  // Navigate to a new page manually
  const navigateToPage = useCallback((path: string) => {
    if (path === currentPath) return;

    // Save current scroll position
    saveScrollPosition(currentPath);

    // Update URL without triggering Next.js navigation
    window.history.pushState({}, '', path);

    // Update current path
    setCurrentPath(path);

    // Load new content
    const pageComponent = pageComponents[path];
    if (pageComponent) {
      setCurrentContent(pageComponent());
      // Restore scroll position after content loads
      setTimeout(() => restoreScrollPosition(path), 0);
    } else {
      // Fallback to Next.js navigation for unknown routes
      router.push(path);
    }
  }, [currentPath, router]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      navigateToPage(path);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigateToPage]);

  // Intercept all navigation clicks
  useEffect(() => {
    const handleLinkClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');

      if (link && link.href) {
        const url = new URL(link.href);
        const path = url.pathname;

        // Only intercept internal navigation for pages we manage
        if (url.origin === window.location.origin && pageComponents[path]) {
          e.preventDefault();
          navigateToPage(path);
        }
      }
    };

    document.addEventListener('click', handleLinkClick);
    return () => document.removeEventListener('click', handleLinkClick);
  }, [navigateToPage]);

  // Initialize content on mount
  useEffect(() => {
    const pageComponent = pageComponents[initialPath];
    if (pageComponent) {
      setCurrentContent(pageComponent());
    }
  }, [initialPath]);

  // Handle direct URL changes (like from Next.js router)
  useEffect(() => {
    if (pathname !== currentPath && pageComponents[pathname]) {
      navigateToPage(pathname);
    }
  }, [pathname, currentPath, navigateToPage]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Static sidebar - never re-renders */}
      {children}
      
      {/* Dynamic content area with scroll management */}
      <div 
        ref={contentRef}
        className="flex-1 overflow-auto"
        style={{ scrollBehavior: 'auto' }} // Prevent smooth scrolling during position restoration
      >
        {currentContent}
      </div>
    </div>
  );
}
