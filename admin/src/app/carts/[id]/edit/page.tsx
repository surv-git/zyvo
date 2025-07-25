"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCartById, updateCart } from '@/services/cart-service';
import { Cart, UpdateCartData } from '@/types/cart';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, ArrowLeft, Save } from 'lucide-react';

interface CartEditPageProps {
  params: {
    id: string;
  };
}

export default function CartEditPage({ params }: CartEditPageProps) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<UpdateCartData>({
    applied_coupon_code: '',
  });
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const loadCartData = async () => {
      try {
        setIsLoading(true);
        const response = await getCartById(params.id);
        const cartData = response.data;
        setCart(cartData);
        setFormData({
          applied_coupon_code: cartData.applied_coupon_code || '',
        });
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



  const handleInputChange = (field: keyof UpdateCartData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cart) return;

    try {
      setIsSaving(true);
      await updateCart(params.id, formData);
      toast({
        title: "Success",
        description: "Cart updated successfully.",
      });
      router.push(`/carts/${params.id}`);
    } catch (error) {
      console.error('Failed to update cart:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update cart. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    router.push(`/carts/${params.id}`);
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
        
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Skeleton className="h-96" />
          </div>
          <div>
            <Skeleton className="h-64" />
          </div>
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
        title={`Edit Cart #${cart._id}`}
        description={`Update shopping cart for ${cart.user_id.name}`}
        actions={[
          {
            label: "Back",
            onClick: handleBack,
            icon: ArrowLeft,
            variant: "outline"
          }
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Cart Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="cart-id">Cart ID</Label>
                    <Input
                      id="cart-id"
                      value={cart._id}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer">Customer</Label>
                    <Input
                      id="customer"
                      value={`${cart.user_id.name} (${cart.user_id.email})`}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="items-count">Items Count</Label>
                    <Input
                      id="items-count"
                      value={cart.item_count}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div>
                    <Label htmlFor="total-amount">Total Amount</Label>
                    <Input
                      id="total-amount"
                      value={`$${cart.cart_total_amount.toFixed(2)}`}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="coupon-code">Applied Coupon Code</Label>
                  <Input
                    id="coupon-code"
                    value={formData.applied_coupon_code || ''}
                    onChange={(e) => handleInputChange('applied_coupon_code', e.target.value)}
                    placeholder="Enter coupon code (optional)"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Leave empty to remove applied coupon
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="min-w-[120px]"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cart Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Items:</span>
                <span className="text-sm font-medium">{cart.item_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Has Items:</span>
                <span className="text-sm font-medium">
                  {cart.has_items ? 'Yes' : 'No'}
                </span>
              </div>
              {cart.applied_coupon_code && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Coupon:</span>
                  <span className="text-sm font-medium">{cart.applied_coupon_code}</span>
                </div>
              )}
              {cart.coupon_discount_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Discount:</span>
                  <span className="text-sm font-medium text-green-600">
                    -${cart.coupon_discount_amount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-base font-semibold pt-2 border-t">
                <span>Total:</span>
                <span>${cart.cart_total_amount.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cart Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Created</h4>
                <p className="text-sm">{formatDate(cart.createdAt)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Last Updated</h4>
                <p className="text-sm">{formatDate(cart.updatedAt)}</p>
              </div>
              {cart.last_updated_at && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Last Activity</h4>
                  <p className="text-sm">{formatDate(cart.last_updated_at)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
