import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Users, 
  Activity, 
  TrendingUp, 
  DollarSign,
  ArrowUpRight,
  Calendar,
  FileText,
  Settings
} from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-6 min-h-[200vh]"> {/* Force minimum height to ensure scrolling */}
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Monitor your application performance and user engagement metrics.
          </p>
        </div>
        <Button>
          <BarChart3 className="mr-2 h-4 w-4" />
          Generate Report
        </Button>
      </div>

      {/* Loading Stats Cards with Skeletons */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-20" />
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <Skeleton className="h-8 w-16 mb-2" />
          <div className="flex items-center space-x-2">
            <ArrowUpRight className="h-3 w-3 text-green-500" />
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Page Views</h3>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">45,231</div>
          <div className="flex items-center text-xs text-muted-foreground">
            <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
            <span className="text-green-500">+18.2%</span>
            <span className="ml-1">from last week</span>
          </div>
        </div>
        
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-16" />
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </div>
          <Skeleton className="h-8 w-20 mb-2" />
          <div className="flex items-center space-x-2">
            <Skeleton className="h-3 w-3" />
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Conversion Rate</h3>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">12.5%</div>
          <div className="flex items-center text-xs text-muted-foreground">
            <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
            <span className="text-green-500">+2.1%</span>
            <span className="ml-1">from last month</span>
          </div>
        </div>
      </div>

      {/* Content Grid with Mixed Loading States */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Chart Area with Skeleton */}
        <div className="md:col-span-2 rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="space-y-1.5 pb-4">
            <h3 className="text-xl font-semibold leading-none tracking-tight">Traffic Overview</h3>
            <p className="text-sm text-muted-foreground">
              Website traffic and user engagement over time
            </p>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-20" />
              <div className="flex space-x-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Recent Activity */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="space-y-1.5 pb-4">
            <h3 className="text-xl font-semibold leading-none tracking-tight">Recent Activity</h3>
            <p className="text-sm text-muted-foreground">
              Latest user actions and system events
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">User signed up</p>
                <p className="text-xs text-muted-foreground">3 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Skeleton className="w-2 h-2 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Order completed</p>
                <p className="text-xs text-muted-foreground">12 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Skeleton className="w-2 h-2 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">System maintenance</p>
                <p className="text-xs text-muted-foreground">1 hour ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section with Loading Tables */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Pages Table */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="space-y-1.5 pb-4">
            <h3 className="text-xl font-semibold leading-none tracking-tight">Top Pages</h3>
            <p className="text-sm text-muted-foreground">
              Most visited pages this week
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">/dashboard</span>
              </div>
              <span className="text-sm text-muted-foreground">2,543 views</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">/analytics</span>
              </div>
              <span className="text-sm text-muted-foreground">1,234 views</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-4 w-14" />
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="space-y-1.5 pb-4">
            <h3 className="text-xl font-semibold leading-none tracking-tight">Quick Actions</h3>
            <p className="text-sm text-muted-foreground">
              Frequently used administrative tasks
            </p>
          </div>
          <div className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <Users className="mr-2 h-4 w-4" />
              User Management
            </Button>
            <div className="w-full">
              <Skeleton className="h-10 w-full" />
            </div>
            <Button className="w-full justify-start" variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Schedule Report
            </Button>
            <div className="w-full">
              <Skeleton className="h-10 w-full" />
            </div>
            <Button className="w-full justify-start" variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              System Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Additional Content to Make Page Scrollable */}
      <div className="grid gap-6 md:grid-cols-1">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="space-y-1.5 pb-4">
            <h3 className="text-xl font-semibold leading-none tracking-tight">Performance Metrics</h3>
            <p className="text-sm text-muted-foreground">
              Detailed performance analysis and system health indicators
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">CPU Usage</span>
                <span className="text-sm text-muted-foreground">45%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{width: '45%'}}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Memory Usage</span>
                <span className="text-sm text-muted-foreground">67%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{width: '67%'}}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Disk Usage</span>
                <span className="text-sm text-muted-foreground">23%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-orange-600 h-2 rounded-full" style={{width: '23%'}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* More Content Sections */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Server Status</h3>
          <div className="space-y-3">
            {Array.from({length: 8}, (_, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    i % 3 === 0 ? 'bg-green-500' : i % 3 === 1 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm font-medium">Server {i + 1}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {i % 3 === 0 ? 'Online' : i % 3 === 1 ? 'Warning' : 'Offline'}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Logs</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {Array.from({length: 15}, (_, i) => (
              <div key={i} className="text-xs font-mono bg-muted p-2 rounded">
                <span className="text-muted-foreground">[{new Date().toLocaleTimeString()}]</span>
                <span className="ml-2">Log entry {i + 1}: System operation completed successfully</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final Section */}
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">System Information</h3>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">99.9%</div>
            <div className="text-sm text-muted-foreground">Uptime</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">1.2ms</div>
            <div className="text-sm text-muted-foreground">Response Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">45GB</div>
            <div className="text-sm text-muted-foreground">Data Processed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">12.5K</div>
            <div className="text-sm text-muted-foreground">Requests/min</div>
          </div>
        </div>
      </div>

      {/* Bottom spacer to ensure scrolling */}
      <div className="h-32"></div>
      
      {/* Visual scroll test indicators */}
      <div className="bg-red-100 border-2 border-red-500 p-4 rounded-lg">
        <h3 className="text-lg font-bold text-red-800">🔴 SCROLL TEST - TOP</h3>
        <p className="text-red-700">If you can see this, you're at the top of the scrollable content.</p>
      </div>
      
      {/* Large spacer to force scrolling */}
      <div className="h-screen bg-gradient-to-b from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-800">📏 MIDDLE SECTION</h3>
          <p className="text-gray-600">This section is 100vh tall to force scrolling</p>
        </div>
      </div>
      
      <div className="bg-green-100 border-2 border-green-500 p-4 rounded-lg">
        <h3 className="text-lg font-bold text-green-800">🟢 SCROLL TEST - BOTTOM</h3>
        <p className="text-green-700">If you can see this, scrolling is working! The header should be sticky above.</p>
      </div>
      
      {/* Final spacer */}
      <div className="h-64"></div>
    </div>
  );
}