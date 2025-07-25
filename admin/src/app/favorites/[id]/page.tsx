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
  Heart, 
  Mail, 
  Loader2,
  AlertCircle,
  Copy,
  Power,
  PowerOff,
  Trash2,
  Package,
  Star,
  User,
  Tag
} from 'lucide-react';
import { toast } from 'sonner';
import { Favorite } from '@/types/favorite';
import { 
  getFavoriteById, 
  activateFavorite, 
  deactivateFavorite, 
  deleteFavorite,
  formatPrice,
  formatDateTime,
  getStatusBadgeVariant,
  getStatusLabel
} from '@/services/favorite-service';

export default function FavoriteViewPage() {
  const router = useRouter();
  const params = useParams();
  const favoriteId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [favorite, setFavorite] = useState<Favorite | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load favorite data
  useEffect(() => {
    const loadFavorite = async () => {
      try {
        const response = await getFavoriteById(favoriteId);
        setFavorite(response.data);
      } catch (error) {
        console.error('Failed to load favorite:', error);
        toast.error('Failed to load favorite data');
        router.push('/favorites');
      } finally {
        setLoading(false);
      }
    };

    if (favoriteId) {
      loadFavorite();
    }
  }, [favoriteId, router]);

  const handleEdit = () => {
    router.push(`/favorites/${favoriteId}/edit`);
  };

  const handleBack = () => {
    router.push('/favorites');
  };

  const handleCopyId = async () => {
    if (favorite) {
      try {
        await navigator.clipboard.writeText(favorite._id);
        toast.success('Favorite ID copied to clipboard');
      } catch {
        toast.error('Failed to copy to clipboard');
      }
    }
  };

  const handleToggleStatus = async () => {
    if (!favorite) return;

    const action = favorite.is_active ? 'deactivate' : 'activate';
    setActionLoading(action);

    try {
      if (favorite.is_active) {
        await deactivateFavorite(favorite._id);
        toast.success('Favorite deactivated successfully');
      } else {
        await activateFavorite(favorite._id);
        toast.success('Favorite activated successfully');
      }

      // Reload favorite data
      const response = await getFavoriteById(favoriteId);
      setFavorite(response.data);
    } catch (error) {
      console.error(`Failed to ${action} favorite:`, error);
      toast.error(`Failed to ${action} favorite. Please try again.`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!favorite) return;

    const productName = favorite.product_variant_id.product_id.name;
    const confirmed = window.confirm(
      `Are you sure you want to delete the favorite for "${productName}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setActionLoading('delete');

    try {
      await deleteFavorite(favorite._id);
      toast.success('Favorite deleted successfully');
      router.push('/favorites');
    } catch (error) {
      console.error('Failed to delete favorite:', error);
      toast.error('Failed to delete favorite. Please try again.');
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading favorite...</span>
        </div>
      </div>
    );
  }

  if (!favorite) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Favorite Not Found</h2>
          <p className="text-muted-foreground mb-4">The favorite you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={handleBack}>
            Back to Favorites
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Heart className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {favorite.product_variant_id.product_id.name}
            </h1>
            <p className="text-muted-foreground mt-1">
              Favorite by {favorite.user_id.name}
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
            ) : favorite.is_active ? (
              <PowerOff className="h-4 w-4 mr-2" />
            ) : (
              <Power className="h-4 w-4 mr-2" />
            )}
            {favorite.is_active ? 'Deactivate' : 'Activate'}
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
          {/* Product Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Product Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-4">
                {favorite.product_variant_id.images.length > 0 && (
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={favorite.product_variant_id.images[0]}
                      alt={favorite.product_variant_id.product_id.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        const sibling = target.nextElementSibling as HTMLElement;
                        target.style.display = 'none';
                        if (sibling) sibling.style.display = 'flex';
                      }}
                    />
                    <div className="hidden w-full h-full items-center justify-center">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </div>
                )}
                
                <div className="flex-1 space-y-2">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Product Name</label>
                    <p className="text-lg font-semibold">{favorite.product_variant_id.product_id.name}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Description</label>
                    <p className="text-base">{favorite.product_variant_id.product_id.description}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">SKU Code</label>
                  <p className="text-base font-mono">{favorite.product_variant_id.sku_code}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Product Variant</label>
                  <div className="flex items-center mt-1">
                    <Badge variant={favorite.product_variant_id.is_active ? 'default' : 'secondary'}>
                      {favorite.product_variant_id.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Price</label>
                  <div className="space-y-1 mt-1">
                    {favorite.product_variant_id.discount_details.is_on_sale ? (
                      <div>
                        <div className="text-lg font-semibold text-green-600">
                          {formatPrice(favorite.product_variant_id.discount_details.price!)}
                        </div>
                        <div className="text-sm text-muted-foreground line-through">
                          {formatPrice(favorite.product_variant_id.price)}
                        </div>
                        <Badge variant="destructive" className="text-xs">
                          {favorite.product_variant_id.discount_details.percentage}% OFF
                        </Badge>
                      </div>
                    ) : (
                      <div className="text-lg font-semibold">
                        {formatPrice(favorite.product_variant_id.price)}
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Rating</label>
                  <div className="flex items-center space-x-1 mt-1">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="text-lg font-semibold">
                      {favorite.product_variant_id.average_rating.toFixed(1)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ({favorite.product_variant_id.reviews_count} reviews)
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Images</label>
                  <p className="text-base mt-1">{favorite.product_variant_id.images.length} image(s)</p>
                </div>
              </div>
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
                  <p className="text-lg font-semibold">{favorite.user_id.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-base">{favorite.user_id.email}</p>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={`mailto:${favorite.user_id.email}`}>
                        <Mail className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Role</label>
                  <div className="flex items-center mt-1">
                    <Badge variant={favorite.user_id.role === 'admin' ? 'default' : 'secondary'}>
                      {favorite.user_id.role}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">User Status</label>
                  <div className="flex items-center mt-1">
                    <Badge variant={favorite.user_id.isActive ? 'default' : 'secondary'}>
                      {favorite.user_id.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Favorite Notes */}
          {favorite.user_notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Tag className="h-5 w-5 mr-2" />
                  User Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base italic">&ldquo;{favorite.user_notes}&rdquo;</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Favorite Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current Status</span>
                <Badge variant={getStatusBadgeVariant(favorite.is_active)}>
                  {getStatusLabel(favorite.is_active)}
                </Badge>
              </div>
              
              <Separator />
              
              <div className="text-sm text-muted-foreground">
                {favorite.is_active 
                  ? "This favorite is active and visible to the user."
                  : "This favorite is inactive and hidden from the user."
                }
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Product Rating</span>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">
                    {favorite.product_variant_id.average_rating.toFixed(1)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Reviews</span>
                <span className="text-sm font-medium">{favorite.product_variant_id.reviews_count}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">On Sale</span>
                <Badge variant={favorite.product_variant_id.discount_details.is_on_sale ? 'destructive' : 'secondary'}>
                  {favorite.product_variant_id.discount_details.is_on_sale ? 'Yes' : 'No'}
                </Badge>
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
                <span className="text-sm text-muted-foreground">Favorite ID</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-mono">{favorite._id.slice(-8)}</span>
                  <Button variant="ghost" size="sm" onClick={handleCopyId}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Added</span>
                <span className="text-sm">{formatDateTime(favorite.added_at)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last Updated</span>
                <span className="text-sm">{formatDateTime(favorite.updatedAt)}</span>
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
                Edit Favorite
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={handleToggleStatus}
                disabled={actionLoading === 'activate' || actionLoading === 'deactivate'}
              >
                {actionLoading === 'activate' || actionLoading === 'deactivate' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : favorite.is_active ? (
                  <>
                    <PowerOff className="h-4 w-4 mr-2" />
                    Deactivate Favorite
                  </>
                ) : (
                  <>
                    <Power className="h-4 w-4 mr-2" />
                    Activate Favorite
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
                Delete Favorite
              </Button>
            </CardContent>
          </Card>

          {/* Help */}
          <Card>
            <CardHeader>
              <CardTitle>Help</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Use Edit to modify favorite notes</p>
              <p>• Deactivate to hide from user</p>
              <p>• Delete permanently removes the favorite</p>
              <p>• Users can add favorites from product pages</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
