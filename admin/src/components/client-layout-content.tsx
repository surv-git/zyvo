'use client';

import { usePathname } from 'next/navigation';
import { SPANavigationWrapper } from '@/components/spa-navigation-wrapper';
import { AppSidebar } from '@/components/app-sidebar';
import { LayoutWrapper } from '@/components/layout-wrapper';
import { SidebarProvider } from '@/components/ui/sidebar';

export function ClientLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  return (
    <div className="h-screen flex overflow-hidden theme-container">
      <SidebarProvider>
        <SPANavigationWrapper initialPath={pathname}>
          <AppSidebar />
          <LayoutWrapper>
            {/* This will be replaced by dynamic content */}
            <div className="hidden">
              {children}
            </div>
          </LayoutWrapper>
        </SPANavigationWrapper>
      </SidebarProvider>
    </div>
  );
}
