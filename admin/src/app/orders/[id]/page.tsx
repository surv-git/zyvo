"use client";

import { useEffect, useState, use } from 'react';
import { getOrderById, deleteOrder, cancelOrder, updateOrderStatus, updatePaymentStatus } from '@/services/order-service';
import { OrderWithItems, OrderStatus, PaymentStatus } from '@/types/order';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { 
  Package, 
  Edit, 
  MapPin, 
  CreditCard,
  DollarSign,
  Gift,
  Trash2,
  Ban,
  Phone
} from 'lucide-react';
import { toast } from 'sonner';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency, formatOrderNumber, getOrderStatusColor, getPaymentStatusColor } from '@/services/order-service';

interface OrderViewPageProps {
  params: Promise<{
    id: string;
  }>;
}

const ORDER_STATUSES: OrderStatus[] = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURN_REQUESTED', 'RETURNED'];
const PAYMENT_STATUSES: PaymentStatus[] = ['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'];

export default function OrderViewPage({ params }: OrderViewPageProps) {
  const resolvedParams = use(params);
  const [orderData, setOrderData] = useState<OrderWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadOrderData = async () => {
      try {
        setIsLoading(true);
        const response = await getOrderById(resolvedParams.id);
        setOrderData(response.data);
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

  const loadOrder = async () => {
    try {
      setIsLoading(true);
      const response = await getOrderById(resolvedParams.id);
      setOrderData(response.data);
    } catch (error) {
      console.error('Failed to load order:', error);
      toast.error('Failed to load order details. Please try again.');
      router.push('/orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/orders/${resolvedParams.id}/edit`);
  };

  const handleBack = () => {
    router.push('/orders');
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteOrder(resolvedParams.id);
      toast.success('Order deleted successfully.');
      router.push('/orders');
    } catch (error) {
      console.error('Failed to delete order:', error);
      toast.error('Failed to delete order. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = async () => {
    try {
      setIsCancelling(true);
      await cancelOrder(resolvedParams.id);
      toast.success('Order cancelled successfully.');
      await loadOrder();
    } catch (error) {
      console.error('Failed to cancel order:', error);
      toast.error('Failed to cancel order. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      setIsUpdatingStatus(true);
      await updateOrderStatus(resolvedParams.id, newStatus);
      toast.success('Order status updated successfully.');
      await loadOrder();
    } catch (error) {
      console.error('Failed to update order status:', error);
      toast.error('Failed to update order status. Please try again.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handlePaymentStatusChange = async (newStatus: string) => {
    try {
      setIsUpdatingPayment(true);
      await updatePaymentStatus(resolvedParams.id, newStatus);
      toast.success('Payment status updated successfully.');
      await loadOrder();
    } catch (error) {
      console.error('Failed to update payment status:', error);
      toast.error('Failed to update payment status. Please try again.');
    } finally {
      setIsUpdatingPayment(false);
    }
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
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32" />
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
        title={formatOrderNumber(order.order_number)}
        description={`Order placed on ${formatDate(order.createdAt)} • ${items.length} items`}
        actions={[
          {
            label: "Edit",
            onClick: handleEdit,
            icon: Edit,
            variant: "default"
          }
        ]}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Order Status</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge className={getOrderStatusColor(order.order_status)}>
                {order.order_status.replace('_', ' ')}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge className={getPaymentStatusColor(order.payment_status)}>
                {order.payment_status.replace('_', ' ')}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items.length}</div>
            <p className="text-xs text-muted-foreground">
              {items.length === 1 ? 'item' : 'items'} ordered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(order.grand_total_amount)}</div>
            <p className="text-xs text-muted-foreground">
              Grand total
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item._id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.product_name}</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>SKU: {item.sku_code}</p>
                        <p>Quantity: {item.quantity}</p>
                        <p>Unit Price: {formatCurrency(item.price)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(item.subtotal)}</div>
                    </div>
                  </div>
                ))}
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(order.subtotal_amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping:</span>
                    <span>{formatCurrency(order.shipping_cost)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax:</span>
                    <span>{formatCurrency(order.tax_amount)}</span>
                  </div>
                  {order.discount_amount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount:</span>
                      <span>-{formatCurrency(order.discount_amount)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>{formatCurrency(order.grand_total_amount)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Addresses */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p className="font-medium">{order.shipping_address.full_name}</p>
                  <p>{order.shipping_address.address_line1}</p>
                  {order.shipping_address.address_line2 && (
                    <p>{order.shipping_address.address_line2}</p>
                  )}
                  <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.pincode}</p>
                  <p>{order.shipping_address.country}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Phone className="h-4 w-4" />
                    <span>{order.shipping_address.phone_number}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Billing Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p className="font-medium">{order.billing_address.full_name}</p>
                  <p>{order.billing_address.address_line1}</p>
                  {order.billing_address.address_line2 && (
                    <p>{order.billing_address.address_line2}</p>
                  )}
                  <p>{order.billing_address.city}, {order.billing_address.state} {order.billing_address.pincode}</p>
                  <p>{order.billing_address.country}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Phone className="h-4 w-4" />
                    <span>{order.billing_address.phone_number}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          {/* Status Management */}
          <Card>
            <CardHeader>
              <CardTitle>Status Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Order Status</label>
                <Select
                  value={order.order_status}
                  onValueChange={handleStatusChange}
                  disabled={isUpdatingStatus}
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
                <label className="text-sm font-medium mb-2 block">Payment Status</label>
                <Select
                  value={order.payment_status}
                  onValueChange={handlePaymentStatusChange}
                  disabled={isUpdatingPayment}
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
            </CardContent>
          </Card>

          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Order ID</h4>
                <p className="text-sm font-mono">{order._id}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Customer ID</h4>
                <p className="text-sm font-mono">
                  {typeof order.user_id === 'string' ? order.user_id : order.user_id._id}
                </p>
                {typeof order.user_id === 'object' && order.user_id.email && (
                  <div className="mt-2">
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Customer Email</h4>
                    <p className="text-sm">{order.user_id.email}</p>
                  </div>
                )}
              </div>
              {order.tracking_number && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Tracking Number</h4>
                  <p className="text-sm font-mono">{order.tracking_number}</p>
                </div>
              )}
              {order.shipping_carrier && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Shipping Carrier</h4>
                  <p className="text-sm">{order.shipping_carrier}</p>
                </div>
              )}
              {order.applied_coupon_code && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Applied Coupon</h4>
                  <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                    <Gift className="h-3 w-3" />
                    {order.applied_coupon_code}
                  </Badge>
                </div>
              )}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Created</h4>
                <p className="text-sm">{formatDate(order.createdAt)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Last Updated</h4>
                <p className="text-sm">{formatDate(order.updatedAt)}</p>
              </div>
              {order.notes && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Notes</h4>
                  <p className="text-sm">{order.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Order Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleEdit} 
                className="w-full"
                variant="default"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Order
              </Button>

              {order.order_status !== 'CANCELLED' && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      disabled={isCancelling}
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      {isCancelling ? 'Cancelling...' : 'Cancel Order'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Order</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to cancel this order? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleCancel}>
                        Cancel Order
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isDeleting ? 'Deleting...' : 'Delete Order'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Order</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this order? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      Delete Order
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
