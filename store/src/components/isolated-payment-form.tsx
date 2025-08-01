'use client'

import React, { useState, useCallback, useRef } from 'react'
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

interface IsolatedPaymentFormProps {
  initialData: NewPaymentMethod
  onDataChange: (data: NewPaymentMethod) => void
  isValid: boolean
}

export const IsolatedPaymentForm = ({ initialData, onDataChange, isValid }: IsolatedPaymentFormProps) => {
  // Internal state that doesn't cause parent re-renders
  const [formData, setFormData] = useState<NewPaymentMethod>(initialData)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const formDataRef = useRef<NewPaymentMethod>(formData)

  // Update field without notifying parent during typing to prevent re-renders
  const updateField = useCallback((field: keyof NewPaymentMethod, value: string | boolean) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
      formDataRef.current = newData // Keep ref in sync
      return newData
    })
  }, [])

  // Delayed parent notification to prevent focus interference
  const notifyParent = useCallback(() => {
    // Use setTimeout to ensure focus events complete before parent update
    setTimeout(() => {
      onDataChange(formDataRef.current)
    }, 0)
  }, [onDataChange])

  // Handle focus events properly
  const handleInputFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    // Ensure input is properly focused
    e.target.focus()
  }, [])

  const handleCardNumberChange = useCallback((value: string) => {
    const digitsOnly = value.replace(/\D/g, '')
    const formattedValue = digitsOnly.replace(/(.{4})/g, '$1 ').trim()
    updateField('card_number', formattedValue)
  }, [updateField])

  const handleCvvChange = useCallback((value: string) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 4)
    updateField('cvv', numericValue)
  }, [updateField])

  // Memoized field handlers to prevent focus loss
  const handleAliasChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('alias', e.target.value)
  }, [updateField])

  const handleMethodTypeChange = useCallback((value: string) => {
    updateField('method_type', value as NewPaymentMethod['method_type'])
  }, [updateField])

  const handleCardNumberInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleCardNumberChange(e.target.value)
  }, [handleCardNumberChange])

  const handleCardHolderNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('card_holder_name', e.target.value)
  }, [updateField])

  const handleExpiryMonthChange = useCallback((value: string) => {
    updateField('expiry_month', value)
  }, [updateField])

  const handleExpiryYearChange = useCallback((value: string) => {
    updateField('expiry_year', value)
  }, [updateField])

  const handleCvvInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleCvvChange(e.target.value)
  }, [handleCvvChange])

  const handleUpiIdChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('upi_id', e.target.value)
  }, [updateField])

  const handleBankNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('bank_name', e.target.value)
  }, [updateField])

  const handleWalletProviderChange = useCallback((value: string) => {
    updateField('wallet_provider', value)
  }, [updateField])

  const handleSaveForFutureChange = useCallback((checked: boolean) => {
    updateField('save_for_future', checked)
  }, [updateField])

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
      <h3 className="font-semibold text-lg">Add New Payment Method</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="payment_alias_isolated">Method Name *</Label>
          <Input
            id="payment_alias_isolated"
            value={formData.alias}
            onChange={handleAliasChange}
            onFocus={handleInputFocus}
            onBlur={notifyParent}
            placeholder="e.g., My Credit Card, Personal UPI"
          />
        </div>
        
        <div>
          <Label htmlFor="payment_type_isolated">Payment Type *</Label>
          <Select
            value={formData.method_type}
            onValueChange={handleMethodTypeChange}
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
      {(formData.method_type === 'CREDIT_CARD' || formData.method_type === 'DEBIT_CARD') && (
        <>
          <div>
            <Label htmlFor="card_number_isolated">Card Number *</Label>
            <Input
              id="card_number_isolated"
              value={formData.card_number}
              onChange={handleCardNumberInputChange}
              onFocus={handleInputFocus}
              onBlur={notifyParent}
              placeholder="1234 5678 9012 3456"
              maxLength={23}
            />
          </div>
          
          <div>
            <Label htmlFor="card_holder_name_isolated">Card Holder Name *</Label>
            <Input
              id="card_holder_name_isolated"
              value={formData.card_holder_name}
              onChange={handleCardHolderNameChange}
              onBlur={notifyParent}
              placeholder="Name as on card"
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="expiry_month_isolated">Month *</Label>
              <Select
                value={formData.expiry_month}
                onValueChange={handleExpiryMonthChange}
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
              <Label htmlFor="expiry_year_isolated">Year *</Label>
              <Select
                value={formData.expiry_year}
                onValueChange={handleExpiryYearChange}
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
              <Label htmlFor="cvv_isolated">CVV *</Label>
              <Input
                id="cvv_isolated"
                value={formData.cvv}
                onChange={handleCvvInputChange}
                onBlur={notifyParent}
                placeholder="123"
                maxLength={4}
                type="password"
              />
            </div>
          </div>
        </>
      )}
      
      {/* UPI Details */}
      {formData.method_type === 'UPI' && (
        <div>
          <Label htmlFor="upi_id_isolated">UPI ID *</Label>
          <Input
            id="upi_id_isolated"
            value={formData.upi_id}
            onChange={handleUpiIdChange}
            onBlur={notifyParent}
            placeholder="yourname@upi"
          />
        </div>
      )}
      
      {/* Net Banking Details */}
      {formData.method_type === 'NETBANKING' && (
        <div>
          <Label htmlFor="bank_name_isolated">Bank Name *</Label>
          <Input
            id="bank_name_isolated"
            value={formData.bank_name}
            onChange={handleBankNameChange}
            onBlur={notifyParent}
            placeholder="Enter bank name"
          />
        </div>
      )}
      
      {/* Wallet Details */}
      {formData.method_type === 'WALLET' && (
        <div>
          <Label htmlFor="wallet_provider_isolated">Wallet Provider *</Label>
          <Select
            value={formData.wallet_provider}
            onValueChange={handleWalletProviderChange}
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
          id="save_payment_isolated"
          checked={formData.save_for_future}
          onCheckedChange={handleSaveForFutureChange}
        />
        <Label htmlFor="save_payment_isolated" className="text-sm">
          Save this payment method for future orders
        </Label>
      </div>
      
      {!isValid && (
        <p className="text-sm text-red-600">* Please fill in all required fields</p>
      )}
    </div>
  )
}

IsolatedPaymentForm.displayName = 'IsolatedPaymentForm'
