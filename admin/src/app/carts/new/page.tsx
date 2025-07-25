"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCart } from '@/services/cart-service';
import { CreateCartData } from '@/types/cart';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, ArrowLeft, Plus } from 'lucide-react';

export default function CartNewPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<CreateCartData>({
    user_id: '',
    applied_coupon_code: '',
  });
  const router = useRouter();
  const { toast } = useToast();

  const handleInputChange = (field: keyof CreateCartData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.user_id.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "User ID is required.",
      });
      return;
    }

    try {
      setIsCreating(true);
      const response = await createCart(formData);
      toast({
        title: "Success",
        description: "Cart created successfully.",
      });
      router.push(`/carts/${response.data._id}`);
    } catch (error) {
      console.error('Failed to create cart:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create cart. Please try again.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleBack = () => {
    router.push('/carts');
  };

  const resetForm = () => {
    setFormData({
      user_id: '',
      applied_coupon_code: '',
    });
  };

  return (
    <div className="page-container">
      <PageHeader
        icon={ShoppingCart}
        title="Create New Cart"
        description="Create a new shopping cart for a customer"
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
                <div>
                  <Label htmlFor="user-id">
                    User ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="user-id"
                    value={formData.user_id}
                    onChange={(e) => handleInputChange('user_id', e.target.value)}
                    placeholder="Enter customer user ID"
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Enter the MongoDB ObjectId of the customer
                  </p>
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
                    Optional coupon code to apply to the cart
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={isCreating}
                    className="min-w-[120px]"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {isCreating ? 'Creating...' : 'Create Cart'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    disabled={isCreating}
                  >
                    Reset
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
              <CardTitle>Cart Creation Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm space-y-2">
                <p><strong>User ID:</strong> Must be a valid MongoDB ObjectId of an existing customer.</p>
                <p><strong>Coupon Code:</strong> Optional field. If provided, the coupon will be validated and applied to the cart if valid.</p>
                <p><strong>Initial State:</strong> New carts start empty with 0 items and $0.00 total.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What happens next?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm space-y-3">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                  <p>Cart will be created with the specified user and coupon</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                  <p>You&apos;ll be redirected to the cart details page</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                  <p>Customer can start adding items to their cart</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
