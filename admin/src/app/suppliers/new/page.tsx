"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Save, Loader2, Plus, Truck } from 'lucide-react';
import { createSupplier } from '@/services/supplier-service';
import { createSupplierContact } from '@/services/supplier-contact-service';
import { SupplierCreateRequest } from '@/types/supplier';
import { SupplierContact } from '@/types/supplier-contact';
import ContactNumbersManager from '@/components/suppliers/contact-numbers-manager';

export default function NewSupplierPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [contacts, setContacts] = useState<SupplierContact[]>([]);

  // Form state
  const [formData, setFormData] = useState<SupplierCreateRequest>({
    name: '',
    description: '',
    logo_url: '',
    address: {
      address_line_1: '',
      address_line_2: '',
      city: '',
      state: '',
      zipcode: '',
      country: 'USA',
    },
    email: '',
    website: '',
    payment_terms: '',
    delivery_terms: '',
    status: 'Active',
    notes: '',
    product_categories_supplied: [],
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Create the supplier first
      const response = await createSupplier(formData);
      const newSupplierId = response.data.id;
      
      // Create contact numbers for the new supplier
      if (contacts.length > 0) {
        await Promise.all(
          contacts.map(contact => 
            createSupplierContact({
              supplier_id: newSupplierId,
              contact_number: contact.contact_number,
              contact_name: contact.contact_name,
              type: contact.type,
              extension: contact.extension || undefined,
              is_primary: contact.is_primary,
              notes: contact.notes || undefined,
            })
          )
        );
      }
      
      router.push(`/suppliers/${newSupplierId}`);
    } catch (error) {
      console.error('Failed to create supplier:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleContactsChange = (updatedContacts: SupplierContact[]) => {
    setContacts(updatedContacts);
  };

  const isFormValid = () => {
    return (
      formData.name.trim() !== '' &&
      formData.email.trim() !== '' &&
      formData.address.address_line_1.trim() !== '' &&
      formData.address.city.trim() !== '' &&
      formData.address.state.trim() !== '' &&
      formData.address.zipcode.trim() !== '' &&
      formData.address.country.trim() !== ''
    );
  };

  return (
    <div className="page-container">
      <PageHeader
        icon={Truck}
        title="Add New Supplier"
        description="Create a new supplier profile"
        showBackButton={true}
        actions={[
          {
            label: saving ? 'Creating...' : 'Create Supplier',
            onClick: handleSave,
            icon: saving ? Loader2 : Save,
            disabled: saving || !isFormValid(),
          }
        ]}
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Supplier Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter supplier name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="supplier@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website || ''}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://www.supplier.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo_url">Logo URL</Label>
              <Input
                id="logo_url"
                value={formData.logo_url || ''}
                onChange={(e) => handleInputChange('logo_url', e.target.value)}
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe the supplier..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle>Address Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address_line_1">Address Line 1 *</Label>
              <Input
                id="address_line_1"
                value={formData.address.address_line_1}
                onChange={(e) => handleAddressChange('address_line_1', e.target.value)}
                placeholder="Street address"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_line_2">Address Line 2</Label>
              <Input
                id="address_line_2"
                value={formData.address.address_line_2 || ''}
                onChange={(e) => handleAddressChange('address_line_2', e.target.value)}
                placeholder="Apartment, suite, etc."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.address.city}
                  onChange={(e) => handleAddressChange('city', e.target.value)}
                  placeholder="City"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={formData.address.state}
                  onChange={(e) => handleAddressChange('state', e.target.value)}
                  placeholder="State"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zipcode">Zip Code *</Label>
                <Input
                  id="zipcode"
                  value={formData.address.zipcode}
                  onChange={(e) => handleAddressChange('zipcode', e.target.value)}
                  placeholder="Zip code"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <Select 
                  value={formData.address.country} 
                  onValueChange={(value) => handleAddressChange('country', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USA">United States</SelectItem>
                    <SelectItem value="Canada">Canada</SelectItem>
                    <SelectItem value="Mexico">Mexico</SelectItem>
                    <SelectItem value="UK">United Kingdom</SelectItem>
                    <SelectItem value="Germany">Germany</SelectItem>
                    <SelectItem value="France">France</SelectItem>
                    <SelectItem value="China">China</SelectItem>
                    <SelectItem value="Japan">Japan</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Business Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="On Hold">On Hold</SelectItem>
                  <SelectItem value="Pending Approval">Pending Approval</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="payment_terms">Payment Terms</Label>
              <Input
                id="payment_terms"
                value={formData.payment_terms || ''}
                onChange={(e) => handleInputChange('payment_terms', e.target.value)}
                placeholder="e.g., Net 30 days"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_terms">Delivery Terms</Label>
              <Input
                id="delivery_terms"
                value={formData.delivery_terms || ''}
                onChange={(e) => handleInputChange('delivery_terms', e.target.value)}
                placeholder="e.g., FOB origin, 5-7 business days"
              />
            </div>
          </CardContent>
        </Card>

        {/* Additional Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="notes">Internal Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Internal notes about this supplier..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Numbers Management */}
      <div className="mt-6">
        <ContactNumbersManager
          contacts={contacts}
          onChange={handleContactsChange}
        />
      </div>
    </div>
  );
}
