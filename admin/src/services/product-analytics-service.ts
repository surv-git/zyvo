// Product Analytics Service
// Handles all API calls for product statistics and analytics

export interface ProductOverview {
  overview: {
    total_products: number;
    active_products: number;
    inactive_products: number;
    avg_score: number;
    products_with_images: number;
    products_with_descriptions: number;
    image_completion_rate: number;
    description_completion_rate: number;
  };
  category_distribution: Array<{
    _id: string;
    count: number;
    percentage: number;
  }>;
  score_distribution: Array<{
    _id: string;
    count: number;
    percentage: number;
  }>;
}

export interface ProductPerformance {
  top_performers: Array<{
    _id: string;
    name: string;
    score: number;
    views: number;
    conversions: number;
    revenue: number;
    conversion_rate: number;
  }>;
  summary: {
    total_views: number;
    total_conversions: number;
    total_revenue: number;
    average_conversion_rate: number;
  };
}

export interface CatalogHealth {
  health_score: number;
  health_grade: string;
  content_completeness: {
    products_with_images: number;
    products_with_descriptions: number;
    products_with_categories: number;
    products_with_scores: number;
    image_completion_rate: number;
    description_completion_rate: number;
    scoring_completion_rate: number;
  };
  quality_metrics: {
    avg_score: number;
    high_quality_products: number;
    needs_improvement: number;
    critical_issues: number;
  };
  recommendations: string[];
}

export interface LowPerformingProduct {
  _id: string;
  name: string;
  score: number;
  issues: string[];
  days_since_update: number;
  recommendations: string[];
}

export interface ProductTrends {
  creation_trends: Array<{
    _id: string;
    created: number;
    updated: number;
  }>;
  insights: {
    peak_creation_month: string;
    avg_monthly_creation: number;
    growth_rate: string;
  };
}

export interface CategoryComparison {
  category_comparison: Array<{
    _id: string;
    category_name: string;
    total_products: number;
    avg_score: number;
    min_score: number;
    max_score: number;
    products_with_images: number;
    products_with_descriptions: number;
    image_completion_rate: number;
    description_completion_rate: number;
    quality_score: number;
    rank: number;
  }>;
  insights: {
    total_categories: number;
    best_performing_category: string;
    categories_needing_improvement: number;
  };
}

export interface ContentOptimization {
  optimization_opportunities: Array<{
    _id: string;
    name: string;
    score: number;
    issues: string[];
    issue_count: number;
    priority_score: string;
  }>;
  summary: {
    total_products_needing_work: number;
    critical_issues: number;
    high_priority: number;
  };
}

// Base API configuration
const API_BASE_URL = '/api/v1/analytics/products';

// Helper function to handle API errors
export function getProductAnalyticsServiceErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred while fetching product analytics';
}

// API Service Functions
export class ProductAnalyticsService {
  // Get product analytics overview
  static async getOverview(): Promise<ProductOverview> {
    // TODO: Replace with actual API call
    // const response = await fetch(`${API_BASE_URL}/overview`);
    // return response.json();
    throw new Error('API not implemented - using mock data');
  }

  // Get product performance metrics
  static async getPerformance(period: string = '30d', metric: string = 'views', limit: number = 10): Promise<ProductPerformance> {
    // TODO: Replace with actual API call
    // const params = new URLSearchParams({ period, metric, limit: limit.toString() });
    // const response = await fetch(`${API_BASE_URL}/performance?${params}`);
    // return response.json();
    throw new Error('API not implemented - using mock data');
  }

  // Get product trends
  static async getTrends(period: string = 'month'): Promise<ProductTrends> {
    // TODO: Replace with actual API call
    // const params = new URLSearchParams({ period });
    // const response = await fetch(`${API_BASE_URL}/trends?${params}`);
    // return response.json();
    throw new Error('API not implemented - using mock data');
  }

  // Get low performing products
  static async getLowPerformers(threshold: number = 3, limit: number = 20): Promise<{ low_performers: LowPerformingProduct[]; summary: any }> {
    // TODO: Replace with actual API call
    // const params = new URLSearchParams({ threshold: threshold.toString(), limit: limit.toString() });
    // const response = await fetch(`${API_BASE_URL}/low-performing?${params}`);
    // return response.json();
    throw new Error('API not implemented - using mock data');
  }

  // Get catalog health report
  static async getCatalogHealth(): Promise<CatalogHealth> {
    // TODO: Replace with actual API call
    // const response = await fetch(`${API_BASE_URL}/catalog-health`);
    // return response.json();
    throw new Error('API not implemented - using mock data');
  }

  // Get category comparison analytics
  static async getCategoryComparison(): Promise<CategoryComparison> {
    // TODO: Replace with actual API call
    // const response = await fetch(`${API_BASE_URL}/category-comparison`);
    // return response.json();
    throw new Error('API not implemented - using mock data');
  }

  // Get content optimization opportunities
  static async getContentOptimization(priority: string = 'critical', limit: number = 50): Promise<ContentOptimization> {
    // TODO: Replace with actual API call
    // const params = new URLSearchParams({ priority, limit: limit.toString() });
    // const response = await fetch(`${API_BASE_URL}/content-optimization?${params}`);
    // return response.json();
    throw new Error('API not implemented - using mock data');
  }
}
