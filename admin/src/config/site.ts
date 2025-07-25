import React from 'react';

export interface SiteConfig {
  name: string;
  description: string;
  url: string;
  ogImage: string;
  links: {
    twitter: string;
    github: string;
  };
  admin: {
    title: string;
    description: string;
    logo: string;
    favicon: string;
    itemsPerPage: number;
    itemsPerPageOptions: number[];
    enableNotifications: boolean;
    enableAnalytics: boolean;
    maintenanceMode: boolean;
    timezone: string;
    dateFormat: string;
    currency: string;
    language: string;
  };
  features: {
    userRegistration: boolean;
    emailVerification: boolean;
    twoFactorAuth: boolean;
    socialLogin: boolean;
    fileUpload: boolean;
    darkMode: boolean;
    multiLanguage: boolean;
  };
  limits: {
    maxFileSize: number; // in MB
    maxUsers: number;
    sessionTimeout: number; // in minutes
    rateLimitRequests: number;
    rateLimitWindow: number; // in minutes
  };
  email: {
    provider: 'smtp' | 'sendgrid' | 'mailgun' | 'ses';
    fromName: string;
    fromEmail: string;
    replyTo: string;
  };
  security: {
    passwordMinLength: number;
    passwordRequireUppercase: boolean;
    passwordRequireNumbers: boolean;
    passwordRequireSymbols: boolean;
    loginAttempts: number;
    lockoutDuration: number; // in minutes
  };
}

export const defaultSiteConfig: SiteConfig = {
  name: "Zyvo Admin",
  description: "Modern admin dashboard for managing your application",
  url: "https://admin.zyvo.com",
  ogImage: "/og-image.png",
  links: {
    twitter: "https://twitter.com/zyvo",
    github: "https://github.com/zyvo/admin",
  },
  admin: {
    title: "Zyvo Admin Dashboard",
    description: "Comprehensive admin panel for managing users, content, and analytics",
    logo: "/logo.svg",
    favicon: "/favicon.ico",
    itemsPerPage: 5,
    itemsPerPageOptions: [5, 10, 20, 50, 100],
    enableNotifications: true,
    enableAnalytics: true,
    maintenanceMode: false,
    timezone: "UTC",
    dateFormat: "MM/DD/YYYY",
    currency: "USD",
    language: "en",
  },
  features: {
    userRegistration: true,
    emailVerification: true,
    twoFactorAuth: false,
    socialLogin: true,
    fileUpload: true,
    darkMode: true,
    multiLanguage: false,
  },
  limits: {
    maxFileSize: 10, // 10MB
    maxUsers: 1000,
    sessionTimeout: 60, // 1 hour
    rateLimitRequests: 100,
    rateLimitWindow: 15, // 15 minutes
  },
  email: {
    provider: 'smtp',
    fromName: "Zyvo Admin",
    fromEmail: "noreply@zyvo.com",
    replyTo: "support@zyvo.com",
  },
  security: {
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireNumbers: true,
    passwordRequireSymbols: false,
    loginAttempts: 5,
    lockoutDuration: 30, // 30 minutes
  },
};

// Site config storage - now supports both localStorage fallback and server persistence
const SITE_CONFIG_KEY = 'zyvo-site-config';

// Helper functions for managing site config
export const getSiteConfig = async (): Promise<SiteConfig> => {
  // Try to load from server first
  try {
    const response = await fetch('/api/config');
    if (response.ok) {
      const serverConfig = await response.json();
      if (serverConfig) {
        // Merge with defaults to ensure all properties exist
        return { ...defaultSiteConfig, ...serverConfig };
      }
    }
  } catch (error) {
    console.warn('Failed to load config from server, falling back to localStorage:', error);
  }

  // Fallback to localStorage for client-side
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(SITE_CONFIG_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...defaultSiteConfig, ...parsed };
      }
    } catch (error) {
      console.error('Error loading site config from localStorage:', error);
    }
  }
  
  return defaultSiteConfig;
};

// Synchronous version for immediate use (fallback to localStorage/defaults)
export const getSiteConfigSync = (): SiteConfig => {
  if (typeof window === 'undefined') return defaultSiteConfig;
  
  try {
    const stored = localStorage.getItem(SITE_CONFIG_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultSiteConfig, ...parsed };
    }
  } catch (error) {
    console.error('Error loading site config:', error);
  }
  
  return defaultSiteConfig;
};

export const setSiteConfig = async (config: Partial<SiteConfig>): Promise<boolean> => {
  const currentConfig = await getSiteConfig();
  const newConfig = { ...currentConfig, ...config };
  
  // Try to save to server first
  try {
    const response = await fetch('/api/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newConfig),
    });
    
    if (response.ok) {
      // Also save to localStorage as backup
      if (typeof window !== 'undefined') {
        localStorage.setItem(SITE_CONFIG_KEY, JSON.stringify(newConfig));
      }
      
      // Dispatch custom event for config changes
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('siteConfigChanged', { 
          detail: newConfig 
        }));
      }
      
      return true;
    }
  } catch (error) {
    console.error('Error saving site config to server:', error);
  }
  
  // Fallback to localStorage only
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(SITE_CONFIG_KEY, JSON.stringify(newConfig));
      window.dispatchEvent(new CustomEvent('siteConfigChanged', { 
        detail: newConfig 
      }));
      return true;
    } catch (error) {
      console.error('Error saving site config to localStorage:', error);
    }
  }
  
  return false;
};

export const resetSiteConfig = async (): Promise<boolean> => {
  // Try to reset on server first
  try {
    const response = await fetch('/api/config', {
      method: 'DELETE',
    });
    
    if (response.ok) {
      // Also clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem(SITE_CONFIG_KEY);
        window.dispatchEvent(new CustomEvent('siteConfigChanged', { 
          detail: defaultSiteConfig 
        }));
      }
      return true;
    }
  } catch (error) {
    console.error('Error resetting site config on server:', error);
  }
  
  // Fallback to localStorage only
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(SITE_CONFIG_KEY);
      window.dispatchEvent(new CustomEvent('siteConfigChanged', { 
        detail: defaultSiteConfig 
      }));
      return true;
    } catch (error) {
      console.error('Error resetting site config in localStorage:', error);
    }
  }
  
  return false;
};

// Hook for using site config in components
export const useSiteConfig = () => {
  const [config, setConfig] = React.useState<SiteConfig>(getSiteConfigSync);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    // Load config asynchronously on mount
    const loadConfig = async () => {
      try {
        const asyncConfig = await getSiteConfig();
        setConfig(asyncConfig);
      } catch (error) {
        console.error('Error loading async config:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadConfig();
    
    const handleConfigChange = (event: CustomEvent) => {
      setConfig(event.detail);
    };
    
    window.addEventListener('siteConfigChanged', handleConfigChange as EventListener);
    
    return () => {
      window.removeEventListener('siteConfigChanged', handleConfigChange as EventListener);
    };
  }, []);
  
  const updateConfig = async (newConfig: Partial<SiteConfig>) => {
    const success = await setSiteConfig(newConfig);
    return success;
  };
  
  const resetConfig = async () => {
    const success = await resetSiteConfig();
    return success;
  };
  
  return {
    config,
    loading,
    updateConfig,
    resetConfig,
  };
};
