"use client"

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft, 
  Star, 
  User, 
  Package, 
  Calendar, 
  ThumbsUp, 
  ThumbsDown, 
  Flag, 
  Check, 
  X,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  AlertCircle,
  MessageSquare,
  Eye,
  CheckCircle,
  XCircle
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

import { Review, ReviewStatus, ReviewReport } from '@/types/review'
import { getReviewById, updateReviewStatus } from '@/services/review-service'
import { PageHeader } from '@/components/ui/page-header'

export default function ReviewDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const reviewId = params.id as string

  // State management
  const [review, setReview] = useState<Review | null>(null)
  const [reports, setReports] = useState<ReviewReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Modal states
  const [approveDialog, setApproveDialog] = useState({ open: false })
  const [rejectDialog, setRejectDialog] = useState({ open: false, reason: '' })
  const [flagDialog, setFlagDialog] = useState({ open: false })

  // Fetch review details
  useEffect(() => {
    const fetchReview = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await getReviewById(reviewId)
        
        if (response.success) {
          setReview(response.data.review)
          setReports(response.data.reports)
        } else {
          setError('Review not found')
        }
      } catch (err: any) {
        console.error('Failed to fetch review:', err)
        setError(err.message || 'Failed to load review details')
      } finally {
        setLoading(false)
      }
    }

    if (reviewId) {
      fetchReview()
    }
  }, [reviewId])

  // Handle status updates
  const handleStatusUpdate = async (status: ReviewStatus, reason?: string) => {
    if (!review) return

    try {
      setActionLoading(true)
      
      await updateReviewStatus(review.id, status, reason)
      
      // Update local state
      setReview(prev => prev ? { ...prev, status } : null)
      
      const statusText = status === ReviewStatus.APPROVED ? 'approved' : 
                        status === ReviewStatus.REJECTED ? 'rejected' : 'flagged'
      
      toast({
        title: "Status Updated",
        description: `Review has been ${statusText} successfully.`,
      })
      
      // Close dialogs
      setApproveDialog({ open: false })
      setRejectDialog({ open: false, reason: '' })
      setFlagDialog({ open: false })
      
    } catch (err: any) {
      console.error('Failed to update status:', err)
      toast({
        title: "Error",
        description: err.message || "Failed to update review status",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Copy to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
    })
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case ReviewStatus.APPROVED:
        return <Badge variant="default" className="bg-green-100 text-green-800">Approved</Badge>
      case ReviewStatus.PENDING_APPROVAL:
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending Approval</Badge>
      case ReviewStatus.REJECTED:
        return <Badge variant="destructive">Rejected</Badge>
      case ReviewStatus.FLAGGED:
        return <Badge variant="outline" className="bg-orange-100 text-orange-800">Flagged</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Get rating stars
  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-5 w-5 ${
          i < rating 
            ? 'fill-yellow-400 text-yellow-400' 
            : 'text-gray-300'
        }`}
      />
    ))
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-48" />
          <Skeleton className="h-32" />
        </div>
      </div>
    )
  }

  if (error || !review) {
    return (
      <div className="page-container">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Review Not Found</h2>
          <p className="text-muted-foreground mb-4">{error || 'The requested review could not be found.'}</p>
          <Button onClick={() => router.push('/reviews')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Reviews
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="page-container">
        <PageHeader
          icon={Eye}
          title={`Review by ${review.reviewer_display_name}`}
          description="Review Details and Moderation"
          showBackButton={true}
          onBack={() => router.push('/reviews')}
          actions={[
            ...(review.status !== ReviewStatus.APPROVED ? [{
              label: "Approve",
              onClick: () => setApproveDialog({ open: true }),
              icon: CheckCircle,
              variant: "default" as const,
              disabled: actionLoading
            }] : []),
            ...(review.status !== ReviewStatus.REJECTED ? [{
              label: "Reject",
              onClick: () => setRejectDialog({ open: true, reason: '' }),
              icon: XCircle,
              variant: "destructive" as const,
              disabled: actionLoading
            }] : []),
            ...(review.status !== ReviewStatus.FLAGGED ? [{
              label: "Flag",
              onClick: () => setFlagDialog({ open: true }),
              icon: Flag,
              variant: "outline" as const,
              disabled: actionLoading
            }] : [])
          ]}
        />

        {/* Review Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Review Content */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Review Content
                </CardTitle>
                <CardDescription>Customer review and rating details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {getRatingStars(review.rating)}
                      <span className="text-lg font-semibold">{review.rating}/5</span>
                    </div>
                    {review.title && (
                      <h3 className="text-xl font-semibold">{review.title}</h3>
                    )}
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <div>Reviewed on {formatDate(review.createdAt)}</div>
                    {review.is_verified_buyer && (
                      <Badge variant="outline" className="mt-1">
                        Verified Buyer
                      </Badge>
                    )}
                  </div>
                </div>

                <Separator />

                {review.review_text && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Review Text</Label>
                    <div className="mt-1 p-4 bg-muted rounded-lg">
                      <p className="whitespace-pre-wrap">{review.review_text}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reviewer & Product Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Reviewer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Reviewer Information
                  </CardTitle>
                  <CardDescription>Details about the reviewer</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Display Name</Label>
                    <p className="font-medium mt-1">{review.reviewer_display_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Location</Label>
                    <p className="mt-1">{review.reviewer_location || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">User ID</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {review.user_id?.id?.slice(0, 8)}...
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(review.user_id?.id || '', 'User ID')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Verified Buyer</Label>
                    <p className="mt-1">{review.is_verified_buyer ? 'Yes' : 'No'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Product Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Product Information
                  </CardTitle>
                  <CardDescription>Details about the reviewed product</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Product Variant ID</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {review.product_variant_id?.id?.slice(0, 8)}...
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(review.product_variant_id?.id || '', 'Product Variant ID')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {review.product_variant_id && (
                    <>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">SKU Code</Label>
                        <p className="font-mono mt-1">{review.product_variant_id.sku_code}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Price</Label>
                        <div className="space-y-1 mt-1">
                          <p className="font-semibold">₹{review.product_variant_id.effective_price}</p>
                          {review.product_variant_id.price !== review.product_variant_id.effective_price && (
                            <p className="text-sm text-muted-foreground line-through">
                              ₹{review.product_variant_id.price}
                            </p>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Savings</Label>
                        <p className="text-green-600 font-medium mt-1">
                          ₹{review.product_variant_id.savings} ({review.product_variant_id.discount_percentage_calculated}% off)
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Reports Section */}
            {reports.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Flag className="h-5 w-5" />
                    Reports ({reports.length})
                  </CardTitle>
                  <CardDescription>Reports submitted against this review</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div key={report.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold">{report.reason}</h4>
                            <p className="text-sm text-muted-foreground">
                              Reported by {report.user_id.fullName} on {formatDate(report.createdAt)}
                            </p>
                          </div>
                          <Badge variant={report.status === 'PENDING' ? 'secondary' : 'default'}>
                            {report.status}
                          </Badge>
                        </div>
                        {report.description && (
                          <p className="text-sm mt-2 p-2 bg-muted rounded">
                            {report.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status & Metrics Card */}
            <Card>
              <CardHeader>
                <CardTitle>Status & Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Review Status</span>
                  {getStatusBadge(review.status)}
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Helpful</span>
                    </div>
                    <span className="font-bold text-green-600">{review.helpful_votes}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ThumbsDown className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium">Unhelpful</span>
                    </div>
                    <span className="font-bold text-red-600">{review.unhelpful_votes}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flag className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium">Reports</span>
                    </div>
                    <span className="font-bold text-orange-600">{review.reported_count}</span>
                  </div>
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
                  <Label className="text-sm font-medium text-muted-foreground">Review ID</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm bg-muted px-2 py-1 rounded">{review.id}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(review.id, 'Review ID')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{formatDate(review.createdAt)}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{formatDate(review.updatedAt)}</p>
                  </div>
                </div>

                {review.moderated_at && (
                  <>
                    <Separator />
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Moderated</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm">{formatDate(review.moderated_at)}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Moderated By</Label>
                      <p className="text-sm mt-1">{review.moderated_by?.fullName || 'System'}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Approve Dialog */}
      {approveDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold mb-2">Approve Review</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to approve this review by {review?.reviewer_display_name}?
              This action will make the review visible to all users.
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setApproveDialog({ open: false })}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleStatusUpdate(ReviewStatus.APPROVED)}
                disabled={actionLoading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {actionLoading ? 'Approving...' : 'Approve'}
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
              Are you sure you want to reject this review by {review?.reviewer_display_name}?
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
                onClick={() => setRejectDialog({ open: false, reason: '' })}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleStatusUpdate(ReviewStatus.REJECTED, rejectDialog.reason)}
                disabled={actionLoading}
                variant="destructive"
              >
                {actionLoading ? 'Rejecting...' : 'Reject'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Flag Dialog */}
      {flagDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold mb-2">Flag Review</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to flag this review by {review?.reviewer_display_name}?
              This will mark the review for further review and moderation.
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setFlagDialog({ open: false })}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleStatusUpdate(ReviewStatus.FLAGGED)}
                disabled={actionLoading}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {actionLoading ? 'Flagging...' : 'Flag'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
