'use client'

import { CreditCard, Plus, Edit, Trash2, Shield, Smartphone, Wallet, Building, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PaymentMethodsService, PaymentMethod } from '@/services/payment-methods-service'
import { useState, useEffect } from 'react'

export default function PaymentMethodsContent() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<Set<string>>(new Set())

  // Fetch payment methods from API
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        setLoading(true)
        setError(null)
        
        console.log('🔄 Fetching payment methods...')
        
        const response = await PaymentMethodsService.getPaymentMethods()
        console.log('✅ Payment methods response:', response)
        
        if (response.success) {
          console.log('📦 Setting payment methods data:', response.data)
          setPaymentMethods(response.data)
        } else {
          console.error('❌ API returned success: false', response)
          setError('Failed to load payment methods')
        }
      } catch (err) {
        console.error('❌ Error fetching payment methods:', err)
        setError('Failed to load payment methods. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchPaymentMethods()
  }, [])

  // Handle delete payment method
  const handleDeletePaymentMethod = async (methodId: string) => {
    try {
      setActionLoading(prev => new Set(prev).add(methodId))
      
      const response = await PaymentMethodsService.deletePaymentMethod(methodId)
      
      if (response.success) {
        // Remove from local state
        setPaymentMethods(prev => prev.filter(method => method._id !== methodId))
      } else {
        setError('Failed to delete payment method')
      }
    } catch (err) {
      console.error('Error deleting payment method:', err)
      setError('Failed to delete payment method')
    } finally {
      setActionLoading(prev => {
        const newSet = new Set(prev)
        newSet.delete(methodId)
        return newSet
      })
    }
  }

  // Handle set default payment method
  const handleSetDefault = async (methodId: string) => {
    try {
      setActionLoading(prev => new Set(prev).add(methodId))
      
      const response = await PaymentMethodsService.setDefaultPaymentMethod(methodId)
      
      if (response.success) {
        // Update local state
        setPaymentMethods(prev => prev.map(method => ({
          ...method,
          is_default: method._id === methodId
        })))
      } else {
        setError('Failed to set default payment method')
      }
    } catch (err) {
      console.error('Error setting default payment method:', err)
      setError('Failed to set default payment method')
    } finally {
      setActionLoading(prev => {
        const newSet = new Set(prev)
        newSet.delete(methodId)
        return newSet
      })
    }
  }

  // Get payment method icon
  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case 'CREDIT_CARD':
      case 'DEBIT_CARD':
        return <CreditCard className="h-5 w-5 text-gray-400" />
      case 'UPI':
        return <Smartphone className="h-5 w-5 text-gray-400" />
      case 'WALLET':
        return <Wallet className="h-5 w-5 text-gray-400" />
      case 'NETBANKING':
        return <Building className="h-5 w-5 text-gray-400" />
      default:
        return <CreditCard className="h-5 w-5 text-gray-400" />
    }
  }

  // Get payment method type label
  const getPaymentMethodTypeLabel = (type: string) => {
    switch (type) {
      case 'CREDIT_CARD':
        return 'Credit Card'
      case 'DEBIT_CARD':
        return 'Debit Card'
      case 'UPI':
        return 'UPI'
      case 'WALLET':
        return 'Wallet'
      case 'NETBANKING':
        return 'Net Banking'
      default:
        return type
    }
  }

  // Get card brand color
  const getCardBrandColor = (brand: string) => {
    switch (brand?.toLowerCase()) {
      case 'visa':
        return 'bg-blue-500'
      case 'mastercard':
        return 'bg-red-500'
      case 'amex':
      case 'american express':
        return 'bg-green-500'
      case 'rupay':
        return 'bg-orange-500'
      default:
        return 'bg-gray-500'
    }
  }

  // Format payment method details
  const formatPaymentMethodDetails = (method: PaymentMethod) => {
    const { details, method_type } = method
    
    switch (method_type) {
      case 'CREDIT_CARD':
      case 'DEBIT_CARD':
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getCardBrandColor(details.card_brand || '')}`}></div>
              <span className="font-medium">{details.card_brand}</span>
              {details.last4_digits && (
                <span className="text-gray-500">•••• {details.last4_digits}</span>
              )}
            </div>
            <p className="text-sm text-gray-600">{details.card_holder_name}</p>
            <p className="text-sm text-gray-500">
              Expires {details.expiry_month}/{details.expiry_year}
            </p>
          </div>
        )
      case 'UPI':
        return (
          <div className="space-y-1">
            <p className="font-medium">{details.account_holder_name}</p>
            {details.upi_id && (
              <p className="text-sm text-gray-600">{details.upi_id}</p>
            )}
          </div>
        )
      case 'WALLET':
        return (
          <div className="space-y-1">
            <p className="font-medium">{details.wallet_provider}</p>
            {details.linked_account_identifier && (
              <p className="text-sm text-gray-600">{details.linked_account_identifier}</p>
            )}
          </div>
        )
      case 'NETBANKING':
        return (
          <div className="space-y-1">
            <p className="font-medium">{details.bank_name}</p>
            <p className="text-sm text-gray-600">{details.account_holder_name}</p>
          </div>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your payment methods...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">Payment Methods</CardTitle>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Payment Method
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Payment Methods List */}
      {paymentMethods.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CreditCard className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No payment methods saved</h3>
            <p className="text-gray-600 mb-6">Add your payment methods for faster checkout.</p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Payment Method
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {paymentMethods.map((method) => {
            const isDeleting = actionLoading.has(method._id)
            const isSettingDefault = actionLoading.has(method._id)
            
            return (
              <Card key={method._id} className="relative">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getPaymentMethodIcon(method.method_type)}
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {method.display_name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {getPaymentMethodTypeLabel(method.method_type)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {method.is_default && (
                        <Badge variant="default" className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          Default
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-green-600">
                        <Shield className="h-3 w-3 mr-1" />
                        Secure
                      </Badge>
                    </div>
                  </div>

                  <div className="mb-4">
                    {formatPaymentMethodDetails(method)}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => handleDeletePaymentMethod(method._id)}
                        disabled={isDeleting || method.is_default}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
                    {!method.is_default && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleSetDefault(method._id)}
                        disabled={isSettingDefault}
                      >
                        {isSettingDefault ? 'Setting...' : 'Set as Default'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
