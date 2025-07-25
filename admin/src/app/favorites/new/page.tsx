"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  Save, 
  Heart, 
  Loader2,
  Package
} from 'lucide-react';
import { toast } from 'sonner';
import { CreateFavoriteData } from '@/types/favorite';
import { 
  createFavorite,
  FavoriteServiceError
} from '@/services/favorite-service';

interface FavoriteFormData {
  user_id: string;
  product_variant_id: string;
  user_notes: string;
  is_active: boolean;
}

export default function FavoriteNewPage() {
  const router = useRouter();
  
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FavoriteFormData>({
    user_id: '',
    product_variant_id: '',
    user_notes: '',
    is_active: true,
  });

  const handleBack = () => {
    router.push('/favorites');
  };

  const handleInputChange = (field: keyof FavoriteFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.user_id.trim()) {
      toast.error('User is required');
      return;
    }
    
    if (!formData.product_variant_id.trim()) {
      toast.error('Product variant is required');
      return;
    }

    try {
      setSaving(true);
      
      const createData: CreateFavoriteData = {
        user_id: formData.user_id,
        product_variant_id: formData.product_variant_id,
        user_notes: formData.user_notes || undefined,
        is_active: formData.is_active,
      };

      const response = await createFavorite(createData);
      
      toast.success('Favorite created successfully');
      router.push(`/favorites/${response.data._id}`);
    } catch (error) {
      console.error('Failed to create favorite:', error);
      if (error instanceof FavoriteServiceError) {
        toast.error(error.message);
      } else {
        toast.error('Failed to create favorite. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

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
            <h1 className="text-3xl font-bold tracking-tight">Create New Favorite</h1>
            <p className="text-muted-foreground mt-1">
              Add a new favorite for a user and product
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
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Favorite
              </>
            )}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Heart className="h-5 w-5 mr-2" />
                Favorite Information
              </CardTitle>
              <CardDescription>
                Enter the basic details for the new favorite
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user_id">User ID</Label>
                <Input
                  id="user_id"
                  placeholder="Enter user ID (e.g., 687b016064843ad6fabfdf5a)"
                  value={formData.user_id}
                  onChange={(e) => handleInputChange('user_id', e.target.value)}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  The unique identifier of the user who is adding this favorite
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="product_variant_id">Product Variant ID</Label>
                <Input
                  id="product_variant_id"
                  placeholder="Enter product variant ID (e.g., 687b33690a7b4450b3133789)"
                  value={formData.product_variant_id}
                  onChange={(e) => handleInputChange('product_variant_id', e.target.value)}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  The unique identifier of the product variant to be favorited
                </p>
              </div>

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
                  Personal notes or comments about why this product is being favorited
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Instructions
              </CardTitle>
              <CardDescription>
                How to find the required IDs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Finding User ID:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Go to Users Management page</li>
                  <li>• Find the user and view their details</li>
                  <li>• Copy the user ID from the details page</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Finding Product Variant ID:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Go to Products Management page</li>
                  <li>• Find the product and view its variants</li>
                  <li>• Copy the specific variant ID you want to favorite</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
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

          {/* Sample Data */}
          <Card>
            <CardHeader>
              <CardTitle>Sample IDs</CardTitle>
              <CardDescription>
                Example IDs for testing (these may not exist)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Sample User ID:</Label>
                <p className="font-mono text-xs bg-muted p-2 rounded mt-1">
                  687b016064843ad6fabfdf5a
                </p>
              </div>
              
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Sample Product Variant ID:</Label>
                <p className="font-mono text-xs bg-muted p-2 rounded mt-1">
                  687b33690a7b4450b3133789
                </p>
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
                <span className="text-muted-foreground">User ID:</span>
                <span className="font-mono text-xs">
                  {formData.user_id || 'Not set'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Product Variant:</span>
                <span className="font-mono text-xs">
                  {formData.product_variant_id || 'Not set'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Has Notes:</span>
                <span className="font-medium">
                  {formData.user_notes ? 'Yes' : 'No'}
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
              <p>• Both User ID and Product Variant ID are required</p>
              <p>• IDs must be valid MongoDB ObjectIds</p>
              <p>• Notes are optional but recommended</p>
              <p>• Active favorites are visible to users</p>
              <p>• Duplicate favorites for the same user/product are not allowed</p>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
