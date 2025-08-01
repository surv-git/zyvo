'use client'

import React, { useRef, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

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

interface SimpleAddressFormProps {
  onSubmit: (data: AddressData) => void
  isValid: boolean
}

export const SimpleAddressForm = ({ onSubmit, isValid }: SimpleAddressFormProps) => {
  const aliasRef = useRef<HTMLInputElement>(null)
  const fullNameRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)
  const address1Ref = useRef<HTMLInputElement>(null)
  const address2Ref = useRef<HTMLInputElement>(null)
  const cityRef = useRef<HTMLInputElement>(null)
  const stateRef = useRef<HTMLInputElement>(null)
  const postalCodeRef = useRef<HTMLInputElement>(null)
  const countryRef = useRef<HTMLInputElement>(null)
  const saveRef = useRef<boolean>(false)

  const collectData = useCallback(() => {
    const data: AddressData = {
      alias: aliasRef.current?.value || '',
      full_name: fullNameRef.current?.value || '',
      phone_number: phoneRef.current?.value || '',
      address_line_1: address1Ref.current?.value || '',
      address_line_2: address2Ref.current?.value || '',
      city: cityRef.current?.value || '',
      state: stateRef.current?.value || '',
      postal_code: postalCodeRef.current?.value || '',
      country: countryRef.current?.value || '',
      save_for_future: saveRef.current
    }
    onSubmit(data)
  }, [onSubmit])

  useEffect(() => {
    const interval = setInterval(collectData, 500)
    return () => clearInterval(interval)
  }, [collectData])

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-green-50">
      <h3 className="font-semibold text-lg">Add New Address</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="simple_addr_alias">Address Name *</Label>
          <Input
            id="simple_addr_alias"
            ref={aliasRef}
            placeholder="e.g., Home, Office"
          />
        </div>
        
        <div>
          <Label htmlFor="simple_addr_name">Full Name *</Label>
          <Input
            id="simple_addr_name"
            ref={fullNameRef}
            placeholder="Enter full name"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="simple_addr_phone">Phone Number *</Label>
          <Input
            id="simple_addr_phone"
            ref={phoneRef}
            placeholder="Enter phone number"
            type="tel"
          />
        </div>
        
        <div>
          <Label htmlFor="simple_addr_country">Country *</Label>
          <Input
            id="simple_addr_country"
            ref={countryRef}
            placeholder="Enter country"
            defaultValue="India"
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="simple_addr_line1">Address Line 1 *</Label>
        <Input
          id="simple_addr_line1"
          ref={address1Ref}
          placeholder="House number, street name"
        />
      </div>
      
      <div>
        <Label htmlFor="simple_addr_line2">Address Line 2</Label>
        <Input
          id="simple_addr_line2"
          ref={address2Ref}
          placeholder="Apartment, suite, etc. (optional)"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="simple_addr_city">City *</Label>
          <Input
            id="simple_addr_city"
            ref={cityRef}
            placeholder="Enter city"
          />
        </div>
        
        <div>
          <Label htmlFor="simple_addr_state">State *</Label>
          <Input
            id="simple_addr_state"
            ref={stateRef}
            placeholder="Enter state"
          />
        </div>
        
        <div>
          <Label htmlFor="simple_addr_postal">Postal Code *</Label>
          <Input
            id="simple_addr_postal"
            ref={postalCodeRef}
            placeholder="Enter postal code"
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="simple_addr_save"
          onCheckedChange={(checked) => {
            saveRef.current = checked as boolean
            collectData()
          }}
        />
        <Label htmlFor="simple_addr_save" className="text-sm">
          Save this address for future orders
        </Label>
      </div>
      
      {!isValid && (
        <p className="text-sm text-red-600">* Please fill in all required fields</p>
      )}
    </div>
  )
}
