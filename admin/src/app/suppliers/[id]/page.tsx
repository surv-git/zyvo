"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Edit, 
  Mail, 
  Globe, 
  MapPin, 
  Star, 
  Package,
  DollarSign,
  Truck,
  Calendar,
  Building,
  Phone
} from 'lucide-react';
import { getSupplier } from '@/services/supplier-service';
import { getSupplierContacts } from '@/services/supplier-contact-service';
import { Supplier } from '@/types/supplier';
import { SupplierContact } from '@/types/supplier-contact';

export default function SupplierViewPage() {
  const router = useRouter();
  const params = useParams();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [contacts, setContacts] = useState<SupplierContact[]>([]);
  const [loading, setLoading] = useState(true);

  const supplierId = params.id as string;

  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        setLoading(true);
        const response = await getSupplier(supplierId);
        setSupplier(response.data);
        
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

  const handleEdit = () => {
    router.push(`/suppliers/${supplierId}/edit`);
  };

  const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' => {
    switch (status) {
      case 'Active':
        return 'default';
      case 'Inactive':
        return 'secondary';
      case 'On Hold':
      case 'Pending Approval':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const renderRating = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        <span className="text-sm font-medium">{rating.toFixed(1)}</span>
      </div>
    );
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
        title={supplier.display_name}
        description={supplier.description || 'Supplier details and information'}
        showBackButton={true}
        actions={[
          {
            label: 'Edit Supplier',
            onClick: handleEdit,
            icon: Edit,
          }
        ]}
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              {supplier.logo_url ? (
                <div className="h-12 w-12 rounded-lg overflow-hidden">
                  <img
                    src={supplier.logo_url}
                    alt={supplier.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                  <span className="text-lg font-medium">
                    {supplier.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h3 className="font-semibold">{supplier.display_name}</h3>
                <p className="text-sm text-muted-foreground">{supplier.slug}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <Badge variant={getStatusBadgeVariant(supplier.status)}>
                  {supplier.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Rating</span>
                {supplier.rating > 0 ? renderRating(supplier.rating) : (
                  <span className="text-muted-foreground text-sm">No rating</span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active</span>
                <Badge variant={supplier.is_active ? 'default' : 'secondary'}>
                  {supplier.is_active ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a href={`mailto:${supplier.email}`} className="text-sm hover:underline">
                {supplier.email}
              </a>
            </div>

            {/* Contact Numbers */}
            {contacts.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Contact Numbers</label>
                {contacts.map((contact) => (
                  <div key={contact.id} className="flex items-center gap-2 pl-6">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{contact.formatted_number}</span>
                        <Badge variant="outline" className="text-xs">
                          {contact.type}
                        </Badge>
                        {contact.is_primary && (
                          <Badge variant="default" className="text-xs">Primary</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{contact.contact_name}</p>
                      {contact.notes && (
                        <p className="text-xs text-muted-foreground">{contact.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {supplier.website && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <a 
                  href={supplier.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm hover:underline"
                >
                  {supplier.website}
                </a>
              </div>
            )}

            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="text-sm">
                <div>{supplier.address.address_line_1}</div>
                {supplier.address.address_line_2 && (
                  <div>{supplier.address.address_line_2}</div>
                )}
                <div>
                  {supplier.address.city}, {supplier.address.state} {supplier.address.zipcode}
                </div>
                <div className="text-muted-foreground">{supplier.address.country}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Terms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Business Terms
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Payment Terms</label>
              <p className="text-sm text-muted-foreground mt-1">
                {supplier.payment_terms || 'Not specified'}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Delivery Terms</label>
              <p className="text-sm text-muted-foreground mt-1">
                {supplier.delivery_terms || 'Not specified'}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Product Categories</label>
              <p className="text-sm text-muted-foreground mt-1">
                {supplier.product_categories_supplied.length > 0 
                  ? `${supplier.product_categories_supplied.length} categories`
                  : 'None specified'
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Additional Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Created</label>
              <p className="text-sm text-muted-foreground mt-1">
                {new Date(supplier.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Last Updated</label>
              <p className="text-sm text-muted-foreground mt-1">
                {new Date(supplier.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>

            {supplier.notes && (
              <div>
                <label className="text-sm font-medium">Notes</label>
                <p className="text-sm text-muted-foreground mt-1">
                  {supplier.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
