"use client";

import { useState, useEffect } from "react";
import { 
  Moon, 
  Sun, 
  Palette, 
  Monitor, 
  Settings, 
  Globe, 
  Shield, 
  Mail, 
  Users, 
  Database,
  Save,
  RotateCcw,
  Bell,
  Lock,
  FileText,
  Zap
} from "lucide-react";
import { useTheme } from "next-themes";
import { useThemeConfig } from "@/components/active-theme";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { getSiteConfig, setSiteConfig, resetSiteConfig, SiteConfig } from "@/config/site";
import { toast } from "sonner";

// Theme definitions with colors
const themes = [
  {
    name: "Default",
    value: "default",
    color: "#64748b",
  },
  {
    name: "Sunset",
    value: "sunset",
    color: "#F08A4B",
  },
  {
    name: "Dark Slate",
    value: "darkslate",
    color: "#191923",
  },
  {
    name: "Crimson",
    value: "crimson",
    color: "#A30000",
  },
  {
    name: "Midnight",
    value: "midnight",
    color: "#17183B",
  },
  {
    name: "Royal",
    value: "royal",
    color: "#0E0E52",
  },
  {
    name: "Deep Purple",
    value: "deep",
    color: "#260F26",
  },
];

export default function SettingsPage() {
  const { theme } = useTheme();
  const { activeTheme, setActiveTheme } = useThemeConfig();
  const [siteConfig, setSiteConfigState] = useState<SiteConfig>(getSiteConfig());
  const [hasChanges, setHasChanges] = useState(false);
  
  // Load config on mount
  useEffect(() => {
    setSiteConfigState(getSiteConfig());
  }, []);
  
  // Get display-friendly theme names
  const getThemeDisplayName = (theme: string) => {
    if (!theme) return "System";
    return theme.charAt(0).toUpperCase() + theme.slice(1);
  };
  
  const getColorDisplayName = (color: string) => {
    if (!color || color === "default") return "Default";
    return color.charAt(0).toUpperCase() + color.slice(1);
  };

  // Handle config updates
  const updateConfig = (section: keyof SiteConfig, field: string, value: any) => {
    const currentSection = siteConfig[section] as Record<string, any>;
    const newConfig = {
      ...siteConfig,
      [section]: {
        ...currentSection,
        [field]: value
      }
    };
    setSiteConfigState(newConfig);
    setHasChanges(true);
  };

  // Handle top-level config updates
  const updateTopLevelConfig = (field: keyof SiteConfig, value: any) => {
    const newConfig = {
      ...siteConfig,
      [field]: value
    };
    setSiteConfigState(newConfig);
    setHasChanges(true);
  };

  // Save configuration
  const saveConfig = () => {
    setSiteConfig(siteConfig);
    setHasChanges(false);
    toast.success('Settings saved successfully!');
  };

  // Reset configuration
  const resetConfig = () => {
    resetSiteConfig();
    setSiteConfigState(getSiteConfig());
    setHasChanges(false);
    toast.success('Settings reset to defaults!');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground text-sm">
            Customize your admin dashboard and application configuration
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={resetConfig}
            variant="outline"
            size="sm"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={saveConfig}
            disabled={!hasChanges}
            size="sm"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
      
      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        
        {/* Theme Mode - Compact */}
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Monitor className="h-4 w-4" />
              Theme Mode
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ToggleGroup 
              type="single" 
              value={theme || 'system'} 
              onValueChange={(value) => {
                if (value === 'light') {
                  document.documentElement.classList.remove('dark');
                  localStorage.setItem('theme', 'light');
                } else if (value === 'dark') {
                  document.documentElement.classList.add('dark');
                  localStorage.setItem('theme', 'dark');
                } else {
                  document.documentElement.classList.remove('dark');
                  localStorage.removeItem('theme');
                  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    document.documentElement.classList.add('dark');
                  }
                }
                window.dispatchEvent(new Event('storage'));
              }}
              className="flex gap-1"
            >
              <ToggleGroupItem value="light" className="h-7 px-2 text-xs">
                <Sun className="h-3 w-3" />
              </ToggleGroupItem>
              <ToggleGroupItem value="dark" className="h-7 px-2 text-xs">
                <Moon className="h-3 w-3" />
              </ToggleGroupItem>
              <ToggleGroupItem value="system" className="h-7 px-2 text-xs">
                <Monitor className="h-3 w-3" />
              </ToggleGroupItem>
            </ToggleGroup>
            <div className="text-xs text-muted-foreground">
              Current: <span className="font-medium">{getThemeDisplayName(theme || 'system')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Theme Color - Compact */}
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Palette className="h-4 w-4" />
              Color Theme
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ToggleGroup 
              type="single" 
              value={activeTheme} 
              onValueChange={(value) => value && setActiveTheme(value)}
              className="flex flex-wrap gap-1"
            >
              {themes.map((theme) => (
                <ToggleGroupItem
                  key={theme.value}
                  value={theme.value}
                  className="h-6 w-6 min-w-6 p-0 rounded-full border-2 border-muted-foreground/20 hover:border-primary data-[state=on]:border-primary data-[state=on]:ring-2 data-[state=on]:ring-primary/20"
                  style={{ backgroundColor: theme.color }}
                  title={theme.name}
                >
                  <span className="sr-only">{theme.name}</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <div className="text-xs text-muted-foreground">
              Current: <span className="font-medium">{getColorDisplayName(activeTheme)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Site Information - Wide */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4" />
              Site Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="site-name" className="text-xs">Site Name</Label>
              <Input
                id="site-name"
                value={siteConfig.name}
                onChange={(e) => updateTopLevelConfig('name', e.target.value)}
                className="h-7 text-xs mt-1"
              />
            </div>
            <div>
              <Label htmlFor="site-url" className="text-xs">Site URL</Label>
              <Input
                id="site-url"
                value={siteConfig.url}
                onChange={(e) => updateTopLevelConfig('url', e.target.value)}
                className="h-7 text-xs mt-1"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="site-description" className="text-xs">Description</Label>
              <Textarea
                id="site-description"
                value={siteConfig.description}
                onChange={(e) => updateTopLevelConfig('description', e.target.value)}
                rows={2}
                className="resize-none text-xs mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* User Features */}
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4" />
              User Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Registration</Label>
              <Switch
                checked={siteConfig.features.userRegistration}
                onCheckedChange={(checked) => updateConfig('features', 'userRegistration', checked)}
                className="h-4 w-7"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Email Verification</Label>
              <Switch
                checked={siteConfig.features.emailVerification}
                onCheckedChange={(checked) => updateConfig('features', 'emailVerification', checked)}
                className="h-4 w-7"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Social Login</Label>
              <Switch
                checked={siteConfig.features.socialLogin}
                onCheckedChange={(checked) => updateConfig('features', 'socialLogin', checked)}
                className="h-4 w-7"
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Features */}
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Two-Factor Auth</Label>
              <Switch
                checked={siteConfig.features.twoFactorAuth}
                onCheckedChange={(checked) => updateConfig('features', 'twoFactorAuth', checked)}
                className="h-4 w-7"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">File Upload</Label>
              <Switch
                checked={siteConfig.features.fileUpload}
                onCheckedChange={(checked) => updateConfig('features', 'fileUpload', checked)}
                className="h-4 w-7"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Dark Mode</Label>
              <Switch
                checked={siteConfig.features.darkMode}
                onCheckedChange={(checked) => updateConfig('features', 'darkMode', checked)}
                className="h-4 w-7"
              />
            </div>
          </CardContent>
        </Card>

        {/* Admin Settings */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Settings className="h-4 w-4" />
              Admin Panel
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="admin-title" className="text-xs">Admin Title</Label>
              <Input
                id="admin-title"
                value={siteConfig.admin.title}
                onChange={(e) => updateConfig('admin', 'title', e.target.value)}
                className="h-7 text-xs mt-1"
              />
            </div>
            <div>
              <Label htmlFor="items-per-page" className="text-xs">Items Per Page</Label>
              <Select
                value={siteConfig.admin.itemsPerPage.toString()}
                onValueChange={(value) => updateConfig('admin', 'itemsPerPage', parseInt(value))}
              >
                <SelectTrigger className="h-7 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="timezone" className="text-xs">Timezone</Label>
              <Select
                value={siteConfig.admin.timezone}
                onValueChange={(value) => updateConfig('admin', 'timezone', value)}
              >
                <SelectTrigger className="h-7 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific</SelectItem>
                  <SelectItem value="Europe/London">London</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* System Settings - Tall */}
        <Card className="col-span-1 row-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Bell className="h-4 w-4" />
              System
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Notifications</Label>
              <Switch
                checked={siteConfig.admin.enableNotifications}
                onCheckedChange={(checked) => updateConfig('admin', 'enableNotifications', checked)}
                className="h-4 w-7"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Analytics</Label>
              <Switch
                checked={siteConfig.admin.enableAnalytics}
                onCheckedChange={(checked) => updateConfig('admin', 'enableAnalytics', checked)}
                className="h-4 w-7"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Maintenance</Label>
              <Switch
                checked={siteConfig.admin.maintenanceMode}
                onCheckedChange={(checked) => updateConfig('admin', 'maintenanceMode', checked)}
                className="h-4 w-7"
              />
            </div>
            <div>
              <Label htmlFor="currency" className="text-xs">Currency</Label>
              <Select
                value={siteConfig.admin.currency}
                onValueChange={(value) => updateConfig('admin', 'currency', value)}
              >
                <SelectTrigger className="h-7 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="INR">INR (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Multi-Language</Label>
              <Switch
                checked={siteConfig.features.multiLanguage}
                onCheckedChange={(checked) => updateConfig('features', 'multiLanguage', checked)}
                className="h-4 w-7"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">API Access</Label>
              <Switch defaultChecked className="h-4 w-7" />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Webhooks</Label>
              <Switch className="h-4 w-7" />
            </div>
          </CardContent>
        </Card>

        {/* Password Policy */}
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Lock className="h-4 w-4" />
              Password Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <Label htmlFor="password-min-length" className="text-xs">Min Length</Label>
              <Select
                value={siteConfig.security.passwordMinLength.toString()}
                onValueChange={(value) => updateConfig('security', 'passwordMinLength', parseInt(value))}
              >
                <SelectTrigger className="h-7 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6 chars</SelectItem>
                  <SelectItem value="8">8 chars</SelectItem>
                  <SelectItem value="10">10 chars</SelectItem>
                  <SelectItem value="12">12 chars</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Uppercase</Label>
              <Switch
                checked={siteConfig.security.passwordRequireUppercase}
                onCheckedChange={(checked) => updateConfig('security', 'passwordRequireUppercase', checked)}
                className="h-4 w-7"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Numbers</Label>
              <Switch
                checked={siteConfig.security.passwordRequireNumbers}
                onCheckedChange={(checked) => updateConfig('security', 'passwordRequireNumbers', checked)}
                className="h-4 w-7"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Symbols</Label>
              <Switch
                checked={siteConfig.security.passwordRequireSymbols}
                onCheckedChange={(checked) => updateConfig('security', 'passwordRequireSymbols', checked)}
                className="h-4 w-7"
              />
            </div>
          </CardContent>
        </Card>

        {/* Login Security */}
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4" />
              Login Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <Label htmlFor="login-attempts" className="text-xs">Max Attempts</Label>
              <Select
                value={siteConfig.security.loginAttempts.toString()}
                onValueChange={(value) => updateConfig('security', 'loginAttempts', parseInt(value))}
              >
                <SelectTrigger className="h-7 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 attempts</SelectItem>
                  <SelectItem value="5">5 attempts</SelectItem>
                  <SelectItem value="10">10 attempts</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="lockout-duration" className="text-xs">Lockout Duration</Label>
              <Select
                value={siteConfig.security.lockoutDuration.toString()}
                onValueChange={(value) => updateConfig('security', 'lockoutDuration', parseInt(value))}
              >
                <SelectTrigger className="h-7 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* File & Storage Limits */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Database className="h-4 w-4" />
              Limits & Storage
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="max-file-size" className="text-xs">Max File Size</Label>
              <Select
                value={siteConfig.limits.maxFileSize.toString()}
                onValueChange={(value) => updateConfig('limits', 'maxFileSize', parseInt(value))}
              >
                <SelectTrigger className="h-7 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 MB</SelectItem>
                  <SelectItem value="5">5 MB</SelectItem>
                  <SelectItem value="10">10 MB</SelectItem>
                  <SelectItem value="25">25 MB</SelectItem>
                  <SelectItem value="50">50 MB</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="max-users" className="text-xs">Max Users</Label>
              <Input
                id="max-users"
                type="number"
                value={siteConfig.limits.maxUsers}
                onChange={(e) => updateConfig('limits', 'maxUsers', parseInt(e.target.value) || 0)}
                className="h-7 text-xs mt-1"
              />
            </div>
            <div>
              <Label htmlFor="session-timeout" className="text-xs">Session Timeout</Label>
              <Select
                value={siteConfig.limits.sessionTimeout.toString()}
                onValueChange={(value) => updateConfig('limits', 'sessionTimeout', parseInt(value))}
              >
                <SelectTrigger className="h-7 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Email Settings - Wide */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4" />
              Email Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <Label htmlFor="email-provider" className="text-xs">Provider</Label>
              <Select
                value={siteConfig.email.provider}
                onValueChange={(value) => updateConfig('email', 'provider', value)}
              >
                <SelectTrigger className="h-7 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="smtp">SMTP</SelectItem>
                  <SelectItem value="sendgrid">SendGrid</SelectItem>
                  <SelectItem value="mailgun">Mailgun</SelectItem>
                  <SelectItem value="ses">Amazon SES</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="from-name" className="text-xs">From Name</Label>
              <Input
                id="from-name"
                value={siteConfig.email.fromName}
                onChange={(e) => updateConfig('email', 'fromName', e.target.value)}
                className="h-7 text-xs mt-1"
              />
            </div>
            <div>
              <Label htmlFor="from-email" className="text-xs">From Email</Label>
              <Input
                id="from-email"
                type="email"
                value={siteConfig.email.fromEmail}
                onChange={(e) => updateConfig('email', 'fromEmail', e.target.value)}
                className="h-7 text-xs mt-1"
              />
            </div>
            <div>
              <Label htmlFor="reply-to" className="text-xs">Reply To</Label>
              <Input
                id="reply-to"
                type="email"
                value={siteConfig.email.replyTo}
                onChange={(e) => updateConfig('email', 'replyTo', e.target.value)}
                className="h-7 text-xs mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Advanced Settings */}
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Zap className="h-4 w-4" />
              Advanced
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Cache Enabled</Label>
              <Switch defaultChecked className="h-4 w-7" />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Compression</Label>
              <Switch defaultChecked className="h-4 w-7" />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">CDN</Label>
              <Switch className="h-4 w-7" />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Audit Trail</Label>
              <Switch defaultChecked className="h-4 w-7" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
