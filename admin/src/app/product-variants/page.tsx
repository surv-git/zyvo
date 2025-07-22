'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Package, Activity, TrendingUp, DollarSign, Loader2 } from 'lucide-react';
import { ProductVariantManagementTable } from '@/components/product-variants/product-variant-management-table';
import { getProductVariantList } from '@/services/product-variant-service';
import { useSiteConfig } from '@/config/site';

interface ProductVariantStats {
  totalVariants: number;
  activeVariants: number;
  inactiveVariants: number;
  onSaleVariants: number;
  totalValue: number;
  averagePrice: number;
}

export default function ProductVariantsPage() {
  const router = useRouter();
  const { config } = useSiteConfig();
  const [stats, setStats] = useState<ProductVariantStats>({
    totalVariants: 0,
    activeVariants: 0,
    inactiveVariants: 0,
    onSaleVariants: 0,
    totalValue: 0,
    averagePrice: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        
        // Get a single comprehensive response for stats calculation
        // Use a higher limit to get most variants for accurate stats
        const allVariantsResponse = await getProductVariantList({ 
          limit: 1000, 
          include_inactive: true 
        });

        const allVariants = allVariantsResponse.data;
        const activeVariants = allVariants.filter(v => v.is_active);
        const inactiveVariants = allVariants.filter(v => !v.is_active);
        const onSaleVariants = allVariants.filter(v => v.discount_details.is_on_sale);

        const totalValue = activeVariants.reduce((sum, variant) => sum + variant.price, 0);
        const averagePrice = activeVariants.length > 0 ? totalValue / activeVariants.length : 0;

        setStats({
          totalVariants: allVariants.length,
          activeVariants: activeVariants.length,
          inactiveVariants: inactiveVariants.length,
          onSaleVariants: onSaleVariants.length,
          totalValue,
          averagePrice,
        });
      } catch (error) {
        console.error('Failed to fetch product variant stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleAddProductVariant = () => {
    router.push('/product-variants/new');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const tableFilters = useMemo(() => ({ 
    limit: config.admin.itemsPerPage 
  }), [config.admin.itemsPerPage]);

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Package className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Product Variants</h1>
            <p className="text-muted-foreground mt-1">
              Manage product variants, pricing, and inventory details.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={handleAddProductVariant}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product Variant
          </Button>
        </div>
      </div>
      
      {/* Product Variant Management Table */}
      <ProductVariantManagementTable 
        defaultFilters={tableFilters}
      />
    </div>
  );
}
