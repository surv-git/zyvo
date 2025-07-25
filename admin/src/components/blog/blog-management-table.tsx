'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TableFooter } from '@/components/ui/table-footer';
import { 
  Loader2, 
  Search, 
  Eye, 
  Edit, 
  Archive, 
  Trash2, 
  MoreHorizontal, 
  FileText, 
  Calendar, 
  User, 
  Tag,
  RefreshCw,
  RotateCcw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  getBlogPosts, 
  deleteBlogPost, 
  archiveBlogPost, 
  publishBlogPost,
  getStatusBadgeVariant,
  getStatusLabel,
  formatReadTime,
  truncateText,
  BlogServiceError,
  BlogTableFilters
} from '@/services/blog-service';
import { BlogPost, BlogStatus } from '@/types/blog';
import { defaultSiteConfig } from '@/config/site';

interface BlogManagementTableProps {
  className?: string;
  initialPage?: number;
  initialLimit?: number;
}

export default function BlogManagementTable({ 
  className,
  initialPage = 1, 
  initialLimit = defaultSiteConfig.admin.itemsPerPage 
}: BlogManagementTableProps) {
  // State
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<BlogTableFilters>({
    search: '',
    status: undefined,
    page: initialPage,
    limit: initialLimit,
    sort: 'updatedAt',
    order: 'desc',
    is_featured: undefined,
  });
  
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 0,
    total_items: 0,
    has_next_page: false,
    has_prev_page: false,
  });

  // Load blogs data
  const loadBlogs = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const response = await getBlogPosts(filters);
      
      if (response.success) {
        setBlogs(response.data);
        setPagination({
          current_page: response.pagination.current_page,
          total_pages: response.pagination.total_pages,
          total_items: response.pagination.total_items,
          has_next_page: response.pagination.has_next_page,
          has_prev_page: response.pagination.has_prev_page,
        });
      } else {
        throw new Error('Failed to fetch blog posts');
      }
    } catch (error) {
      console.error('Error loading blogs:', error);
      if (error instanceof BlogServiceError) {
        toast.error(error.message);
      } else {
        toast.error('Failed to load blog posts. Please try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  useEffect(() => {
    loadBlogs();
  }, [loadBlogs]);

  const handleFilterChange = (key: keyof BlogTableFilters, value: string | number | boolean | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : (typeof value === 'string' ? parseInt(value) : value as number),
    }));
  };

  const handleSearch = (value: string) => {
    handleFilterChange('search', value || undefined);
  };

  const handleRefresh = () => {
    loadBlogs(false);
  };

  const handleResetFilters = () => {
    setFilters({
      search: undefined,
      status: undefined,
      page: 1,
      limit: defaultSiteConfig.admin.itemsPerPage,
      sort: 'updatedAt',
      order: 'desc',
      is_featured: undefined,
    });
  };

  const handleSort = (column: string) => {
    setFilters(prev => ({
      ...prev,
      sort: column,
      order: prev.sort === column && prev.order === 'asc' ? 'desc' : 'asc',
      page: 1,
    }));
  };

  const getSortIcon = (column: string) => {
    if (filters.sort !== column) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    }
    return filters.order === 'asc' 
      ? <ArrowUp className="h-4 w-4 text-foreground" />
      : <ArrowDown className="h-4 w-4 text-foreground" />;
  };

  const SortableHeader = ({ column, children }: { column: string; children: React.ReactNode }) => (
    <TableHead>
      <Button
        variant="ghost"
        onClick={() => handleSort(column)}
        className="h-auto p-0 font-medium hover:bg-transparent"
      >
        <div className="flex items-center gap-2">
          {children}
          {getSortIcon(column)}
        </div>
      </Button>
    </TableHead>
  );

  // Delete blog
  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setActionLoading(id);
      await deleteBlogPost(id);
      
      toast.success('Blog post deleted successfully.');
      
      await loadBlogs(false);
    } catch (error) {
      console.error('Error deleting blog:', error);
      if (error instanceof BlogServiceError) {
        toast.error(error.message);
      } else {
        toast.error('Failed to delete blog post. Please try again.');
      }
    } finally {
      setActionLoading(null);
    }
  };

  // Archive blog
  const handleArchive = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to archive "${title}"?`)) {
      return;
    }

    try {
      setActionLoading(id);
      await archiveBlogPost(id);
      
      toast.success('Blog post archived successfully.');
      
      await loadBlogs(false);
    } catch (error) {
      console.error('Error archiving blog:', error);
      if (error instanceof BlogServiceError) {
        toast.error(error.message);
      } else {
        toast.error('Failed to archive blog post. Please try again.');
      }
    } finally {
      setActionLoading(null);
    }
  };

  // Publish blog
  const handlePublish = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to publish "${title}"?`)) {
      return;
    }

    try {
      setActionLoading(id);
      await publishBlogPost(id);
      
      toast.success('Blog post published successfully.');
      
      await loadBlogs(false);
    } catch (error) {
      console.error('Error publishing blog:', error);
      if (error instanceof BlogServiceError) {
        toast.error(error.message);
      } else {
        toast.error('Failed to publish blog post. Please try again.');
      }
    } finally {
      setActionLoading(null);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Blog Management</CardTitle>
        <CardDescription>
          Manage your blog posts, articles, and content publications
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search blog posts..."
                value={filters.search || ''}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value as BlogStatus)}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value={BlogStatus.Published}>Published</SelectItem>
                <SelectItem value={BlogStatus.Draft}>Draft</SelectItem>
                <SelectItem value={BlogStatus.PendingReview}>Pending Review</SelectItem>
                <SelectItem value={BlogStatus.Archived}>Archived</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={filters.is_featured === undefined ? 'all' : filters.is_featured.toString()} 
              onValueChange={(value) => handleFilterChange('is_featured', value === 'all' ? undefined : value === 'true')}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Featured" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Posts</SelectItem>
                <SelectItem value="true">Featured</SelectItem>
                <SelectItem value="false">Regular</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHeader column="title">Title</SortableHeader>
                  <TableHead>Author</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <SortableHeader column="views_count">Views</SortableHeader>
                  <SortableHeader column="updatedAt">Updated</SortableHeader>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No blog posts found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  blogs.map((blog) => (
                    <TableRow key={blog._id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {truncateText(blog.title, 50)}
                          </div>
                          {blog.excerpt && (
                            <div className="text-sm text-muted-foreground">
                              {truncateText(blog.excerpt, 80)}
                            </div>
                          )}
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            {blog.read_time_minutes && (
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>{formatReadTime(blog.read_time_minutes)}</span>
                              </div>
                            )}
                            {blog.tags.length > 0 && (
                              <div className="flex items-center space-x-1">
                                <Tag className="h-3 w-3" />
                                <span>{blog.tags.slice(0, 2).join(', ')}{blog.tags.length > 2 ? '...' : ''}</span>
                              </div>
                            )}
                            {blog.is_featured && (
                              <Badge variant="secondary" className="text-xs">
                                Featured
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{blog.author_id.fullName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{blog.category_id.name}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(blog.status)}>
                          {getStatusLabel(blog.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{blog.views_count.toLocaleString()}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{formatDate(blog.updatedAt)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              className="h-8 w-8 p-0"
                              disabled={actionLoading === blog._id}
                            >
                              {actionLoading === blog._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link href={`/blog/${blog._id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/blog/${blog._id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {blog.status !== BlogStatus.Published && (
                              <DropdownMenuItem 
                                onClick={() => handlePublish(blog._id, blog.title)}
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                Publish
                              </DropdownMenuItem>
                            )}
                            {blog.status !== BlogStatus.Archived && (
                              <DropdownMenuItem 
                                onClick={() => handleArchive(blog._id, blog.title)}
                              >
                                <Archive className="mr-2 h-4 w-4" />
                                Archive
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(blog._id, blog.title)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.total_items > 0 && (
            <TableFooter
              currentPage={pagination.current_page}
              totalPages={pagination.total_pages}
              totalItems={pagination.total_items}
              itemsPerPage={filters.limit || defaultSiteConfig.admin.itemsPerPage}
              onPageChange={(page) => handleFilterChange('page', page)}
              onItemsPerPageChange={(limit) => handleFilterChange('limit', limit)}
              itemsPerPageOptions={defaultSiteConfig.admin.itemsPerPageOptions}
              showItemsPerPageSelector={true}
              entityName="blog posts"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
