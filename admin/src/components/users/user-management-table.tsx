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
import { getSiteConfigSync } from '@/config/site';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TableFooter } from '@/components/ui/table-footer';
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  UserX, 
  UserCheck, 
  Trash2, 
  Search,
  RefreshCw,
  Loader2,
  AlertCircle,
  BadgeCheck,
  BadgeX,
  Copy,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

import { User, UserTableFilters, UserStatus } from '@/types/user';
import { 
  getUserList, 
  suspendUser, 
  activateUser, 
  deleteUser, 
  getUserServiceErrorMessage 
} from '@/services/user-service';
import { toast } from 'sonner';

// Simple confirmation dialog component
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  isDestructive?: boolean;
}

function ConfirmDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  description, 
  confirmText = "Confirm",
  isDestructive = false 
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/80" onClick={onClose} />
      <div className="relative z-50 grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg sm:rounded-lg">
        <div className="flex flex-col space-y-2 text-center sm:text-left">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <Button variant="outline" onClick={onClose} className="mt-2 sm:mt-0">
            Cancel
          </Button>
          <Button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={isDestructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface UserManagementTableProps {
  className?: string;
}

export function UserManagementTable({ className }: UserManagementTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Scroll preservation state
  const [isNavigating, setIsNavigating] = useState(false);
  const scrollPositionRef = useRef<{ x: number; y: number } | null>(null);
  const lastScrollPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const scrollLockIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const scrollBlockerRef = useRef<((e: Event) => boolean) | null>(null);
  const fetchingRef = useRef<boolean>(false);
  const isNavigatingRef = useRef<boolean>(false);

  // State management
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    isDestructive?: boolean;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  // Filters from URL parameters
  const filters = useMemo((): UserTableFilters => ({
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || getSiteConfigSync().admin.itemsPerPage.toString()),
    search: searchParams.get('search') || '',
    role: searchParams.get('role') as 'user' | 'admin' | undefined,
    is_active: searchParams.get('is_active') ? searchParams.get('is_active') === 'true' : undefined,
    sort: (searchParams.get('sort') as UserTableFilters['sort']) || 'createdAt',
    order: (searchParams.get('order') as UserTableFilters['order']) || 'desc',
  }), [searchParams]);

  // Update URL parameters
  const updateFilters = useCallback((newFilters: Partial<UserTableFilters>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === undefined || value === '' || value === null) {
        params.delete(key);
      } else {
        params.set(key, value.toString());
      }
    });

    // Use scroll: false to prevent automatic scroll-to-top
    router.push(`/users?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  // Show toast
  const showToast = (message: string, type: 'success' | 'error') => {
    if (type === 'error') {
      toast.error(message);
    } else {
      toast.success(message);
    }
  };

  // Handle items per page change
  const handleItemsPerPageChange = (value: number) => {
    updateFilters({ limit: value, page: 1 });
  };

  // Fetch users data
  const fetchUsers = useCallback(async () => {
    // Prevent duplicate fetch calls
    if (fetchingRef.current) {
      console.log('👥 fetchUsers blocked - already in progress');
      return;
    }
    
    fetchingRef.current = true;
    console.log('👥 fetchUsers started');
    console.log('👥 isNavigating:', isNavigatingRef.current);
    console.log('👥 scrollPositionRef.current:', scrollPositionRef.current);
    
    try {
      // Preserve scroll position during loading if navigating
      const shouldPreserveScroll = isNavigatingRef.current && scrollPositionRef.current;
      const preservedPosition = shouldPreserveScroll ? scrollPositionRef.current : null;
      
      console.log('👥 shouldPreserveScroll:', shouldPreserveScroll);
      console.log('👥 preservedPosition:', preservedPosition);
      
      // Set loading state
      setLoading(true);
      setError(null);
      console.log('👥 Loading state set to true');
      
      // If preserving scroll, lock the scroll position immediately and continuously
      if (preservedPosition) {
        console.log('👥 Starting aggressive scroll lock');
        const mainElement = document.querySelector('main');
        
        // Create a more aggressive scroll lock
        const lockScroll = () => {
          if (mainElement) {
            const beforeY = mainElement.scrollTop;
            mainElement.scrollTop = preservedPosition.y;
            mainElement.scrollLeft = preservedPosition.x;
            console.log('👥 Main scroll locked:', { 
              before: beforeY, 
              target: preservedPosition.y, 
              after: mainElement.scrollTop 
            });
          } else {
            const beforeY = window.pageYOffset;
            window.scrollTo(preservedPosition.x, preservedPosition.y);
            document.documentElement.scrollTop = preservedPosition.y;
            document.body.scrollTop = preservedPosition.y;
            console.log('👥 Window scroll locked:', { 
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
        console.log('👥 Scroll lock interval started');
        
        // Store interval in ref to clear it later
        scrollLockIntervalRef.current = scrollLockInterval;
      }
      
      console.log('👥 Fetching data...');
      const response = await getUserList(filters);
      console.log('👥 Data fetched successfully');
      
      // Update data in a way that doesn't trigger scroll resets
      requestAnimationFrame(() => {
        console.log('👥 Updating data in requestAnimationFrame');
        setUsers(response.users);
        setTotalPages(response.totalPages);
        setTotalUsers(response.total);
        console.log('👥 Data state updated');
        
        // Final scroll restoration after data is set
        if (preservedPosition) {
          console.log('👥 Final scroll restoration');
          const mainElement = document.querySelector('main');
          const finalRestore = () => {
            if (mainElement) {
              const beforeY = mainElement.scrollTop;
              mainElement.scrollTo({
                left: preservedPosition.x,
                top: preservedPosition.y,
                behavior: 'instant'
              });
              console.log('👥 Final main restore:', { 
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
              console.log('👥 Final window restore:', { 
                before: beforeY, 
                target: preservedPosition.y, 
                after: window.pageYOffset 
              });
            }
          };
          
          // Simplified since blocking is working well
          finalRestore();
          requestAnimationFrame(finalRestore);
        }
      });
      
    } catch (err: unknown) {
      console.error('👥 Failed to fetch users:', err);
      const errorMessage = getUserServiceErrorMessage(err);
      setError(errorMessage);
      
      // Check if it's an authentication error
      if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 401) {
        showToast('Please log in to access user management.', 'error');
        // Redirect to login after a short delay
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        showToast(errorMessage, 'error');
      }
    } finally {
      // Clear scroll lock interval
      if (scrollLockIntervalRef.current) {
        clearInterval(scrollLockIntervalRef.current);
        scrollLockIntervalRef.current = null;
        console.log('👥 Scroll lock interval cleared');
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
          console.log('👥 Comprehensive scroll blocking removed');
        }
      };
      
      // Remove blocking after a short delay to ensure data is fully rendered
      setTimeout(removeScrollBlocking, 100);
      
      setLoading(false);
      fetchingRef.current = false;
      console.log('👥 Loading state set to false, fetch lock released');
    }
  }, [filters, router]); // Removed isNavigating from dependency array

  // Initial data fetch
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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

  // Restore scroll position after data loads
  useEffect(() => {
    console.log('👥 Scroll restoration effect triggered:', { 
      loading, 
      isNavigating, 
      hasScrollPosition: !!scrollPositionRef.current,
      users: users.length 
    });
    
    if (!loading && scrollPositionRef.current && isNavigating) {
      const position = scrollPositionRef.current;
      console.log('👥 Position to restore:', position);
      
      // Only restore if we have a meaningful scroll position
      if (position.y > 0 || position.x > 0) {
        // Check if we have a main element (layout with sidebar)
        const mainElement = document.querySelector('main');
        console.log('👥 Main element for restoration:', !!mainElement);
        
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
            console.log('👥 Main element restored:', { before: beforeY, target: position.y, after: mainElement.scrollTop });
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
            console.log('👥 Window restored:', { before: beforeY, target: position.y, after: window.pageYOffset });
          }
        };
        
        // Simplified restoration - the blocking is working well
        console.log('👥 Final scroll restoration');
        restoreScroll();
        
        // Just one additional attempt to be safe
        requestAnimationFrame(() => {
          console.log('👥 requestAnimationFrame restoration');
          restoreScroll();
        });
      } else {
        console.log('👥 No meaningful scroll position to restore');
      }
      
      // Clear the position and navigation state after a longer delay
      setTimeout(() => {
        console.log('👥 Clearing navigation state and scroll position');
        scrollPositionRef.current = null;
        setIsNavigating(false);
        isNavigatingRef.current = false;
      }, 1000); // Reduced from 3000ms to 1000ms since blocking is working
    } else if (!loading && !scrollPositionRef.current && isNavigating) {
      // No scroll position to restore, just clear navigation state
      console.log('👥 No scroll position, clearing navigation state');
      setIsNavigating(false);
      isNavigatingRef.current = false;
    }
  }, [loading, users, isNavigating]);

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
        // console.log('👥 Tracking main scroll:', newPosition);
      } else {
        // Fallback to window scroll
        const newPosition = {
          x: window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0,
          y: window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0,
        };
        lastScrollPositionRef.current = newPosition;
        // console.log('👥 Tracking window scroll:', newPosition);
      }
    };
    
    // Track scroll position continuously
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.addEventListener('scroll', trackScroll, { passive: true });
      console.log('👥 Scroll tracking added to main element');
    } else {
      window.addEventListener('scroll', trackScroll, { passive: true });
      console.log('👥 Scroll tracking added to window');
    }
    
    return () => {
      if (mainElement) {
        mainElement.removeEventListener('scroll', trackScroll);
        console.log('👥 Scroll tracking removed from main element');
      } else {
        window.removeEventListener('scroll', trackScroll);
        console.log('👥 Scroll tracking removed from window');
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
      
      // Reset fetch lock and navigation state
      fetchingRef.current = false;
      isNavigatingRef.current = false;
      
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

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  // Handle filter changes
  const handleFilterChange = useCallback((key: keyof UserTableFilters, value: UserTableFilters[keyof UserTableFilters]) => {
    const newFilters: Partial<UserTableFilters> = {
      [key]: value,
      page: key !== 'page' ? 1 : (value as number) // Reset to page 1 when changing filters
    };
    updateFilters(newFilters);
  }, [updateFilters]);

  // Handle sort changes
  const handleSortChange = (field: string) => {
    const newOrder = filters.sort === field && filters.order === 'asc' ? 'desc' : 'asc';
    updateFilters({
      sort: field as UserTableFilters['sort'],
      order: newOrder,
      page: 1
    });
  };

  // Get sort icon
  const getSortIcon = (field: string) => {
    if (filters.sort !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return filters.order === 'asc' ? 
      <ArrowUp className="ml-2 h-4 w-4" /> : 
      <ArrowDown className="ml-2 h-4 w-4" />;
  };

  // Get user status
  const getUserStatus = (user: User): UserStatus => {
    if (!user.isActive) return 'Inactive';
    return 'Active';
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: UserStatus) => {
    switch (status) {
      case 'Active':
        return 'default';
      case 'Inactive':
        return 'secondary';
      case 'Suspended':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  // Get role badge variant
  const getRoleBadgeVariant = (role: string) => {
    return role === 'admin' ? 'default' : 'outline';
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch {
      return 'Invalid date';
    }
  };

  // Truncate ID
  const truncateId = (id: string) => {
    return `${id.slice(0, 8)}...`;
  };

  // Handle user actions
  const handleViewUser = (userId: string) => {
    router.push(`/users/${userId}`);
  };

  const handleEditUser = (userId: string) => {
    router.push(`/users/${userId}/edit`);
  };

  const handleSuspendUser = async (userId: string, userName: string) => {
    try {
      setActionLoading(userId);
      await suspendUser(userId, 'Suspended by admin');
      
      // Update local state
      setUsers(prev => prev.map(user => 
        user._id === userId ? { ...user, isActive: false } : user
      ));
      
      showToast(`User ${userName} has been suspended.`, 'success');
    } catch (err) {
      const errorMessage = getUserServiceErrorMessage(err);
      showToast(errorMessage, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivateUser = async (userId: string, userName: string) => {
    try {
      setActionLoading(userId);
      await activateUser(userId, 'Activated by admin');
      
      // Update local state
      setUsers(prev => prev.map(user => 
        user._id === userId ? { ...user, isActive: true } : user
      ));
      
      showToast(`User ${userName} has been activated.`, 'success');
    } catch (err) {
      const errorMessage = getUserServiceErrorMessage(err);
      showToast(errorMessage, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    try {
      setActionLoading(userId);
      await deleteUser(userId, 'Deleted by admin');
      
      // Remove from local state
      setUsers(prev => prev.filter(user => user._id !== userId));
      setTotalUsers(prev => prev - 1);
      
      showToast(`User ${userName} has been deleted.`, 'success');
    } catch (err) {
      const errorMessage = getUserServiceErrorMessage(err);
      showToast(errorMessage, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Confirmation dialogs
  const confirmSuspend = (user: User) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Suspend User',
      description: `Are you sure you want to suspend ${user.name}? This will prevent them from accessing their account.`,
      onConfirm: () => handleSuspendUser(user._id, user.name),
      isDestructive: true,
    });
  };

  const confirmDelete = (user: User) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete User',
      description: `Are you sure you want to delete ${user.name}? This action cannot be undone and will permanently remove the user and all associated data.`,
      onConfirm: () => handleDeleteUser(user._id, user.name),
      isDestructive: true,
    });
  };

  // Handle pagination with scroll preservation
  const handlePageChange = useCallback((page: number) => {
    console.log('👥 Users handlePageChange started for page:', page);
    
    // Check if we have a main element (layout with sidebar)
    const mainElement = document.querySelector('main');
    console.log('👥 Main element found:', !!mainElement);
    
    let currentScrollY = 0;
    let currentScrollX = 0;
    
    if (mainElement) {
      // Get scroll position from main element
      currentScrollY = mainElement.scrollTop || 0;
      currentScrollX = mainElement.scrollLeft || 0;
      console.log('👥 Main element scroll:', { x: currentScrollX, y: currentScrollY });
    } else {
      // Fallback to window scroll
      currentScrollY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
      currentScrollX = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0;
      console.log('👥 Window scroll:', { x: currentScrollX, y: currentScrollY });
    }
    
    const trackedPosition = lastScrollPositionRef.current;
    console.log('👥 Tracked position:', trackedPosition);
    
    // Use the highest value from different methods
    const finalY = Math.max(currentScrollY, trackedPosition.y);
    const finalX = Math.max(currentScrollX, trackedPosition.x);
    
    const finalPosition = { x: finalX, y: finalY };
    console.log('👥 Final position to preserve:', finalPosition);
    
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
      
      console.log('👥 Blocked scroll event and restored position');
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
      
      console.log('👥 Added comprehensive scroll blocking');
    };
    
    // Immediately lock the scroll position to prevent any movement
    const lockScroll = () => {
      if (mainElement) {
        mainElement.scrollTop = finalPosition.y;
        mainElement.scrollLeft = finalPosition.x;
        console.log('👥 Scroll locked to main element:', finalPosition);
      } else {
        window.scrollTo(finalPosition.x, finalPosition.y);
        console.log('👥 Scroll locked to window:', finalPosition);
      }
    };
    
    // Start comprehensive scroll blocking
    addScrollBlocking();
    
    // Start locking immediately and continuously
    lockScroll();
    requestAnimationFrame(lockScroll);
    
    // Store the blocking function to remove it later
    scrollBlockerRef.current = blockAllScrolling;
    console.log('👥 Comprehensive scroll protection activated');
    
    // Set navigation state
    setIsNavigating(true);
    isNavigatingRef.current = true;
    console.log('👥 Navigation state set to true');
    
    // Update URL with new page
    updateFilters({ page });
    console.log('👥 URL updated for page:', page);
  }, [updateFilters]);

  // Refresh data
  const handleRefresh = useCallback(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Manage user accounts, roles, and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search users..."
                  value={filters.search || ''}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={filters.role || 'all'}
              onValueChange={(value) => handleFilterChange('role', value === 'all' ? undefined : value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.is_active === undefined ? 'all' : filters.is_active.toString()}
              onValueChange={(value) => handleFilterChange('is_active', value === 'all' ? undefined : value === 'true')}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.sort || 'createdAt'}
              onValueChange={(value) => handleFilterChange('sort', value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="role">Role</SelectItem>
                <SelectItem value="createdAt">Created</SelectItem>
                <SelectItem value="lastLoginAt">Last Login</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.order || 'desc'}
              onValueChange={(value) => handleFilterChange('order', value)}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
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
                  <Button onClick={fetchUsers} className="mt-2">
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
              <p className="text-muted-foreground mt-2">Loading users...</p>
            </div>
          )}

          {/* Table */}
          {!loading && !error && (
            <>
              <div className="table-container">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSortChange('name')}
                          className="h-auto p-0 font-semibold"
                        >
                          Name
                          {getSortIcon('name')}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSortChange('email')}
                          className="h-auto p-0 font-semibold"
                        >
                          Email
                          {getSortIcon('email')}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSortChange('role')}
                          className="h-auto p-0 font-semibold"
                        >
                          Role
                          {getSortIcon('role')}
                        </Button>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSortChange('lastLoginAt')}
                          className="h-auto p-0 font-semibold"
                        >
                          Last Login
                          {getSortIcon('lastLoginAt')}
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users && users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      users?.map((user) => (
                        <TableRow key={user._id}>                          
                          <TableCell className="font-medium">
                            {user.name}
                            <div className='font-mono text-xs mt-2 flex'>
                              {truncateId(user._id)}<Copy 
                                className="ml-2 h-3 w-3 cursor-pointer hover:text-primary" 
                                onClick={async () => {
                                  try {
                                    await navigator.clipboard.writeText(user._id);
                                    toast.success('User ID copied to clipboard');
                                  } catch {
                                    toast.error('Failed to copy to clipboard');
                                  }
                                }} 
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center'>
                              {user.isEmailVerified ? <BadgeCheck className="mr-2 h-4 w-4" /> : <BadgeX className="mr-2 h-4 w-4" />} {user.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadgeVariant(user.role)}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(getUserStatus(user))}>
                              {getUserStatus(user)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(user.lastLogin)}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  className="h-8 w-8 p-0"
                                  disabled={actionLoading === user._id}
                                >
                                  {actionLoading === user._id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <MoreHorizontal className="h-4 w-4" />
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewUser(user._id)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditUser(user._id)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {user.isActive ? (
                                  <DropdownMenuItem onClick={() => confirmSuspend(user)}>
                                    <UserX className="mr-2 h-4 w-4" />
                                    Suspend
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem 
                                    onClick={() => handleActivateUser(user._id, user.name)}
                                  >
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    Activate
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => confirmDelete(user)}
                                  className="text-destructive focus:text-destructive"
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

              {/* Table Footer with Pagination */}
              {totalUsers > 0 && (
                <TableFooter
                  currentPage={filters.page}
                  totalPages={totalPages}
                  totalItems={totalUsers}
                  itemsPerPage={filters.limit || 10}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                  showItemsPerPageSelector={true}
                  entityName="users"
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        isDestructive={confirmDialog.isDestructive}
      />
    </>
  );
}
