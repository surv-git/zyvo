"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TableFooter } from '@/components/ui/table-footer';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MoreHorizontal, Search, RefreshCw, Edit, Eye, Trash2, Star, Phone, Mail, Globe } from 'lucide-react';
import { getSuppliers, deleteSupplier } from '@/services/supplier-service';
import { Supplier, SupplierTableFilters } from '@/types/supplier';
import { SupplierContact } from '@/types/supplier-contact';
import { getSiteConfigSync } from '@/config/site';

interface SupplierManagementTableProps {
  className?: string;
}

export default function SupplierManagementTable({ className }: SupplierManagementTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [contactNumbers, setContactNumbers] = useState<Record<string, SupplierContact[]>>({});
  
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Get pagination values from URL or defaults
  const currentPage = parseInt(searchParams.get('page') || '1');
  const itemsPerPage = parseInt(searchParams.get('limit') || getSiteConfigSync().admin.itemsPerPage.toString());

  // Scroll preservation logic
  // Simplified navigation without complex scroll preservation
  
  // Build filters from search params
  const buildFilters = useCallback((): SupplierTableFilters => {
    return {
      page: currentPage,
      limit: itemsPerPage,
      status: searchParams.get('status') as 'Active' | 'Inactive' | 'On Hold' | 'Pending Approval' || undefined,
      country: searchParams.get('country') || undefined,
      product_categories_supplied: searchParams.get('product_categories_supplied') || undefined,
      search: searchParams.get('search') || undefined,
      sort: searchParams.get('sort') as 'name' | 'createdAt' | 'rating' | 'status' || 'createdAt',
      order: searchParams.get('order') as 'asc' | 'desc' || 'desc',
      include_inactive: searchParams.get('include_inactive') === 'true' || false,
    };
  }, [currentPage, itemsPerPage, searchParams]);

  // Fetch suppliers
  const fetchSuppliers = useCallback(async () => {
    try {
      const filters = buildFilters();
      const response = await getSuppliers(filters);
      
      setSuppliers(response.data);
      setTotalItems(response.pagination.totalItems);
      setTotalPages(response.pagination.totalPages);

      // Extract contact numbers from supplier response (they're already included)
      const contactsMap: Record<string, SupplierContact[]> = {};
      response.data.forEach((supplier) => {
        if (supplier.contact_numbers && supplier.contact_numbers.length > 0) {
          contactsMap[supplier.id] = supplier.contact_numbers;
        }
      });
      setContactNumbers(contactsMap);
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
    }
  }, [buildFilters]);

  // Load suppliers on mount and when filters change
  useEffect(() => {
    const loadSuppliers = async () => {
      setLoading(true);
      await fetchSuppliers();
      setLoading(false);
    };

    loadSuppliers();
  }, [fetchSuppliers]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/suppliers?${params.toString()}`);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('limit', newItemsPerPage.toString());
    params.set('page', '1'); // Reset to first page
    router.push(`/suppliers?${params.toString()}`);
  };

  // Handle search
  const handleSearch = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      params.set('search', value.trim());
    } else {
      params.delete('search');
    }
    params.set('page', '1'); // Reset to first page
    router.push(`/suppliers?${params.toString()}`);
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSuppliers();
    setRefreshing(false);
  };

  // Handle view supplier
  const handleViewSupplier = (id: string) => {
    router.push(`/suppliers/${id}`);
  };

  // Handle edit supplier
  const handleEditSupplier = (id: string) => {
    router.push(`/suppliers/${id}/edit`);
  };

  // Handle delete supplier
  const handleDeleteSupplier = async (id: string, name: string) => {
    try {
      setActionLoading(id);
      await deleteSupplier(id);
      
      // Refresh the list
      await fetchSuppliers();
      
      console.log(`Supplier "${name}" deleted successfully`);
    } catch (error) {
      console.error('Failed to delete supplier:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle rating display
  const renderRating = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        <span className="text-sm">{rating.toFixed(1)}</span>
      </div>
    );
  };

  // Get badge variant for status
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

  // Render contact info (email and primary contact number)
  const renderContactInfo = (supplier: Supplier) => {
    const contacts = contactNumbers[supplier.id] || [];
    const primaryContact = contacts.find(c => c.is_primary) || contacts[0];

    return (
      <div className="space-y-1">
        {/* Email */}
        <div className="flex items-center gap-2">
          <Mail className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{supplier.email}</span>
        </div>
        
        {/* Primary Contact Number */}
        {primaryContact ? (
          <div className="flex items-center gap-2">
            <Phone className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm">{primaryContact.formatted_number}</span>
            {contacts.length > 1 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-5 px-1 text-xs">
                    +{contacts.length - 1}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">All Contact Numbers</h4>
                    <div className="space-y-2">
                      {contacts.map((contact) => (
                        <div key={contact.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{contact.formatted_number}</span>
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
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Phone className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">No contact</span>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Loading Suppliers...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Suppliers</CardTitle>
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search suppliers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(searchTerm);
                  }
                }}
                className="w-64 pl-8"
              />
            </div>
            
            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {suppliers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No suppliers found. Try adjusting your search criteria.
          </div>
        ) : (
          <>
          <div className='table-container'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Payment Terms</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {supplier.logo_url ? (
                          <img
                            src={supplier.logo_url}
                            alt={supplier.name}
                            className="h-8 w-8 rounded object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                            <span className="text-xs font-medium">
                              {supplier.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{supplier.display_name}</div>
                          {supplier.website && (
                            <div className="flex items-center gap-1 mt-1">
                              <Globe className="h-3 w-3 text-muted-foreground" />
                              <a
                                href={supplier.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {supplier.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{renderContactInfo(supplier)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {supplier.address.city}, {supplier.address.state}
                        <br />
                        <span className="text-muted-foreground">{supplier.address.country}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(supplier.status)}>
                        {supplier.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {supplier.rating > 0 ? renderRating(supplier.rating) : (
                        <span className="text-muted-foreground text-sm">No rating</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {supplier.payment_terms || 'Not specified'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(supplier.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            disabled={actionLoading === supplier.id}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewSupplier(supplier.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditSupplier(supplier.id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the supplier &quot;{supplier.name}&quot;. 
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteSupplier(supplier.id, supplier.name)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        </div>
            <TableFooter
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
              entityName="suppliers"
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
