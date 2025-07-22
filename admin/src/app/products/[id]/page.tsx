'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Edit, 
  Trash2, 
  Power, 
  PowerOff, 
  Loader2, 
  AlertCircle,
  ImageIcon,
  Copy,
  Tag,
  Building2,
  Calendar,
  DollarSign,
  Package
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { toast } from 'sonner';
import { Product } from '@/types/product';
import { 
  getProductById, 
  toggleProductStatus, 
  deleteProduct, 
  getProductServiceErrorMessage 
} from '@/services/product-service';

// Simple confirmation dialog component
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  isDestructive?: boolean;
}

function ConfirmDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  description, 
  confirmText = "Confirm",
  isDestructive = false 
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/80" onClick={onClose} />
      <div className="relative z-50 grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg sm:rounded-lg">
        <div className="flex flex-col space-y-2 text-center sm:text-left">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <Button variant="outline" onClick={onClose} className="mt-2 sm:mt-0">
            Cancel
          </Button>
          <Button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={isDestructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ProductViewPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  // State
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    isDestructive?: boolean;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  // Load product
  useEffect(() => {
    const loadProduct = async () => {
      if (!productId) return;

      try {
        setLoading(true);
        setError(null);
        const data = await getProductById(productId);
        setProduct(data);
      } catch (err) {
        console.error('Failed to load product:', err);
        const errorMessage = getProductServiceErrorMessage(err);
        setError(errorMessage);
        
        if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 401) {
          toast.error('Please log in to access this product.');
          setTimeout(() => router.push('/login'), 2000);
        } else {
          toast.error(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId, router]);

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Invalid date';
    }
  };

  // Handle actions
  const handleToggleStatus = async () => {
    if (!product) return;

    try {
      setActionLoading(true);
      await toggleProductStatus(product._id, !product.is_active);
      
      setProduct(prev => prev ? { ...prev, is_active: !prev.is_active } : null);
      toast.success(`Product ${!product.is_active ? 'activated' : 'deactivated'} successfully.`);
    } catch (err) {
      const errorMessage = getProductServiceErrorMessage(err);
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!product) return;

    try {
      setActionLoading(true);
      await deleteProduct(product._id);
      
      toast.success(`Product "${product.name}" has been deleted.`);
      router.push('/products');
    } catch (err) {
      const errorMessage = getProductServiceErrorMessage(err);
      toast.error(errorMessage);
      setActionLoading(false);
    }
  };

  // Confirmation dialogs
  const confirmDelete = () => {
    if (!product) return;
    
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Product',
      description: `Are you sure you want to delete "${product.name}"? This action cannot be undone and will permanently remove the product and all associated data.`,
      onConfirm: handleDelete,
      isDestructive: true,
    });
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  // Navigation
  const handleBack = () => {
    router.back();
  };

  const handleEdit = () => {
    router.push(`/products/${productId}/edit`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground mt-2">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={handleBack}>
              Go Back
            </Button>
            {error.includes('Authentication required') || error.includes('log in') ? (
              <Button onClick={() => router.push('/login')}>
                Go to Login
              </Button>
            ) : (
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Product not found</p>
          <Button variant="outline" onClick={handleBack}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-container">
        <PageHeader
          showBackButton={true}
          onBack={handleBack}
          icon={Package}
          title={product.name}
          description="Product details and information"
          actions={[
            {
              label: 'Edit',
              onClick: handleEdit,
              variant: 'outline',
              icon: Edit,
              disabled: actionLoading
            },
            {
              label: product.is_active ? 'Deactivate' : 'Activate',
              onClick: handleToggleStatus,
              variant: 'outline',
              icon: product.is_active ? PowerOff : Power,
              disabled: actionLoading
            },
            {
              label: 'Delete',
              onClick: confirmDelete,
              variant: 'destructive',
              icon: actionLoading ? Loader2 : Trash2,
              disabled: actionLoading
            }
          ]}
        />

        <div className="grid gap-6 md:grid-cols-2">
          {/* Product Images */}
          <Card>
            <CardHeader>
              <CardTitle>Product Images</CardTitle>
            </CardHeader>
            <CardContent>
              {product.images && product.images.length > 0 ? (
                <div className="grid gap-4">
                  {product.images.map((image, index) => (
                    <div key={index} className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                      <Image
                        src={image}
                        alt={`${product.name} - Image ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center aspect-square bg-muted rounded-lg">
                  <div className="text-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No images available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Product ID</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <code className="flex-1 px-2 py-1 bg-muted rounded text-sm font-mono">
                      {product._id}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(product._id)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="mt-1 font-medium">{product.name}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Slug</label>
                  <p className="mt-1 font-mono text-sm">{product.slug}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <Badge variant={product.is_active ? 'default' : 'secondary'}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Category and Brand */}
            <Card>
              <CardHeader>
                <CardTitle>Classification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Category</label>
                    <p className="font-medium">{product.category_id?.name || 'Not assigned'}</p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Brand</label>
                    <p className="font-medium">{product.brand_id?.name || 'Not assigned'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Minimum Price</label>
                    <p className="text-lg font-bold">{formatPrice(product.min_price)}</p>
                  </div>
                </div>

                {product.min_discounted_price && (
                  <>
                    <Separator />
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Minimum Discounted Price</label>
                        <p className="text-lg font-bold text-green-600">{formatPrice(product.min_discounted_price)}</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Timestamps */}
            <Card>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created</label>
                    <p className="text-sm">{formatDate(product.createdAt)}</p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                    <p className="text-sm">{formatDate(product.updatedAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        isDestructive={confirmDialog.isDestructive}
      />
    </>
  );
}
