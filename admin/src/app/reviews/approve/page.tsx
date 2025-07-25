"use client"

import React, { useState, useEffect } from 'react'
import { MessageSquare, Plus, BarChart3, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { ReviewManagementTable } from '@/components/reviews/review-management-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getReviewStats } from '@/services/review-service'
import { Skeleton } from '@/components/ui/skeleton'
import { ReviewStatus } from '@/types/review'

interface ReviewStats {
  total: number
  pending: number
  approved: number
  rejected: number
}

export default function ReviewsPage() {
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  // Fetch review statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const reviewStats = await getReviewStats()
        setStats(reviewStats)
      } catch (error) {
        console.error('Failed to fetch review stats:', error)
        // Set default stats on error
        setStats({ total: 0, pending: 0, approved: 0, rejected: 0 })
      } finally {
        setStatsLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="page-container">
      <PageHeader
        icon={MessageSquare}
        title="Reviews Management"
        description="Manage and moderate product reviews from customers"
        actions={[
          {
            label: "Analytics",
            onClick: () => console.log('Navigate to analytics'),
            variant: "outline",
            icon: BarChart3,
          },
        ]}
      />


      {/* Reviews Management Table */}
      <div className="table-container">
        <ReviewManagementTable status={ReviewStatus.PENDING_APPROVAL} />
      </div>
    </div>
  )
}
