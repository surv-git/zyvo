"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  AlertCircle,
  MapPin,
  User,
  Building2,
  Home,
  Package,
  CreditCard,
  MapPinIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  AddressWithUser, 
  AddressUpdateData, 
  AddressType,
  getAddressTypeLabel
} from '@/types/address';
import { getAddressById, updateAddress } from '@/services/address-service';

export default function AddressEditPage() {
  const router = useRouter();
  const params = useParams();
  const addressId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [address, setAddress] = useState<AddressWithUser | null>(null);
  const [formData, setFormData] = useState<AddressUpdateData>({
    title: '',
    type: 'HOME',
    full_name: '',
    phone: '',
    address_line_1: '',
    address_line_2: '',
    landmark: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    is_default: false,
    is_active: true,
    delivery_instructions: '',
    is_verified: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load address data
  useEffect(() => {
    const loadAddress = async () => {
      try {
        const addressData = await getAddressById(addressId);
        setAddress(addressData);
        setFormData({
          title: addressData.title,
          type: addressData.type,
          full_name: addressData.full_name,
          phone: addressData.phone,
          address_line_1: addressData.address_line_1,
          address_line_2: addressData.address_line_2 || '',
          landmark: addressData.landmark || '',
          city: addressData.city,
          state: addressData.state,
          postal_code: addressData.postal_code,
          country: addressData.country,
          is_default: addressData.is_default,
          is_active: addressData.is_active,
          delivery_instructions: addressData.delivery_instructions || '',
          is_verified: addressData.is_verified,
        });
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

  const handleBack = () => {
    router.push(`/addresses/${addressId}`);
  };

  const handleCancel = () => {
    router.push(`/addresses/${addressId}`);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title?.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 50) {
      newErrors.title = 'Title must be 50 characters or less';
    }

    if (!formData.type) {
      newErrors.type = 'Address type is required';
    }

    if (!formData.full_name?.trim()) {
      newErrors.full_name = 'Full name is required';
    } else if (formData.full_name.length > 100) {
      newErrors.full_name = 'Full name must be 100 characters or less';
    }

    if (!formData.phone?.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[+]?[\d\s\-\(\)]{10,15}$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format (10-15 digits allowed)';
    }

    if (!formData.address_line_1?.trim()) {
      newErrors.address_line_1 = 'Address line 1 is required';
    } else if (formData.address_line_1.length > 200) {
      newErrors.address_line_1 = 'Address line 1 must be 200 characters or less';
    }

    if (formData.address_line_2 && formData.address_line_2.length > 200) {
      newErrors.address_line_2 = 'Address line 2 must be 200 characters or less';
    }

    if (formData.landmark && formData.landmark.length > 100) {
      newErrors.landmark = 'Landmark must be 100 characters or less';
    }

    if (!formData.city?.trim()) {
      newErrors.city = 'City is required';
    } else if (formData.city.length > 50) {
      newErrors.city = 'City must be 50 characters or less';
    }

    if (!formData.state?.trim()) {
      newErrors.state = 'State is required';
    } else if (formData.state.length > 50) {
      newErrors.state = 'State must be 50 characters or less';
    }

    if (!formData.postal_code?.trim()) {
      newErrors.postal_code = 'Postal code is required';
    } else if (!/^[A-Za-z0-9\s\-]{3,10}$/.test(formData.postal_code)) {
      newErrors.postal_code = 'Invalid postal code format (3-10 alphanumeric characters)';
    }

    if (!formData.country?.trim()) {
      newErrors.country = 'Country is required';
    } else if (formData.country.length > 50) {
      newErrors.country = 'Country must be 50 characters or less';
    }

    if (formData.delivery_instructions && formData.delivery_instructions.length > 500) {
      newErrors.delivery_instructions = 'Delivery instructions must be 500 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the validation errors.');
      return;
    }

    setSaving(true);

    try {
      await updateAddress(addressId, formData);
      toast.success('Address updated successfully');
      router.push(`/addresses/${addressId}`);
    } catch (error) {
      console.error('Failed to update address:', error);
      toast.error('Failed to update address. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof AddressUpdateData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
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
          <Button onClick={() => router.push('/addresses')}>
            Back to Addresses
          </Button>
        </div>
      </div>
    );
  }

  const AddressIcon = getAddressIcon(formData.type || 'HOME');

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
            <h1 className="text-3xl font-bold tracking-tight">Edit Address</h1>
            <p className="text-muted-foreground mt-1">
              Update address information and settings
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Address Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title || ''}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="e.g., Home, Office, etc."
                      maxLength={50}
                      className={errors.title ? 'border-red-500' : ''}
                    />
                    {errors.title && (
                      <p className="text-sm text-red-500">{errors.title}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => handleInputChange('type', value as AddressType)}
                    >
                      <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select address type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HOME">{getAddressTypeLabel('HOME')}</SelectItem>
                        <SelectItem value="OFFICE">{getAddressTypeLabel('OFFICE')}</SelectItem>
                        <SelectItem value="BILLING">{getAddressTypeLabel('BILLING')}</SelectItem>
                        <SelectItem value="SHIPPING">{getAddressTypeLabel('SHIPPING')}</SelectItem>
                        <SelectItem value="OTHER">{getAddressTypeLabel('OTHER')}</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.type && (
                      <p className="text-sm text-red-500">{errors.type}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name || ''}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      placeholder="Full name for delivery"
                      maxLength={100}
                      className={errors.full_name ? 'border-red-500' : ''}
                    />
                    {errors.full_name && (
                      <p className="text-sm text-red-500">{errors.full_name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={formData.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Contact phone number"
                      maxLength={15}
                      className={errors.phone ? 'border-red-500' : ''}
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-500">{errors.phone}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address_line_1">Address Line 1 *</Label>
                  <Input
                    id="address_line_1"
                    value={formData.address_line_1 || ''}
                    onChange={(e) => handleInputChange('address_line_1', e.target.value)}
                    placeholder="Street address, building number"
                    maxLength={200}
                    className={errors.address_line_1 ? 'border-red-500' : ''}
                  />
                  {errors.address_line_1 && (
                    <p className="text-sm text-red-500">{errors.address_line_1}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address_line_2">Address Line 2</Label>
                  <Input
                    id="address_line_2"
                    value={formData.address_line_2 || ''}
                    onChange={(e) => handleInputChange('address_line_2', e.target.value)}
                    placeholder="Apartment, suite, floor (optional)"
                    maxLength={200}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="landmark">Landmark</Label>
                  <Input
                    id="landmark"
                    value={formData.landmark || ''}
                    onChange={(e) => handleInputChange('landmark', e.target.value)}
                    placeholder="Nearby landmark (optional)"
                    maxLength={100}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.city || ''}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="City"
                      maxLength={50}
                      className={errors.city ? 'border-red-500' : ''}
                    />
                    {errors.city && (
                      <p className="text-sm text-red-500">{errors.city}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={formData.state || ''}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="State/Province"
                      maxLength={50}
                      className={errors.state ? 'border-red-500' : ''}
                    />
                    {errors.state && (
                      <p className="text-sm text-red-500">{errors.state}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postal_code">Postal Code *</Label>
                    <Input
                      id="postal_code"
                      value={formData.postal_code || ''}
                      onChange={(e) => handleInputChange('postal_code', e.target.value)}
                      placeholder="ZIP/Postal code"
                      maxLength={10}
                      className={errors.postal_code ? 'border-red-500' : ''}
                    />
                    {errors.postal_code && (
                      <p className="text-sm text-red-500">{errors.postal_code}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Input
                    id="country"
                    value={formData.country || ''}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    placeholder="Country"
                    maxLength={50}
                    className={errors.country ? 'border-red-500' : ''}
                  />
                  {errors.country && (
                    <p className="text-sm text-red-500">{errors.country}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delivery_instructions">Delivery Instructions</Label>
                  <Textarea
                    id="delivery_instructions"
                    value={formData.delivery_instructions || ''}
                    onChange={(e) => handleInputChange('delivery_instructions', e.target.value)}
                    placeholder="Special instructions for delivery (optional)"
                    maxLength={500}
                    rows={3}
                    className={errors.delivery_instructions ? 'border-red-500' : ''}
                  />
                  {errors.delivery_instructions && (
                    <p className="text-sm text-red-500">{errors.delivery_instructions}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </form>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">User Name</label>
                <p className="text-base font-medium">
                  {address.user?.email?.split('@')[0] || 'Unknown User'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="text-sm">{address.user?.email || 'No email available'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">User ID</label>
                <p className="text-xs font-mono">{address.user_id}</p>
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Address Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Active Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Active addresses can be used for orders
                  </p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Default Address</Label>
                  <p className="text-sm text-muted-foreground">
                    Set as primary address for the user
                  </p>
                </div>
                <Switch
                  checked={formData.is_default}
                  onCheckedChange={(checked) => handleInputChange('is_default', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Verified</Label>
                  <p className="text-sm text-muted-foreground">
                    Mark address as verified
                  </p>
                </div>
                <Switch
                  checked={formData.is_verified}
                  onCheckedChange={(checked) => handleInputChange('is_verified', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button onClick={handleSubmit} disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleCancel} className="w-full">
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
