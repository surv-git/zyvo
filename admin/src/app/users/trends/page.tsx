"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useThemeConfig } from '@/components/active-theme';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, LineChart, Line } from 'recharts';
import { CalendarDays, TrendingUp, Users, RefreshCw, Loader2, AlertCircle, AreaChart as AreaChartIcon, BarChart3, TrendingUpIcon } from 'lucide-react';
import { toast } from 'sonner';
import { API_CONFIG, buildUrl, getHeaders } from '@/config/api';

interface RegistrationTrendData {
  count: number;
  date: string;
}

interface TrendsResponse {
  success: boolean;
  data: RegistrationTrendData[];
}

interface ActiveUsersData {
  activeUsers: number;
  period: string;
  thresholdDate: string;
}

interface ActiveUsersResponse {
  success: boolean;
  data: ActiveUsersData;
}

interface TopActivityUser {
  _id: string;
  name: string;
  email: string;
  loginCount?: number;
  orderCount?: number;
  reviewCount?: number;
  lastLogin?: string;
  lastOrder?: string;
  lastReview?: string;
}

interface TopActivityResponse {
  success: boolean;
  data: TopActivityUser[];
}

interface UserRolesData {
  user: number;
  admin: number;
  [key: string]: number; // Allow for additional roles
}

interface UserRolesResponse {
  success: boolean;
  data: UserRolesData;
}

type PeriodType = 'daily' | 'weekly' | 'monthly' | 'yearly';
type ChartType = 'area' | 'bar' | 'line';



const chartConfig = {
  registrations: {
    label: "Registrations",
    color: "hsl(var(--primary))",
  },
};

// Theme color mapping based on active theme
const getThemeColors = (activeTheme: string) => {
  const themeColorMap: Record<string, { primary: string; shades: string[] }> = {
    'sunset': {
      primary: '#F08A4B',
      shades: ['#F08A4B', '#e07a3b', '#d06a2b', '#c05a1b', '#b04a0b']
    },
    'darkslate': {
      primary: '#191923',
      shades: ['#191923', '#2a2a34', '#3b3b45', '#4c4c56', '#5d5d67']
    },
    'crimson': {
      primary: '#A30000',
      shades: ['#A30000', '#b31010', '#c32020', '#d33030', '#e34040']
    },
    'midnight': {
      primary: '#17183B',
      shades: ['#17183B', '#27284b', '#37385b', '#47486b', '#57587b']
    },
    'royal': {
      primary: '#0E0E52',
      shades: ['#0E0E52', '#1e1e62', '#2e2e72', '#3e3e82', '#4e4e92']
    },
    'deep': {
      primary: '#260F26',
      shades: ['#260F26', '#361f36', '#462f46', '#563f56', '#664f66']
    },
    'default': {
      primary: '#64748b',
      shades: ['#64748b', '#475569', '#334155', '#1e293b', '#0f172a']
    },
    'blue': {
      primary: '#3b82f6',
      shades: ['#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a']
    }
  };
  
  return themeColorMap[activeTheme] || themeColorMap['default'];
};

