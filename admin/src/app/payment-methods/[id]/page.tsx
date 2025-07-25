"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  CreditCard,
  Edit,
  Trash2,
  Star,
  Calendar,
  User,
  Shield,
  Activity,
  Loader2
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  PaymentMethod,
  getPaymentMethodTypeLabel,
  getPaymentMethodTypeColor,
  formatPaymentMethodDetails
} from '@/types/payment-method';
import { 
  getPaymentMethodById,
  deletePaymentMethod,
  activatePaymentMethod,
  deactivatePaymentMethod,
  setDefaultPaymentMethod
} from '@/services/payment-method-service';

export default function PaymentMethodViewPage() {
  const params = useParams();
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const paymentMethodId = params.id as string;

  // Fetch payment method data
  const fetchPaymentMethod = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getPaymentMethodById(paymentMethodId);
      setPaymentMethod(response);
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

  // Handle delete
  const handleDelete = async () => {
    if (!paymentMethod) return;
    
    try {
      setActionLoading('delete');
      await deletePaymentMethod(paymentMethod._id);
      toast.success('Payment method deleted successfully');
      router.push('/payment-methods');
    } catch (err) {
      console.error('Error deleting payment method:', err);
      toast.error('Failed to delete payment method');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle activation toggle
  const handleToggleActivation = async () => {
    if (!paymentMethod) return;
    
    try {
      setActionLoading('toggle');
      if (paymentMethod.is_active) {
        await deactivatePaymentMethod(paymentMethod._id);
        toast.success('Payment method deactivated');
      } else {
        await activatePaymentMethod(paymentMethod._id);
        toast.success('Payment method activated');
      }
      await fetchPaymentMethod(); // Refresh data
    } catch (err) {
      console.error('Error toggling payment method status:', err);
      toast.error('Failed to update payment method status');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle set as default
  const handleSetDefault = async () => {
    if (!paymentMethod) return;
    
    try {
      setActionLoading('default');
      await setDefaultPaymentMethod(paymentMethod._id);
      toast.success('Payment method set as default');
      await fetchPaymentMethod(); // Refresh data
    } catch (err) {
      console.error('Error setting default payment method:', err);
      toast.error('Failed to set payment method as default');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !paymentMethod) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Payment Method Not Found</h2>
            <p className="text-muted-foreground mt-2">
              {error || 'The payment method you are looking for does not exist.'}
            </p>
          </div>
          <Button onClick={() => router.push('/payment-methods')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Payment Methods
          </Button>
        </div>
      </div>
    );
  }

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
                {paymentMethod.alias}
              </h1>
              <p className="text-muted-foreground">
                Payment method details and management
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/payment-methods/${paymentMethod._id}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Payment Method</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this payment method? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={actionLoading === 'delete'}
                  >
                    {actionLoading === 'delete' ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Basic Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Payment Method Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Alias</label>
                    <p className="font-medium">{paymentMethod.alias}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Display Name</label>
                    <p className="font-medium">{paymentMethod.display_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Type</label>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="secondary" 
                        className={`${getPaymentMethodTypeColor(paymentMethod.method_type)} text-white`}
                      >
                        {getPaymentMethodTypeLabel(paymentMethod.method_type)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">User ID</label>
                    <p className="font-medium font-mono text-sm">{paymentMethod.user_id}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Payment Details</label>
                  <div className="mt-2 p-4 bg-muted rounded-lg">
                    <pre className="text-sm whitespace-pre-wrap">
                      {formatPaymentMethodDetails(paymentMethod)}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timestamps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Timeline</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created</label>
                    <p className="font-medium">
                      {new Date(paymentMethod.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                    <p className="font-medium">
                      {new Date(paymentMethod.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status & Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Active Status</span>
                  <Badge variant={paymentMethod.is_active ? 'default' : 'destructive'}>
                    {paymentMethod.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Default Method</span>
                  <Badge variant={paymentMethod.is_default ? 'default' : 'secondary'}>
                    {paymentMethod.is_default ? 'Default' : 'Not Default'}
                  </Badge>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleToggleActivation}
                    disabled={actionLoading === 'toggle'}
                  >
                    {actionLoading === 'toggle' ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : paymentMethod.is_active ? (
                      <Shield className="h-4 w-4 mr-2" />
                    ) : (
                      <Activity className="h-4 w-4 mr-2" />
                    )}
                    {paymentMethod.is_active ? 'Deactivate' : 'Activate'}
                  </Button>

                  {!paymentMethod.is_default && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={handleSetDefault}
                      disabled={actionLoading === 'default'}
                    >
                      {actionLoading === 'default' ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Star className="h-4 w-4 mr-2" />
                      )}
                      Set as Default
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>User Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => router.push(`/users/${paymentMethod.user_id}`)}
                >
                  <User className="h-4 w-4 mr-2" />
                  View User Profile
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
