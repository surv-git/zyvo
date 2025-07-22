"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Edit, 
  Settings, 
  Tag, 
  Loader2,
  AlertCircle,
  Copy,
  Power,
  PowerOff,
  Trash2,
  ArrowUpDown
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { toast } from 'sonner';
import { Option } from '@/types/option';
import { getOptionById, activateOption, deactivateOption, deleteOption, getOptionServiceErrorMessage } from '@/services/option-service';

export default function OptionViewPage() {
  const router = useRouter();
  const params = useParams();
  const optionId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [option, setOption] = useState<Option | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load option data
  useEffect(() => {
    const loadOption = async () => {
      try {
        const optionData = await getOptionById(optionId);
        setOption(optionData);
        setError(null);
      } catch (error) {
        console.error('Failed to load option:', error);
        const errorMessage = getOptionServiceErrorMessage(error);
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (optionId) {
      loadOption();
    }
  }, [optionId, router]);

  const handleEdit = () => {
    router.push(`/options/${optionId}/edit`);
  };

  const handleBack = () => {
    router.push('/options');
  };

  const handleCopyId = async () => {
    if (option) {
      try {
        await navigator.clipboard.writeText(option._id);
        toast.success('Option ID copied to clipboard');
      } catch {
        toast.error('Failed to copy to clipboard');
      }
    }
  };

  const handleToggleStatus = async () => {
    if (!option) return;

    const action = option.is_active ? 'deactivate' : 'activate';
    setActionLoading(action);

    try {
      if (option.is_active) {
        await deactivateOption(option._id);
        toast.success('Option deactivated successfully');
      } else {
        await activateOption(option._id);
        toast.success('Option activated successfully');
      }

      // Reload option data
      const updatedOption = await getOptionById(optionId);
      setOption(updatedOption);
    } catch (error) {
      console.error(`Failed to ${action} option:`, error);
      toast.error(`Failed to ${action} option. Please try again.`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!option) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${option.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setActionLoading('delete');

    try {
      await deleteOption(option._id);
      toast.success('Option deleted successfully');
      router.push('/options');
    } catch (error) {
      console.error('Failed to delete option:', error);
      toast.error('Failed to delete option. Please try again.');
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading option...</span>
        </div>
      </div>
    );
  }

  if (!option && !loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            {error ? 'Failed to Load Option' : 'Option Not Found'}
          </h2>
          <p className="text-muted-foreground mb-4">
            {error || "The option you&apos;re looking for doesn&apos;t exist."}
          </p>
          <Button onClick={handleBack}>
            Back to Options
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {option && (
        <>
          <PageHeader
            showBackButton={true}
            onBack={handleBack}
            icon={Settings}
            title={option.name}
            description="Option details and configuration"
            actions={[
              {
                label: 'Edit',
                onClick: handleEdit,
                variant: 'outline',
                icon: Edit
              },
              {
                label: option.is_active ? 'Deactivate' : 'Activate',
                onClick: handleToggleStatus,
                variant: 'outline',
                icon: option.is_active ? PowerOff : Power,
                disabled: actionLoading === 'activate' || actionLoading === 'deactivate'
              },
              {
                label: 'Delete',
                onClick: handleDelete,
                variant: 'destructive',
                icon: Trash2,
                disabled: actionLoading === 'delete'
              }
            ]}
          />

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
                  <label className="text-sm font-medium text-muted-foreground">Option Name</label>
                  <p className="text-lg font-semibold">{option.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Option Value</label>
                  <p className="text-lg">{option.option_value}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Option Type</label>
                  <p className="text-lg font-medium">{option.option_type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                  <p className="text-lg">{option.full_name}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Slug</label>
                  <p className="text-base font-mono">{option.slug}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="flex items-center mt-1">
                    <Badge variant={option.is_active ? 'default' : 'secondary'}>
                      {option.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Sort Order</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                    <p className="text-lg font-semibold">{option.sort_order}</p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Display order in option lists
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Version</label>
                  <p className="text-base">{option.__v}</p>
                </div>
              </div>

              <Separator />

              <div>
                <label className="text-sm font-medium text-muted-foreground">Usage Information</label>
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    This option can be used in product variants to specify different choices for customers.
                    The sort order determines how this option appears in selection lists.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Option Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current Status</span>
                <Badge variant={option.is_active ? "default" : "secondary"}>
                  {option.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              
              <Separator />
              
              <div className="text-sm text-muted-foreground">
                {option.is_active 
                  ? "This option is active and available for product variants."
                  : "This option is inactive and hidden from product variants."
                }
              </div>
            </CardContent>
          </Card>

          {/* Option Details */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Option ID</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-mono">{option._id.slice(-8)}</span>
                  <Button variant="ghost" size="sm" onClick={handleCopyId}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm">{new Date(option.createdAt).toLocaleDateString()}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last Updated</span>
                <span className="text-sm">{new Date(option.updatedAt).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Sort Order</span>
                <span className="text-sm font-semibold">{option.sort_order}</span>
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
                Edit Option
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={handleToggleStatus}
                disabled={actionLoading === 'activate' || actionLoading === 'deactivate'}
              >
                {actionLoading === 'activate' || actionLoading === 'deactivate' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : option.is_active ? (
                  <>
                    <PowerOff className="h-4 w-4 mr-2" />
                    Deactivate Option
                  </>
                ) : (
                  <>
                    <Power className="h-4 w-4 mr-2" />
                    Activate Option
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
                Delete Option
              </Button>
            </CardContent>
          </Card>

          {/* Help */}
          <Card>
            <CardHeader>
              <CardTitle>Help</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Use Edit to modify option information</p>
              <p>• Deactivate to hide from product variants</p>
              <p>• Delete permanently removes the option</p>
              <p>• Sort order controls display sequence</p>
              <p>• Option type groups related options</p>
            </CardContent>
          </Card>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
