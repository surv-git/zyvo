'use client'

import React, { useState } from 'react'
import { AuthGuard } from '@/components/auth-guard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

const FocusStableCheckout = () => {
  // Single state object - no individual useState calls
  const [formData, setFormData] = useState({
    // Address fields
    addressAlias: '',
    fullName: '',
    phoneNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    saveAddress: false,
    
    // Payment fields
    paymentAlias: '',
    paymentType: 'CREDIT_CARD',
    cardNumber: '',
    cardHolder: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    upiId: '',
    bankName: '',
    walletProvider: '',
    savePayment: false,
    
    // UI state
    showAddressForm: false,
    showPaymentForm: false
  })

  // Single update function that preserves focus
  const updateField = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Validation helpers
  const isAddressValid = () => {
    return !!(
      formData.addressAlias &&
      formData.fullName &&
      formData.phoneNumber &&
      formData.addressLine1 &&
      formData.city &&
      formData.state &&
      formData.postalCode &&
      formData.country
    )
  }

  const isPaymentValid = () => {
    if (!formData.paymentAlias || !formData.paymentType) return false
    
    if (formData.paymentType === 'CREDIT_CARD' || formData.paymentType === 'DEBIT_CARD') {
      return !!(formData.cardNumber && formData.cardHolder && formData.expiryMonth && formData.expiryYear && formData.cvv)
    }
    if (formData.paymentType === 'UPI') return !!formData.upiId
    if (formData.paymentType === 'NETBANKING') return !!formData.bankName
    if (formData.paymentType === 'WALLET') return !!formData.walletProvider
    
    return false
  }

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    return cleaned.replace(/(.{4})/g, '$1 ').trim()
  }

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value)
    updateField('cardNumber', formatted)
  }

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 4)
    updateField('cvv', cleaned)
  }

  const handlePlaceOrder = () => {
    if (isAddressValid() && isPaymentValid()) {
      console.log('Order data:', formData)
      alert('Order placed successfully!')
    } else {
      alert('Please complete all required fields')
    }
  }

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
                  onClick={() => updateField('showAddressForm', !formData.showAddressForm)}
                >
                  {formData.showAddressForm ? 'Cancel' : 'Add New Address'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {formData.showAddressForm && (
                <div className="space-y-4 p-4 border rounded-lg bg-green-50">
                  <h3 className="font-semibold text-lg">Add New Address</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="addressAlias">Address Name *</Label>
                      <Input
                        id="addressAlias"
                        value={formData.addressAlias}
                        onChange={(e) => updateField('addressAlias', e.target.value)}
                        placeholder="e.g., Home, Office"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => updateField('fullName', e.target.value)}
                        placeholder="Enter full name"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phoneNumber">Phone Number *</Label>
                      <Input
                        id="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={(e) => updateField('phoneNumber', e.target.value)}
                        placeholder="Enter phone number"
                        type="tel"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="country">Country *</Label>
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) => updateField('country', e.target.value)}
                        placeholder="Enter country"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="addressLine1">Address Line 1 *</Label>
                    <Input
                      id="addressLine1"
                      value={formData.addressLine1}
                      onChange={(e) => updateField('addressLine1', e.target.value)}
                      placeholder="House number, street name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="addressLine2">Address Line 2</Label>
                    <Input
                      id="addressLine2"
                      value={formData.addressLine2}
                      onChange={(e) => updateField('addressLine2', e.target.value)}
                      placeholder="Apartment, suite, etc. (optional)"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => updateField('city', e.target.value)}
                        placeholder="Enter city"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => updateField('state', e.target.value)}
                        placeholder="Enter state"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="postalCode">Postal Code *</Label>
                      <Input
                        id="postalCode"
                        value={formData.postalCode}
                        onChange={(e) => updateField('postalCode', e.target.value)}
                        placeholder="Enter postal code"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="saveAddress"
                      checked={formData.saveAddress}
                      onCheckedChange={(checked) => updateField('saveAddress', checked as boolean)}
                    />
                    <Label htmlFor="saveAddress" className="text-sm">
                      Save this address for future orders
                    </Label>
                  </div>
                  
                  {!isAddressValid() && (
                    <p className="text-sm text-red-600">* Please fill in all required fields</p>
                  )}
                </div>
              )}
              
              {isAddressValid() && (
                <div className="mt-4 p-4 bg-green-100 rounded-lg">
                  <h4 className="font-semibold text-green-800">✅ Address Added</h4>
                  <p className="text-green-700">{formData.addressAlias}: {formData.fullName}</p>
                  <p className="text-sm text-green-600">
                    {formData.addressLine1}, {formData.city}, {formData.state} {formData.postalCode}
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
                  onClick={() => updateField('showPaymentForm', !formData.showPaymentForm)}
                >
                  {formData.showPaymentForm ? 'Cancel' : 'Add New Payment Method'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {formData.showPaymentForm && (
                <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
                  <h3 className="font-semibold text-lg">Add New Payment Method</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="paymentAlias">Method Name *</Label>
                      <Input
                        id="paymentAlias"
                        value={formData.paymentAlias}
                        onChange={(e) => updateField('paymentAlias', e.target.value)}
                        placeholder="e.g., My Credit Card"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="paymentType">Payment Type *</Label>
                      <Select
                        value={formData.paymentType}
                        onValueChange={(value) => updateField('paymentType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                          <SelectItem value="DEBIT_CARD">Debit Card</SelectItem>
                          <SelectItem value="UPI">UPI</SelectItem>
                          <SelectItem value="NETBANKING">Net Banking</SelectItem>
                          <SelectItem value="WALLET">Wallet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Card Details */}
                  {(formData.paymentType === 'CREDIT_CARD' || formData.paymentType === 'DEBIT_CARD') && (
                    <>
                      <div>
                        <Label htmlFor="cardNumber">Card Number *</Label>
                        <Input
                          id="cardNumber"
                          value={formData.cardNumber}
                          onChange={handleCardNumberChange}
                          placeholder="1234 5678 9012 3456"
                          maxLength={23}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="cardHolder">Card Holder Name *</Label>
                        <Input
                          id="cardHolder"
                          value={formData.cardHolder}
                          onChange={(e) => updateField('cardHolder', e.target.value)}
                          placeholder="Name as on card"
                        />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="expiryMonth">Month *</Label>
                          <Select
                            value={formData.expiryMonth}
                            onValueChange={(value) => updateField('expiryMonth', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="MM" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 12 }, (_, i) => (
                                <SelectItem key={i + 1} value={String(i + 1).padStart(2, '0')}>
                                  {String(i + 1).padStart(2, '0')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="expiryYear">Year *</Label>
                          <Select
                            value={formData.expiryYear}
                            onValueChange={(value) => updateField('expiryYear', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="YYYY" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 10 }, (_, i) => {
                                const year = new Date().getFullYear() + i
                                return (
                                  <SelectItem key={year} value={String(year)}>
                                    {year}
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="cvv">CVV *</Label>
                          <Input
                            id="cvv"
                            value={formData.cvv}
                            onChange={handleCvvChange}
                            placeholder="123"
                            maxLength={4}
                            type="password"
                          />
                        </div>
                      </div>
                    </>
                  )}
                  
                  {/* UPI */}
                  {formData.paymentType === 'UPI' && (
                    <div>
                      <Label htmlFor="upiId">UPI ID *</Label>
                      <Input
                        id="upiId"
                        value={formData.upiId}
                        onChange={(e) => updateField('upiId', e.target.value)}
                        placeholder="yourname@upi"
                      />
                    </div>
                  )}
                  
                  {/* Net Banking */}
                  {formData.paymentType === 'NETBANKING' && (
                    <div>
                      <Label htmlFor="bankName">Bank Name *</Label>
                      <Input
                        id="bankName"
                        value={formData.bankName}
                        onChange={(e) => updateField('bankName', e.target.value)}
                        placeholder="Enter bank name"
                      />
                    </div>
                  )}
                  
                  {/* Wallet */}
                  {formData.paymentType === 'WALLET' && (
                    <div>
                      <Label htmlFor="walletProvider">Wallet Provider *</Label>
                      <Select
                        value={formData.walletProvider}
                        onValueChange={(value) => updateField('walletProvider', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select wallet provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Paytm">Paytm</SelectItem>
                          <SelectItem value="PhonePe">PhonePe</SelectItem>
                          <SelectItem value="Google Pay">Google Pay</SelectItem>
                          <SelectItem value="Amazon Pay">Amazon Pay</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="savePayment"
                      checked={formData.savePayment}
                      onCheckedChange={(checked) => updateField('savePayment', checked as boolean)}
                    />
                    <Label htmlFor="savePayment" className="text-sm">
                      Save this payment method for future orders
                    </Label>
                  </div>
                  
                  {!isPaymentValid() && (
                    <p className="text-sm text-red-600">* Please fill in all required fields</p>
                  )}
                </div>
              )}
              
              {isPaymentValid() && (
                <div className="mt-4 p-4 bg-blue-100 rounded-lg">
                  <h4 className="font-semibold text-blue-800">✅ Payment Method Added</h4>
                  <p className="text-blue-700">{formData.paymentAlias}: {formData.paymentType}</p>
                  {(formData.paymentType === 'CREDIT_CARD' || formData.paymentType === 'DEBIT_CARD') && formData.cardNumber && (
                    <p className="text-sm text-blue-600">**** **** **** {formData.cardNumber.replace(/\s/g, '').slice(-4)}</p>
                  )}
                  {formData.paymentType === 'UPI' && formData.upiId && (
                    <p className="text-sm text-blue-600">{formData.upiId}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Place Order */}
          <div className="flex justify-end pt-6">
            <Button
              size="lg"
              onClick={handlePlaceOrder}
              disabled={!isAddressValid() || !isPaymentValid()}
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

export default FocusStableCheckout
