"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createOrder } from '@/services/order-service';
import { CreateOrderData, Address, OrderStatus, PaymentStatus } from '@/types/order';
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
import { toast } from 'sonner';
import { Package, Plus, MapPin, CreditCard } from 'lucide-react';
import { formatCurrency } from '@/services/order-service';

const ORDER_STATUSES: OrderStatus[] = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURN_REQUESTED', 'RETURNED'];
const PAYMENT_STATUSES: PaymentStatus[] = ['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'];

export default function OrderNewPage() {
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState<CreateOrderData>({
    user_id: '',
    shipping_address: {
      full_name: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
      phone_number: '',
    },
    billing_address: {
      full_name: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
      phone_number: '',
    },
    payment_status: 'PENDING',
    order_status: 'PENDING',
    subtotal_amount: 0,
    shipping_cost: 0,
    tax_amount: 0,
    discount_amount: 0,
    grand_total_amount: 0,
    applied_coupon_code: '',
    tracking_number: '',
    shipping_carrier: '',
    notes: '',
  });

  const [copyBillingAddress, setCopyBillingAddress] = useState(false);

  const handleInputChange = (field: keyof CreateOrderData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddressChange = (
    addressType: 'shipping_address' | 'billing_address',
    field: keyof Address,
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      [addressType]: {
        ...prev[addressType],
        [field]: value
      }
    }));

    // If copying billing address and changing shipping address, update billing too
    if (copyBillingAddress && addressType === 'shipping_address') {
      setFormData(prev => ({
        ...prev,
        billing_address: {
          ...prev.billing_address,
          [field]: value
        }
      }));
    }
  };

  const handleCopyBillingAddress = (checked: boolean) => {
    setCopyBillingAddress(checked);
    if (checked) {
      setFormData(prev => ({
        ...prev,
        billing_address: { ...prev.shipping_address }
      }));
    }
  };

  // Calculate grand total when financial fields change
  const calculateGrandTotal = () => {
    return formData.subtotal_amount + formData.shipping_cost + formData.tax_amount - formData.discount_amount;
  };

  const handleFinancialChange = (field: keyof CreateOrderData, value: number) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      updated.grand_total_amount = updated.subtotal_amount + updated.shipping_cost + updated.tax_amount - updated.discount_amount;
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.user_id.trim()) {
      toast.error('User ID is required.');
      return;
    }

    if (!formData.shipping_address.full_name.trim()) {
      toast.error('Shipping address full name is required.');
      return;
    }

    if (!formData.shipping_address.address_line1.trim()) {
      toast.error('Shipping address line 1 is required.');
      return;
    }

    if (!formData.shipping_address.city.trim() || !formData.shipping_address.state.trim()) {
      toast.error('Shipping address city and state are required.');
      return;
    }

    if (formData.subtotal_amount <= 0) {
      toast.error('Subtotal amount must be greater than 0.');
      return;
    }

    try {
      setIsCreating(true);
      const response = await createOrder(formData);
      toast.success('Order created successfully.');
      router.push(`/orders/${response.data.order._id}`);
    } catch (error) {
      console.error('Failed to create order:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create order. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleBack = () => {
    router.push('/orders');
  };

  const handleCancel = () => {
    router.push('/orders');
  };

  const resetForm = () => {
    setFormData({
      user_id: '',
      shipping_address: {
        full_name: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India',
        phone_number: '',
      },
      billing_address: {
        full_name: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India',
        phone_number: '',
      },
      payment_status: 'PENDING',
      order_status: 'PENDING',
      subtotal_amount: 0,
      shipping_cost: 0,
      tax_amount: 0,
      discount_amount: 0,
      grand_total_amount: 0,
      applied_coupon_code: '',
      tracking_number: '',
      shipping_carrier: '',
      notes: '',
    });
    setCopyBillingAddress(false);
  };

  return (
    <div className="page-container">
      <PageHeader
        showBackButton={true}
        onBack={handleBack}
        icon={Package}
        title="Create New Order"
        description="Create a new order for a customer with shipping and billing details"
      />

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Customer & Order Details */}
            <Card>
              <CardHeader>
                <CardTitle>Order Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="user-id">
                    Customer User ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="user-id"
                    value={formData.user_id}
                    onChange={(e) => handleInputChange('user_id', e.target.value)}
                    placeholder="Enter customer MongoDB ObjectId"
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Enter the MongoDB ObjectId of the customer placing this order
                  </p>
                </div>

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

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="shipping-name">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="shipping-name"
                    value={formData.shipping_address.full_name}
                    onChange={(e) => handleAddressChange('shipping_address', 'full_name', e.target.value)}
                    placeholder="Enter recipient's full name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="shipping-address1">
                    Address Line 1 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="shipping-address1"
                    value={formData.shipping_address.address_line1}
                    onChange={(e) => handleAddressChange('shipping_address', 'address_line1', e.target.value)}
                    placeholder="Street address, building number"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="shipping-address2">Address Line 2</Label>
                  <Input
                    id="shipping-address2"
                    value={formData.shipping_address.address_line2 || ''}
                    onChange={(e) => handleAddressChange('shipping_address', 'address_line2', e.target.value)}
                    placeholder="Apartment, suite, unit (optional)"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label htmlFor="shipping-city">
                      City <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="shipping-city"
                      value={formData.shipping_address.city}
                      onChange={(e) => handleAddressChange('shipping_address', 'city', e.target.value)}
                      placeholder="City"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="shipping-state">
                      State <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="shipping-state"
                      value={formData.shipping_address.state}
                      onChange={(e) => handleAddressChange('shipping_address', 'state', e.target.value)}
                      placeholder="State/Province"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="shipping-pincode">Pincode</Label>
                    <Input
                      id="shipping-pincode"
                      value={formData.shipping_address.pincode}
                      onChange={(e) => handleAddressChange('shipping_address', 'pincode', e.target.value)}
                      placeholder="Postal code"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="shipping-country">Country</Label>
                    <Input
                      id="shipping-country"
                      value={formData.shipping_address.country}
                      onChange={(e) => handleAddressChange('shipping_address', 'country', e.target.value)}
                      placeholder="Country"
                    />
                  </div>

                  <div>
                    <Label htmlFor="shipping-phone">Phone Number</Label>
                    <Input
                      id="shipping-phone"
                      value={formData.shipping_address.phone_number}
                      onChange={(e) => handleAddressChange('shipping_address', 'phone_number', e.target.value)}
                      placeholder="Phone number"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Billing Address */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Billing Address
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="copy-billing"
                      checked={copyBillingAddress}
                      onChange={(e) => handleCopyBillingAddress(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="copy-billing" className="text-sm">
                      Same as shipping address
                    </Label>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {!copyBillingAddress && (
                  <>
                    <div>
                      <Label htmlFor="billing-name">Full Name</Label>
                      <Input
                        id="billing-name"
                        value={formData.billing_address.full_name}
                        onChange={(e) => handleAddressChange('billing_address', 'full_name', e.target.value)}
                        placeholder="Enter billing contact's full name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="billing-address1">Address Line 1</Label>
                      <Input
                        id="billing-address1"
                        value={formData.billing_address.address_line1}
                        onChange={(e) => handleAddressChange('billing_address', 'address_line1', e.target.value)}
                        placeholder="Street address, building number"
                      />
                    </div>

                    <div>
                      <Label htmlFor="billing-address2">Address Line 2</Label>
                      <Input
                        id="billing-address2"
                        value={formData.billing_address.address_line2 || ''}
                        onChange={(e) => handleAddressChange('billing_address', 'address_line2', e.target.value)}
                        placeholder="Apartment, suite, unit (optional)"
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <Label htmlFor="billing-city">City</Label>
                        <Input
                          id="billing-city"
                          value={formData.billing_address.city}
                          onChange={(e) => handleAddressChange('billing_address', 'city', e.target.value)}
                          placeholder="City"
                        />
                      </div>

                      <div>
                        <Label htmlFor="billing-state">State</Label>
                        <Input
                          id="billing-state"
                          value={formData.billing_address.state}
                          onChange={(e) => handleAddressChange('billing_address', 'state', e.target.value)}
                          placeholder="State/Province"
                        />
                      </div>

                      <div>
                        <Label htmlFor="billing-pincode">Pincode</Label>
                        <Input
                          id="billing-pincode"
                          value={formData.billing_address.pincode}
                          onChange={(e) => handleAddressChange('billing_address', 'pincode', e.target.value)}
                          placeholder="Postal code"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="billing-country">Country</Label>
                        <Input
                          id="billing-country"
                          value={formData.billing_address.country}
                          onChange={(e) => handleAddressChange('billing_address', 'country', e.target.value)}
                          placeholder="Country"
                        />
                      </div>

                      <div>
                        <Label htmlFor="billing-phone">Phone Number</Label>
                        <Input
                          id="billing-phone"
                          value={formData.billing_address.phone_number}
                          onChange={(e) => handleAddressChange('billing_address', 'phone_number', e.target.value)}
                          placeholder="Phone number"
                        />
                      </div>
                    </div>
                  </>
                )}
                {copyBillingAddress && (
                  <p className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
                    Billing address will be the same as shipping address.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Financial Details */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="subtotal">
                      Subtotal Amount ($) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="subtotal"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.subtotal_amount}
                      onChange={(e) => handleFinancialChange('subtotal_amount', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="shipping-cost">Shipping Cost ($)</Label>
                    <Input
                      id="shipping-cost"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.shipping_cost}
                      onChange={(e) => handleFinancialChange('shipping_cost', parseFloat(e.target.value) || 0)}
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
                      onChange={(e) => handleFinancialChange('tax_amount', parseFloat(e.target.value) || 0)}
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
                      onChange={(e) => handleFinancialChange('discount_amount', parseFloat(e.target.value) || 0)}
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
                    disabled={isCreating}
                    className="min-w-[120px]"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {isCreating ? 'Creating...' : 'Create Order'}
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
                    <span>Subtotal:</span>
                    <span>{formatCurrency(formData.subtotal_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span>{formatCurrency(formData.shipping_cost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>{formatCurrency(formData.tax_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span>-{formatCurrency(formData.discount_amount)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>{formatCurrency(calculateGrandTotal())}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Creation Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle>Order Creation Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Customer User ID must be a valid MongoDB ObjectId</p>
                <p>• Subtotal amount is required and must be greater than 0</p>
                <p>• Shipping address full name and address line 1 are required</p>
                <p>• Grand total is automatically calculated from all amounts</p>
                <p>• Order items can be added after creation</p>
              </CardContent>
            </Card>

            {/* What happens next */}
            <Card>
              <CardHeader>
                <CardTitle>What happens next?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                    <p>Order will be created with the specified details</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                    <p>You&apos;ll be redirected to the order details page</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                    <p>Order items can be added and managed from there</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                    <p>Customer notifications can be sent based on status</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
