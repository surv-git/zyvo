"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { 
  Edit, 
  Globe, 
  Calendar,
  Loader2,
  AlertCircle,
  Copy,
  Power,
  PowerOff,
  Trash2,
  ExternalLink,
  ImageIcon,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { Platform } from '@/types/platform';
import { getPlatformById, activatePlatform, deactivatePlatform, deletePlatform } from '@/services/platform-service';
import { PageHeader } from '@/components/ui/page-header';

export default function PlatformViewPage() {
  const router = useRouter();
  const params = useParams();
  const platformId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load platform data
  useEffect(() => {
    const loadPlatform = async () => {
      try {
        const platformData = await getPlatformById(platformId);
        setPlatform(platformData);
      } catch (error) {
        console.error('Failed to load platform:', error);
        toast.error('Failed to load platform data');
        router.push('/platforms');
      } finally {
        setLoading(false);
      }
    };

    if (platformId) {
      loadPlatform();
    }
  }, [platformId, router]);

  // Handle platform actions
  const handleActivate = async () => {
    if (!platform) return;
    
    setActionLoading('activate');
    try {
      await activatePlatform(platform._id);
      setPlatform(prev => prev ? { ...prev, is_active: true } : null);
      toast.success('Platform activated successfully');
    } catch (error) {
      console.error('Failed to activate platform:', error);
      toast.error('Failed to activate platform');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivate = async () => {
    if (!platform) return;
    
    if (!confirm(`Are you sure you want to deactivate "${platform.name}"?`)) {
      return;
    }

    setActionLoading('deactivate');
    try {
      await deactivatePlatform(platform._id);
      setPlatform(prev => prev ? { ...prev, is_active: false } : null);
      toast.success('Platform deactivated successfully');
    } catch (error) {
      console.error('Failed to deactivate platform:', error);
      toast.error('Failed to deactivate platform');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!platform) return;
    
    if (!confirm(`Are you sure you want to delete "${platform.name}"? This action cannot be undone.`)) {
      return;
    }

    setActionLoading('delete');
    try {
      await deletePlatform(platform._id);
      toast.success('Platform deleted successfully');
      router.push('/platforms');
    } catch (error) {
      console.error('Failed to delete platform:', error);
      toast.error('Failed to delete platform');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEdit = () => {
    router.push(`/platforms/${platformId}/edit`);
  };

  const handleBack = () => {
    router.push('/platforms');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading platform...</span>
        </div>
      </div>
    );
  }

  if (!platform) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
          <div>
            <h2 className="text-xl font-semibold">Platform Not Found</h2>
            <p className="text-muted-foreground">The platform you&apos;re looking for doesn&apos;t exist.</p>
          </div>
          <Button onClick={handleBack}>
            Back to Platforms
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        icon={Settings}
        title={platform.name}
        description="Platform Details"
        showBackButton={true}
        onBack={handleBack}
        actions={[
          {
            label: "Edit",
            onClick: handleEdit,
            icon: Edit,
            variant: "outline"
          },
          ...(platform.is_active ? [{
            label: "Deactivate",
            onClick: handleDeactivate,
            icon: PowerOff,
            variant: "outline" as const,
            disabled: actionLoading === 'deactivate'
          }] : [{
            label: "Activate",
            onClick: handleActivate,
            icon: Power,
            variant: "default" as const,
            disabled: actionLoading === 'activate'
          }]),
          {
            label: "Delete",
            onClick: handleDelete,
            icon: Trash2,
            variant: "destructive",
            disabled: actionLoading === 'delete'
          }
        ]}
      />

      {/* Platform Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Information</CardTitle>
              <CardDescription>Basic details about this platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="font-medium">{platform.name}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(platform.name)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Slug</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="font-mono text-sm">{platform.slug}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(platform.slug)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                <p className="mt-1 text-sm">{platform.description}</p>
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Base URL</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={platform.base_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {platform.base_url}
                  </a>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(platform.base_url)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                  >
                    <a href={platform.base_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </div>
              </div>

              {platform.logo_url && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Logo URL</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={platform.logo_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline truncate"
                    >
                      {platform.logo_url}
                    </a>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(platform.logo_url)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* API Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>API Configuration</span>
              </CardTitle>
              <CardDescription>API credentials and configuration details</CardDescription>
            </CardHeader>
            <CardContent>
              {platform.api_credentials_placeholder ? (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-mono">{platform.api_credentials_placeholder}</p>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="h-8 w-8 mx-auto mb-2" />
                  <p>No API configuration set</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Platform Status</span>
                <Badge variant={platform.is_active ? "default" : "secondary"}>
                  {platform.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Metadata Card */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Platform ID</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <p className="font-mono text-sm">{platform._id}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(platform._id)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">{new Date(platform.createdAt).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">{new Date(platform.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
