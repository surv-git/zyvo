'use client'

import React, { useState } from 'react'
import { AuthGuard } from '@/components/auth-guard'
import { SimpleAddressForm } from '@/components/simple-address-form'
import { SimplePaymentForm } from '@/components/simple-payment-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface AddressData {
  alias: string
  full_name: string
  phone_number: string
  address_line_1: string
  address_line_2: string
  city: string
  state: string
  postal_code: string
  country: string
  save_for_future: boolean
}

interface PaymentMethodData {
  alias: string
  method_type: string
  card_number: string
  card_holder_name: string
  expiry_month: string
  expiry_year: string
  cvv: string
  upi_id: string
  bank_name: string
  wallet_provider: string
  save_for_future: boolean
}

const SimpleCheckoutPage = () => {
  const [addressData, setAddressData] = useState<AddressData | null>(null)
  const [paymentData, setPaymentData] = useState<PaymentMethodData | null>(null)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)

  const isAddressValid = (data: AddressData) => {
    return !!(
      data.alias &&
      data.full_name &&
      data.phone_number &&
      data.address_line_1 &&
      data.city &&
      data.state &&
      data.postal_code &&
      data.country
    )
  }

  const isPaymentValid = (data: PaymentMethodData) => {
    if (!data.alias || !data.method_type) return false
    
    if (data.method_type === 'CREDIT_CARD' || data.method_type === 'DEBIT_CARD') {
      return !!(data.card_number && data.card_holder_name && data.expiry_month && data.expiry_year && data.cvv)
    }
    
    if (data.method_type === 'UPI') {
      return !!data.upi_id
    }
    
    if (data.method_type === 'NETBANKING') {
      return !!data.bank_name
    }
    
    if (data.method_type === 'WALLET') {
      return !!data.wallet_provider
    }
    
    return false
  }

  const handlePlaceOrder = () => {
    if (addressData && paymentData && isAddressValid(addressData) && isPaymentValid(paymentData)) {
      console.log('Placing order with:', { addressData, paymentData })
      alert('Order placed successfully!')
    } else {
      alert('Please complete all required fields')
    }
  }

  const canPlaceOrder = addressData && paymentData && isAddressValid(addressData) && isPaymentValid(paymentData)

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>
        
        <div className="space-y-6">
          {/* Address Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                Delivery Address
                <Button
                  variant="outline"
                  onClick={() => setShowAddressForm(!showAddressForm)}
                >
                  {showAddressForm ? 'Cancel' : 'Add New Address'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {showAddressForm && (
                <SimpleAddressForm
                  onSubmit={setAddressData}
                  isValid={addressData ? isAddressValid(addressData) : false}
                />
              )}
              
              {addressData && isAddressValid(addressData) && (
                <div className="mt-4 p-4 bg-green-100 rounded-lg">
                  <h4 className="font-semibold text-green-800">✅ Address Added</h4>
                  <p className="text-green-700">{addressData.alias}: {addressData.full_name}</p>
                  <p className="text-sm text-green-600">
                    {addressData.address_line_1}, {addressData.city}, {addressData.state} {addressData.postal_code}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                Payment Method
                <Button
                  variant="outline"
                  onClick={() => setShowPaymentForm(!showPaymentForm)}
                >
                  {showPaymentForm ? 'Cancel' : 'Add New Payment Method'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {showPaymentForm && (
                <SimplePaymentForm
                  onSubmit={setPaymentData}
                  isValid={paymentData ? isPaymentValid(paymentData) : false}
                />
              )}
              
              {paymentData && isPaymentValid(paymentData) && (
                <div className="mt-4 p-4 bg-blue-100 rounded-lg">
                  <h4 className="font-semibold text-blue-800">✅ Payment Method Added</h4>
                  <p className="text-blue-700">{paymentData.alias}: {paymentData.method_type}</p>
                  {paymentData.method_type === 'CREDIT_CARD' || paymentData.method_type === 'DEBIT_CARD' ? (
                    <p className="text-sm text-blue-600">**** **** **** {paymentData.card_number.slice(-4)}</p>
                  ) : paymentData.method_type === 'UPI' ? (
                    <p className="text-sm text-blue-600">{paymentData.upi_id}</p>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Place Order */}
          <div className="flex justify-end pt-6">
            <Button
              size="lg"
              onClick={handlePlaceOrder}
              disabled={!canPlaceOrder}
              className="min-w-[200px]"
            >
              Place Order
            </Button>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}

export default SimpleCheckoutPage
