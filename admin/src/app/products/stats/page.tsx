"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  Package, 
  Eye, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Target,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { PieChart, Pie, RadialBarChart, RadialBar, ResponsiveContainer, Cell, Tooltip } from 'recharts';


import { Label } from "recharts"

import {
  CardFooter,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import ChartPieDonutText from '@/components/ui/donut-pie-chart';
import { ChartRadialGrid } from '@/components/ui/radial-chart-grid';
import { ChartRadialStacked } from '@/components/ui/chart-radial-stacked';
import { ChartRadialShape } from '@/components/ui/chart-radial-shape';
import { HealthScore } from '@/components/ui/health-score';

// Mock data based on the API responses
const mockOverviewData = {
  overview: {
    total_products: 1247,
    active_products: 1156,
    inactive_products: 91,
    avg_score: 6.8,
    products_with_images: 892,
    products_with_descriptions: 1034,
    image_completion_rate: 71.5,
    description_completion_rate: 82.9
  },
  category_distribution: [
    { "_id": "Electronics", "count": 423, "percentage": 33.9 },
    { "_id": "Clothing", "count": 298, "percentage": 23.9 },
    { "_id": "Home & Garden", "count": 187, "percentage": 15.0 },
    { "_id": "Sports", "count": 142, "percentage": 11.4 },
    { "_id": "Books", "count": 197, "percentage": 15.8 }
  ],
  score_distribution: [
    { "_id": "0-2", "count": 89, "percentage": 7.1 },
    { "_id": "3-5", "count": 245, "percentage": 19.6 },
    { "_id": "6-8", "count": 567, "percentage": 45.5 },
    { "_id": "9-10", "count": 346, "percentage": 27.8 }
  ]
};

const mockPerformanceData = {
  top_performers: [
    {
      "_id": "64f5a2b1c8d4e5f6g7h8i9j0",
      "name": "iPhone 15 Pro Max",
      "score": 9.2,
      "views": 15847,
      "conversions": 234,
      "revenue": 234000,
      "conversion_rate": 1.48
    },
    {
      "_id": "64f5a2b1c8d4e5f6g7h8i9j1",
      "name": "Samsung Galaxy S24",
      "score": 8.9,
      "views": 12456,
      "conversions": 189,
      "revenue": 189000,
      "conversion_rate": 1.52
    },
    {
      "_id": "64f5a2b1c8d4e5f6g7h8i9j2",
      "name": "MacBook Pro M3",
      "score": 9.1,
      "views": 11234,
      "conversions": 156,
      "revenue": 312000,
      "conversion_rate": 1.39
    }
  ],
  summary: {
    total_views: 125847,
    total_conversions: 1847,
    total_revenue: 1847000,
    average_conversion_rate: 1.47
  }
};

const mockLowPerformers = [
  {
    "_id": "64f5a2b1c8d4e5f6g7h8i9j2",
    "name": "Budget Wireless Headphones",
    "score": 2.1,
    "issues": ["missing_images", "poor_description"],
    "days_since_update": 45,
    "recommendations": [
      "Add high-quality product images",
      "Improve product description with more details",
      "Update pricing strategy"
    ]
  },
  {
    "_id": "64f5a2b1c8d4e5f6g7h8i9j3",
    "name": "Basic Phone Case",
    "score": 1.8,
    "issues": ["missing_images", "outdated_pricing"],
    "days_since_update": 67,
    "recommendations": [
      "Add product images",
      "Review competitive pricing"
    ]
  }
];

const mockCatalogHealth = {
  health_score: 78.5,
  health_grade: "B+",
  content_completeness: {
    products_with_images: 892,
    products_with_descriptions: 1034,
    products_with_categories: 1247,
    products_with_scores: 1158,
    image_completion_rate: 71.5,
    description_completion_rate: 82.9,
    scoring_completion_rate: 92.9
  },
  quality_metrics: {
    avg_score: 6.8,
    high_quality_products: 567,
    needs_improvement: 234,
    critical_issues: 23
  },
  recommendations: [
    "Focus on adding images to 355 products missing them",
    "Improve descriptions for 213 products with poor content",
    "Review pricing for 89 products with low scores"
  ]
};


export const description = "A donut chart with text"
const chartData = [
  { browser: "chrome", visitors: 275, fill: "var(--color-chrome)" },
  { browser: "safari", visitors: 200, fill: "var(--color-safari)" },
  { browser: "firefox", visitors: 287, fill: "var(--color-firefox)" },
  { browser: "edge", visitors: 173, fill: "var(--color-edge)" },
  { browser: "other", visitors: 190, fill: "var(--color-other)" },
]
const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  chrome: {
    label: "Chrome",
    color: "var(--chart-1)",
  },
  safari: {
    label: "Safari",
    color: "var(--chart-2)",
  },
  firefox: {
    label: "Firefox",
    color: "var(--chart-3)",
  },
  edge: {
    label: "Edge",
    color: "var(--chart-4)",
  },
  other: {
    label: "Other",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig




export default function ProductStatsPage() {
  const [period, setPeriod] = useState("30d");
  const [refreshing, setRefreshing] = useState(false);

    const totalVisitors = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.visitors, 0)
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
    toast.success("Data refreshed successfully");
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getHealthColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 80) return "text-blue-600 bg-blue-50 border-blue-200";
    if (score >= 70) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-blue-600";
    if (score >= 4) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive insights into your product catalog performance and health
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-6 auto-rows-min">
        {/* Row 1: Key Metrics - 6 cards */}
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockOverviewData.overview.total_products.toLocaleString()}</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              {mockOverviewData.overview.active_products} active
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockOverviewData.overview.avg_score}</div>
            <div className="text-xs text-muted-foreground">Out of 10.0</div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Image Coverage</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockOverviewData.overview.image_completion_rate}%</div>
            <div className="text-xs text-muted-foreground">
              {mockOverviewData.overview.products_with_images} products
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Description Coverage</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockOverviewData.overview.description_completion_rate}%</div>
            <div className="text-xs text-muted-foreground">
              {mockOverviewData.overview.products_with_descriptions} products
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(mockPerformanceData.summary.total_views)}</div>
            <div className="text-xs text-muted-foreground">Last {period}</div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(mockPerformanceData.summary.total_revenue)}</div>
            <div className="text-xs text-muted-foreground">Last {period}</div>
          </CardContent>
        </Card>

        {/* Row 2: Health Score and Distribution Cards */}
        <HealthScore />

        <div className="col-span-2 md:col-span-2 lg:col-span-2 xl:col-span-2" >
        <ChartPieDonutText
          chartConfig={chartConfig}
          chartData={chartData}
        />
        </div>
        <div className="col-span-2 md:col-span-2 lg:col-span-2 xl:col-span-2" >
          <ChartRadialGrid />
        </div>
        {/* Row 3: Content Completeness */}
        <Card className="col-span-2 md:col-span-3 lg:col-span-6 xl:col-span-6">
          <CardHeader className="pb-2">
            <CardTitle>Content Completeness</CardTitle>
            <CardDescription>How complete is your product data?</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            {/* Images Radial Chart */}            
              <div className="">
                <ChartRadialShape />              
            </div>
            <div className="">
                <ChartRadialShape />              
            </div>
            <div className="">
                <ChartRadialShape />              
            </div>            
          </CardContent>
        </Card>

        {/* Row 4: Top Performing Products - Full width */}
        <Card className="col-span-2 md:col-span-3 lg:col-span-6 xl:col-span-6">
          <CardHeader className="pb-3">
            <CardTitle>Top Performing Products</CardTitle>
            <CardDescription>Best performing products by views, conversions, and revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {mockPerformanceData.top_performers.map((product, index) => (
                <div key={product._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="w-6 h-6 rounded-full flex items-center justify-center text-xs">
                      {index + 1}
                    </Badge>
                    <div>
                      <h4 className="font-medium text-sm">{product.name}</h4>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>Score: <span className={getScoreColor(product.score)}>{product.score}</span></span>
                        <span>Rate: {product.conversion_rate}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs space-y-1">
                      <div>{formatNumber(product.views)} views</div>
                      <div className="font-medium">{formatCurrency(product.revenue)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Row 5: Issues and Recommendations - Side by side */}
        <Card className="col-span-2 md:col-span-3 lg:col-span-3 xl:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle>Products Needing Attention</CardTitle>
            <CardDescription>Low performing products requiring action</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockLowPerformers.map((product) => (
                <div key={product._id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-sm">{product.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="destructive" className="text-xs">Score: {product.score}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {product.days_since_update}d ago
                        </span>
                      </div>
                    </div>
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {product.issues.map((issue, index) => (
                        <Badge key={index} variant="outline" className="text-red-600 text-xs px-2 py-0">
                          {issue.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                    
                    <ul className="space-y-1">
                      {product.recommendations.slice(0, 2).map((rec, index) => (
                        <li key={index} className="text-xs text-muted-foreground flex items-start">
                          <span className="mr-1">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2 md:col-span-3 lg:col-span-3 xl:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle>Improvement Recommendations</CardTitle>
            <CardDescription>Actionable insights to improve your catalog</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockCatalogHealth.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{recommendation}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
