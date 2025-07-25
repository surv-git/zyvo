"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Star, 
  Eye, 
  Check, 
  X, 
  MoreHorizontal, 
  Search, 
  Filter, 
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MessageSquare,
  User,
  Package,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  Flag,
  AlertCircle,
  Loader2,
  ShieldCheck
} from 'lucide-react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { TableFooter } from '@/components/ui/table-footer'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

import { Review, ReviewTableFilters, ReviewStatus } from '@/types/review'
import { getAdminReviewList, approveReview, rejectReview, updateReviewStatus } from '@/services/review-service'
import { defaultSiteConfig } from '@/config/site'

interface ReviewManagementTableProps {
  className?: string
  status?: ReviewStatus | 'all'
}

export function ReviewManagementTable({ className, status = 'all' }: ReviewManagementTableProps) {
  const router = useRouter()
  const { toast } = useToast()

  // State management
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalReviews, setTotalReviews] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Filter state
  const [filters, setFilters] = useState<ReviewTableFilters>({
    search: '',
    status: status,
    product_id: '',
    page: 1,
    limit: defaultSiteConfig.admin.itemsPerPage,
    sort: 'createdAt',
    order: 'desc'
  })

  // Action dialogs state
  const [approveDialog, setApproveDialog] = useState<{ open: boolean; review: Review | null }>({
    open: false,
    review: null
  })
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; review: Review | null; reason: string }>({
    open: false,
    review: null,
    reason: ''
  })
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Fetch reviews data
  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await getAdminReviewList(filters)
      
      setReviews(response.data)
      setTotalReviews(response.pagination.total_items)
      setTotalPages(response.pagination.total_pages)
    } catch (err: any) {
      console.error('Failed to fetch reviews:', err)
      setError(err.message || 'Failed to load reviews')
      
      if (err?.status === 401) {
        toast({
          title: "Authentication Error",
          description: "Please log in to access review management.",
          variant: "destructive",
        })
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      }
    } finally {
      setLoading(false)
    }
  }, [filters, router, toast])

  // Initial load and filter changes
  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  // Handle filter changes
  const handleFilterChange = useCallback((key: keyof ReviewTableFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      // Reset to page 1 when filters change (except pagination)
      ...(key !== 'page' && key !== 'limit' ? { page: 1 } : {})
    }))
  }, [])

  // Handle sorting
  const handleSort = useCallback((column: ReviewTableFilters['sort']) => {
    setFilters(prev => ({
      ...prev,
      sort: column,
      order: prev.sort === column && prev.order === 'asc' ? 'desc' : 'asc',
      page: 1
    }))
  }, [])

  // Handle approve review
  const handleApprove = async (review: Review) => {
    try {
      setActionLoading(review.id)
      
      await approveReview(review.id)
      
      toast({
        title: "Review Approved",
        description: `Review by ${review.reviewer_display_name} has been approved.`,
      })
      
      // Refresh the data
      await fetchReviews()
    } catch (err: any) {
      console.error('Failed to approve review:', err)
      toast({
        title: "Error",
        description: err.message || "Failed to approve review",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
      setApproveDialog({ open: false, review: null })
    }
  }

  // Handle reject review
  const handleReject = async (review: Review, reason: string) => {
    try {
      setActionLoading(review.id)
      
      await rejectReview(review.id, reason)
      
      toast({
        title: "Review Rejected",
        description: `Review by ${review.reviewer_display_name} has been rejected.`,
      })
      
      // Refresh the data
      await fetchReviews()
    } catch (err: any) {
      console.error('Failed to reject review:', err)
      toast({
        title: "Error",
        description: err.message || "Failed to reject review",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
      setRejectDialog({ open: false, review: null, reason: '' })
    }
  }

  // Handle flag review
  const handleFlag = async (review: Review) => {
    try {
      setActionLoading(review.id)
      
      await updateReviewStatus(review.id, ReviewStatus.FLAGGED)
      
      toast({
        title: "Review Flagged",
        description: `Review by ${review.reviewer_display_name} has been flagged for review.`,
      })
      
      // Refresh the data
      await fetchReviews()
    } catch (err: any) {
      console.error('Failed to flag review:', err)
      toast({
        title: "Error",
        description: err.message || "Failed to flag review",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case ReviewStatus.APPROVED:
        return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>
      case ReviewStatus.PENDING_APPROVAL:
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending Approval</Badge>
      case ReviewStatus.REJECTED:
        return <Badge variant="destructive">Rejected</Badge>
      case ReviewStatus.FLAGGED:
        return <Badge variant="outline" className="bg-orange-100 text-orange-800 hover:bg-orange-100">Flagged</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Get rating stars
  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ))
  }

  // Get sort icon
  const getSortIcon = (column: ReviewTableFilters['sort']) => {
    if (filters.sort !== column) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />
    }
    return filters.order === 'asc' ? 
      <ArrowUp className="ml-2 h-4 w-4" /> : 
      <ArrowDown className="ml-2 h-4 w-4" />
  }

  // Render loading skeleton
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {Array.from({ length: 6 }).map((_, i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-4 w-20" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  // Render error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">Error Loading Reviews</h3>
          <p className="text-gray-600 mt-2">{error}</p>
        </div>
        <Button onClick={fetchReviews} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <>
      <Card className={className}>
      <CardHeader>
        <CardTitle>Review Management</CardTitle>
        <CardDescription>
          Manage and moderate product reviews from customers
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search reviews, products, or reviewers..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select
            value={filters.status}
            onValueChange={(value) => handleFilterChange('status', value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="FLAGGED">Flagged</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.sort}
            onValueChange={(value) => handleFilterChange('sort', value)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Date</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
              <SelectItem value="helpful_votes">Helpful Votes</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.order}
            onValueChange={(value) => handleFilterChange('order', value)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Descending</SelectItem>
              <SelectItem value="asc">Ascending</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchReviews}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              {error.includes('Authentication required') || error.includes('log in') ? (
                <Button onClick={() => router.push('/login')} className="mt-2">
                  Go to Login
                </Button>
              ) : (
                <Button onClick={fetchReviews} className="mt-2">
                  Try Again
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="text-muted-foreground mt-2">Loading reviews...</p>
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <div className="table-container">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('rating')}
              >
                <div className="flex items-center">
                  Rating
                  {getSortIcon('rating')}
                </div>
              </TableHead>
              <TableHead>Review</TableHead>
              <TableHead>Reviewer</TableHead>
              <TableHead>Product</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center">
                  Status
                  {getSortIcon('status')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('helpful_votes')}
              >
                <div className="flex items-center">
                  Votes
                  {getSortIcon('helpful_votes')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('createdAt')}
              >
                <div className="flex items-center">
                  Date
                  {getSortIcon('createdAt')}
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews && reviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex flex-col items-center space-y-2">
                    <MessageSquare className="h-8 w-8 text-gray-400" />
                    <p className="text-gray-500">No reviews found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              reviews?.map((review) => (
                <TableRow key={review.id}>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      {getRatingStars(review.rating)}
                      <span className="ml-2 text-xs font-medium">{review.rating}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="space-y-1">
                      <p className="font-medium text-sm truncate">{review.title}</p>
                      <div className="text-xs text-muted-foreground">
                        {review.review_text && review.review_text.length > 100 ? (
                          <div className="flex items-start gap-1">
                            <span className="line-clamp-2">
                              {review.review_text.slice(0, 75)}...
                            </span>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-auto p-0 text-xs text-muted-foreground hover:text-muted-foreground hover:bg-transparent font-bold"
                                >
                                  more
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80 max-h-60 overflow-y-auto">
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-sm">{review.title}</h4>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {review.review_text}
                                  </p>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        ) : (
                          <p className="line-clamp-2">{review.review_text}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{review.reviewer_display_name}</p>
                        {review.is_verified_buyer && (
                          <div title="Verified Buyer">
                            <ShieldCheck className="h-4 w-4 text-green-600" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{review.reviewer_location}</p>
                      {/* <p className="text-xs text-muted-foreground">{review.user_id.email}</p> */}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{review.product_variant_id.sku_code}</p>
                      <p className="text-xs text-muted-foreground">
                        ${review.product_variant_id.effective_price}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(review.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2 text-sm">
                      <div className="flex items-center space-x-1">
                        <ThumbsUp className="h-3 w-3 text-green-600" />
                        <span>{review.helpful_votes}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <ThumbsDown className="h-3 w-3 text-red-600" />
                        <span>{review.unhelpful_votes}</span>
                      </div>
                      {review.reported_count > 0 && (
                        <div className="flex items-center space-x-1">
                          <Flag className="h-3 w-3 text-orange-600" />
                          <span>{review.reported_count}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          disabled={actionLoading === review.id}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => router.push(`/reviews/${review.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {review.status !== ReviewStatus.APPROVED && (
                          <DropdownMenuItem
                            onClick={() => setApproveDialog({ open: true, review })}
                            className="text-green-600"
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Approve
                          </DropdownMenuItem>
                        )}
                        {review.status !== ReviewStatus.REJECTED && (
                          <DropdownMenuItem
                            onClick={() => setRejectDialog({ open: true, review, reason: '' })}
                            className="text-red-600"
                          >
                            <X className="mr-2 h-4 w-4" />
                            Reject
                          </DropdownMenuItem>
                        )}
                        {review.status !== ReviewStatus.FLAGGED && (
                          <DropdownMenuItem
                            onClick={() => handleFlag(review)}
                            className="text-orange-600"
                          >
                            <Flag className="mr-2 h-4 w-4" />
                            Flag
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          </Table>
          </div>
        )}
        {/* Pagination */}
      <TableFooter
        currentPage={filters.page}
        totalPages={totalPages}
        totalItems={totalReviews}
        itemsPerPage={filters.limit}
        onPageChange={(page) => handleFilterChange('page', page)}
        entityName="reviews"
      />

        </CardContent>
      </Card>

      
      {/* Approve Dialog */}
      {approveDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold mb-2">Approve Review</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to approve this review by {approveDialog.review?.reviewer_display_name}?
              This action will make the review visible to all users.
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setApproveDialog({ open: false, review: null })}
              >
                Cancel
              </Button>
              <Button
                onClick={() => approveDialog.review && handleApprove(approveDialog.review)}
                disabled={actionLoading !== null}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {actionLoading === approveDialog.review?.id ? 'Approving...' : 'Approve'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Dialog */}
      {rejectDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold mb-2">Reject Review</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to reject this review by {rejectDialog.review?.reviewer_display_name}?
              Please provide a reason for rejection (optional).
            </p>
            <div className="py-4">
              <Textarea
                placeholder="Reason for rejection (optional)..."
                value={rejectDialog.reason}
                onChange={(e) => setRejectDialog(prev => ({ ...prev, reason: e.target.value }))}
                className="min-h-[80px]"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setRejectDialog({ open: false, review: null, reason: '' })}
              >
                Cancel
              </Button>
              <Button
                onClick={() => rejectDialog.review && handleReject(rejectDialog.review, rejectDialog.reason)}
                disabled={actionLoading !== null}
                variant="destructive"
              >
                {actionLoading === rejectDialog.review?.id ? 'Rejecting...' : 'Reject'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
