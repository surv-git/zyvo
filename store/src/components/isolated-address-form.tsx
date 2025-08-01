'use client'

import React, { useState, useCallback, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

interface NewAddress {
  full_name: string
  address_line_1: string
  address_line_2: string
  city: string
  state: string
  postal_code: string
  phone: string
  delivery_instructions: string
  type: 'HOME' | 'OFFICE' | 'OTHER'
  save_for_future: boolean
}

interface IsolatedAddressFormProps {
  initialData: NewAddress
  onDataChange: (data: NewAddress) => void
  isValid: boolean
}

export const IsolatedAddressForm = ({ initialData, onDataChange, isValid }: IsolatedAddressFormProps) => {
  // Internal state that doesn't cause parent re-renders
  const [formData, setFormData] = useState<NewAddress>(initialData)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const formDataRef = useRef<NewAddress>(formData)

  // Update field without notifying parent during typing to prevent re-renders
  const updateField = useCallback((field: keyof NewAddress, value: string | boolean) => {
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

  // Memoized field handlers to prevent focus loss
  const handleFullNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('full_name', e.target.value)
  }, [updateField])

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('phone', e.target.value)
  }, [updateField])

  const handleAddressLine1Change = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('address_line_1', e.target.value)
  }, [updateField])

  const handleAddressLine2Change = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('address_line_2', e.target.value)
  }, [updateField])

  const handleCityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('city', e.target.value)
  }, [updateField])

  const handleStateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('state', e.target.value)
  }, [updateField])

  const handlePostalCodeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('postal_code', e.target.value)
  }, [updateField])

  const handleDeliveryInstructionsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('delivery_instructions', e.target.value)
  }, [updateField])

  const handleTypeChange = useCallback((value: string) => {
    updateField('type', value as 'HOME' | 'OFFICE' | 'OTHER')
  }, [updateField])

  const handleSaveForFutureChange = useCallback((checked: boolean) => {
    updateField('save_for_future', checked)
  }, [updateField])

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-green-50">
      <h3 className="font-semibold text-lg">Add New Address</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="full_name_isolated">Full Name *</Label>
          <Input
            id="full_name_isolated"
            value={formData.full_name}
            onChange={handleFullNameChange}
            onFocus={handleInputFocus}
            onBlur={notifyParent}
            placeholder="Enter full name"
          />
        </div>
        
        <div>
          <Label htmlFor="phone_isolated">Phone Number *</Label>
          <Input
            id="phone_isolated"
            value={formData.phone}
            onChange={handlePhoneChange}
            onFocus={handleInputFocus}
            onBlur={notifyParent}
            placeholder="Enter phone number"
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="address_line_1_isolated">Address Line 1 *</Label>
        <Input
          id="address_line_1_isolated"
          value={formData.address_line_1}
          onChange={handleAddressLine1Change}
          onBlur={notifyParent}
          placeholder="House number, street name"
        />
      </div>
      
      <div>
        <Label htmlFor="address_line_2_isolated">Address Line 2</Label>
        <Input
          id="address_line_2_isolated"
          value={formData.address_line_2}
          onChange={handleAddressLine2Change}
          onBlur={notifyParent}
          placeholder="Apartment, suite, unit, building (Optional)"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="city_isolated">City *</Label>
          <Input
            id="city_isolated"
            value={formData.city}
            onChange={handleCityChange}
            onBlur={notifyParent}
            placeholder="Enter city"
          />
        </div>
        
        <div>
          <Label htmlFor="state_isolated">State *</Label>
          <Input
            id="state_isolated"
            value={formData.state}
            onChange={handleStateChange}
            onBlur={notifyParent}
            placeholder="Enter state"
          />
        </div>
        
        <div>
          <Label htmlFor="postal_code_isolated">Postal Code *</Label>
          <Input
            id="postal_code_isolated"
            value={formData.postal_code}
            onChange={handlePostalCodeChange}
            onBlur={notifyParent}
            placeholder="Enter postal code"
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="delivery_instructions_isolated">Delivery Instructions</Label>
        <Input
          id="delivery_instructions_isolated"
          value={formData.delivery_instructions}
          onChange={handleDeliveryInstructionsChange}
          onBlur={notifyParent}
          placeholder="Any special instructions for delivery (Optional)"
        />
      </div>
      
      <div>
        <Label htmlFor="address_type_isolated">Address Type</Label>
        <Select
          value={formData.type}
          onValueChange={handleTypeChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select address type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="HOME">Home</SelectItem>
            <SelectItem value="OFFICE">Office</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="save_address_isolated"
          checked={formData.save_for_future}
          onCheckedChange={handleSaveForFutureChange}
        />
        <Label htmlFor="save_address_isolated" className="text-sm">
          Save this address for future orders
        </Label>
      </div>
      
      {!isValid && (
        <p className="text-sm text-red-600">* Please fill in all required fields</p>
      )}
    </div>
  )
}

IsolatedAddressForm.displayName = 'IsolatedAddressForm'