export default function UserTrendsPage() {
  const { activeTheme } = useThemeConfig();
  const [data, setData] = useState<RegistrationTrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodType>('daily');
  const [chartType, setChartType] = useState<ChartType>('area');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // Active users state
  const [activeUsersData, setActiveUsersData] = useState<ActiveUsersData | null>(null);
  const [activeUsersLoading, setActiveUsersLoading] = useState(true);
  const [lastActivityDays, setLastActivityDays] = useState(10);
  
  // Top activity users state
  const [topActivityData, setTopActivityData] = useState<TopActivityUser[]>([]);
  const [topActivityLoading, setTopActivityLoading] = useState(true);
  const [activityType, setActivityType] = useState<'logins' | 'orders' | 'reviews'>('logins');
  const [topUsersLimit, setTopUsersLimit] = useState(10);
  
  // User roles state
  const [userRolesData, setUserRolesData] = useState<UserRolesData | null>(null);
  const [userRolesLoading, setUserRolesLoading] = useState(true);

  // Calculate default date range (last 30 days)
  const getDefaultDateRange = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

  // Initialize default dates
  useEffect(() => {
    const { start, end } = getDefaultDateRange();
    setStartDate(start);
    setEndDate(end);
  }, []);

  // Fetch trends data
  const fetchTrends = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      params.append('period', period);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const url = `${API_CONFIG.BASE_URL}/api/v1/admin/users/trends/registrations?${params.toString()}`;
      
      const authToken = sessionStorage.getItem('auth_token');
      if (!authToken) {
        throw new Error('Authentication required. Please log in to access this resource.');
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders({ authToken }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: TrendsResponse = await response.json();
      
      if (result.success) {
        setData(result.data);
        toast.success(`Loaded ${result.data.length} data points`);
      } else {
        throw new Error('Failed to fetch trends data');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch trends data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [period, startDate, endDate]);

  // Fetch active users data
  const fetchActiveUsers = useCallback(async () => {
    try {
      setActiveUsersLoading(true);

      const authToken = sessionStorage.getItem('auth_token');
      if (!authToken) {
        throw new Error('Authentication required. Please log in to access this resource.');
      }

      const params = new URLSearchParams();
      params.append('lastActivityDays', lastActivityDays.toString());

      const url = `${API_CONFIG.BASE_URL}/api/v1/admin/users/trends/active?${params.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders({ authToken }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ActiveUsersResponse = await response.json();
      
      if (result.success) {
        setActiveUsersData(result.data);
      } else {
        throw new Error('Failed to fetch active users data');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch active users data';
      toast.error(errorMessage);
    } finally {
      setActiveUsersLoading(false);
    }
  }, [lastActivityDays]);

  // Fetch top activity users data
  const fetchTopActivity = useCallback(async () => {
    try {
      setTopActivityLoading(true);

      const authToken = sessionStorage.getItem('auth_token');
      if (!authToken) {
        throw new Error('Authentication required. Please log in to access this resource.');
      }

      const params = new URLSearchParams();
      params.append('type', activityType);
      params.append('limit', topUsersLimit.toString());

      const url = `${API_CONFIG.BASE_URL}/api/v1/admin/users/trends/top-activity?${params.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders({ authToken }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: TopActivityResponse = await response.json();
      
      if (result.success) {
        setTopActivityData(result.data);
      } else {
        throw new Error('Failed to fetch top activity users data');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch top activity users data';
      toast.error(errorMessage);
    } finally {
      setTopActivityLoading(false);
    }
  }, [activityType, topUsersLimit]);

  // Fetch user roles data
  const fetchUserRoles = useCallback(async () => {
    try {
      setUserRolesLoading(true);

      const authToken = sessionStorage.getItem('auth_token');
      if (!authToken) {
        throw new Error('Authentication required. Please log in to access this resource.');
      }

      const url = `${API_CONFIG.BASE_URL}/api/v1/admin/users/trends/roles`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders({ authToken }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: UserRolesResponse = await response.json();
      
      if (result.success) {
        setUserRolesData(result.data);
      } else {
        throw new Error('Failed to fetch user roles data');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user roles data';
      toast.error(errorMessage);
    } finally {
      setUserRolesLoading(false);
    }
  }, []);

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchTrends(), fetchActiveUsers(), fetchTopActivity(), fetchUserRoles()]);
    setRefreshing(false);
  };

  // Initial data fetch
  useEffect(() => {
    if (startDate && endDate) {
      fetchTrends();
    }
  }, [fetchTrends, startDate, endDate]);

  // Fetch active users data
  useEffect(() => {
    fetchActiveUsers();
  }, [fetchActiveUsers]);

  // Fetch top activity users data
  useEffect(() => {
    fetchTopActivity();
  }, [fetchTopActivity]);

  // Fetch user roles data
  useEffect(() => {
    fetchUserRoles();
  }, [fetchUserRoles]);

  // Calculate statistics
  const totalRegistrations = data.reduce((sum, item) => sum + item.count, 0);
  const averagePerPeriod = data.length > 0 ? Math.round(totalRegistrations / data.length) : 0;
  const maxRegistrations = Math.max(...data.map(item => item.count), 0);
  const minRegistrations = Math.min(...data.map(item => item.count), 0);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    switch (period) {
      case 'daily':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case 'weekly':
        return `Week ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      case 'monthly':
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      case 'yearly':
        return date.getFullYear().toString();
      default:
        return dateString;
    }
  };

  // Prepare chart data
  const chartData = data.map(item => ({
    ...item,
    formattedDate: formatDate(item.date),
    registrations: item.count,
  }));

  // Render chart based on type
  const renderChart = () => {
    const themeColors = getThemeColors(activeTheme);
    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 },      
    };

    switch (chartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="formattedDate" 
              className="text-xs fill-muted-foreground"
              tick={{ fontSize: 12 }}
            />
            <YAxis className="text-xs fill-muted-foreground" tick={{ fontSize: 12 }} />
            <ChartTooltip 
              content={<ChartTooltipContent />}
              cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
            />
            <Area
              type="monotone"
              dataKey="registrations"
              stroke={themeColors.primary}
              fill={themeColors.primary}
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </AreaChart>
        );
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="formattedDate" 
              className="text-xs fill-muted-foreground"
              tick={{ fontSize: 12 }}
            />
            <YAxis className="text-xs fill-muted-foreground" tick={{ fontSize: 12 }} />
            <ChartTooltip 
              content={<ChartTooltipContent />}
              cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
            />
            <Bar
              dataKey="registrations"
              fill={themeColors.primary}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        );
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="formattedDate" 
              className="text-xs fill-muted-foreground"
              tick={{ fontSize: 12 }}
            />
            <YAxis className="text-xs fill-muted-foreground" tick={{ fontSize: 12 }} />
            <ChartTooltip 
              content={<ChartTooltipContent />}
              cursor={{ stroke: themeColors.primary, strokeWidth: 1 }}
            />
            <Line
              type="monotone"
              dataKey="registrations"
              stroke={themeColors.primary}
              strokeWidth={2}
              dot={{ fill: themeColors.primary, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: themeColors.primary }}
            />
          </LineChart>
        );
      default:
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="formattedDate" 
              className="text-xs fill-muted-foreground"
              tick={{ fontSize: 12 }}
            />
            <YAxis className="text-xs fill-muted-foreground" tick={{ fontSize: 12 }} />
            <ChartTooltip 
              content={<ChartTooltipContent />}
              cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
            />
            <Area
              type="monotone"
              dataKey="registrations"
              stroke={themeColors.primary}
              fill={themeColors.primary}
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </AreaChart>
        );
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Registration Trends</h1>
          <p className="text-muted-foreground mt-2">
            Analyze user registration patterns and trends over time.
          </p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={refreshing || loading}
          variant="outline"
          size="sm"
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{totalRegistrations.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  In selected period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average per {period.slice(0, -2)}</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{averagePerPeriod}</div>
                <p className="text-xs text-muted-foreground">
                  Average registrations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Peak Day</CardTitle>
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{maxRegistrations}</div>
                <p className="text-xs text-muted-foreground">
                  Highest registrations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lowest Day</CardTitle>
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{minRegistrations}</div>
                <p className="text-xs text-muted-foreground">
                  Lowest registrations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {activeUsersLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading...</span>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-primary">
                      {activeUsersData?.activeUsers?.toLocaleString() || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Active in last {lastActivityDays} days
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

      {/* Main Analytics Grid - Optimized Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Registration Trends Chart - Takes 2 columns on XL screens */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Registration Trends</CardTitle>
            <CardDescription>
              User registration patterns over the selected time period ({period})
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Registration Trends Filters */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              {/* Period Selection */}
              <div className="space-y-1">
                <Label htmlFor="period" className="text-xs">Period</Label>
                <Select value={period} onValueChange={(value: PeriodType) => setPeriod(value)}>
                  <SelectTrigger id="period" className='w-full h-8'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Chart Type */}
              <div className="space-y-1">
                <Label className="text-xs">Chart Type</Label>
                <ToggleGroup 
                  type="single" 
                  value={chartType} 
                  onValueChange={(value: ChartType) => value && setChartType(value)}
                  className="justify-start items-center w-full"
                >
                  <ToggleGroupItem value="area" aria-label="Area Chart" size="sm" className="border">
                    <AreaChartIcon className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="bar" aria-label="Bar Chart" size="sm" className="border">
                    <BarChart3 className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="line" aria-label="Line Chart" size="sm" className="border">
                    <TrendingUpIcon className="h-4 w-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              {/* Start Date */}
              <div className="space-y-1">
                <Label htmlFor="startDate" className="text-xs">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className='w-full h-8'
                />
              </div>

              {/* End Date */}
              <div className="space-y-1">
                <Label htmlFor="endDate" className="text-xs">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className='w-full h-8'
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-[300px]">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-muted-foreground">Loading trends data...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-[300px]">
                <div className="text-center">
                  <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
                  <p className="text-destructive font-medium mb-2">Error loading data</p>
                  <p className="text-muted-foreground text-sm mb-4">{error}</p>
                  <Button onClick={fetchTrends} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              </div>
            ) : data.length === 0 ? (
              <div className="flex items-center justify-center h-[300px]">
                <div className="text-center">
                  <Users className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No registration data found for the selected period</p>
                </div>
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {renderChart()}
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Active Users Overview - Compact */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Active Users</CardTitle>
            <CardDescription className="text-sm">
              Users active in the last {lastActivityDays} days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Active Users Filter */}
            <div className="mb-4">
              <div className="space-y-1">
                <Label htmlFor="activityDays" className="text-xs">Activity Period</Label>
                <Select value={lastActivityDays.toString()} onValueChange={(value) => setLastActivityDays(parseInt(value))}>
                  <SelectTrigger id="activityDays" className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="10">Last 10 days</SelectItem>
                    <SelectItem value="14">Last 14 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="60">Last 60 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {activeUsersLoading ? (
              <div className="flex items-center justify-center h-[200px]">
                <div className="text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
              </div>
            ) : activeUsersData ? (
              <div className="space-y-4">
                {/* Compact Active Users Display */}
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-1">
                    {activeUsersData.activeUsers}
                  </div>
                  <div className="text-sm text-muted-foreground mb-3">
                    Active Users
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min((activeUsersData.activeUsers / Math.max(totalRegistrations, 1)) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {totalRegistrations > 0 ? Math.round((activeUsersData.activeUsers / totalRegistrations) * 100) : 0}% of total users
                  </div>
                </div>

                {/* Compact Stats */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <div className="text-lg font-bold text-primary">
                      {activeUsersData.activeUsers}
                    </div>
                    <div className="text-xs text-muted-foreground">Active</div>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <div className="text-lg font-bold text-muted-foreground">
                      {Math.max(totalRegistrations - activeUsersData.activeUsers, 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Inactive</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px]">
                <div className="text-center">
                  <Users className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User Activity Section - Optimized */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Top Activity Users - Takes 2 columns on XL screens */}
        <Card className="xl:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Top {activityType.charAt(0).toUpperCase() + activityType.slice(1)} Users</CardTitle>
            <CardDescription className="text-sm">
              Users with the highest {activityType} activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Top Activity Users Filters */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Activity Type */}
              <div className="space-y-1">
                <Label htmlFor="activityType" className="text-xs">Activity Type</Label>
                <Select value={activityType} onValueChange={(value: 'logins' | 'orders' | 'reviews') => setActivityType(value)}>
                  <SelectTrigger id="activityType" className='w-full h-8'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="logins">Logins</SelectItem>
                    <SelectItem value="orders">Orders</SelectItem>
                    <SelectItem value="reviews">Reviews</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Top Users Limit */}
              <div className="space-y-1">
                <Label htmlFor="topUsersLimit" className="text-xs">Number of Users</Label>
                <Select value={topUsersLimit.toString()} onValueChange={(value) => setTopUsersLimit(parseInt(value))}>
                  <SelectTrigger id="topUsersLimit" className='w-full h-8'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">Top 5</SelectItem>
                    <SelectItem value="10">Top 10</SelectItem>
                    <SelectItem value="15">Top 15</SelectItem>
                    <SelectItem value="20">Top 20</SelectItem>
                    <SelectItem value="25">Top 25</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

          {topActivityLoading ? (
            <div className="flex items-center justify-center h-[200px]">
              <div className="text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            </div>
          ) : topActivityData.length > 0 ? (
            <div className="space-y-2">
              {/* Top Users List - Compact */}
              <div className="grid gap-2">
                {topActivityData.map((user, index) => {
                  const activityCount = activityType === 'logins' ? user.loginCount : 
                                       activityType === 'orders' ? user.orderCount : 
                                       user.reviewCount;
                  const lastActivity = activityType === 'logins' ? user.lastLogin : 
                                      activityType === 'orders' ? user.lastOrder : 
                                      user.lastReview;
                  
                  return (
                    <div key={user._id} className="flex items-center justify-between p-3 bg-muted/50 rounded hover:bg-muted/70 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs font-bold">
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm truncate">{user.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-bold text-primary">
                          {activityCount?.toLocaleString() || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {lastActivity ? new Date(lastActivity).toLocaleDateString() : 'No activity'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Activity Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {topActivityData.reduce((sum, user) => {
                      const count = activityType === 'logins' ? user.loginCount : 
                                   activityType === 'orders' ? user.orderCount : 
                                   user.reviewCount;
                      return sum + (count || 0);
                    }, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Total {activityType}</div>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {Math.round(topActivityData.reduce((sum, user) => {
                      const count = activityType === 'logins' ? user.loginCount : 
                                   activityType === 'orders' ? user.orderCount : 
                                   user.reviewCount;
                      return sum + (count || 0);
                    }, 0) / topActivityData.length).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Average per user</div>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {Math.max(...topActivityData.map(user => {
                      const count = activityType === 'logins' ? user.loginCount : 
                                   activityType === 'orders' ? user.orderCount : 
                                   user.reviewCount;
                      return count || 0;
                    })).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Highest {activityType}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px]">
              <div className="text-center">
                <Users className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No {activityType} activity data available</p>
              </div>
            </div>
          )}
        </CardContent>
        </Card>

        {/* User Roles Distribution - Compact */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">User Roles</CardTitle>
            <CardDescription className="text-sm">
              Breakdown by assigned roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userRolesLoading ? (
              <div className="flex items-center justify-center h-[200px]">
                <div className="text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
              </div>
            ) : userRolesData ? (
              <div>
                {/* 2-Column Layout: Pie Chart (2/3) + Stats (1/3) */}
                <div className="grid grid-cols-3 gap-6">
                {/* Left Column - Pie Chart (2 columns) */}
                <div className="col-span-2">
                  <div className="flex items-center justify-center h-[280px]">
                    <div className="relative">
                      {/* Calculate total and percentages */}
                      {(() => {
                        const totalUsers = Object.values(userRolesData).reduce((sum, count) => sum + count, 0);
                        const roles = Object.entries(userRolesData);
                        let cumulativePercentage = 0;
                        
                        return (
                          <div className="relative w-48 h-48">
                            <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 36 36">
                              {roles.map(([role, count], index) => {
                                const percentage = (count / totalUsers) * 100;
                                const strokeDasharray = `${percentage} ${100 - percentage}`;
                                const strokeDashoffset = -cumulativePercentage;
                                const themeColors = getThemeColors(activeTheme);
                                const color = themeColors.shades[index % themeColors.shades.length];
                                
                                const result = (
                                  <circle
                                    key={role}
                                    cx="18"
                                    cy="18"
                                    r="15.9155"
                                    fill="transparent"
                                    stroke={color}
                                    strokeWidth="3"
                                    strokeDasharray={strokeDasharray}
                                    strokeDashoffset={strokeDashoffset}
                                    className="transition-all duration-300"
                                  />
                                );
                                
                                cumulativePercentage += percentage;
                                return result;
                              })}
                            </svg>
                            
                            {/* Center text */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center">
                                <div className="text-3xl font-bold text-primary">
                                  {Object.values(userRolesData).reduce((sum, count) => sum + count, 0)}
                                </div>
                                <div className="text-sm text-muted-foreground">Total Users</div>
                              </div>
                            </div>
                          </div>
                        );
                      })()
                      }
                    </div>
                  </div>
                  
                  {/* Legend below chart */}
                  <div className="flex flex-wrap justify-center gap-4 mt-4">
                    {Object.entries(userRolesData).map(([role, count], index) => {
                      const totalUsers = Object.values(userRolesData).reduce((sum, c) => sum + c, 0);
                      const percentage = totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0;
                      const themeColors = getThemeColors(activeTheme);
                      const color = themeColors.shades[index % themeColors.shades.length];
                      
                      return (
                        <div key={role} className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-sm font-medium capitalize">{role}</span>
                          <span className="text-sm text-muted-foreground">({percentage}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Column - Stats (1 column) */}
                <div className="col-span-1">
                  <div className="space-y-4 h-[280px] flex flex-col justify-center">
                    {/* Role Stats - Vertical Layout */}
                    {Object.entries(userRolesData).map(([role, count], index) => {
                      const totalUsers = Object.values(userRolesData).reduce((sum, c) => sum + c, 0);
                      const percentage = totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0;
                      const themeColors = getThemeColors(activeTheme);
                      const color = themeColors.shades[index % themeColors.shades.length];
                      
                      return (
                        <div key={role} className="p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium capitalize text-sm">{role}</span>
                            <span className="text-xs text-muted-foreground">{percentage}%</span>
                          </div>
                          <div className="text-xl font-bold" style={{ color }}>
                            {count.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {count === 1 ? 'user' : 'users'}
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Summary Stats */}
                    <div className="border-t pt-3 mt-3">
                      <div className="text-center p-3 bg-primary/10 rounded-lg">
                        <div className="text-lg font-bold text-primary">
                          {Object.keys(userRolesData).length}
                        </div>
                        <div className="text-xs text-muted-foreground">Different Roles</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              </div>
          ) : (
            <div className="flex items-center justify-center h-[300px]">
              <div className="text-center">
                <Users className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No user roles data available</p>
              </div>
            </div>
          )}
        </CardContent>
        </Card>
      </div>
    </div>
  );
}
