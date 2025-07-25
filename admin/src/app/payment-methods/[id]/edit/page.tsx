"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  Save,
  Loader2,
  CreditCard,
  Edit,
  Settings,
  User,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/page-header';
import { 
  PaymentMethod,
  PaymentMethodType,
  getPaymentMethodTypeLabel
} from '@/types/payment-method';
import { 
  getPaymentMethodById,
  updatePaymentMethod
} from '@/services/payment-method-service';

const PAYMENT_METHOD_TYPES: PaymentMethodType[] = ['CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'WALLET', 'NETBANKING'];

interface FormData {
  alias: string;
  display_name: string;
  method_type: PaymentMethodType;
  is_active: boolean;
  is_default: boolean;
  details: string;
}

interface FormErrors {
  alias?: string;
  display_name?: string;
  method_type?: string;
  details?: string;
}

export default function PaymentMethodEditPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState<FormData>({
    alias: '',
    display_name: '',
    method_type: 'CREDIT_CARD',
    is_active: true,
    is_default: false,
    details: '',
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const paymentMethodId = params.id as string;

  // Fetch payment method data
  const fetchPaymentMethod = useCallback(async () => {
    try {
      setLoading(true);
      const paymentMethodData = await getPaymentMethodById(paymentMethodId);
      
      // Store the payment method data
      setPaymentMethod(paymentMethodData);
      
      // Set form values
      setFormData({
        alias: paymentMethodData.alias,
        display_name: paymentMethodData.display_name,
        method_type: paymentMethodData.method_type,
        is_active: paymentMethodData.is_active,
        is_default: paymentMethodData.is_default,
        details: JSON.stringify(paymentMethodData.details, null, 2),
      });
      
      setError(null);
    } catch (err) {
      console.error('Error fetching payment method:', err);
      setError('Failed to fetch payment method details');
    } finally {
      setLoading(false);
    }
  }, [paymentMethodId]);

  useEffect(() => {
    if (paymentMethodId) {
      fetchPaymentMethod();
    }
  }, [paymentMethodId, fetchPaymentMethod]);

  // Validate form
  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    
    if (!formData.alias.trim()) {
      errors.alias = 'Alias is required';
    } else if (formData.alias.length > 50) {
      errors.alias = 'Alias must be less than 50 characters';
    }
    
    if (!formData.display_name.trim()) {
      errors.display_name = 'Display name is required';
    } else if (formData.display_name.length > 100) {
      errors.display_name = 'Display name must be less than 100 characters';
    }
    
    if (!formData.details.trim()) {
      errors.details = 'Payment details are required';
    } else {
      try {
        JSON.parse(formData.details);
      } catch {
        errors.details = 'Invalid JSON format';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Parse details JSON
      let parsedDetails;
      try {
        parsedDetails = JSON.parse(formData.details);
      } catch {
        toast.error('Invalid JSON format in payment details');
        return;
      }

      const updateData = {
        alias: formData.alias,
        display_name: formData.display_name,
        method_type: formData.method_type,
        is_active: formData.is_active,
        is_default: formData.is_default,
        details: parsedDetails,
      };

      await updatePaymentMethod(paymentMethodId, updateData);
      toast.success('Payment method updated successfully');
      router.push(`/payment-methods/${paymentMethodId}`);
    } catch (err) {
      console.error('Error updating payment method:', err);
      toast.error('Failed to update payment method');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading payment method...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Payment Method</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => router.push('/payment-methods')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Payment Methods
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        showBackButton={true}
        onBack={() => router.push(`/payment-methods/${paymentMethodId}`)}
        icon={Edit}
        title="Edit Payment Method"
        description="Update payment method information and settings"
      />

      <form onSubmit={onSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Update the payment method&apos;s basic information and details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="alias">
                      Alias <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="alias"
                      placeholder="Enter payment method alias"
                      value={formData.alias}
                      onChange={(e) => handleInputChange('alias', e.target.value)}
                      className={formErrors.alias ? 'border-destructive' : ''}
                    />
                    {formErrors.alias && (
                      <p className="text-sm text-destructive">{formErrors.alias}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Short identifier for this payment method
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="display_name">
                      Display Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="display_name"
                      placeholder="Enter display name"
                      value={formData.display_name}
                      onChange={(e) => handleInputChange('display_name', e.target.value)}
                      className={formErrors.display_name ? 'border-destructive' : ''}
                    />
                    {formErrors.display_name && (
                      <p className="text-sm text-destructive">{formErrors.display_name}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      User-friendly display name
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="method_type">Payment Method Type</Label>
                  <Select 
                    value={formData.method_type} 
                    onValueChange={(value) => handleInputChange('method_type', value as PaymentMethodType)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method type" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHOD_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {getPaymentMethodTypeLabel(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    The type of payment method
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Payment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Payment Details
                </CardTitle>
                <CardDescription>
                  Configure the specific details for this payment method
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="details">
                    Payment Details (JSON) <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="details"
                    placeholder="Enter payment details as JSON"
                    className={`min-h-[120px] font-mono text-sm ${formErrors.details ? 'border-destructive' : ''}`}
                    value={formData.details}
                    onChange={(e) => handleInputChange('details', e.target.value)}
                  />
                  {formErrors.details && (
                    <p className="text-sm text-destructive">{formErrors.details}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Payment method details in JSON format
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Status & Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Status & Settings
                </CardTitle>
                <CardDescription>
                  Configure the payment method&apos;s status and user preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Active Status</Label>
                    <p className="text-sm text-muted-foreground">
                      Whether this payment method is currently active
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(value) => handleInputChange('is_active', value)}
                  />
                </div>

                <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Default Method</Label>
                    <p className="text-sm text-muted-foreground">
                      Set this as the default payment method for the user
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_default}
                    onCheckedChange={(value) => handleInputChange('is_default', value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Payment Method
                    </>
                  )}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => router.push(`/payment-methods/${paymentMethodId}`)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>

            {/* Payment Method Metadata */}
            {paymentMethod && (
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Payment Method ID</span>
                    <span className="text-sm font-mono">{paymentMethod._id.slice(-8)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">User ID</span>
                    <span className="text-sm font-mono">{paymentMethod.user_id.slice(-8)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Type</span>
                    <span className="text-sm">{getPaymentMethodTypeLabel(paymentMethod.method_type)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Created</span>
                    <span className="text-sm">{new Date(paymentMethod.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Last Updated</span>
                    <span className="text-sm">{new Date(paymentMethod.updatedAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Help */}
            <Card>
              <CardHeader>
                <CardTitle>Help</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Alias and display name are required fields</p>
                <p>• Payment details must be valid JSON format</p>
                <p>• Active methods are available for transactions</p>
                <p>• Default methods are used automatically</p>
                <p>• Type determines the payment processing flow</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
