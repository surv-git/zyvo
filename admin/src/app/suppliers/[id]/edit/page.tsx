"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Save, Loader2, Truck } from 'lucide-react';
import { getSupplier, updateSupplier } from '@/services/supplier-service';
import { getSupplierContacts, createSupplierContact, updateSupplierContact, deleteSupplierContact } from '@/services/supplier-contact-service';
import { Supplier, SupplierUpdateRequest } from '@/types/supplier';
import { SupplierContact } from '@/types/supplier-contact';
import ContactNumbersManager from '@/components/suppliers/contact-numbers-manager';

export default function SupplierEditPage() {
  const router = useRouter();
  const params = useParams();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [contacts, setContacts] = useState<SupplierContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const supplierId = params.id as string;

  // Form state
  const [formData, setFormData] = useState<SupplierUpdateRequest>({
    name: '',
    description: '',
    logo_url: '',
    address: {
      address_line_1: '',
      address_line_2: '',
      city: '',
      state: '',
      zipcode: '',
      country: '',
    },
    email: '',
    website: '',
    payment_terms: '',
    delivery_terms: '',
    status: 'Active',
    notes: '',
    is_active: true,
  });

  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        setLoading(true);
        const response = await getSupplier(supplierId);
        const supplierData = response.data;
        setSupplier(supplierData);
        
        // Populate form data
        setFormData({
          name: supplierData.name,
          description: supplierData.description || '',
          logo_url: supplierData.logo_url || '',
          address: {
            address_line_1: supplierData.address.address_line_1,
            address_line_2: supplierData.address.address_line_2 || '',
            city: supplierData.address.city,
            state: supplierData.address.state,
            zipcode: supplierData.address.zipcode,
            country: supplierData.address.country,
          },
          email: supplierData.email,
          website: supplierData.website || '',
          payment_terms: supplierData.payment_terms || '',
          delivery_terms: supplierData.delivery_terms || '',
          status: supplierData.status,
          notes: supplierData.notes || '',
          is_active: supplierData.is_active,
        });
        
        // Fetch contact numbers
        try {
          const contactsResponse = await getSupplierContacts({
            supplier_id: supplierId,
            page: 1,
            limit: 50,
            sort: 'is_primary',
            order: 'desc'
          });
          setContacts(contactsResponse.data);
        } catch (contactError) {
          console.error('Failed to fetch contact numbers:', contactError);
          setContacts([]);
        }
      } catch (error) {
        console.error('Failed to fetch supplier:', error);
      } finally {
        setLoading(false);
      }
    };

    if (supplierId) {
      fetchSupplier();
    }
  }, [supplierId]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address!,
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Save supplier data
      await updateSupplier(supplierId, formData);
      
      // Save contact numbers
      await saveContactNumbers();
      
      router.push(`/suppliers/${supplierId}`);
    } catch (error) {
      console.error('Failed to update supplier:', error);
    } finally {
      setSaving(false);
    }
  };

  const saveContactNumbers = async () => {
    // Handle contact number operations
    const existingContactIds = new Set(
      contacts.filter(c => !c.id.startsWith('temp-')).map(c => c.id)
    );
    
    // Create new contacts (those with temp- IDs)
    const newContacts = contacts.filter(c => c.id.startsWith('temp-'));
    for (const contact of newContacts) {
      try {
        await createSupplierContact({
          supplier_id: supplierId,
          contact_number: contact.contact_number,
          contact_name: contact.contact_name,
          type: contact.type,
          extension: contact.extension || undefined,
          is_primary: contact.is_primary,
          notes: contact.notes || undefined,
        });
      } catch (error) {
        console.error('Failed to create contact:', error);
      }
    }

    // Update existing contacts
    const existingContacts = contacts.filter(c => !c.id.startsWith('temp-'));
    for (const contact of existingContacts) {
      try {
        await updateSupplierContact(contact.id, {
          contact_number: contact.contact_number,
          contact_name: contact.contact_name,
          type: contact.type,
          extension: contact.extension || undefined,
          is_primary: contact.is_primary,
          notes: contact.notes || undefined,
        });
      } catch (error) {
        console.error('Failed to update contact:', error);
      }
    }

    // Delete removed contacts (if any were removed)
    // This would require tracking which contacts were removed
    // For now, we'll skip this and handle it in future iterations
  };

  const handleContactsChange = (updatedContacts: SupplierContact[]) => {
    setContacts(updatedContacts);
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading supplier...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="page-container">
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold">Supplier not found</h2>
          <p className="text-muted-foreground mt-2">The supplier you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={() => router.push('/suppliers')} className="mt-4">
            Back to Suppliers
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        icon={Truck}
        title={`Edit ${supplier.display_name}`}
        description="Update supplier information and settings"
        showBackButton={true}
        actions={[
          {
            label: saving ? 'Saving...' : 'Save Changes',
            onClick: handleSave,
            icon: saving ? Loader2 : Save,
            disabled: saving,
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
                value={formData.address?.address_line_1 || ''}
                onChange={(e) => handleAddressChange('address_line_1', e.target.value)}
                placeholder="Street address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_line_2">Address Line 2</Label>
              <Input
                id="address_line_2"
                value={formData.address?.address_line_2 || ''}
                onChange={(e) => handleAddressChange('address_line_2', e.target.value)}
                placeholder="Apartment, suite, etc."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.address?.city || ''}
                  onChange={(e) => handleAddressChange('city', e.target.value)}
                  placeholder="City"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={formData.address?.state || ''}
                  onChange={(e) => handleAddressChange('state', e.target.value)}
                  placeholder="State"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zipcode">Zip Code *</Label>
                <Input
                  id="zipcode"
                  value={formData.address?.zipcode || ''}
                  onChange={(e) => handleAddressChange('zipcode', e.target.value)}
                  placeholder="Zip code"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  value={formData.address?.country || ''}
                  onChange={(e) => handleAddressChange('country', e.target.value)}
                  placeholder="Country"
                />
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

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is_active">Active Supplier</Label>
                <div className="text-sm text-muted-foreground">
                  Enable to allow orders from this supplier
                </div>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleInputChange('is_active', checked)}
              />
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
