'use client'

import React, { useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

interface NewPaymentMethod {
  alias: string
  method_type: 'CREDIT_CARD' | 'DEBIT_CARD' | 'UPI' | 'NETBANKING' | 'WALLET'
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

interface PaymentFormProps {
  newPaymentMethod: NewPaymentMethod
  onPaymentMethodChange: (field: keyof NewPaymentMethod, value: string | boolean) => void
  isValid: boolean
}

export const PaymentForm = React.memo(({ 
  newPaymentMethod, 
  onPaymentMethodChange, 
  isValid 
}: PaymentFormProps) => {
  const handleInputChange = useCallback((field: keyof NewPaymentMethod) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    onPaymentMethodChange(field, e.target.value)
  }, [onPaymentMethodChange])

  const handleCardNumberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const digitsOnly = value.replace(/\D/g, '')
    const formattedValue = digitsOnly.replace(/(.{4})/g, '$1 ').trim()
    onPaymentMethodChange('card_number', formattedValue)
  }, [onPaymentMethodChange])

  const handleCvvChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const numericValue = value.replace(/\D/g, '').slice(0, 4)
    onPaymentMethodChange('cvv', numericValue)
  }, [onPaymentMethodChange])

  const handleSelectChange = useCallback((field: keyof NewPaymentMethod) => (
    value: string
  ) => {
    onPaymentMethodChange(field, value)
  }, [onPaymentMethodChange])

  const handleCheckboxChange = useCallback((checked: boolean) => {
    onPaymentMethodChange('save_for_future', checked)
  }, [onPaymentMethodChange])

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
      <h3 className="font-semibold text-lg">Add New Payment Method</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="payment_alias">Method Name *</Label>
          <Input
            id="payment_alias"
            value={newPaymentMethod.alias}
            onChange={handleInputChange('alias')}
            placeholder="e.g., My Credit Card, Personal UPI"
          />
        </div>
        
        <div>
          <Label htmlFor="payment_type">Payment Type *</Label>
          <Select
            value={newPaymentMethod.method_type}
            onValueChange={handleSelectChange('method_type')}
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
      {(newPaymentMethod.method_type === 'CREDIT_CARD' || 
        newPaymentMethod.method_type === 'DEBIT_CARD') && (
        <>
          <div>
            <Label htmlFor="card_number">Card Number *</Label>
            <Input
              id="card_number"
              value={newPaymentMethod.card_number}
              onChange={handleCardNumberChange}
              placeholder="1234 5678 9012 3456"
              maxLength={23}
            />
          </div>
          
          <div>
            <Label htmlFor="card_holder_name">Card Holder Name *</Label>
            <Input
              id="card_holder_name"
              value={newPaymentMethod.card_holder_name}
              onChange={handleInputChange('card_holder_name')}
              placeholder="Name as on card"
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="expiry_month">Month *</Label>
              <Select
                value={newPaymentMethod.expiry_month}
                onValueChange={handleSelectChange('expiry_month')}
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
              <Label htmlFor="expiry_year">Year *</Label>
              <Select
                value={newPaymentMethod.expiry_year}
                onValueChange={handleSelectChange('expiry_year')}
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
                value={newPaymentMethod.cvv}
                onChange={handleCvvChange}
                placeholder="123"
                maxLength={4}
                type="password"
              />
            </div>
          </div>
        </>
      )}
      
      {/* UPI Details */}
      {newPaymentMethod.method_type === 'UPI' && (
        <div>
          <Label htmlFor="upi_id">UPI ID *</Label>
          <Input
            id="upi_id"
            value={newPaymentMethod.upi_id}
            onChange={handleInputChange('upi_id')}
            placeholder="yourname@upi"
          />
        </div>
      )}
      
      {/* Net Banking Details */}
      {newPaymentMethod.method_type === 'NETBANKING' && (
        <div>
          <Label htmlFor="bank_name">Bank Name *</Label>
          <Input
            id="bank_name"
            value={newPaymentMethod.bank_name}
            onChange={handleInputChange('bank_name')}
            placeholder="Enter bank name"
          />
        </div>
      )}
      
      {/* Wallet Details */}
      {newPaymentMethod.method_type === 'WALLET' && (
        <div>
          <Label htmlFor="wallet_provider">Wallet Provider *</Label>
          <Select
            value={newPaymentMethod.wallet_provider}
            onValueChange={handleSelectChange('wallet_provider')}
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
          id="save_payment_for_future"
          checked={newPaymentMethod.save_for_future}
          onCheckedChange={handleCheckboxChange}
        />
        <Label htmlFor="save_payment_for_future" className="text-sm">
          Save this payment method for future orders
        </Label>
      </div>
      
      {!isValid && (
        <p className="text-sm text-red-600">* Please fill in all required fields</p>
      )}
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    JSON.stringify(prevProps.newPaymentMethod) === JSON.stringify(nextProps.newPaymentMethod) &&
    prevProps.isValid === nextProps.isValid &&
    prevProps.onPaymentMethodChange === nextProps.onPaymentMethodChange
  )
})

PaymentForm.displayName = 'PaymentForm'
