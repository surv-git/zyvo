"use client";

import { useEffect, useState } from 'react';
import { getCartById } from '@/services/cart-service';
import { Cart } from '@/types/cart';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { 
  ShoppingCart, 
  Edit, 
  ArrowLeft, 
  User, 
  Package, 
  DollarSign, 
  Gift,
  Trash2,
  RefreshCcw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { deleteCart, clearCart } from '@/services/cart-service';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';

interface CartViewPageProps {
  params: {
    id: string;
  };
}

export default function CartViewPage({ params }: CartViewPageProps) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const loadCartData = async () => {
      try {
        setIsLoading(true);
        const response = await getCartById(params.id);
        setCart(response.data);
      } catch (error) {
        console.error('Failed to load cart:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load cart details. Please try again.",
        });
        router.push('/carts');
      } finally {
        setIsLoading(false);
      }
    };

    loadCartData();
  }, [params.id, router, toast]);

  const loadCart = async () => {
    try {
      setIsLoading(true);
      const response = await getCartById(params.id);
      setCart(response.data);
    } catch (error) {
      console.error('Failed to load cart:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load cart details. Please try again.",
      });
      router.push('/carts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/carts/${params.id}/edit`);
  };

  const handleBack = () => {
    router.push('/carts');
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteCart(params.id);
      toast({
        title: "Success",
        description: "Cart deleted successfully.",
      });
      router.push('/carts');
    } catch (error) {
      console.error('Failed to delete cart:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete cart. Please try again.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClear = async () => {
    try {
      setIsClearing(true);
      await clearCart(params.id);
      toast({
        title: "Success",
        description: "Cart items cleared successfully.",
      });
      // Reload cart data
      await loadCart();
    } catch (error) {
      console.error('Failed to clear cart:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to clear cart items. Please try again.",
      });
    } finally {
      setIsClearing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-8 w-8" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        
        <div className="mt-6">
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!cart) {
    return (
      <div className="page-container">
        <PageHeader
          icon={ShoppingCart}
          title="Cart Not Found"
          description="The requested cart could not be found."
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        icon={ShoppingCart}
        title={`Cart #${cart._id}`}
        description={`Shopping cart for ${cart.user_id.name} - Created ${formatDate(cart.createdAt)}`}
        actions={[
          {
            label: "Back",
            onClick: handleBack,
            icon: ArrowLeft,
            variant: "outline"
          },
          {
            label: "Edit",
            onClick: handleEdit,
            icon: Edit,
            variant: "default"
          }
        ]}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cart.user_id.name}</div>
            <p className="text-xs text-muted-foreground">
              {cart.user_id.email}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cart.item_count}</div>
            <p className="text-xs text-muted-foreground">
              {cart.item_count === 1 ? 'item' : 'items'} in cart
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(cart.cart_total_amount)}</div>
            <p className="text-xs text-muted-foreground">
              Current cart value
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Cart Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Cart ID</h4>
                  <p className="text-sm">{cart._id}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Customer ID</h4>
                  <p className="text-sm">{cart.user_id._id}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Items Count</h4>
                  <p className="text-sm">{cart.item_count}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Total Price</h4>
                  <p className="text-sm font-semibold">{formatCurrency(cart.cart_total_amount)}</p>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Created</h4>
                  <p className="text-sm">{formatDate(cart.createdAt)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Last Updated</h4>
                  <p className="text-sm">{formatDate(cart.updatedAt)}</p>
                </div>
              </div>

              {cart.applied_coupon_code && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Applied Coupon</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Gift className="h-3 w-3" />
                        {cart.applied_coupon_code}
                      </Badge>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Name</h4>
                <p className="text-sm">{cart.user_id.name}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Email</h4>
                <p className="text-sm">{cart.user_id.email}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Customer Since</h4>
                <p className="text-sm">{formatDate(cart.createdAt)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cart Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleEdit} 
                className="w-full"
                variant="default"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Cart
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    disabled={cart.item_count === 0 || isClearing}
                  >
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    {isClearing ? 'Clearing...' : 'Clear Items'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear Cart Items</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to clear all items from this cart? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClear}>
                      Clear Items
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isDeleting ? 'Deleting...' : 'Delete Cart'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Cart</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this cart? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      Delete Cart
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
