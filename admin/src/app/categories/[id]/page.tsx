"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Edit, 
  FolderTree, 
  Image as ImageIcon, 
  Tag, 
  Calendar,
  Loader2,
  AlertCircle,
  ExternalLink,
  Copy,
  Power,
  PowerOff,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { Category } from '@/types/category';
import { getCategoryById, activateCategory, deactivateCategory, deleteCategory } from '@/services/category-service';

export default function CategoryViewPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load category data
  useEffect(() => {
    const loadCategory = async () => {
      try {
        const categoryData = await getCategoryById(categoryId);
        setCategory(categoryData);
      } catch (error) {
        console.error('Failed to load category:', error);
        toast.error('Failed to load category data');
        router.push('/categories');
      } finally {
        setLoading(false);
      }
    };

    if (categoryId) {
      loadCategory();
    }
  }, [categoryId, router]);

  const handleEdit = () => {
    router.push(`/categories/${categoryId}/edit`);
  };

  const handleBack = () => {
    router.push('/categories');
  };

  const handleCopyId = async () => {
    if (category) {
      try {
        await navigator.clipboard.writeText(category._id);
        toast.success('Category ID copied to clipboard');
      } catch (err) {
        toast.error('Failed to copy to clipboard');
      }
    }
  };

  const handleToggleStatus = async () => {
    if (!category) return;

    const action = category.is_active ? 'deactivate' : 'activate';
    setActionLoading(action);

    try {
      if (category.is_active) {
        await deactivateCategory(category._id);
        toast.success('Category deactivated successfully');
      } else {
        await activateCategory(category._id);
        toast.success('Category activated successfully');
      }

      // Reload category data
      const updatedCategory = await getCategoryById(categoryId);
      setCategory(updatedCategory);
    } catch (error) {
      console.error(`Failed to ${action} category:`, error);
      toast.error(`Failed to ${action} category. Please try again.`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!category) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${category.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setActionLoading('delete');

    try {
      await deleteCategory(category._id);
      toast.success('Category deleted successfully');
      router.push('/categories');
    } catch (error) {
      console.error('Failed to delete category:', error);
      toast.error('Failed to delete category. Please try again.');
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading category...</span>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Category Not Found</h2>
          <p className="text-muted-foreground mb-4">The category you're looking for doesn't exist.</p>
          <Button onClick={handleBack}>
            Back to Categories
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
          <FolderTree className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{category.name}</h1>
            <p className="text-muted-foreground mt-1">
              Category details and information
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
            ) : category.is_active ? (
              <PowerOff className="h-4 w-4 mr-2" />
            ) : (
              <Power className="h-4 w-4 mr-2" />
            )}
            {category.is_active ? 'Deactivate' : 'Activate'}
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
                <Tag className="h-5 w-5 mr-2" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-lg font-semibold">{category.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Slug</label>
                  <p className="text-lg font-mono">{category.slug}</p>
                </div>
              </div>

              {category.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="text-base mt-1">{category.description}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground">Hierarchy</label>
                <div className="flex items-center mt-1">
                  {category.parent_category ? (
                    <div className="flex items-center space-x-2">
                      <span className="text-base">{category.parent_category.name}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="text-base font-semibold">{category.name}</span>
                    </div>
                  ) : (
                    <span className="text-base">Root Category</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Image */}
          {category.image_url && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ImageIcon className="h-5 w-5 mr-2" />
                  Category Image
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center p-8 bg-muted/50 rounded-lg">
                  <img
                    src={category.image_url}
                    alt={category.name}
                    className="max-w-full max-h-64 object-contain rounded-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Image URL:</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(category.image_url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm font-mono mt-1 break-all">{category.image_url}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current Status</span>
                <Badge variant={category.is_active ? "default" : "secondary"}>
                  {category.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              
              <Separator />
              
              <div className="text-sm text-muted-foreground">
                {category.is_active 
                  ? "This category is visible to customers and can be used for products."
                  : "This category is hidden from customers and cannot be used for new products."
                }
              </div>
            </CardContent>
          </Card>

          {/* Category Details */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Category ID</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-mono">{category._id.slice(-8)}</span>
                  <Button variant="ghost" size="sm" onClick={handleCopyId}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm">{new Date(category.createdAt).toLocaleDateString()}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last Updated</span>
                <span className="text-sm">{new Date(category.updatedAt).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Version</span>
                <span className="text-sm">{category.__v}</span>
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
                Edit Category
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={handleToggleStatus}
                disabled={actionLoading === 'activate' || actionLoading === 'deactivate'}
              >
                {category.is_active ? (
                  <>
                    <PowerOff className="h-4 w-4 mr-2" />
                    Deactivate Category
                  </>
                ) : (
                  <>
                    <Power className="h-4 w-4 mr-2" />
                    Activate Category
                  </>
                )}
              </Button>
              
              <Button 
                variant="destructive" 
                className="w-full justify-start"
                onClick={handleDelete}
                disabled={actionLoading === 'delete'}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Category
              </Button>
            </CardContent>
          </Card>

          {/* Help */}
          <Card>
            <CardHeader>
              <CardTitle>Help</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Use Edit to modify category information</p>
              <p>• Deactivate to hide from customers temporarily</p>
              <p>• Delete permanently removes the category</p>
              <p>• Changes to parent categories affect hierarchy</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
