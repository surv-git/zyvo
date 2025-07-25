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
  FileText, 
  User, 
  Calendar,
  Loader2,
  AlertCircle,
  Copy,
  Archive,
  Eye,
  Trash2,
  Tag,
  Clock,
  Globe,
  ExternalLink,
  Image
} from 'lucide-react';
import { toast } from 'sonner';
import { BlogPost } from '@/types/blog';
import { 
  getBlogById, 
  deleteBlogPost, 
  archiveBlogPost, 
  publishBlogPost,
  getStatusBadgeVariant,
  getStatusLabel,
  formatReadTime
} from '@/services/blog-service';

export default function BlogViewPage() {
  const router = useRouter();
  const params = useParams();
  const blogId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load blog data
  useEffect(() => {
    const loadBlog = async () => {
      try {
        const response = await getBlogById(blogId);
        setBlog(response.data);
      } catch (error) {
        console.error('Failed to load blog post:', error);
        toast.error('Failed to load blog post data');
        router.push('/blog');
      } finally {
        setLoading(false);
      }
    };

    if (blogId) {
      loadBlog();
    }
  }, [blogId, router]);

  const handleEdit = () => {
    router.push(`/blog/${blogId}/edit`);
  };

  const handleBack = () => {
    router.push('/blog');
  };

  const handleCopyId = async () => {
    if (blog) {
      try {
        await navigator.clipboard.writeText(blog._id);
        toast.success('Blog post ID copied to clipboard');
      } catch {
        toast.error('Failed to copy to clipboard');
      }
    }
  };

  const handlePublish = async () => {
    if (!blog) return;

    const confirmed = window.confirm(
      `Are you sure you want to publish "${blog.title}"?`
    );

    if (!confirmed) return;

    setActionLoading('publish');

    try {
      await publishBlogPost(blog._id);
      toast.success('Blog post published successfully');
      
      // Reload blog data
      const updatedResponse = await getBlogById(blogId);
      setBlog(updatedResponse.data);
    } catch (error) {
      console.error('Failed to publish blog post:', error);
      toast.error('Failed to publish blog post. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleArchive = async () => {
    if (!blog) return;

    const confirmed = window.confirm(
      `Are you sure you want to archive "${blog.title}"?`
    );

    if (!confirmed) return;

    setActionLoading('archive');

    try {
      await archiveBlogPost(blog._id);
      toast.success('Blog post archived successfully');
      
      // Reload blog data
      const updatedResponse = await getBlogById(blogId);
      setBlog(updatedResponse.data);
    } catch (error) {
      console.error('Failed to archive blog post:', error);
      toast.error('Failed to archive blog post. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!blog) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${blog.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setActionLoading('delete');

    try {
      await deleteBlogPost(blog._id);
      toast.success('Blog post deleted successfully');
      router.push('/blog');
    } catch (error) {
      console.error('Failed to delete blog post:', error);
      toast.error('Failed to delete blog post. Please try again.');
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading blog post...</span>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Blog Post Not Found</h2>
          <p className="text-muted-foreground mb-4">The blog post you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={handleBack}>
            Back to Blog Posts
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
            <h1 className="text-3xl font-bold tracking-tight">{blog.title}</h1>
            <p className="text-muted-foreground mt-1">
              Blog post details and content
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          {blog.status !== 'PUBLISHED' && (
            <Button
              variant="outline"
              onClick={handlePublish}
              disabled={actionLoading === 'publish'}
            >
              {actionLoading === 'publish' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Globe className="h-4 w-4 mr-2" />
              )}
              Publish
            </Button>
          )}
          {blog.status !== 'ARCHIVED' && (
            <Button
              variant="outline"
              onClick={handleArchive}
              disabled={actionLoading === 'archive'}
            >
              {actionLoading === 'archive' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Archive className="h-4 w-4 mr-2" />
              )}
              Archive
            </Button>
          )}
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
                <FileText className="h-5 w-5 mr-2" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Title</label>
                <p className="text-lg font-semibold">{blog.title}</p>
              </div>

              {blog.excerpt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Excerpt</label>
                  <p className="text-base mt-1">{blog.excerpt}</p>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Category</label>
                  <p className="text-base">{blog.category_id.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Author</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-base">{blog.author_id.fullName}</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="flex items-center mt-1">
                    <Badge variant={getStatusBadgeVariant(blog.status)}>
                      {getStatusLabel(blog.status)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Featured</label>
                  <div className="flex items-center mt-1">
                    <Badge variant={blog.is_featured ? 'default' : 'secondary'}>
                      {blog.is_featured ? 'Featured' : 'Regular'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Featured Image */}
          {blog.featured_image_url && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Image className="h-5 w-5 mr-2" />
                  Featured Image
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded-lg overflow-hidden bg-muted">
                    <img
                      src={blog.featured_image_url}
                      alt={blog.title}
                      className="w-full h-64 object-cover"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="flex items-center justify-center h-64"><div class="h-8 w-8 text-muted-foreground" /></div>';
                        }
                      }}
                    />
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={blog.featured_image_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Full Size
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Content */}
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: blog.content }}
              />
            </CardContent>
          </Card>

          {/* Tags */}
          {blog.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Tag className="h-5 w-5 mr-2" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {blog.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
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
              <CardTitle>Post Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current Status</span>
                <Badge variant={getStatusBadgeVariant(blog.status)}>
                  {getStatusLabel(blog.status)}
                </Badge>
              </div>
              
              <Separator />
              
              <div className="text-sm text-muted-foreground">
                {blog.status === 'PUBLISHED' 
                  ? "This post is published and visible to readers."
                  : blog.status === 'DRAFT'
                  ? "This post is a draft and not yet published."
                  : blog.status === 'PENDING_REVIEW'
                  ? "This post is pending review before publication."
                  : "This post is archived and hidden from readers."
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
                <span className="text-sm text-muted-foreground">Views</span>
                <div className="flex items-center space-x-1">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{blog.views_count.toLocaleString()}</span>
                </div>
              </div>

              {blog.read_time_minutes && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Read Time</span>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{formatReadTime(blog.read_time_minutes)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Post Details */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Post ID</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-mono">{blog._id.slice(-8)}</span>
                  <Button variant="ghost" size="sm" onClick={handleCopyId}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm">{formatDate(blog.createdAt)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last Updated</span>
                <span className="text-sm">{formatDate(blog.updatedAt)}</span>
              </div>

              {blog.published_at && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Published</span>
                  <span className="text-sm">{formatDate(blog.published_at.toString())}</span>
                </div>
              )}
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
                Edit Post
              </Button>
              
              {blog.status !== 'PUBLISHED' && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handlePublish}
                  disabled={actionLoading === 'publish'}
                >
                  {actionLoading === 'publish' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Globe className="h-4 w-4 mr-2" />
                  )}
                  Publish Post
                </Button>
              )}

              {blog.status !== 'ARCHIVED' && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleArchive}
                  disabled={actionLoading === 'archive'}
                >
                  {actionLoading === 'archive' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Archive className="h-4 w-4 mr-2" />
                  )}
                  Archive Post
                </Button>
              )}
              
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
                Delete Post
              </Button>
            </CardContent>
          </Card>

          {/* Help */}
          <Card>
            <CardHeader>
              <CardTitle>Help</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Use Edit to modify post content and settings</p>
              <p>• Publish to make the post visible to readers</p>
              <p>• Archive to hide from readers without deleting</p>
              <p>• Featured posts appear prominently on the site</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
