"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import React from "react";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  
  // Check if current page should have minimal layout (no sidebar/header)
  const isAuthPage = pathname.startsWith('/login') || 
                     pathname.startsWith('/register') || 
                     pathname.startsWith('/forgot-password') ||
                     pathname.startsWith('/reset-password');

  // If it's an auth page, render minimal layout
  if (isAuthPage) {
    return (
      <div className="min-h-screen items-center justify-center bg-background">
        {children}
      </div>
    );
  }

  // For admin pages, only render the main content area
  // The sidebar will be rendered at the root level
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <SiteHeader />
      <main className="flex-1 overflow-y-scroll p-6">
        <div className="space-y-6 w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
