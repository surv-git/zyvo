'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { AuthGuard } from '@/components/auth-guard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

interface AddressFormData {
  alias: string
  fullName: string
  phoneNumber: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postalCode: string
  country: string
  saveForFuture: boolean
}

interface PaymentFormData {
  alias: string
  paymentType: string
  cardNumber: string
  cardHolder: string
  expiryMonth: string
  expiryYear: string
  cvv: string
  upiId: string
  bankName: string
  walletProvider: string
  saveForFuture: boolean
}

const FormBasedCheckout = () => {
  const [showAddressForm, setShowAddressForm] = React.useState(false)
  const [showPaymentForm, setShowPaymentForm] = React.useState(false)
  const [addressData, setAddressData] = React.useState<AddressFormData | null>(null)
  const [paymentData, setPaymentData] = React.useState<PaymentFormData | null>(null)

  const addressForm = useForm<AddressFormData>({
    defaultValues: {
      alias: '',
      fullName: '',
      phoneNumber: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
      saveForFuture: false,
    },
  })

  const paymentForm = useForm<PaymentFormData>({
    defaultValues: {
      alias: '',
      paymentType: 'CREDIT_CARD',
      cardNumber: '',
      cardHolder: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: '',
      upiId: '',
      bankName: '',
      walletProvider: '',
      saveForFuture: false,
    },
  })

  const watchPaymentType = paymentForm.watch('paymentType')

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    return cleaned.replace(/(.{4})/g, '$1 ').trim()
  }

  const onAddressSubmit = (values: AddressFormData) => {
    setAddressData(values)
    setShowAddressForm(false)
    console.log('Address saved:', values)
  }

  const onPaymentSubmit = (values: PaymentFormData) => {
    setPaymentData(values)
    setShowPaymentForm(false)
    console.log('Payment method saved:', values)
  }

  const handlePlaceOrder = () => {
    if (addressData && paymentData) {
      console.log('Placing order:', { address: addressData, payment: paymentData })
      alert('Order placed successfully!')
    } else {
      alert('Please complete both address and payment information')
    }
  }

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Checkout with React Hook Form</h1>
        
        <div className="space-y-6">
          {/* Address Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                Delivery Address
                <Button
                  variant="outline"
                  onClick={() => setShowAddressForm(!showAddressForm)}
                  type="button"
                >
                  {showAddressForm ? 'Cancel' : 'Add New Address'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {showAddressForm && (
                <Form {...addressForm}>
                  <form onSubmit={addressForm.handleSubmit(onAddressSubmit)} className="space-y-4 p-4 border rounded-lg bg-green-50">
                    <h3 className="font-semibold text-lg">Add New Address</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={addressForm.control}
                        name="alias"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Home, Office" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={addressForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={addressForm.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter phone number" type="tel" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={addressForm.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter country" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={addressForm.control}
                      name="addressLine1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address Line 1 *</FormLabel>
                          <FormControl>
                            <Input placeholder="House number, street name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={addressForm.control}
                      name="addressLine2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address Line 2</FormLabel>
                          <FormControl>
                            <Input placeholder="Apartment, suite, etc. (optional)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={addressForm.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter city" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={addressForm.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter state" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={addressForm.control}
                        name="postalCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postal Code *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter postal code" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={addressForm.control}
                      name="saveForFuture"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Save this address for future orders
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex gap-2">
                      <Button type="submit">Save Address</Button>
                      <Button type="button" variant="outline" onClick={() => setShowAddressForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
              
              {addressData && (
                <div className="mt-4 p-4 bg-green-100 rounded-lg">
                  <h4 className="font-semibold text-green-800">✅ Address Added</h4>
                  <p className="text-green-700">{addressData.alias}: {addressData.fullName}</p>
                  <p className="text-sm text-green-600">
                    {addressData.addressLine1}, {addressData.city}, {addressData.state} {addressData.postalCode}
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
                  type="button"
                >
                  {showPaymentForm ? 'Cancel' : 'Add New Payment Method'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {showPaymentForm && (
                <Form {...paymentForm}>
                  <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)} className="space-y-4 p-4 border rounded-lg bg-blue-50">
                    <h3 className="font-semibold text-lg">Add New Payment Method</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={paymentForm.control}
                        name="alias"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Method Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., My Credit Card" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={paymentForm.control}
                        name="paymentType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payment Type *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select payment type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                                <SelectItem value="DEBIT_CARD">Debit Card</SelectItem>
                                <SelectItem value="UPI">UPI</SelectItem>
                                <SelectItem value="NETBANKING">Net Banking</SelectItem>
                                <SelectItem value="WALLET">Wallet</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {/* Card Details */}
                    {(watchPaymentType === 'CREDIT_CARD' || watchPaymentType === 'DEBIT_CARD') && (
                      <>
                        <FormField
                          control={paymentForm.control}
                          name="cardNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Card Number *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="1234 5678 9012 3456"
                                  maxLength={23}
                                  {...field}
                                  onChange={(e) => {
                                    const formatted = formatCardNumber(e.target.value)
                                    field.onChange(formatted)
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={paymentForm.control}
                          name="cardHolder"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Card Holder Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="Name as on card" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-3 gap-4">
                          <FormField
                            control={paymentForm.control}
                            name="expiryMonth"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Month *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="MM" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {Array.from({ length: 12 }, (_, i) => (
                                      <SelectItem key={i + 1} value={String(i + 1).padStart(2, '0')}>
                                        {String(i + 1).padStart(2, '0')}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={paymentForm.control}
                            name="expiryYear"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Year *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="YYYY" />
                                    </SelectTrigger>
                                  </FormControl>
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
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={paymentForm.control}
                            name="cvv"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>CVV *</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="123"
                                    maxLength={4}
                                    type="password"
                                    {...field}
                                    onChange={(e) => {
                                      const cleaned = e.target.value.replace(/\D/g, '').slice(0, 4)
                                      field.onChange(cleaned)
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </>
                    )}
                    
                    {/* UPI */}
                    {watchPaymentType === 'UPI' && (
                      <FormField
                        control={paymentForm.control}
                        name="upiId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>UPI ID *</FormLabel>
                            <FormControl>
                              <Input placeholder="yourname@upi" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    {/* Net Banking */}
                    {watchPaymentType === 'NETBANKING' && (
                      <FormField
                        control={paymentForm.control}
                        name="bankName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bank Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter bank name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    {/* Wallet */}
                    {watchPaymentType === 'WALLET' && (
                      <FormField
                        control={paymentForm.control}
                        name="walletProvider"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Wallet Provider *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select wallet provider" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Paytm">Paytm</SelectItem>
                                <SelectItem value="PhonePe">PhonePe</SelectItem>
                                <SelectItem value="Google Pay">Google Pay</SelectItem>
                                <SelectItem value="Amazon Pay">Amazon Pay</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    <FormField
                      control={paymentForm.control}
                      name="saveForFuture"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Save this payment method for future orders
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex gap-2">
                      <Button type="submit">Save Payment Method</Button>
                      <Button type="button" variant="outline" onClick={() => setShowPaymentForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
              
              {paymentData && (
                <div className="mt-4 p-4 bg-blue-100 rounded-lg">
                  <h4 className="font-semibold text-blue-800">✅ Payment Method Added</h4>
                  <p className="text-blue-700">{paymentData.alias}: {paymentData.paymentType}</p>
                  {(paymentData.paymentType === 'CREDIT_CARD' || paymentData.paymentType === 'DEBIT_CARD') && paymentData.cardNumber && (
                    <p className="text-sm text-blue-600">**** **** **** {paymentData.cardNumber.replace(/\s/g, '').slice(-4)}</p>
                  )}
                  {paymentData.paymentType === 'UPI' && paymentData.upiId && (
                    <p className="text-sm text-blue-600">{paymentData.upiId}</p>
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
              disabled={!addressData || !paymentData}
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

export default FormBasedCheckout
