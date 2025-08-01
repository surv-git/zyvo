'use client'

import React from 'react'
import { AuthGuard } from '@/components/auth-guard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const PureCheckout = () => {
  const handlePlaceOrder = () => {
    // Get all form values directly from DOM
    const addressAlias = (document.getElementById('addr_alias') as HTMLInputElement)?.value
    const fullName = (document.getElementById('full_name') as HTMLInputElement)?.value
    const phoneNumber = (document.getElementById('phone_number') as HTMLInputElement)?.value
    const addressLine1 = (document.getElementById('address_line_1') as HTMLInputElement)?.value
    const city = (document.getElementById('city') as HTMLInputElement)?.value
    const state = (document.getElementById('state') as HTMLInputElement)?.value
    const postalCode = (document.getElementById('postal_code') as HTMLInputElement)?.value
    
    const paymentAlias = (document.getElementById('payment_alias') as HTMLInputElement)?.value
    const cardNumber = (document.getElementById('card_number') as HTMLInputElement)?.value
    const cardHolder = (document.getElementById('card_holder') as HTMLInputElement)?.value
    const cvv = (document.getElementById('cvv') as HTMLInputElement)?.value
    
    const formData = {
      addressAlias,
      fullName,
      phoneNumber,
      addressLine1,
      city,
      state,
      postalCode,
      paymentAlias,
      cardNumber,
      cardHolder,
      cvv
    }
    
    console.log('Order data:', formData)
    alert('Order placed with: ' + JSON.stringify(formData, null, 2))
  }

  const formatCardNumber = (input: HTMLInputElement) => {
    const value = input.value.replace(/\D/g, '')
    const formattedValue = value.replace(/(.{4})/g, '$1 ').trim()
    input.value = formattedValue
  }

  const formatCvv = (input: HTMLInputElement) => {
    const value = input.value.replace(/\D/g, '').slice(0, 4)
    input.value = value
  }

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Pure DOM Checkout</h1>
        
        <div className="space-y-6">
          {/* Address Section */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 p-4 border rounded-lg bg-green-50">
                <h3 className="font-semibold text-lg">Add New Address</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="addr_alias" className="block text-sm font-medium mb-1">
                      Address Name *
                    </label>
                    <input
                      id="addr_alias"
                      type="text"
                      placeholder="e.g., Home, Office"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="full_name" className="block text-sm font-medium mb-1">
                      Full Name *
                    </label>
                    <input
                      id="full_name"
                      type="text"
                      placeholder="Enter full name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="phone_number" className="block text-sm font-medium mb-1">
                    Phone Number *
                  </label>
                  <input
                    id="phone_number"
                    type="tel"
                    placeholder="Enter phone number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="address_line_1" className="block text-sm font-medium mb-1">
                    Address Line 1 *
                  </label>
                  <input
                    id="address_line_1"
                    type="text"
                    placeholder="House number, street name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium mb-1">
                      City *
                    </label>
                    <input
                      id="city"
                      type="text"
                      placeholder="Enter city"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="state" className="block text-sm font-medium mb-1">
                      State *
                    </label>
                    <input
                      id="state"
                      type="text"
                      placeholder="Enter state"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="postal_code" className="block text-sm font-medium mb-1">
                      Postal Code *
                    </label>
                    <input
                      id="postal_code"
                      type="text"
                      placeholder="Enter postal code"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Section */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
                <h3 className="font-semibold text-lg">Add Credit Card</h3>
                
                <div>
                  <label htmlFor="payment_alias" className="block text-sm font-medium mb-1">
                    Card Name *
                  </label>
                  <input
                    id="payment_alias"
                    type="text"
                    placeholder="e.g., My Credit Card"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="card_number" className="block text-sm font-medium mb-1">
                    Card Number *
                  </label>
                  <input
                    id="card_number"
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    maxLength={23}
                    onInput={(e) => formatCardNumber(e.target as HTMLInputElement)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="card_holder" className="block text-sm font-medium mb-1">
                    Card Holder Name *
                  </label>
                  <input
                    id="card_holder"
                    type="text"
                    placeholder="Name as on card"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="expiry_month" className="block text-sm font-medium mb-1">
                      Month *
                    </label>
                    <select
                      id="expiry_month"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">MM</option>
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                          {String(i + 1).padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="expiry_year" className="block text-sm font-medium mb-1">
                      Year *
                    </label>
                    <select
                      id="expiry_year"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">YYYY</option>
                      {Array.from({ length: 10 }, (_, i) => {
                        const year = new Date().getFullYear() + i
                        return (
                          <option key={year} value={String(year)}>
                            {year}
                          </option>
                        )
                      })}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="cvv" className="block text-sm font-medium mb-1">
                      CVV *
                    </label>
                    <input
                      id="cvv"
                      type="password"
                      placeholder="123"
                      maxLength={4}
                      onInput={(e) => formatCvv(e.target as HTMLInputElement)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Place Order */}
          <div className="flex justify-end pt-6">
            <Button
              size="lg"
              onClick={handlePlaceOrder}
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

export default PureCheckout
