import React from 'react';
import { Bell, Check, AlertCircle, Info, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// Mock notification data
const notifications = [
  {
    id: 1,
    type: 'info',
    title: 'Inventory Update',
    message: 'Product variant #PV001 stock has been updated to 50 units',
    timestamp: '2 minutes ago',
    read: false
  },
  {
    id: 2,
    type: 'warning',
    title: 'Low Stock Alert',
    message: 'Product variant #PV003 is running low (5 units remaining)',
    timestamp: '1 hour ago',
    read: false
  },
  {
    id: 3,
    type: 'success',
    title: 'New User Registration',
    message: 'A new user has registered: john.doe@example.com',
    timestamp: '3 hours ago',
    read: true
  },
  {
    id: 4,
    type: 'info',
    title: 'System Maintenance',
    message: 'Scheduled maintenance completed successfully',
    timestamp: '1 day ago',
    read: true
  }
];

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'success':
      return <Check className="h-4 w-4 text-green-600" />;
    case 'warning':
      return <AlertCircle className="h-4 w-4 text-amber-600" />;
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    default:
      return <Info className="h-4 w-4 text-blue-600" />;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'success':
      return 'bg-green-50 border-green-200';
    case 'warning':
      return 'bg-amber-50 border-amber-200';
    case 'error':
      return 'bg-red-50 border-red-200';
    default:
      return 'bg-blue-50 border-blue-200';
  }
};

export default function NotificationsPage() {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Bell className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground mt-1">
              Stay updated with system alerts and important updates
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline">
            {unreadCount} unread
          </Badge>
          <Button variant="outline" size="sm">
            Mark all as read
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="grid gap-4">
        {notifications.map((notification, index) => (
          <div key={notification.id}>
            <Card className={`${!notification.read ? 'border-primary/20 bg-primary/5' : ''} transition-colors hover:bg-muted/50`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-medium ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {notification.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          {notification.timestamp}
                        </div>
                        {!notification.read && (
                          <div className="h-2 w-2 bg-primary rounded-full" />
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            {index < notifications.length - 1 && <Separator className="my-2" />}
          </div>
        ))}
      </div>

      {/* Empty State (when no notifications) */}
      {notifications.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No notifications</h3>
            <p className="text-muted-foreground text-center max-w-md">
              You&apos;re all caught up! New notifications will appear here when there are updates to your system.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>
            Manage how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Inventory Alerts</h4>
              <p className="text-sm text-muted-foreground">Get notified when stock levels are low</p>
            </div>
            <Button variant="outline" size="sm">
              Configure
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">User Activity</h4>
              <p className="text-sm text-muted-foreground">Receive updates about user registrations and activity</p>
            </div>
            <Button variant="outline" size="sm">
              Configure
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">System Updates</h4>
              <p className="text-sm text-muted-foreground">Get notified about system maintenance and updates</p>
            </div>
            <Button variant="outline" size="sm">
              Configure
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
