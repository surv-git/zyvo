"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Edit, 
  User, 
  Loader2,
  AlertCircle,
  Copy,
  Power,
  PowerOff,
  Trash2,
  CheckCircle,
  Star,
  Shield,
  Home,
  Building2,
  Package,
  CreditCard,
  MapPinIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  AddressWithUser, 
  getAddressTypeColor,
  getAddressTypeLabel
} from '@/types/address';
import { 
  getAddressById, 
  activateAddress, 
  deactivateAddress, 
  deleteAddress,
  setDefaultAddress,
  verifyAddress
} from '@/services/address-service';

export default function AddressViewPage() {
  const router = useRouter();
  const params = useParams();
  const addressId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState<AddressWithUser | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load address data
  useEffect(() => {
    const loadAddress = async () => {
      try {
        const addressData = await getAddressById(addressId);
        setAddress(addressData);
      } catch (error) {
        console.error('Failed to load address:', error);
        toast.error('Failed to load address data');
        router.push('/addresses');
      } finally {
        setLoading(false);
      }
    };

    if (addressId) {
      loadAddress();
    }
  }, [addressId, router]);

  const handleEdit = () => {
    router.push(`/addresses/${addressId}/edit`);
  };

  const handleBack = () => {
    router.push('/addresses');
  };

  const handleCopyId = async () => {
    if (address) {
      try {
        await navigator.clipboard.writeText(address._id);
        toast.success('Address ID copied to clipboard');
      } catch {
        toast.error('Failed to copy to clipboard');
      }
    }
  };

  const handleToggleStatus = async () => {
    if (!address) return;

    const action = address.is_active ? 'deactivate' : 'activate';
    setActionLoading(action);

    try {
      if (address.is_active) {
        await deactivateAddress(address._id);
        toast.success('Address deactivated successfully');
      } else {
        await activateAddress(address._id);
        toast.success('Address activated successfully');
      }

      // Reload address data
      const updatedAddress = await getAddressById(addressId);
      setAddress(updatedAddress);
    } catch (error) {
      console.error(`Failed to ${action} address:`, error);
      toast.error(`Failed to ${action} address. Please try again.`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSetDefault = async () => {
    if (!address || address.is_default) return;

    setActionLoading('set-default');

    try {
      await setDefaultAddress(address._id);
      toast.success('Address set as default successfully');
      
      // Reload address data
      const updatedAddress = await getAddressById(addressId);
      setAddress(updatedAddress);
    } catch (error) {
      console.error('Failed to set address as default:', error);
      toast.error('Failed to set address as default. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerifyAddress = async () => {
    if (!address || address.is_verified) return;

    setActionLoading('verify');

    try {
      await verifyAddress(address._id);
      toast.success('Address verified successfully');
      
      // Reload address data
      const updatedAddress = await getAddressById(addressId);
      setAddress(updatedAddress);
    } catch (error) {
      console.error('Failed to verify address:', error);
      toast.error('Failed to verify address. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!address) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete the address "${address.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setActionLoading('delete');

    try {
      await deleteAddress(address._id);
      toast.success('Address deleted successfully');
      router.push('/addresses');
    } catch (error) {
      console.error('Failed to delete address:', error);
      toast.error('Failed to delete address. Please try again.');
      setActionLoading(null);
    }
  };

  const getAddressIcon = (type: string) => {
    switch (type) {
      case 'HOME':
        return Home;
      case 'OFFICE':
        return Building2;
      case 'SHIPPING':
        return Package;
      case 'BILLING':
        return CreditCard;
      default:
        return MapPinIcon;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading address...</span>
        </div>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Address Not Found</h2>
          <p className="text-muted-foreground mb-4">The address you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={handleBack}>
            Back to Addresses
          </Button>
        </div>
      </div>
    );
  }

  const AddressIcon = getAddressIcon(address.type);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <AddressIcon className="h-8 w-8 text-primary" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{address.title}</h1>
              {address.is_default && (
                <Star className="h-5 w-5 text-yellow-500 fill-current" />
              )}
              {address.is_verified && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
            </div>
            <p className="text-muted-foreground mt-1">
              Address details and information
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={handleToggleStatus}
            disabled={actionLoading === 'activate' || actionLoading === 'deactivate'}
          >
            {actionLoading === 'activate' || actionLoading === 'deactivate' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : address.is_active ? (
              <PowerOff className="h-4 w-4 mr-2" />
            ) : (
              <Power className="h-4 w-4 mr-2" />
            )}
            {address.is_active ? 'Deactivate' : 'Activate'}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={actionLoading === 'delete'}
          >
            {actionLoading === 'delete' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AddressIcon className="h-5 w-5 mr-2" />
                Address Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Title</label>
                  <p className="text-lg font-semibold">{address.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <div className="mt-1">
                    <Badge variant="secondary" className={getAddressTypeColor(address.type)}>
                      {getAddressTypeLabel(address.type)}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                  <p className="text-base">{address.full_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <p className="text-base">{address.phone}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Address</label>
                <div className="mt-1 space-y-1">
                  <p className="text-base">{address.address_line_1}</p>
                  {address.address_line_2 && (
                    <p className="text-base">{address.address_line_2}</p>
                  )}
                  {address.landmark && (
                    <p className="text-sm text-muted-foreground">Landmark: {address.landmark}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">City</label>
                  <p className="text-base">{address.city}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">State</label>
                  <p className="text-base">{address.state}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Postal Code</label>
                  <p className="text-base">{address.postal_code}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Country</label>
                <p className="text-base">{address.country}</p>
              </div>

              {address.delivery_instructions && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Delivery Instructions</label>
                  <p className="text-base mt-1">{address.delivery_instructions}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">User Name</label>
                  <p className="text-lg font-semibold">
                    {address.user?.email?.split('@')[0] || 'Unknown User'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-base">{address.user?.email || 'No email available'}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">User ID</label>
                <div className="flex items-center space-x-2 mt-1">
                  <p className="text-sm font-mono">{address.user_id}</p>
                  <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(address.user_id)}>
                    <Copy className="h-3 w-3" />
                  </Button>
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
              <CardTitle>Address Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={address.is_active ? "default" : "secondary"}>
                  {address.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Default</span>
                <Badge variant={address.is_default ? "default" : "outline"}>
                  {address.is_default ? "Yes" : "No"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Verified</span>
                <Badge variant={address.is_verified ? "default" : "outline"}>
                  {address.is_verified ? "Yes" : "No"}
                </Badge>
              </div>
              
              <Separator />
              
              <div className="text-sm text-muted-foreground">
                {address.is_active 
                  ? "This address is active and can be used for orders."
                  : "This address is inactive and cannot be used for orders."
                }
              </div>
            </CardContent>
          </Card>

          {/* Usage Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Usage Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Usage Count</span>
                <span className="text-sm font-medium">{address.usage_count} times</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last Used</span>
                <span className="text-sm">
                  {address.last_used_at 
                    ? new Date(address.last_used_at).toLocaleDateString()
                    : 'Never'
                  }
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Verification Source</span>
                <span className="text-sm">{address.verification_source || 'Not specified'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Address ID</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-mono">{address._id.slice(-8)}</span>
                  <Button variant="ghost" size="sm" onClick={handleCopyId}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm">{new Date(address.createdAt).toLocaleDateString()}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last Updated</span>
                <span className="text-sm">{new Date(address.updatedAt).toLocaleDateString()}</span>
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
                Edit Address
              </Button>
              
              {!address.is_default && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleSetDefault}
                  disabled={actionLoading === 'set-default'}
                >
                  {actionLoading === 'set-default' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Star className="h-4 w-4 mr-2" />
                  )}
                  Set as Default
                </Button>
              )}
              
              {!address.is_verified && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleVerifyAddress}
                  disabled={actionLoading === 'verify'}
                >
                  {actionLoading === 'verify' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Shield className="h-4 w-4 mr-2" />
                  )}
                  Verify Address
                </Button>
              )}
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={handleToggleStatus}
                disabled={actionLoading === 'activate' || actionLoading === 'deactivate'}
              >
                {actionLoading === 'activate' || actionLoading === 'deactivate' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : address.is_active ? (
                  <>
                    <PowerOff className="h-4 w-4 mr-2" />
                    Deactivate Address
                  </>
                ) : (
                  <>
                    <Power className="h-4 w-4 mr-2" />
                    Activate Address
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
                Delete Address
              </Button>
            </CardContent>
          </Card>

          {/* Help */}
          <Card>
            <CardHeader>
              <CardTitle>Help</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Use Edit to modify address information</p>
              <p>• Set as Default to make primary address</p>
              <p>• Verify to mark address as validated</p>
              <p>• Deactivate to prevent use in orders</p>
              <p>• Delete permanently removes the address</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
