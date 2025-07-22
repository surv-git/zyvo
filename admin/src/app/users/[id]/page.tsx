"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/ui/page-header';
import { 
  Edit, 
  User, 
  Loader2,
  AlertCircle,
  Copy,
  Power,
  PowerOff,
  Trash2,
  CheckCircle,
  XCircle,
  UserCheck,
  Crown,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { User as UserType } from '@/types/user';
import { getUserDetails, activateUser, suspendUser, deleteUser } from '@/services/user-service';

export default function UserViewPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserType | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load user data
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await getUserDetails(userId);
        setUser(userData);
      } catch (error) {
        console.error('Failed to load user:', error);
        toast.error('Failed to load user data');
        router.push('/users/manage');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadUser();
    }
  }, [userId, router]);

  const handleEdit = () => {
    router.push(`/users/${userId}/edit`);
  };

  const handleBack = () => {
    router.push('/users/manage');
  };

  const handleCopyId = async () => {
    if (user) {
      try {
        await navigator.clipboard.writeText(user._id);
        toast.success('User ID copied to clipboard');
      } catch (err) {
        toast.error('Failed to copy to clipboard');
      }
    }
  };

  const handleToggleStatus = async () => {
    if (!user) return;

    const action = user.isActive ? 'suspend' : 'activate';
    setActionLoading(action);

    try {
      if (user.isActive) {
        await suspendUser(user._id, 'Suspended by admin');
        toast.success('User suspended successfully');
      } else {
        await activateUser(user._id, 'Activated by admin');
        toast.success('User activated successfully');
      }

      // Reload user data
      const updatedUser = await getUserDetails(userId);
      setUser(updatedUser);
    } catch (error) {
      console.error(`Failed to ${action} user:`, error);
      toast.error(`Failed to ${action} user. Please try again.`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!user) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${user.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setActionLoading('delete');

    try {
      await deleteUser(user._id, 'Deleted by admin');
      toast.success('User deleted successfully');
      router.push('/users/manage');
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast.error('Failed to delete user. Please try again.');
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading user...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">User Not Found</h2>
          <p className="text-muted-foreground mb-4">The user you're looking for doesn't exist.</p>
          <Button onClick={handleBack}>
            Back to Users
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        showBackButton={true}
        onBack={handleBack}
        title={user.name}
        description="User details and account information"
        icon={User}
        actions={[
          {
            label: "Edit",
            onClick: handleEdit,
            icon: Edit,
            variant: "outline"
          },
          {
            label: user.isActive ? 'Suspend' : 'Activate',
            onClick: handleToggleStatus,
            icon: user.isActive ? PowerOff : Power,
            variant: "outline",
            disabled: actionLoading === 'activate' || actionLoading === 'suspend'
          },
          {
            label: "Delete",
            onClick: handleDelete,
            icon: Trash2,
            variant: "destructive",
            disabled: actionLoading === 'delete'
          }
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-lg font-semibold">{user.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <div className="flex items-center space-x-2">
                    <p className="text-lg">{user.email}</p>
                    {user.isEmailVerified && (
                      <CheckCircle className="h-4 w-4 text-green-500" title="Email verified" />
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Role</label>
                  <div className="flex items-center mt-1">
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="flex items-center">
                      {user.role === 'admin' ? (
                        <Crown className="h-3 w-3 mr-1" />
                      ) : (
                        <UserCheck className="h-3 w-3 mr-1" />
                      )}
                      {user.role === 'admin' ? 'Admin' : 'User'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="flex items-center mt-1">
                    <Badge variant={user.isActive ? 'default' : 'secondary'}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>

              {(user.phone || user.address) && (
                <>
                  <Separator />
                  <div className="grid gap-4 md:grid-cols-2">
                    {user.phone && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Phone</label>
                        <p className="text-base">{user.phone}</p>
                      </div>
                    )}
                    {user.address && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Address</label>
                        <p className="text-base">{user.address}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Activity Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Activity Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Login</label>
                  <p className="text-base">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Login Count</label>
                  <p className="text-base">{user.loginCount || 0} times</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Account Created</label>
                  <p className="text-base">{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                  <p className="text-base">{user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'Never'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current Status</span>
                <Badge variant={user.isActive ? "default" : "secondary"}>
                  {user.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              
              <Separator />
              
              <div className="text-sm text-muted-foreground">
                {user.isActive 
                  ? "This user can log in and access the system."
                  : "This user is suspended and cannot access the system."
                }
              </div>
            </CardContent>
          </Card>

          {/* User Details */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">User ID</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-mono">{user._id.slice(-8)}</span>
                  <Button variant="ghost" size="sm" onClick={handleCopyId}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Email Verified</span>
                <div className="flex items-center space-x-1">
                  {user.isEmailVerified ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm">{user.isEmailVerified ? 'Yes' : 'No'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm">{new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last Updated</span>
                <span className="text-sm">{user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'Never'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit User
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={handleToggleStatus}
                disabled={actionLoading === 'activate' || actionLoading === 'suspend'}
              >
                {actionLoading === 'activate' || actionLoading === 'suspend' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : user.isActive ? (
                  <>
                    <PowerOff className="h-4 w-4 mr-2" />
                    Suspend User
                  </>
                ) : (
                  <>
                    <Power className="h-4 w-4 mr-2" />
                    Activate User
                  </>
                )}
              </Button>
              
              <Button 
                variant="destructive" 
                className="w-full justify-start"
                onClick={handleDelete}
                disabled={actionLoading === 'delete'}
              >
                {actionLoading === 'delete' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete User
              </Button>
            </CardContent>
          </Card>

          {/* Help */}
          <Card>
            <CardHeader>
              <CardTitle>Help</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Use Edit to modify user information</p>
              <p>• Suspend to temporarily disable access</p>
              <p>• Delete permanently removes the user</p>
              <p>• Verified badges show confirmed contact info</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
