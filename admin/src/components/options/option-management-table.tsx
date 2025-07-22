"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TableFooter } from '@/components/ui/table-footer';
import {
  MoreHorizontal,
  Eye,
  Edit,
  Power,
  PowerOff,
  Trash2,
  Search,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Settings,
  Tag,
  Copy,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { Option, OptionTableFilters } from '@/types/option';
import { getOptionList, activateOption, deactivateOption, deleteOption } from '@/services/option-service';
import { getSiteConfigSync } from '@/config/site';

interface OptionManagementTableProps {
  className?: string;
}

export default function OptionManagementTable({ className }: OptionManagementTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Scroll preservation state
  const [isNavigating, setIsNavigating] = useState(false);
  const scrollPositionRef = useRef<{ x: number; y: number } | null>(null);
  const lastScrollPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const scrollLockIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const scrollBlockerRef = useRef<((e: Event) => boolean) | null>(null);
  
  // State
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filters from URL parameters
  const filters = useMemo((): OptionTableFilters => ({
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || getSiteConfigSync().admin.itemsPerPage.toString()),
    search: searchParams.get('search') || '',
    option_type: searchParams.get('option_type') || undefined,
    is_active: searchParams.get('is_active') ? searchParams.get('is_active') === 'true' : undefined,
    sort: (searchParams.get('sort') as OptionTableFilters['sort']) || 'createdAt',
    order: (searchParams.get('order') as OptionTableFilters['order']) || 'desc',
    include_inactive: searchParams.get('include_inactive') !== 'false'
  }), [searchParams]);

  // Update URL parameters
  const updateFilters = useCallback((newFilters: Partial<OptionTableFilters>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === undefined || value === '' || value === null) {
        params.delete(key);
      } else {
        params.set(key, value.toString());
      }
    });

    // Use scroll: false to prevent automatic scroll-to-top
    router.push(`/options?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);


  


  // Load options data
  const loadOptions = useCallback(async () => {
    console.log('📦 loadOptions started');
    console.log('🧭 isNavigating:', isNavigating);
    console.log('📍 scrollPositionRef.current:', scrollPositionRef.current);
    
    try {
      // Preserve scroll position during loading if navigating
      const shouldPreserveScroll = isNavigating && scrollPositionRef.current;
      const preservedPosition = shouldPreserveScroll ? scrollPositionRef.current : null;
      
      console.log('🔄 shouldPreserveScroll:', shouldPreserveScroll);
      console.log('📍 preservedPosition:', preservedPosition);
      
      // Set loading state
      setLoading(true);
      console.log('⏳ Loading state set to true');
      
      // If preserving scroll, lock the scroll position immediately and continuously
      if (preservedPosition) {
        console.log('🔒 Starting aggressive scroll lock');
        const mainElement = document.querySelector('main');
        
        // Create a more aggressive scroll lock
        const lockScroll = () => {
          if (mainElement) {
            const beforeY = mainElement.scrollTop;
            mainElement.scrollTop = preservedPosition.y;
            mainElement.scrollLeft = preservedPosition.x;
            console.log('🔒 Main scroll locked:', { 
              before: beforeY, 
              target: preservedPosition.y, 
              after: mainElement.scrollTop 
            });
          } else {
            const beforeY = window.pageYOffset;
            window.scrollTo(preservedPosition.x, preservedPosition.y);
            document.documentElement.scrollTop = preservedPosition.y;
            document.body.scrollTop = preservedPosition.y;
            console.log('🔒 Window scroll locked:', { 
              before: beforeY, 
              target: preservedPosition.y, 
              after: window.pageYOffset 
            });
          }
        };
        
        // Lock scroll immediately
        lockScroll();
        
        // Continue locking during the entire loading process
        const scrollLockInterval = setInterval(lockScroll, 8); // Very frequent updates
        console.log('⏰ Scroll lock interval started');
        
        // Store interval in ref to clear it later
        scrollLockIntervalRef.current = scrollLockInterval;
      }
      
      console.log('🌐 Fetching data...');
      const response = await getOptionList(filters);
      console.log('✅ Data fetched successfully');
      
      // Update data in a way that doesn't trigger scroll resets
      requestAnimationFrame(() => {
        console.log('🎬 Updating data in requestAnimationFrame');
        setOptions(response.options);
        setTotalItems(response.total);
        setTotalPages(response.totalPages);
        console.log('📊 Data state updated');
        
        // Final scroll restoration after data is set
        if (preservedPosition) {
          console.log('🔄 Final scroll restoration');
          const mainElement = document.querySelector('main');
          const finalRestore = () => {
            if (mainElement) {
              const beforeY = mainElement.scrollTop;
              mainElement.scrollTo({
                left: preservedPosition.x,
                top: preservedPosition.y,
                behavior: 'instant'
              });
              console.log('🎯 Final main restore:', { 
                before: beforeY, 
                target: preservedPosition.y, 
                after: mainElement.scrollTop 
              });
            } else {
              const beforeY = window.pageYOffset;
              window.scrollTo({
                left: preservedPosition.x,
                top: preservedPosition.y,
                behavior: 'instant'
              });
              console.log('🎯 Final window restore:', { 
                before: beforeY, 
                target: preservedPosition.y, 
                after: window.pageYOffset 
              });
            }
          };
          
          finalRestore();
          requestAnimationFrame(finalRestore);
          setTimeout(finalRestore, 0);
        }
      });
      
    } catch (error) {
      console.error('❌ Failed to load options:', error);
      toast.error('Failed to load options. Please try again.');
    } finally {
      // Clear scroll lock interval
      if (scrollLockIntervalRef.current) {
        clearInterval(scrollLockIntervalRef.current);
        scrollLockIntervalRef.current = null;
        console.log('⏰ Scroll lock interval cleared');
      }
      
      // Remove comprehensive scroll blocking
      const removeScrollBlocking = () => {
        const mainElement = document.querySelector('main');
        const blocker = scrollBlockerRef.current;
        
        if (blocker) {
          if (mainElement) {
            mainElement.removeEventListener('scroll', blocker, { capture: true });
            mainElement.removeEventListener('wheel', blocker, { capture: true });
            mainElement.removeEventListener('touchmove', blocker, { capture: true });
          }
          window.removeEventListener('scroll', blocker, { capture: true });
          window.removeEventListener('wheel', blocker, { capture: true });
          window.removeEventListener('touchmove', blocker, { capture: true });
          document.removeEventListener('scroll', blocker, { capture: true });
          
          scrollBlockerRef.current = null;
          console.log('🚀 Comprehensive scroll blocking removed');
        }
      };
      
      // Remove blocking after a short delay to ensure data is fully rendered
      setTimeout(removeScrollBlocking, 100);
      
      setLoading(false);
      setRefreshing(false);
      console.log('⏳ Loading state set to false');
    }
  }, [filters, isNavigating]);

  // Load data on mount and filter changes
  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== filters.search) {
        updateFilters({ search: searchTerm, page: 1 });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, filters.search, updateFilters]);

  // Initialize search term from URL
  useEffect(() => {
    setSearchTerm(filters.search || '');
  }, [filters.search]);

  // Maintain scroll position during navigation and restore immediately
  useEffect(() => {
    console.log('🎯 Scroll restoration effect triggered:', { isNavigating, hasScrollPosition: !!scrollPositionRef.current });
    
    if (isNavigating && scrollPositionRef.current) {
      const position = scrollPositionRef.current;
      console.log('📍 Position to restore:', position);
      
      // Only restore if we have a meaningful scroll position
      if (position.y > 0 || position.x > 0) {
        // Check if we have a main element (layout with sidebar)
        const mainElement = document.querySelector('main');
        console.log('🔍 Main element for restoration:', !!mainElement);
        
        // Restore scroll position with maximum reliability
        const restoreScroll = () => {
          if (mainElement) {
            const beforeY = mainElement.scrollTop;
            // Restore scroll on main element
            mainElement.scrollTo({
              left: position.x,
              top: position.y,
              behavior: 'instant'
            });
            mainElement.scrollTop = position.y;
            mainElement.scrollLeft = position.x;
            console.log('🔄 Main element restored:', { before: beforeY, target: position.y, after: mainElement.scrollTop });
          } else {
            const beforeY = window.pageYOffset;
            // Fallback to window scroll
            window.scrollTo({
              left: position.x,
              top: position.y,
              behavior: 'instant'
            });
            document.documentElement.scrollTop = position.y;
            document.body.scrollTop = position.y;
            console.log('🔄 Window restored:', { before: beforeY, target: position.y, after: window.pageYOffset });
          }
        };
        
        // Immediate restoration - don't wait for data
        console.log('🚀 Immediate restoration');
        restoreScroll();
        
        // Use multiple timing strategies for reliability
        requestAnimationFrame(() => {
          console.log('🎬 requestAnimationFrame restoration');
          restoreScroll();
        });
        
        setTimeout(() => {
          console.log('⏰ 0ms timeout restoration');
          restoreScroll();
        }, 0);
        
        setTimeout(() => {
          console.log('⏰ 10ms timeout restoration');
          restoreScroll();
        }, 10);
        
        setTimeout(() => {
          console.log('⏰ 50ms timeout restoration');
          restoreScroll();
        }, 50);
        
        // Continue restoring even during loading
        const interval = setInterval(() => {
          if (isNavigating) {
            console.log('🔄 Interval restoration');
            restoreScroll();
          }
        }, 16); // Every frame at 60fps
        
        // Clear interval after data loads
        setTimeout(() => {
          clearInterval(interval);
          console.log('⏰ Interval restoration cleared');
        }, 1000);
      } else {
        console.log('📍 No meaningful scroll position to restore');
      }
    }
    
    // Clear navigation state when loading completes
    if (!loading && isNavigating) {
      console.log('🏁 Loading complete, clearing navigation state');
      setTimeout(() => {
        setIsNavigating(false);
        scrollPositionRef.current = null;
        console.log('🧭 Navigation state cleared');
      }, 100);
    }
  }, [isNavigating, loading]);

  // Continuously track scroll position
  useEffect(() => {
    const trackScroll = () => {
      // Check if we have a main element (layout with sidebar)
      const mainElement = document.querySelector('main');
      
      if (mainElement) {
        // Track scroll position of the main element
        const newPosition = {
          x: mainElement.scrollLeft || 0,
          y: mainElement.scrollTop || 0,
        };
        lastScrollPositionRef.current = newPosition;
        // console.log('📊 Tracking main scroll:', newPosition);
      } else {
        // Fallback to window scroll
        const newPosition = {
          x: window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0,
          y: window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0,
        };
        lastScrollPositionRef.current = newPosition;
        // console.log('📊 Tracking window scroll:', newPosition);
      }
    };
    
    // Track scroll position continuously
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.addEventListener('scroll', trackScroll, { passive: true });
      console.log('👂 Scroll tracking added to main element');
    } else {
      window.addEventListener('scroll', trackScroll, { passive: true });
      console.log('👂 Scroll tracking added to window');
    }
    
    return () => {
      if (mainElement) {
        mainElement.removeEventListener('scroll', trackScroll);
        console.log('👂 Scroll tracking removed from main element');
      } else {
        window.removeEventListener('scroll', trackScroll);
        console.log('👂 Scroll tracking removed from window');
      }
    };
  }, []);

  // Disable browser scroll restoration for this component
  useEffect(() => {
    if ('scrollRestoration' in history) {
      const originalScrollRestoration = history.scrollRestoration;
      history.scrollRestoration = 'manual';
      
      return () => {
        history.scrollRestoration = originalScrollRestoration;
      };
    }
  }, []);

  // Cleanup scroll lock interval on unmount
  useEffect(() => {
    return () => {
      if (scrollLockIntervalRef.current) {
        clearInterval(scrollLockIntervalRef.current);
        scrollLockIntervalRef.current = null;
      }
      
      // Clean up scroll blocking on unmount
      const blocker = scrollBlockerRef.current;
      if (blocker) {
        const mainElement = document.querySelector('main');
        if (mainElement) {
          mainElement.removeEventListener('scroll', blocker, { capture: true });
          mainElement.removeEventListener('wheel', blocker, { capture: true });
          mainElement.removeEventListener('touchmove', blocker, { capture: true });
        }
        window.removeEventListener('scroll', blocker, { capture: true });
        window.removeEventListener('wheel', blocker, { capture: true });
        window.removeEventListener('touchmove', blocker, { capture: true });
        document.removeEventListener('scroll', blocker, { capture: true });
        scrollBlockerRef.current = null;
      }
    };
  }, []);



  // Handle filter changes
  const handleFilterChange = useCallback((key: keyof OptionTableFilters, value: OptionTableFilters[keyof OptionTableFilters]) => {
    const newFilters: Partial<OptionTableFilters> = {
      [key]: value,
      page: key !== 'page' ? 1 : (value as number) // Reset to page 1 when changing filters
    };
    updateFilters(newFilters);
  }, [updateFilters]);

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  // Handle sorting
  const handleSort = (field: string) => {
    const newOrder = filters.sort === field && filters.order === 'asc' ? 'desc' : 'asc';
    updateFilters({
      sort: field as 'name' | 'option_type' | 'sort_order' | 'createdAt' | 'updatedAt',
      order: newOrder,
      page: 1
    });
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadOptions();
  };

  // Handle pagination with scroll preservation
  const handlePageChange = useCallback((page: number) => {
    console.log('🚀 handlePageChange started for page:', page);
    
    // Check if we have a main element (layout with sidebar)
    const mainElement = document.querySelector('main');
    console.log('📍 Main element found:', !!mainElement);
    
    let currentScrollY = 0;
    let currentScrollX = 0;
    
    if (mainElement) {
      // Get scroll position from main element
      currentScrollY = mainElement.scrollTop || 0;
      currentScrollX = mainElement.scrollLeft || 0;
      console.log('📊 Main element scroll:', { x: currentScrollX, y: currentScrollY });
    } else {
      // Fallback to window scroll
      currentScrollY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
      currentScrollX = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0;
      console.log('📊 Window scroll:', { x: currentScrollX, y: currentScrollY });
    }
    
    const trackedPosition = lastScrollPositionRef.current;
    console.log('📝 Tracked position:', trackedPosition);
    
    // Use the highest value from different methods
    const finalY = Math.max(currentScrollY, trackedPosition.y);
    const finalX = Math.max(currentScrollX, trackedPosition.x);
    
    const finalPosition = { x: finalX, y: finalY };
    console.log('🎯 Final position to preserve:', finalPosition);
    
    // Save position and immediately lock scroll to prevent any movement
    scrollPositionRef.current = finalPosition;
    
    // Create an aggressive scroll blocker that prevents ANY scroll changes
    const blockAllScrolling = (e: Event) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      
      // Force restore position immediately
      if (mainElement) {
        mainElement.scrollTop = finalPosition.y;
        mainElement.scrollLeft = finalPosition.x;
      } else {
        window.scrollTo(finalPosition.x, finalPosition.y);
      }
      
      console.log('🚀 Blocked scroll event and restored position');
      return false;
    };
    
    // Add scroll blocking to all possible scroll sources
    const addScrollBlocking = () => {
      if (mainElement) {
        mainElement.addEventListener('scroll', blockAllScrolling, { capture: true, passive: false });
        // Also block wheel events that could cause scrolling
        mainElement.addEventListener('wheel', blockAllScrolling, { capture: true, passive: false });
        mainElement.addEventListener('touchmove', blockAllScrolling, { capture: true, passive: false });
      }
      window.addEventListener('scroll', blockAllScrolling, { capture: true, passive: false });
      window.addEventListener('wheel', blockAllScrolling, { capture: true, passive: false });
      window.addEventListener('touchmove', blockAllScrolling, { capture: true, passive: false });
      document.addEventListener('scroll', blockAllScrolling, { capture: true, passive: false });
      
      console.log('🚀 Added comprehensive scroll blocking');
    };
    
    // Immediately lock the scroll position to prevent any movement
    const lockScroll = () => {
      if (mainElement) {
        mainElement.scrollTop = finalPosition.y;
        mainElement.scrollLeft = finalPosition.x;
        console.log('🔒 Scroll locked to main element:', finalPosition);
      } else {
        window.scrollTo(finalPosition.x, finalPosition.y);
        console.log('🔒 Scroll locked to window:', finalPosition);
      }
    };
    
    // Start comprehensive scroll blocking
    addScrollBlocking();
    
    // Start locking immediately and continuously
    lockScroll();
    requestAnimationFrame(lockScroll);
    
    // Store the blocking function to remove it later
    scrollBlockerRef.current = blockAllScrolling;
    console.log('� Comprehensive scroll protection activated');
    
    // Set navigation state
    setIsNavigating(true);
    console.log('🧭 Navigation state set to true');
    
    // Update URL with new page
    updateFilters({ page });
    console.log('🔄 URL updated for page:', page);
  }, [updateFilters]);

  // Handle items per page change
  const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
    updateFilters({ limit: newItemsPerPage, page: 1 });
  }, [updateFilters]);

  // Handle view option
  const handleViewOption = (option: Option) => {
    router.push(`/options/${option._id}`);
  };

  // Handle edit option
  const handleEditOption = (option: Option) => {
    router.push(`/options/${option._id}/edit`);
  };

  // Handle copy ID
  const handleCopyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      toast.success('Option ID copied to clipboard');
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (option: Option) => {
    const action = option.is_active ? 'deactivate' : 'activate';
    const confirmed = window.confirm(
      `Are you sure you want to ${action} "${option.name}"? ${
        option.is_active 
          ? 'This will hide the option from product variants.' 
          : 'This will make the option available for product variants.'
      }`
    );

    if (!confirmed) return;

    await executeToggleStatus(option);
  };

  const executeToggleStatus = async (option: Option) => {
    const action = option.is_active ? 'deactivate' : 'activate';
    setActionLoading(`${action}-${option._id}`);

    try {
      if (option.is_active) {
        await deactivateOption(option._id);
        toast.success('Option deactivated successfully');
      } else {
        await activateOption(option._id);
        toast.success('Option activated successfully');
      }

      // Reload data
      await loadOptions();
    } catch (error) {
      console.error(`Failed to ${action} option:`, error);
      toast.error(`Failed to ${action} option. Please try again.`);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle delete option
  const handleDeleteOption = async (option: Option) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${option.name}"? This action cannot be undone and will remove the option from all product variants.`
    );

    if (!confirmed) return;

    await executeDeleteOption(option);
  };

  const executeDeleteOption = async (option: Option) => {
    setActionLoading(`delete-${option._id}`);

    try {
      await deleteOption(option._id);
      toast.success('Option deleted successfully');
      
      // Reload data
      await loadOptions();
    } catch (error) {
      console.error('Failed to delete option:', error);
      toast.error('Failed to delete option. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  // Get sort icon
  const getSortIcon = (field: string) => {
    if (filters.sort !== field) return <ArrowUpDown className="h-4 w-4" />;
    return filters.order === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  return (
    <div className={className} style={{ scrollBehavior: 'auto' }}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Option Management
              </CardTitle>
              <CardDescription>
                Manage product options and their configurations
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                handleRefresh();
              }}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search options..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <Select
              value={filters.option_type || 'all'}
              onValueChange={(value) => handleFilterChange('option_type', value === 'all' ? undefined : value)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Option Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Color">Color</SelectItem>
                <SelectItem value="Size">Size</SelectItem>
                <SelectItem value="Material">Material</SelectItem>
                <SelectItem value="Style">Style</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.is_active === undefined ? 'all' : filters.is_active.toString()}
              onValueChange={(value) => handleFilterChange('is_active', value === 'all' ? undefined : value === 'true')}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.sort}
              onValueChange={(value) => handleFilterChange('sort', value)}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="option_type">Type</SelectItem>
                <SelectItem value="sort_order">Sort Order</SelectItem>
                <SelectItem value="createdAt">Created</SelectItem>
                <SelectItem value="updatedAt">Updated</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.order}
              onValueChange={(value) => handleFilterChange('order', value)}
            >
              <SelectTrigger className="w-[110px]">
                <SelectValue placeholder="Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="table-container">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center space-x-2">
                      <span>Option</span>
                      {getSortIcon('name')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('option_type')}
                  >
                    <div className="flex items-center space-x-2">
                      <span>Type</span>
                      {getSortIcon('option_type')}
                    </div>
                  </TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('sort_order')}
                  >
                    <div className="flex items-center space-x-2">
                      <span>Sort Order</span>
                      {getSortIcon('sort_order')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center space-x-2">
                      <span>Created</span>
                      {getSortIcon('createdAt')}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody style={{ minHeight: isNavigating ? '400px' : 'auto' }}>
                {loading && isNavigating ? (
                  // Show minimal loading state during navigation to prevent layout shift
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-2">
                      <div className="flex items-center justify-center opacity-50">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span className="text-sm">Updating...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        Loading options...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : options.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-muted-foreground">
                        <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">No options found</p>
                        <p className="text-sm">Try adjusting your search or filter criteria</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  options.map((option) => (
                    <TableRow key={option._id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Tag className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{option.name}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <span className="font-mono">{option._id.slice(-8)}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyId(option._id)}
                              className="h-4 w-4 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{option.option_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{option.option_value}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={option.is_active ? 'default' : 'secondary'}>
                          {option.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">{option.sort_order}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {new Date(option.createdAt).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleViewOption(option)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditOption(option)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleToggleStatus(option)}
                              disabled={actionLoading === `activate-${option._id}` || actionLoading === `deactivate-${option._id}`}
                            >
                              {option.is_active ? (
                                <>
                                  <PowerOff className="mr-2 h-4 w-4" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <Power className="mr-2 h-4 w-4" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteOption(option)}
                              disabled={actionLoading === `delete-${option._id}`}
                              className="text-destructive"
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

          {/* Table Footer */}
          {totalItems > 0 && (
            <TableFooter
              currentPage={filters.page}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={filters.limit}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
              entityName="options"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
