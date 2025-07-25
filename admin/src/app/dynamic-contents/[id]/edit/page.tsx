"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  AlertCircle,
  Edit,
  HelpCircle,
  Info,
  Zap
} from 'lucide-react';
import { getDynamicContentById, updateDynamicContent, DynamicContent, DynamicContentType } from '@/services/dynamic-content-service';
import { toast } from 'sonner';

export default function EditDynamicContentPage() {
  const params = useParams();
  const router = useRouter();
  const contentId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState<DynamicContent | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: DynamicContentType.Advertisement,
    location_key: '',
    content_order: 0,
    is_active: true,
    display_start_date: '',
    display_end_date: '',
    primary_image_url: '',
    mobile_image_url: '',
    alt_text: '',
    caption: '',
    main_text_content: '',
    link_url: '',
    call_to_action_text: '',
    target_audience_tags: [] as string[],
  });

  useEffect(() => {
    const loadContent = async () => {
      try {
        const response = await getDynamicContentById(contentId);
        if (response.success) {
          const data = response.data;
          setContent(data);
          setFormData({
            name: data.name || '',
            type: data.type || DynamicContentType.Advertisement,
            location_key: data.location_key || '',
            content_order: data.content_order || 0,
            is_active: data.is_active ?? true,
            display_start_date: data.display_start_date ? data.display_start_date.slice(0, 16) : '',
            display_end_date: data.display_end_date ? data.display_end_date.slice(0, 16) : '',
            primary_image_url: data.primary_image_url || '',
            mobile_image_url: data.mobile_image_url || '',
            alt_text: data.alt_text || '',
            caption: data.caption || '',
            main_text_content: data.main_text_content || '',
            link_url: data.link_url || '',
            call_to_action_text: data.call_to_action_text || '',
            target_audience_tags: data.target_audience_tags || [],
          });
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

  const handleInputChange = (field: string, value: string | number | boolean | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await updateDynamicContent(contentId, formData);
      if (response.success) {
        toast.success('Dynamic content updated successfully');
        router.push(`/dynamic-contents/${contentId}`);
      } else {
        throw new Error(response.message || 'Failed to update content');
      }
    } catch (error) {
      console.error('Failed to update content:', error);
      toast.error('Failed to update content. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.push(`/dynamic-contents/${contentId}`);
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
          <p className="text-muted-foreground mb-4">The content you&apos;re trying to edit doesn&apos;t exist.</p>
          <Button onClick={() => router.push('/dynamic-contents')}>
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
          <Edit className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Dynamic Content</h1>
            <p className="text-muted-foreground mt-1">
              Update content information and settings
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleBack}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Edit className="h-5 w-5 mr-2" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter content name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Content Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => handleInputChange('type', value as DynamicContentType)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select content type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(DynamicContentType).map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="location_key">Location Key *</Label>
                    <Input
                      id="location_key"
                      value={formData.location_key}
                      onChange={(e) => handleInputChange('location_key', e.target.value)}
                      placeholder="e.g., homepage_banner"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="content_order">Display Order</Label>
                    <Input
                      id="content_order"
                      type="number"
                      value={formData.content_order}
                      onChange={(e) => handleInputChange('content_order', parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="caption">Caption</Label>
                  <Input
                    id="caption"
                    value={formData.caption}
                    onChange={(e) => handleInputChange('caption', e.target.value)}
                    placeholder="Brief caption for the content"
                  />
                </div>

                <div>
                  <Label htmlFor="main_text_content">Main Text Content</Label>
                  <Textarea
                    id="main_text_content"
                    value={formData.main_text_content}
                    onChange={(e) => handleInputChange('main_text_content', e.target.value)}
                    placeholder="Main content text..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Media & Links */}
            <Card>
              <CardHeader>
                <CardTitle>Media & Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="primary_image_url">Primary Image URL</Label>
                  <Input
                    id="primary_image_url"
                    value={formData.primary_image_url}
                    onChange={(e) => handleInputChange('primary_image_url', e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div>
                  <Label htmlFor="mobile_image_url">Mobile Image URL</Label>
                  <Input
                    id="mobile_image_url"
                    value={formData.mobile_image_url}
                    onChange={(e) => handleInputChange('mobile_image_url', e.target.value)}
                    placeholder="https://example.com/mobile-image.jpg"
                  />
                </div>

                <div>
                  <Label htmlFor="alt_text">Alt Text</Label>
                  <Input
                    id="alt_text"
                    value={formData.alt_text}
                    onChange={(e) => handleInputChange('alt_text', e.target.value)}
                    placeholder="Alternative text for accessibility"
                  />
                </div>

                <div>
                  <Label htmlFor="link_url">Link URL</Label>
                  <Input
                    id="link_url"
                    value={formData.link_url}
                    onChange={(e) => handleInputChange('link_url', e.target.value)}
                    placeholder="https://example.com/destination"
                  />
                </div>

                <div>
                  <Label htmlFor="call_to_action_text">Call to Action Text</Label>
                  <Input
                    id="call_to_action_text"
                    value={formData.call_to_action_text}
                    onChange={(e) => handleInputChange('call_to_action_text', e.target.value)}
                    placeholder="Learn More, Shop Now, etc."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Schedule */}
            <Card>
              <CardHeader>
                <CardTitle>Display Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="display_start_date">Start Date</Label>
                    <Input
                      id="display_start_date"
                      type="datetime-local"
                      value={formData.display_start_date}
                      onChange={(e) => handleInputChange('display_start_date', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="display_end_date">End Date</Label>
                    <Input
                      id="display_end_date"
                      type="datetime-local"
                      value={formData.display_end_date}
                      onChange={(e) => handleInputChange('display_end_date', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active" className="text-sm font-medium">
                    Active Status
                  </Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                  />
                </div>
                <Separator />
                <div className="text-sm text-muted-foreground">
                  {formData.is_active 
                    ? "Content is active and visible to users"
                    : "Content is inactive and hidden from users"
                  }
                </div>
              </CardContent>
            </Card>

            {/* Content Metadata */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Info className="h-5 w-5 mr-2" />
                  Metadata
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Content ID</span>
                  <span className="text-sm font-mono">{(content.id || content._id || '').slice(-8)}</span>
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

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Current Status</span>
                  <Badge variant={content.is_active ? "default" : "secondary"}>
                    {content.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>

                {content.created_by && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Created By</span>
                    <span className="text-sm">{content.created_by.name}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Help */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HelpCircle className="h-5 w-5 mr-2" />
                  Help
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Name should be descriptive and unique</p>
                <p>• Location key determines where content appears</p>
                <p>• Display order controls positioning (lower = first)</p>
                <p>• Use display schedule to control visibility timing</p>
                <p>• Mobile image will be used on smaller screens</p>
                <p>• Alt text is important for accessibility</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
