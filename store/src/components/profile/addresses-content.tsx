'use client'

import { MapPin, Plus, Edit, Trash2, Phone, Home, Building2, MapPinIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UserAddressesService, UserAddress } from '@/services/user-addresses-service'
import { useState, useEffect } from 'react'

export default function AddressesContent() {
  const [addresses, setAddresses] = useState<UserAddress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<Set<string>>(new Set())

  // Fetch addresses from API
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        setLoading(true)
        setError(null)
        
        console.log('🔄 Fetching addresses...')
        
        const response = await UserAddressesService.getAddresses()
        console.log('✅ Addresses response:', response)
        
        if (response.success) {
          console.log('📦 Setting addresses data:', response.data)
          setAddresses(response.data)
        } else {
          console.error('❌ API returned success: false', response)
          setError('Failed to load addresses')
        }
      } catch (err) {
        console.error('❌ Error fetching addresses:', err)
        setError('Failed to load addresses. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchAddresses()
  }, [])

  // Handle delete address
  const handleDeleteAddress = async (addressId: string) => {
    try {
      setActionLoading(prev => new Set(prev).add(addressId))
      
      const response = await UserAddressesService.deleteAddress(addressId)
      
      if (response.success) {
        // Remove from local state
        setAddresses(prev => prev.filter(addr => addr._id !== addressId))
      } else {
        setError('Failed to delete address')
      }
    } catch (err) {
      console.error('Error deleting address:', err)
      setError('Failed to delete address')
    } finally {
      setActionLoading(prev => {
        const newSet = new Set(prev)
        newSet.delete(addressId)
        return newSet
      })
    }
  }

  // Handle set default address
  const handleSetDefault = async (addressId: string) => {
    try {
      setActionLoading(prev => new Set(prev).add(addressId))
      
      const response = await UserAddressesService.setDefaultAddress(addressId)
      
      if (response.success) {
        // Update local state
        setAddresses(prev => prev.map(addr => ({
          ...addr,
          is_default: addr._id === addressId
        })))
      } else {
        setError('Failed to set default address')
      }
    } catch (err) {
      console.error('Error setting default address:', err)
      setError('Failed to set default address')
    } finally {
      setActionLoading(prev => {
        const newSet = new Set(prev)
        newSet.delete(addressId)
        return newSet
      })
    }
  }

  // Get address type icon
  const getAddressIcon = (type: string) => {
    switch (type) {
      case 'HOME':
        return <Home className="h-5 w-5 text-gray-400" />
      case 'WORK':
        return <Building2 className="h-5 w-5 text-gray-400" />
      default:
        return <MapPinIcon className="h-5 w-5 text-gray-400" />
    }
  }

  // Get address type label
  const getAddressTypeLabel = (type: string) => {
    switch (type) {
      case 'HOME':
        return 'Home'
      case 'WORK':
        return 'Work'
      case 'OTHER':
        return 'Other'
      default:
        return type
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your addresses...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">Saved Addresses</CardTitle>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add New Address
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Addresses List */}
      {addresses.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No addresses saved</h3>
            <p className="text-gray-600 mb-6">Add your addresses for faster checkout.</p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Address
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((address) => {
            const isDeleting = actionLoading.has(address._id)
            const isSettingDefault = actionLoading.has(address._id)
            
            return (
              <Card key={address._id} className="relative">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      {getAddressIcon(address.type)}
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {address.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {getAddressTypeLabel(address.type)} Address
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {address.is_default && (
                        <Badge variant="secondary">Default</Badge>
                      )}
                      {address.is_verified && (
                        <Badge variant="outline" className="text-green-600">
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="font-medium text-gray-900">{address.full_name}</p>
                    <p className="text-gray-600">{address.address_line_1}</p>
                    {address.address_line_2 && (
                      <p className="text-gray-600">{address.address_line_2}</p>
                    )}
                    {address.landmark && (
                      <p className="text-sm text-gray-500">Near {address.landmark}</p>
                    )}
                    <p className="text-gray-600">
                      {address.city}, {address.state} {address.postal_code}
                    </p>
                    <p className="text-gray-600">{address.country}</p>
                    <p className="text-gray-600 flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {address.phone}
                    </p>
                    {address.delivery_instructions && (
                      <p className="text-sm text-gray-500 italic">
                        Note: {address.delivery_instructions}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => handleDeleteAddress(address._id)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
                    {!address.is_default && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleSetDefault(address._id)}
                        disabled={isSettingDefault}
                      >
                        {isSettingDefault ? 'Setting...' : 'Set as Default'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
