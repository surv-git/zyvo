"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Save, 
  FileText, 
  Loader2,
  X,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { BlogStatus } from '@/types/blog';
import { 
  createBlogPost,
  BlogServiceError
} from '@/services/blog-service';

interface BlogFormData {
  title: string;
  excerpt: string;
  content: string;
  featured_image_url: string;
  featured_image_alt_text: string;
  category_id: string;
  tags: string[];
  status: BlogStatus;
  is_featured: boolean;
  comments_enabled: boolean;
  seo_title: string;
  meta_description: string;
}

export default function BlogNewPage() {
  const router = useRouter();
  
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [formData, setFormData] = useState<BlogFormData>({
    title: '',
    excerpt: '',
    content: '',
    featured_image_url: '',
    featured_image_alt_text: '',
    category_id: '',
    tags: [],
    status: BlogStatus.Draft,
    is_featured: false,
    comments_enabled: true,
    seo_title: '',
    meta_description: '',
  });

  const handleBack = () => {
    router.push('/blog');
  };

  const handleInputChange = (field: keyof BlogFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    
    if (!formData.content.trim()) {
      toast.error('Content is required');
      return;
    }
    
    if (!formData.category_id) {
      toast.error('Category is required');
      return;
    }

    try {
      setSaving(true);
      
      const createData = {
        ...formData,
        featured_image_url: formData.featured_image_url || undefined,
        featured_image_alt_text: formData.featured_image_alt_text || undefined,
        seo_title: formData.seo_title || undefined,
        meta_description: formData.meta_description || undefined,
        excerpt: formData.excerpt || undefined,
      };

      const response = await createBlogPost(createData);
      
      toast.success('Blog post created successfully');
      router.push(`/blog/${response.data.id}`);
    } catch (error) {
      console.error('Failed to create blog post:', error);
      if (error instanceof BlogServiceError) {
        toast.error(error.message);
      } else {
        toast.error('Failed to create blog post. Please try again.');
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
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create New Blog Post</h1>
            <p className="text-muted-foreground mt-1">
              Write and publish a new blog post
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
                Create Post
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
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Enter the main content and details for your new blog post
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter blog post title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  placeholder="Brief description or summary (optional)"
                  rows={3}
                  value={formData.excerpt}
                  onChange={(e) => handleInputChange('excerpt', e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  A short summary that appears in post previews
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Write your blog post content here..."
                  rows={20}
                  className="font-mono"
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Main content of your blog post (HTML supported)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Featured Image */}
          <Card>
            <CardHeader>
              <CardTitle>Featured Image</CardTitle>
              <CardDescription>
                Set a featured image for your blog post
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="featured_image_url">Image URL</Label>
                <Input
                  id="featured_image_url"
                  placeholder="https://example.com/image.jpg"
                  type="url"
                  value={formData.featured_image_url}
                  onChange={(e) => handleInputChange('featured_image_url', e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  URL of the featured image for this post
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="featured_image_alt_text">Alt Text</Label>
                <Input
                  id="featured_image_alt_text"
                  placeholder="Describe the image for accessibility"
                  value={formData.featured_image_alt_text}
                  onChange={(e) => handleInputChange('featured_image_alt_text', e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Alternative text for screen readers and SEO
                </p>
              </div>
            </CardContent>
          </Card>

          {/* SEO Settings */}
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
              <CardDescription>
                Optimize your post for search engines
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seo_title">SEO Title</Label>
                <Input
                  id="seo_title"
                  placeholder="Custom title for search results (optional)"
                  value={formData.seo_title}
                  onChange={(e) => handleInputChange('seo_title', e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  If empty, the post title will be used
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta_description">Meta Description</Label>
                <Textarea
                  id="meta_description"
                  placeholder="Description for search results (optional)"
                  rows={3}
                  value={formData.meta_description}
                  onChange={(e) => handleInputChange('meta_description', e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Brief description shown in search results
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publication Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Publication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => handleInputChange('status', value as BlogStatus)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={BlogStatus.Draft}>Draft</SelectItem>
                    <SelectItem value={BlogStatus.PendingReview}>Pending Review</SelectItem>
                    <SelectItem value={BlogStatus.Published}>Published</SelectItem>
                    <SelectItem value={BlogStatus.Archived}>Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category_id">Category</Label>
                <Select 
                  value={formData.category_id} 
                  onValueChange={(value) => handleInputChange('category_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tech">Technology</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="lifestyle">Lifestyle</SelectItem>
                    <SelectItem value="news">News</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Choose the main category for this post
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Post Options */}
          <Card>
            <CardHeader>
              <CardTitle>Post Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label>Featured Post</Label>
                  <p className="text-sm text-muted-foreground">
                    Feature this post prominently on the site
                  </p>
                </div>
                <Switch
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => handleInputChange('is_featured', checked)}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label>Enable Comments</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow readers to comment on this post
                  </p>
                </div>
                <Switch
                  checked={formData.comments_enabled}
                  onCheckedChange={(checked) => handleInputChange('comments_enabled', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
              <CardDescription>
                Add tags to help categorize your post
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="Add a tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={handleAddTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="px-2 py-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
