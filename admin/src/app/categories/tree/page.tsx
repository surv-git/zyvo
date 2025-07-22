"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus, FolderTree, BarChart3, TrendingUp, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CategoryManagementTable } from '@/components/categories/category-management-table';
import { CategoryTree } from '@/components/categories/category-tree';
import { getCategoryList } from '@/services/category-service';
import { toast } from 'sonner';

interface CategoryStats {
  total: number;
  active: number;
  inactive: number;
  rootCategories: number;
}

export default function CategoriesPage() {
  const router = useRouter();
  const [stats, setStats] = useState<CategoryStats>({ total: 0, active: 0, inactive: 0, rootCategories: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  // Load category statistics
  useEffect(() => {
    const loadStats = async () => {
      try {
        // Load all categories to calculate stats
        const [allCategories, activeCategories] = await Promise.all([
          getCategoryList({ page: 1, limit: 1000, include_inactive: true }),
          getCategoryList({ page: 1, limit: 1000, include_inactive: false })
        ]);

        const total = allCategories.total;
        const active = activeCategories.total;
        const inactive = total - active;
        const rootCategories = allCategories.categories.filter(cat => !cat.parent_category).length;

        setStats({ total, active, inactive, rootCategories });
      } catch (error) {
        console.error('Failed to load category stats:', error);
        // Don't show error toast for stats, just keep loading state
      } finally {
        setLoadingStats(false);
      }
    };

    loadStats();
  }, []);

  const handleAddCategory = () => {
    router.push('/categories/new');
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FolderTree className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Category Tree</h1>
            <p className="text-muted-foreground mt-1">
              Get a tree view of product categories, hierarchies, and organization structure.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => router.push('/categories/analytics')}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button onClick={handleAddCategory}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Top Section: Stats and Tree */}
      <div className="grid gap-6 lg:grid-cols-4">        
        
        {/* Category Tree - Compact Sidebar */}
        <div className="lg:col-span-1">
          <CategoryTree className="h-fit max-h-[600px] overflow-y-auto" />
        </div>

        {/* Quick Stats Cards */}
                <div className="lg:col-span-3">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
                        <FolderTree className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        {loadingStats ? (
                          <div className="flex items-center space-x-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm text-muted-foreground">Loading...</span>
                          </div>
                        ) : (
                          <>
                            <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">
                              Active and inactive categories
                            </p>
                          </>
                        )}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Categories</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        {loadingStats ? (
                          <div className="flex items-center space-x-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm text-muted-foreground">Loading...</span>
                          </div>
                        ) : (
                          <>
                            <div className="text-2xl font-bold">{stats.active.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">
                              Currently active categories
                            </p>
                            {stats.inactive > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {stats.inactive} inactive
                              </p>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Root Categories</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        {loadingStats ? (
                          <div className="flex items-center space-x-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm text-muted-foreground">Loading...</span>
                          </div>
                        ) : (
                          <>
                            <div className="text-2xl font-bold">{stats.rootCategories.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">
                              Top-level categories
                            </p>
                            {stats.total > stats.rootCategories && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {(stats.total - stats.rootCategories)} subcategories
                              </p>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
      </div>
            
    </div>
  );
}
