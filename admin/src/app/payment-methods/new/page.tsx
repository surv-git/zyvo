"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  Plus,
  Loader2,
  CreditCard
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  PaymentMethodType,
  getPaymentMethodTypeLabel
} from '@/types/payment-method';
import { createPaymentMethod } from '@/services/payment-method-service';

const PAYMENT_METHOD_TYPES: PaymentMethodType[] = ['CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'WALLET', 'NETBANKING'];

interface FormData {
  user_id: string;
  alias: string;
  display_name: string;
  method_type: PaymentMethodType;
  is_active: boolean;
  is_default: boolean;
  details: string;
}

interface FormErrors {
  user_id?: string;
  alias?: string;
  display_name?: string;
  method_type?: string;
  details?: string;
}

export default function NewPaymentMethodPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    user_id: '',
    alias: '',
    display_name: '',
    method_type: 'CREDIT_CARD',
    is_active: true,
    is_default: false,
    details: JSON.stringify({
      card_brand: "",
      last4_digits: "",
      expiry_month: "",
      expiry_year: "",
      card_holder_name: ""
    }, null, 2),
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Validate form
  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    
    if (!formData.user_id.trim()) {
      errors.user_id = 'User ID is required';
    }
    
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

      const createData = {
        user_id: formData.user_id,
        alias: formData.alias,
        display_name: formData.display_name,
        method_type: formData.method_type,
        is_active: formData.is_active,
        is_default: formData.is_default,
        details: parsedDetails,
      };

      const response = await createPaymentMethod(createData);
      toast.success('Payment method created successfully');
      router.push(`/payment-methods/${response._id}`);
    } catch (err) {
      console.error('Error creating payment method:', err);
      toast.error('Failed to create payment method');
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

  // Update details template when method type changes
  const handleMethodTypeChange = (methodType: PaymentMethodType) => {
    let detailsTemplate = {};
    
    switch (methodType) {
      case 'CREDIT_CARD':
      case 'DEBIT_CARD':
        detailsTemplate = {
          card_brand: "",
          last4_digits: "",
          expiry_month: "",
          expiry_year: "",
          card_holder_name: ""
        };
        break;
      case 'UPI':
        detailsTemplate = {
          upi_id: ""
        };
        break;
      case 'WALLET':
        detailsTemplate = {
          wallet_provider: "",
          wallet_number: ""
        };
        break;
      case 'NETBANKING':
        detailsTemplate = {
          bank_name: "",
          account_number: "",
          ifsc_code: ""
        };
        break;
    }
    
    handleInputChange('method_type', methodType);
    handleInputChange('details', JSON.stringify(detailsTemplate, null, 2));
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/payment-methods')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                New Payment Method
              </h1>
              <p className="text-muted-foreground">
                Create a new payment method for a user
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-2xl">
          <form onSubmit={onSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Basic Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user_id">User ID</Label>
                  <Input
                    id="user_id"
                    placeholder="Enter user ID"
                    value={formData.user_id}
                    onChange={(e) => handleInputChange('user_id', e.target.value)}
                    className={formErrors.user_id ? 'border-destructive' : ''}
                  />
                  {formErrors.user_id && (
                    <p className="text-sm text-destructive">{formErrors.user_id}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    The ID of the user this payment method belongs to
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="alias">Alias</Label>
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
                    <Label htmlFor="display_name">Display Name</Label>
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
                    onValueChange={(value) => handleMethodTypeChange(value as PaymentMethodType)}
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

                <div className="space-y-2">
                  <Label htmlFor="details">Payment Details (JSON)</Label>
                  <Textarea
                    id="details"
                    placeholder="Enter payment details as JSON"
                    className={`min-h-[150px] font-mono text-sm ${formErrors.details ? 'border-destructive' : ''}`}
                    value={formData.details}
                    onChange={(e) => handleInputChange('details', e.target.value)}
                  />
                  {formErrors.details && (
                    <p className="text-sm text-destructive">{formErrors.details}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Payment method details in JSON format. Template is auto-updated based on type.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status & Settings</CardTitle>
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

            {/* Submit Button */}
            <div className="flex items-center space-x-4">
              <Button 
                type="submit" 
                disabled={submitting}
                className="min-w-[120px]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Payment Method
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/payment-methods')}
                disabled={submitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
