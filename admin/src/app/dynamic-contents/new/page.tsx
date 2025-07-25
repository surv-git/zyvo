"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Save, 
  Loader2,
  Plus,
  HelpCircle,
  Info,
  Zap,
  Lightbulb
} from 'lucide-react';
import { createDynamicContent, DynamicContentType } from '@/services/dynamic-content-service';
import { toast } from 'sonner';

export default function NewDynamicContentPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
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

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await createDynamicContent(formData);
      if (response.success) {
        toast.success('Dynamic content created successfully');
        router.push('/dynamic-contents');
      } else {
        throw new Error(response.error || 'Failed to create content');
      }
    } catch (error) {
      console.error('Failed to create content:', error);
      toast.error('Failed to create content. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.push('/dynamic-contents');
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Plus className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Dynamic Content</h1>
            <p className="text-muted-foreground mt-1">
              Add new dynamic content to your application
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
            {saving ? 'Creating...' : 'Create Content'}
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
                  <Plus className="h-5 w-5 mr-2" />
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
            {/* Quick Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  Quick Settings
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
                    ? "Content will be active and visible to users"
                    : "Content will be inactive and hidden from users"
                  }
                </div>
              </CardContent>
            </Card>

            {/* Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Info className="h-5 w-5 mr-2" />
                  Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <p>Choose a descriptive name that clearly identifies the content purpose</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <p>Location key determines where the content will appear in your application</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <p>Lower display order numbers appear first in lists</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <p>Alt text is crucial for accessibility and screen readers</p>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lightbulb className="h-5 w-5 mr-2" />
                  Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Use mobile images for better responsive design</p>
                <p>• Test different content types to see what works best</p>
                <p>• Set display schedules for time-sensitive content</p>
                <p>• Include clear call-to-action text when applicable</p>
                <p>• Keep captions concise but descriptive</p>
              </CardContent>
            </Card>

            {/* Help */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HelpCircle className="h-5 w-5 mr-2" />
                  Need Help?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Having trouble creating dynamic content? Check out our documentation or contact support.
                </p>
                <div className="flex flex-col space-y-2">
                  <Button variant="outline" size="sm" className="justify-start">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    View Documentation
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Contact Support
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}