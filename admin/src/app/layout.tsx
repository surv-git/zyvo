import { cookies } from "next/headers";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./styles/themes.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ActiveThemeProvider } from "@/components/active-theme";
import { AuthProvider } from "@/contexts/auth-context";
import { LayoutWrapper } from "@/components/layout-wrapper";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { defaultSiteConfig } from "@/config/site";
import { ConsentManagerProvider, CookieBanner, ConsentManagerDialog } from "@c15t/nextjs";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: defaultSiteConfig.admin.title,
  description: defaultSiteConfig.admin.description,
};

// Root layout wrapper that handles the sidebar positioning
function RootLayoutContent({ children }: { children: React.ReactNode }) {
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const cookieStore = await cookies();
  const activeThemeValue = cookieStore.get("active_theme")?.value;
  const isScaled = activeThemeValue?.endsWith("-scaled");

  return (
        <html lang="en" suppressHydrationWarning>
          <body
            className={cn(
              "bg-background overscroll-none font-sans antialiased",
              geistSans.variable,
              geistMono.variable,
              activeThemeValue ? `theme-${activeThemeValue}` : "",
              isScaled ? "theme-scaled" : ""
            )}
          >
    		<ConsentManagerProvider options={{
    					mode: 'c15t',
    					backendURL: '/api/c15t',
    					consentCategories: ['necessary', 'marketing'], // Optional: Specify which consent categories to show in the banner. 
    					ignoreGeoLocation: true, // Useful for development to always view the banner.
    				}}>
    			<CookieBanner />
    			<ConsentManagerDialog />
    			
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                <ActiveThemeProvider initialTheme={activeThemeValue}>
                  <AuthProvider>
                    <RootLayoutContent>
                      {children}
                    </RootLayoutContent>
                    <Toaster richColors expand position="bottom-right" />
                  </AuthProvider>
                </ActiveThemeProvider>
            </ThemeProvider>
          
    		</ConsentManagerProvider>
    	</body>
        </html>
      )
}
