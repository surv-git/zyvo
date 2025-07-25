"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { getOrderById, updateOrder } from '@/services/order-service';
import { OrderWithItems, UpdateOrderData, OrderStatus, PaymentStatus } from '@/types/order';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Package, Save, MapPin } from 'lucide-react';
import { formatCurrency, formatOrderNumber } from '@/services/order-service';

interface OrderEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

const ORDER_STATUSES: OrderStatus[] = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURN_REQUESTED', 'RETURNED'];
const PAYMENT_STATUSES: PaymentStatus[] = ['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'];

export default function OrderEditPage({ params }: OrderEditPageProps) {
  const resolvedParams = use(params);
  const [orderData, setOrderData] = useState<OrderWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState<UpdateOrderData>({
    order_status: 'PENDING',
    payment_status: 'PENDING',
    shipping_cost: 0,
    tax_amount: 0,
    discount_amount: 0,
    applied_coupon_code: '',
    tracking_number: '',
    shipping_carrier: '',
    notes: '',
  });

  useEffect(() => {
    const loadOrderData = async () => {
      try {
        setIsLoading(true);
        const response = await getOrderById(resolvedParams.id);
        const order = response.data;
        setOrderData(order);
        
        // Populate form with current order data
        setFormData({
          order_status: order.order.order_status,
          payment_status: order.order.payment_status,
          shipping_cost: order.order.shipping_cost,
          tax_amount: order.order.tax_amount,
          discount_amount: order.order.discount_amount,
          applied_coupon_code: order.order.applied_coupon_code || '',
          tracking_number: order.order.tracking_number || '',
          shipping_carrier: order.order.shipping_carrier || '',
          notes: order.order.notes || '',
        });
      } catch (error) {
        console.error('Failed to load order:', error);
        toast.error('Failed to load order details. Please try again.');
        router.push('/orders');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrderData();
  }, [resolvedParams.id, router]);

  const handleInputChange = (field: keyof UpdateOrderData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      await updateOrder(resolvedParams.id, formData);
      toast.success('Order updated successfully.');
      router.push(`/orders/${resolvedParams.id}`);
    } catch (error) {
      console.error('Failed to update order:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update order. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    router.push(`/orders/${resolvedParams.id}`);
  };

  const handleCancel = () => {
    router.push(`/orders/${resolvedParams.id}`);
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

  if (!orderData) {
    return (
      <div className="page-container">
        <PageHeader
          icon={Package}
          title="Order Not Found"
          description="The requested order could not be found."
        />
      </div>
    );
  }

  const { order, items } = orderData;

  return (
    <div className="page-container">
      <PageHeader
        showBackButton={true}
        onBack={handleBack}
        icon={Package}
        title={`Edit ${formatOrderNumber(order.order_number)}`}
        description="Update order details, status, and shipping information"
      />

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status */}
            <Card>
              <CardHeader>
                <CardTitle>Order Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="order-status">Order Status</Label>
                    <Select
                      value={formData.order_status}
                      onValueChange={(value) => handleInputChange('order_status', value as OrderStatus)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUSES.map(status => (
                          <SelectItem key={status} value={status}>
                            {status.replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="payment-status">Payment Status</Label>
                    <Select
                      value={formData.payment_status}
                      onValueChange={(value) => handleInputChange('payment_status', value as PaymentStatus)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_STATUSES.map(status => (
                          <SelectItem key={status} value={status}>
                            {status.replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping & Financial Details */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label htmlFor="shipping-cost">Shipping Cost ($)</Label>
                    <Input
                      id="shipping-cost"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.shipping_cost}
                      onChange={(e) => handleInputChange('shipping_cost', parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="tax-amount">Tax Amount ($)</Label>
                    <Input
                      id="tax-amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.tax_amount}
                      onChange={(e) => handleInputChange('tax_amount', parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="discount-amount">Discount Amount ($)</Label>
                    <Input
                      id="discount-amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.discount_amount}
                      onChange={(e) => handleInputChange('discount_amount', parseFloat(e.target.value) || 0)}
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
                </div>
              </CardContent>
            </Card>

            {/* Shipping Information */}
            <Card>
              <CardHeader>
                <CardTitle>Shipping Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="tracking-number">Tracking Number</Label>
                    <Input
                      id="tracking-number"
                      value={formData.tracking_number || ''}
                      onChange={(e) => handleInputChange('tracking_number', e.target.value)}
                      placeholder="Enter tracking number (optional)"
                    />
                  </div>

                  <div>
                    <Label htmlFor="shipping-carrier">Shipping Carrier</Label>
                    <Input
                      id="shipping-carrier"
                      value={formData.shipping_carrier || ''}
                      onChange={(e) => handleInputChange('shipping_carrier', e.target.value)}
                      placeholder="e.g., FedEx, UPS, DHL (optional)"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Order Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes || ''}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Add any notes about this order (optional)"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Form Actions */}
            <Card>
              <CardContent className="pt-6">
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
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Order Number:</span>
                    <span className="font-mono">{formatOrderNumber(order.order_number)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Items:</span>
                    <span>{items.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(order.subtotal_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span>{formatCurrency(formData.shipping_cost || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>{formatCurrency(formData.tax_amount || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span>-{formatCurrency(formData.discount_amount || 0)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>
                        {formatCurrency(
                          order.subtotal_amount + 
                          (formData.shipping_cost || 0) + 
                          (formData.tax_amount || 0) - 
                          (formData.discount_amount || 0)
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Customer Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-2">
                  <h4 className="font-medium">Shipping Address</h4>
                  <div className="pl-3 text-muted-foreground">
                    <p>{order.shipping_address.full_name}</p>
                    <p>{order.shipping_address.address_line1}</p>
                    {order.shipping_address.address_line2 && (
                      <p>{order.shipping_address.address_line2}</p>
                    )}
                    <p>{order.shipping_address.city}, {order.shipping_address.state}</p>
                    <p>{order.shipping_address.pincode} {order.shipping_address.country}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Edit Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle>Edit Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Status changes will trigger customer notifications</p>
                <p>• Tracking numbers enable customer shipment tracking</p>
                <p>• Financial adjustments recalculate order totals</p>
                <p>• Order notes are internal and not visible to customers</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
