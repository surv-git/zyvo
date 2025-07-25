"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  Save, 
  Heart, 
  Loader2,
  AlertCircle,
  Package,
  User
} from 'lucide-react';
import { toast } from 'sonner';
import { Favorite } from '@/types/favorite';
import { 
  getFavoriteById, 
  updateFavorite,
  FavoriteServiceError
} from '@/services/favorite-service';

interface FavoriteFormData {
  user_notes: string;
  is_active: boolean;
}

export default function FavoriteEditPage() {
  const router = useRouter();
  const params = useParams();
  const favoriteId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [favorite, setFavorite] = useState<Favorite | null>(null);
  const [formData, setFormData] = useState<FavoriteFormData>({
    user_notes: '',
    is_active: true,
  });

  // Load favorite data
  useEffect(() => {
    const loadFavorite = async () => {
      try {
        const response = await getFavoriteById(favoriteId);
        const favoriteData = response.data;
        setFavorite(favoriteData);
        
        // Populate form with existing data
        setFormData({
          user_notes: favoriteData.user_notes || '',
          is_active: favoriteData.is_active,
        });
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

  const handleBack = () => {
    router.push(`/favorites/${favoriteId}`);
  };

  const handleInputChange = (field: keyof FavoriteFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      
      const updateData = {
        user_notes: formData.user_notes || undefined,
        is_active: formData.is_active,
      };

      await updateFavorite(favoriteId, updateData);
      
      toast.success('Favorite updated successfully');
      router.push(`/favorites/${favoriteId}`);
    } catch (error) {
      console.error('Failed to update favorite:', error);
      if (error instanceof FavoriteServiceError) {
        toast.error(error.message);
      } else {
        toast.error('Failed to update favorite. Please try again.');
      }
    } finally {
      setSaving(false);
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
          <p className="text-muted-foreground mb-4">The favorite you&apos;re trying to edit doesn&apos;t exist.</p>
          <Button onClick={() => router.push('/favorites')}>
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
            <h1 className="text-3xl font-bold tracking-tight">Edit Favorite</h1>
            <p className="text-muted-foreground mt-1">
              Update favorite settings and notes
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleBack}>
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

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Information (Read-only) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Product Information
              </CardTitle>
              <CardDescription>
                Product details cannot be changed for existing favorites
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-4">
                {favorite.product_variant_id.images.length > 0 && (
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
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
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                  </div>
                )}
                
                <div className="flex-1 space-y-2">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Product Name</label>
                    <p className="text-lg font-semibold">{favorite.product_variant_id.product_id.name}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">SKU Code</label>
                    <p className="text-base font-mono">{favorite.product_variant_id.sku_code}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Information (Read-only) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                User Information
              </CardTitle>
              <CardDescription>
                User details cannot be changed for existing favorites
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">User Name</label>
                  <p className="text-lg font-semibold">{favorite.user_id.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-base">{favorite.user_id.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Editable Information */}
          <Card>
            <CardHeader>
              <CardTitle>Favorite Settings</CardTitle>
              <CardDescription>
                Modify the favorite notes and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user_notes">User Notes</Label>
                <Textarea
                  id="user_notes"
                  placeholder="Add personal notes about this favorite (optional)"
                  rows={4}
                  value={formData.user_notes}
                  onChange={(e) => handleInputChange('user_notes', e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Personal notes or comments about why this product is favorited
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label>Active Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Controls whether this favorite is visible to the user
                  </p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Product:</span>
                <span className="font-medium">{favorite.product_variant_id.product_id.name}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">User:</span>
                <span className="font-medium">{favorite.user_id.name}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Added:</span>
                <span className="font-medium">
                  {new Date(favorite.added_at).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className={`font-medium ${formData.is_active ? 'text-green-600' : 'text-red-600'}`}>
                  {formData.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Help */}
          <Card>
            <CardHeader>
              <CardTitle>Help</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Only notes and status can be edited</p>
              <p>• Product and user cannot be changed</p>
              <p>• Inactive favorites are hidden from users</p>
              <p>• Notes are personal and not visible to other users</p>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
