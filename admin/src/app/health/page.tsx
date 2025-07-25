"use client"

import { useState, useEffect } from 'react'
import { Activity, AlertCircle, Clock, Server, RefreshCw, CheckCircle, XCircle, Zap, Globe, Database, Cpu, BarChart3, Timer, Wifi, Shield } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { API_CONFIG, API_ENDPOINTS, buildFullUrl } from '@/config/api'
import { useToast } from '@/hooks/use-toast'

interface HealthStatus {
  status: string
  timestamp: string
  uptime: number
  environment: string
}

interface HealthMetrics {
  responseTime: number
  lastChecked: string
  consecutiveFailures: number
}

export default function HealthCheckPage() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null)
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics>({ responseTime: 0, lastChecked: '', consecutiveFailures: 0 })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  const fetchHealthStatus = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    
    const startTime = Date.now()
    
    try {
      const healthUrl = buildFullUrl(API_ENDPOINTS.HEALTH.CHECK)
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: API_CONFIG.DEFAULT_HEADERS,
        signal: AbortSignal.timeout(API_CONFIG.TIMEOUT)
      })
      
      const responseTime = Date.now() - startTime
      
      if (response.ok) {
        const health = await response.json()
        setHealthStatus(health)
        setHealthMetrics({
          responseTime,
          lastChecked: new Date().toISOString(),
          consecutiveFailures: 0
        })
        
        if (isRefresh) {
          toast({
            title: "Health Status Updated",
            description: "Server health information has been refreshed.",
          })
        }
      } else {
        setHealthStatus(null)
        setHealthMetrics(prev => ({
          responseTime,
          lastChecked: new Date().toISOString(),
          consecutiveFailures: prev.consecutiveFailures + 1
        }))
        
        if (isRefresh) {
          toast({
            title: "Health Check Failed",
            description: `Server returned ${response.status} ${response.statusText}`,
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error('Failed to fetch health status:', error)
      setHealthStatus(null)
      setHealthMetrics(prev => ({
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
        consecutiveFailures: prev.consecutiveFailures + 1
      }))
      
      if (isRefresh) {
        toast({
          title: "Health Check Failed",
          description: "Unable to connect to the server.",
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchHealthStatus()
    // Auto-refresh every 60 seconds
    const interval = setInterval(() => fetchHealthStatus(), 600000)
    return () => clearInterval(interval)
  }, [])

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`
    if (minutes > 0) return `${minutes}m ${secs}s`
    return `${secs}s`
  }

  const getStatusBadge = () => {
    if (loading) return <Badge variant="secondary">Checking...</Badge>
    if (healthStatus?.status === 'OK') return <Badge variant="default" className="bg-green-600">Healthy</Badge>
    return <Badge variant="destructive">Unhealthy</Badge>
  }

  const getStatusIcon = () => {
    if (loading) return <Activity className="h-5 w-5 animate-pulse text-muted-foreground" />
    if (healthStatus?.status === 'OK') return <CheckCircle className="h-5 w-5 text-green-600" />
    return <XCircle className="h-5 w-5 text-red-600" />
  }

  return (
    <div className="page-container">
      <PageHeader
        icon={Activity}
        title="System Health"
        description="Monitor server health, uptime, and performance metrics"
        actions={[
          {
            label: refreshing ? "Refreshing..." : "Refresh",
            onClick: () => fetchHealthStatus(true),
            variant: "outline",
            icon: RefreshCw,
            disabled: refreshing,
          },
        ]}
      />

      {/* Status Overview Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Server Status Tile */}
        <Card className="relative overflow-hidden">
          <CardContent className="px-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Server Status</p>
                <div className="flex items-center gap-2 mt-2">
                  {getStatusIcon()}
                  <p className="text-2xl font-bold">
                    {loading ? "..." : healthStatus?.status || "ERROR"}
                  </p>
                </div>
              </div>
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Server className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="mt-4">
              {getStatusBadge()}
            </div>
          </CardContent>
        </Card>

        {/* Response Time Tile */}
        <Card className="relative overflow-hidden">
          <CardContent className="px-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Response Time</p>
                <p className="text-2xl font-bold mt-2">
                  {loading ? "..." : `${healthMetrics.responseTime}ms`}
                </p>
                <p className={`text-xs mt-1 ${
                  healthMetrics.responseTime < 100 ? 'text-green-600' :
                  healthMetrics.responseTime < 500 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {healthMetrics.responseTime < 100 ? 'Excellent' :
                   healthMetrics.responseTime < 500 ? 'Good' : 'Slow'}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Uptime Tile */}
        <Card className="relative overflow-hidden">
          <CardContent className="px-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Uptime</p>
                <p className="text-2xl font-bold mt-2">
                  {loading ? "..." : healthStatus ? formatUptime(healthStatus.uptime) : "N/A"}
                </p>
                <p className="text-xs text-green-600 mt-1">Running</p>
              </div>
              <div className="h-12 w-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Environment Tile */}
        <Card className="relative overflow-hidden">
          <CardContent className="px-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Environment</p>
                <p className="text-2xl font-bold mt-2">
                  {loading ? "..." : healthStatus?.environment || "Unknown"}
                </p>
                <Badge variant={API_CONFIG.IS_DEVELOPMENT ? "secondary" : "default"} className="mt-2">
                  {API_CONFIG.IS_DEVELOPMENT ? "Development" : "Production"}
                </Badge>
              </div>
              <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <Globe className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Health Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Detailed Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Health Details
              </CardTitle>
              <CardDescription>Comprehensive server health information</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ) : healthStatus ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">Server Status</p>
                        <p className="text-sm text-muted-foreground">{healthStatus.status}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Globe className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">Environment</p>
                        <p className="text-sm text-muted-foreground">{healthStatus.environment}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Clock className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="font-medium">Server Uptime</p>
                        <p className="text-sm text-muted-foreground">{formatUptime(healthStatus.uptime)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Zap className="h-5 w-5 text-yellow-600" />
                      <div>
                        <p className="font-medium">Response Time</p>
                        <p className="text-sm text-muted-foreground">{healthMetrics.responseTime}ms</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Timer className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="font-medium">Last Checked</p>
                        <p className="text-sm text-muted-foreground">{new Date(healthMetrics.lastChecked).toLocaleTimeString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Server className="h-5 w-5 text-indigo-600" />
                      <div>
                        <p className="font-medium">Server Time</p>
                        <p className="text-sm text-muted-foreground">{new Date(healthStatus.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="h-16 w-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <XCircle className="h-8 w-8 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-red-600 mb-2">Server Unavailable</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                    Unable to connect to the backend server. Please check your connection or contact support.
                  </p>
                  <Button onClick={() => fetchHealthStatus(true)} disabled={refreshing} className="gap-2">
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? "Retrying..." : "Retry Connection"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* API Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                API Configuration
              </CardTitle>
              <CardDescription>Backend server and endpoint information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Globe className="h-5 w-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="font-medium">Base URL</p>
                    <code className="text-xs bg-background px-2 py-1 rounded border">{API_CONFIG.BASE_URL}</code>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  <div className="flex-1">
                    <p className="font-medium">API Version</p>
                    <code className="text-xs bg-background px-2 py-1 rounded border">{API_CONFIG.API_VERSION}</code>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Activity className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium">Health Endpoint</p>
                    <code className="text-xs bg-background px-2 py-1 rounded border">{API_ENDPOINTS.HEALTH.CHECK}</code>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Timer className="h-5 w-5 text-orange-600" />
                  <div className="flex-1">
                    <p className="font-medium">Request Timeout</p>
                    <p className="text-sm text-muted-foreground">{API_CONFIG.TIMEOUT}ms</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Metrics & Monitoring */}
        <div className="space-y-6">
          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Metrics
              </CardTitle>
              <CardDescription>Real-time performance indicators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Response Time</span>
                      </div>
                      <Badge variant={healthMetrics.responseTime < 100 ? "default" : healthMetrics.responseTime < 500 ? "secondary" : "destructive"} className="text-xs">
                        {healthMetrics.responseTime < 100 ? 'Excellent' :
                         healthMetrics.responseTime < 500 ? 'Good' : 'Slow'}
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{healthMetrics.responseTime}ms</p>
                    <p className="text-xs text-muted-foreground mt-1">Last request latency</p>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Uptime</span>
                      </div>
                      <Badge variant="default" className="bg-green-600 text-xs">
                        Running
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                      {healthStatus ? formatUptime(healthStatus.uptime) : 'N/A'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Server availability</p>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium">Failures</span>
                      </div>
                      <Badge variant={healthMetrics.consecutiveFailures === 0 ? "default" : "destructive"} className="text-xs">
                        {healthMetrics.consecutiveFailures === 0 ? 'Stable' : 'Issues'}
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{healthMetrics.consecutiveFailures}</p>
                    <p className="text-xs text-muted-foreground mt-1">Consecutive failures</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Connection Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                Connection Status
              </CardTitle>
              <CardDescription>Network and connectivity information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className={`h-3 w-3 rounded-full ${
                  loading ? 'bg-yellow-500 animate-pulse' :
                  healthStatus ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {loading ? 'Connecting...' : healthStatus ? 'Connected' : 'Disconnected'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {loading ? 'Checking server status' :
                     healthStatus ? 'Server is responding' : 'Unable to reach server'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Shield className="h-4 w-4 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Security</p>
                  <p className="text-xs text-muted-foreground">HTTPS enabled</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Cpu className="h-4 w-4 text-purple-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Auto-refresh</p>
                  <p className="text-xs text-muted-foreground">Every 60 seconds</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
