'use client'

import React, { useCallback } from 'react'
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

interface AddressFormProps {
  newAddress: NewAddress
  onAddressChange: (field: keyof NewAddress, value: string | boolean) => void
  isValid: boolean
}

export const AddressForm = React.memo(({ 
  newAddress, 
  onAddressChange, 
  isValid 
}: AddressFormProps) => {
  const handleInputChange = useCallback((field: keyof NewAddress) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    onAddressChange(field, e.target.value)
  }, [onAddressChange])

  const handleSelectChange = useCallback((field: keyof NewAddress) => (
    value: string
  ) => {
    onAddressChange(field, value)
  }, [onAddressChange])

  const handleCheckboxChange = useCallback((field: keyof NewAddress) => (
    checked: boolean
  ) => {
    onAddressChange(field, checked)
  }, [onAddressChange])

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-green-50">
      <h3 className="font-semibold text-lg">Add New Address</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="full_name">Full Name *</Label>
          <Input
            id="full_name"
            value={newAddress.full_name}
            onChange={handleInputChange('full_name')}
            placeholder="Enter full name"
          />
        </div>
        
        <div>
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            value={newAddress.phone}
            onChange={handleInputChange('phone')}
            placeholder="Enter phone number"
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="address_line_1">Address Line 1 *</Label>
        <Input
          id="address_line_1"
          value={newAddress.address_line_1}
          onChange={handleInputChange('address_line_1')}
          placeholder="House number, street name"
        />
      </div>
      
      <div>
        <Label htmlFor="address_line_2">Address Line 2</Label>
        <Input
          id="address_line_2"
          value={newAddress.address_line_2}
          onChange={handleInputChange('address_line_2')}
          placeholder="Apartment, suite, unit, building (Optional)"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            value={newAddress.city}
            onChange={handleInputChange('city')}
            placeholder="Enter city"
          />
        </div>
        
        <div>
          <Label htmlFor="state">State *</Label>
          <Input
            id="state"
            value={newAddress.state}
            onChange={handleInputChange('state')}
            placeholder="Enter state"
          />
        </div>
        
        <div>
          <Label htmlFor="postal_code">Postal Code *</Label>
          <Input
            id="postal_code"
            value={newAddress.postal_code}
            onChange={handleInputChange('postal_code')}
            placeholder="Enter postal code"
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="delivery_instructions">Delivery Instructions</Label>
        <Input
          id="delivery_instructions"
          value={newAddress.delivery_instructions}
          onChange={handleInputChange('delivery_instructions')}
          placeholder="Any special instructions for delivery (Optional)"
        />
      </div>
      
      <div>
        <Label htmlFor="address_type">Address Type</Label>
        <Select
          value={newAddress.type}
          onValueChange={handleSelectChange('type')}
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
          id="save_address_for_future"
          checked={newAddress.save_for_future}
          onCheckedChange={handleCheckboxChange('save_for_future')}
        />
        <Label htmlFor="save_address_for_future" className="text-sm">
          Save this address for future orders
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
    JSON.stringify(prevProps.newAddress) === JSON.stringify(nextProps.newAddress) &&
    prevProps.isValid === nextProps.isValid &&
    prevProps.onAddressChange === nextProps.onAddressChange
  )
})

AddressForm.displayName = 'AddressForm'
