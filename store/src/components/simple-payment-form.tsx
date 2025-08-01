'use client'

import React, { useRef, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

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

interface SimplePaymentFormProps {
  onSubmit: (data: PaymentMethodData) => void
  isValid: boolean
}

export const SimplePaymentForm = ({ onSubmit, isValid }: SimplePaymentFormProps) => {
  const aliasRef = useRef<HTMLInputElement>(null)
  const cardNumberRef = useRef<HTMLInputElement>(null)
  const cardHolderRef = useRef<HTMLInputElement>(null)
  const cvvRef = useRef<HTMLInputElement>(null)
  const upiRef = useRef<HTMLInputElement>(null)
  const bankRef = useRef<HTMLInputElement>(null)
  const methodTypeRef = useRef<string>('CREDIT_CARD')
  const monthRef = useRef<string>('')
  const yearRef = useRef<string>('')
  const walletRef = useRef<string>('')
  const saveRef = useRef<boolean>(false)

  const handleCardNumberInput = (e: React.FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget
    const value = input.value.replace(/\D/g, '')
    const formattedValue = value.replace(/(.{4})/g, '$1 ').trim()
    input.value = formattedValue
  }

  const handleCvvInput = (e: React.FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget
    const value = input.value.replace(/\D/g, '').slice(0, 4)
    input.value = value
  }

  const collectData = useCallback(() => {
    const data: PaymentMethodData = {
      alias: aliasRef.current?.value || '',
      method_type: methodTypeRef.current,
      card_number: cardNumberRef.current?.value || '',
      card_holder_name: cardHolderRef.current?.value || '',
      expiry_month: monthRef.current,
      expiry_year: yearRef.current,
      cvv: cvvRef.current?.value || '',
      upi_id: upiRef.current?.value || '',
      bank_name: bankRef.current?.value || '',
      wallet_provider: walletRef.current,
      save_for_future: saveRef.current
    }
    onSubmit(data)
  }, [onSubmit])

  useEffect(() => {
    const interval = setInterval(collectData, 500)
    return () => clearInterval(interval)
  }, [collectData])

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
      <h3 className="font-semibold text-lg">Add New Payment Method</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="simple_alias">Method Name *</Label>
          <Input
            id="simple_alias"
            ref={aliasRef}
            placeholder="e.g., My Credit Card"
          />
        </div>
        
        <div>
          <Label htmlFor="simple_type">Payment Type *</Label>
          <Select
            defaultValue="CREDIT_CARD"
            onValueChange={(value) => {
              methodTypeRef.current = value
              collectData()
            }}
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
      {(methodTypeRef.current === 'CREDIT_CARD' || methodTypeRef.current === 'DEBIT_CARD') && (
        <>
          <div>
            <Label htmlFor="simple_card_number">Card Number *</Label>
            <Input
              id="simple_card_number"
              ref={cardNumberRef}
              onInput={handleCardNumberInput}
              placeholder="1234 5678 9012 3456"
              maxLength={23}
            />
          </div>
          
          <div>
            <Label htmlFor="simple_card_holder">Card Holder Name *</Label>
            <Input
              id="simple_card_holder"
              ref={cardHolderRef}
              placeholder="Name as on card"
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="simple_month">Month *</Label>
              <Select onValueChange={(value) => {
                monthRef.current = value
                collectData()
              }}>
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
              <Label htmlFor="simple_year">Year *</Label>
              <Select onValueChange={(value) => {
                yearRef.current = value
                collectData()
              }}>
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
              <Label htmlFor="simple_cvv">CVV *</Label>
              <Input
                id="simple_cvv"
                ref={cvvRef}
                onInput={handleCvvInput}
                placeholder="123"
                maxLength={4}
                type="password"
              />
            </div>
          </div>
        </>
      )}
      
      {/* UPI */}
      {methodTypeRef.current === 'UPI' && (
        <div>
          <Label htmlFor="simple_upi">UPI ID *</Label>
          <Input
            id="simple_upi"
            ref={upiRef}
            placeholder="yourname@upi"
          />
        </div>
      )}
      
      {/* Net Banking */}
      {methodTypeRef.current === 'NETBANKING' && (
        <div>
          <Label htmlFor="simple_bank">Bank Name *</Label>
          <Input
            id="simple_bank"
            ref={bankRef}
            placeholder="Enter bank name"
          />
        </div>
      )}
      
      {/* Wallet */}
      {methodTypeRef.current === 'WALLET' && (
        <div>
          <Label htmlFor="simple_wallet">Wallet Provider *</Label>
          <Select onValueChange={(value) => {
            walletRef.current = value
            collectData()
          }}>
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
          id="simple_save"
          onCheckedChange={(checked) => {
            saveRef.current = checked as boolean
            collectData()
          }}
        />
        <Label htmlFor="simple_save" className="text-sm">
          Save this payment method for future orders
        </Label>
      </div>
      
      {!isValid && (
        <p className="text-sm text-red-600">* Please fill in all required fields</p>
      )}
    </div>
  )
}
