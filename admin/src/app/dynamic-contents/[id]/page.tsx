"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Copy, 
  Power, 
  PowerOff, 
  Loader2, 
  AlertCircle,
  FileText,
  Megaphone
} from 'lucide-react';
import { getDynamicContentById, deleteDynamicContent, DynamicContent } from '@/services/dynamic-content-service';
import { toast } from 'sonner';

export default function DynamicContentViewPage() {
  const params = useParams();
  const router = useRouter();
  const contentId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<DynamicContent | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const response = await getDynamicContentById(contentId);
        if (response.success) {
          setContent(response.data);
        } else {
          throw new Error('Failed to load content');
        }
      } catch (error) {
        console.error('Failed to load content:', error);
        toast.error('Failed to load content data');
        router.push('/dynamic-contents');
      } finally {
        setLoading(false);
      }
    };

    if (contentId) {
      loadContent();
    }
  }, [contentId, router]);

  const handleEdit = () => {
    router.push(`/dynamic-contents/${contentId}/edit`);
  };

  const handleBack = () => {
    router.push('/dynamic-contents');
  };

  const handleCopyId = async () => {
    if (content) {
      try {
        await navigator.clipboard.writeText(content.id || content._id || '');
        toast.success('Content ID copied to clipboard');
      } catch {
        toast.error('Failed to copy to clipboard');
      }
    }
  };

  const handleToggleStatus = async () => {
    if (!content) return;

    const action = content.is_active ? 'deactivate' : 'activate';
    setActionLoading(action);

    try {
      // Note: You'll need to implement these functions in your service
      // if (content.is_active) {
      //   await deactivateDynamicContent(content.id);
      //   toast.success('Content deactivated successfully');
      // } else {
      //   await activateDynamicContent(content.id);
      //   toast.success('Content activated successfully');
      // }

      // Reload content data
      const response = await getDynamicContentById(contentId);
      if (response.success) {
        setContent(response.data);
      }
    } catch (error) {
      console.error(`Failed to ${action} content:`, error);
      toast.error(`Failed to ${action} content. Please try again.`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!content) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${content.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setActionLoading('delete');

    try {
      await deleteDynamicContent(contentId);
      toast.success('Content deleted successfully');
      router.push('/dynamic-contents');
    } catch (error) {
      console.error('Failed to delete content:', error);
      toast.error('Failed to delete content. Please try again.');
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading content...</span>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Content Not Found</h2>
          <p className="text-muted-foreground mb-4">The content you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={handleBack}>
            Back to Dynamic Contents
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
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{content.name}</h1>
            <p className="text-muted-foreground mt-1">
              Dynamic content details and information
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
            ) : content.is_active ? (
              <PowerOff className="h-4 w-4 mr-2" />
            ) : (
              <Power className="h-4 w-4 mr-2" />
            )}
            {content.is_active ? 'Deactivate' : 'Activate'}
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
                <Megaphone className="h-5 w-5 mr-2" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-lg font-semibold">{content.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Content Type</label>
                  <p className="text-lg capitalize">{content.type?.replace('_', ' ') || 'Not specified'}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Location Key</label>
                  <p className="text-base font-mono bg-muted px-2 py-1 rounded text-sm">{content.location_key}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Display Order</label>
                  <p className="text-base font-mono">{content.content_order}</p>
                </div>
              </div>

              {content.caption && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Caption</label>
                  <p className="text-base mt-1">{content.caption}</p>
                </div>
              )}

              {content.main_text_content && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Main Content</label>
                  <div className="text-base mt-1 bg-muted p-3 rounded border-l-4 border-primary">
                    {content.main_text_content}
                  </div>
                </div>
              )}

              {content.alt_text && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Alt Text</label>
                  <p className="text-base mt-1 text-muted-foreground">{content.alt_text}</p>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="flex items-center mt-1 space-x-2">
                    <Badge variant={content.is_active ? 'default' : 'secondary'}>
                      {content.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    {content.is_currently_active !== undefined && (
                      <Badge variant={content.is_currently_active ? 'default' : 'outline'} className="text-xs">
                        {content.is_currently_active ? 'Currently Live' : 'Not Live'}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Assets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Content Assets
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {content.primary_image_url ? (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Primary Image</label>
                  <div className="mt-2 flex items-center space-x-4">
                    <div className="w-16 h-16 border rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                      <img
                        src={content.primary_image_url}
                        alt={`${content.name} image`}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground break-all">{content.primary_image_url}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2" />
                  <p>No image provided</p>
                </div>
              )}

              {content.mobile_image_url && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Mobile Image</label>
                  <p className="text-base text-muted-foreground mt-1 break-all">{content.mobile_image_url}</p>
                </div>
              )}

              {content.link_url && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Link URL</label>
                  <p className="text-base text-muted-foreground mt-1 break-all">{content.link_url}</p>
                </div>
              )}

              {content.call_to_action_text && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Call to Action</label>
                  <p className="text-base text-muted-foreground mt-1">{content.call_to_action_text}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Target Audience Tags */}
          {content.target_audience_tags && content.target_audience_tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Target Audience
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {content.target_audience_tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Display Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Display Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                  <p className="text-base mt-1">
                    {content.display_start_date 
                      ? new Date(content.display_start_date).toLocaleString()
                      : <span className="text-muted-foreground">No start date set</span>
                    }
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">End Date</label>
                  <p className="text-base mt-1">
                    {content.display_end_date 
                      ? new Date(content.display_end_date).toLocaleString()
                      : <span className="text-muted-foreground">No end date set</span>
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                <div className={`w-2 h-2 rounded-full ${content.is_currently_active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="text-sm font-medium">
                  {content.is_currently_active ? 'Currently Active' : 'Not Currently Active'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Creator Information */}
          {content.created_by && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Creator Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created By</label>
                    <div className="mt-1">
                      <p className="font-medium">{content.created_by.fullName || content.created_by.name}</p>
                      <p className="text-sm text-muted-foreground">{content.created_by.email}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Updated By</label>
                    <div className="mt-1">
                      {content.updated_by ? (
                        <>
                          <p className="font-medium">{content.updated_by.fullName || content.updated_by.name}</p>
                          <p className="text-sm text-muted-foreground">{content.updated_by.email}</p>
                        </>
                      ) : (
                        <span className="text-muted-foreground">No updates yet</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created At</label>
                    <p className="text-sm mt-1">
                      {new Date(content.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                    <p className="text-sm mt-1">
                      {new Date(content.updatedAt).toLocaleString()}
                    </p>
                  </div>
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
              <CardTitle>Content Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Status</span>
                <Badge variant={content.is_active ? "default" : "secondary"}>
                  {content.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Currently Live</span>
                <Badge variant={content.is_currently_active ? "default" : "outline"}>
                  {content.is_currently_active ? "Live" : "Not Live"}
                </Badge>
              </div>
              
              <Separator />
              
              <div className="text-sm text-muted-foreground">
                {content.is_currently_active 
                  ? "This content is currently active and visible to users."
                  : content.is_active 
                    ? "This content is set to active but may not be live due to schedule or other conditions."
                    : "This content is inactive and hidden from users."
                }
              </div>
            </CardContent>
          </Card>

          {/* Content Details */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Content ID</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-mono">{(content.id || content._id || '').slice(-8)}</span>
                  <Button variant="ghost" size="sm" onClick={handleCopyId}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Type</span>
                <Badge variant="outline">{content.type}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Location</span>
                <span className="text-sm font-mono bg-muted px-2 py-1 rounded">{content.location_key}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Order</span>
                <span className="text-sm font-mono">{content.content_order}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Version</span>
                <span className="text-sm font-mono">v{content.__v || 0}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm">
                  {content.createdAt ? new Date(content.createdAt).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last Updated</span>
                <span className="text-sm">
                  {content.updatedAt ? new Date(content.updatedAt).toLocaleDateString() : 'Never'}
                </span>
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
                Edit Content
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={handleToggleStatus}
                disabled={actionLoading === 'activate' || actionLoading === 'deactivate'}
              >
                {actionLoading === 'activate' || actionLoading === 'deactivate' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : content.is_active ? (
                  <>
                    <PowerOff className="h-4 w-4 mr-2" />
                    Deactivate Content
                  </>
                ) : (
                  <>
                    <Power className="h-4 w-4 mr-2" />
                    Activate Content
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
                Delete Content
              </Button>
            </CardContent>
          </Card>

          {/* Help */}
          <Card>
            <CardHeader>
              <CardTitle>Help</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• <strong>Active Status:</strong> Controls if content can be displayed</p>
              <p>• <strong>Currently Live:</strong> Whether content is actually showing to users</p>
              <p>• <strong>Location Key:</strong> Determines where content appears (e.g., TOP_MARQUEE)</p>
              <p>• <strong>Display Order:</strong> Lower numbers appear first</p>
              <p>• <strong>Display Schedule:</strong> Optional time restrictions for visibility</p>
              <p>• <strong>Content Types:</strong></p>
              <div className="ml-4 space-y-1">
                <p>- MARQUEE: Scrolling text banners</p>
                <p>- ADVERTISEMENT: Promotional content</p>
                <p>- CAROUSEL: Image sliders</p>
                <p>- OFFER: Special deals and promotions</p>
                <p>- PROMO: Marketing announcements</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
