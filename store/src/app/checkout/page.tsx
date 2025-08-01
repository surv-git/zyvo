'use client'

import React, { useEffect, useState, useRef, useLayoutEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import confetti from "canvas-confetti"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { CompactPageHeader } from '@/components/ui/compact-page-header'
import { Logo } from '@/components/logo'
import { useAuth } from '@/contexts/auth-context'
import { AuthGuard } from '@/components/auth-guard'
import { API_CONFIG, apiRequest } from '@/lib/api-config'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Edit,
  Loader2,
  MapPin,
  Plus,
  ShoppingCart,
  Tag,
  Package,
  Shield,
  Star,
  Home,
  Building,
  MapPinIcon
} from 'lucide-react'

interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

// Types
interface CartItem {
  _id: string
  cart_id: string
  product_variant_id: {
    _id: string
    product_id: {
      _id: string
      name: string
      description: string
    }
    option_values: Array<{
      _id: string
      option_type: string
      option_value: string
      name: string
      full_name: string
    }>
    sku_code: string
    price: number
    discount_details: {
      price: number | null
      percentage: number | null
      end_date: string | null
      is_on_sale: boolean
    }
    slug: string
    images: string[]
    effective_price: number
    savings: number
    discount_percentage_calculated: number
    average_rating: number
    reviews_count: number
  }
  quantity: number
  price_at_addition: number
  current_subtotal: number
  historical_subtotal: number
}

interface Cart {
  _id: string
  user_id: string
  applied_coupon_code: string | null
  coupon_discount_amount: number
  cart_total_amount: number
  last_updated_at: string
}

interface Address {
  _id: string
  user_id: string
  title: string
  type: 'HOME' | 'OFFICE' | 'OTHER'
  full_name: string
  phone: string
  address_line_1: string
  address_line_2: string
  landmark?: string
  city: string
  state: string
  postal_code: string
  country: string
  is_default: boolean
  is_active: boolean
  delivery_instructions?: string
  is_verified: boolean
}

interface PaymentMethod {
  _id: string
  user_id: string
  method_type: 'CREDIT_CARD' | 'DEBIT_CARD' | 'UPI' | 'NETBANKING' | 'WALLET'
  alias: string
  is_default: boolean
  details: {
    card_brand?: string
    last4_digits?: string
    expiry_month?: string
    expiry_year?: string
    card_holder_name?: string
    upi_id?: string
    account_holder_name?: string
  }
  is_active: boolean
  display_name: string
}

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
  title: string
  landmark: string
}

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

type CheckoutStep = 'cart' | 'address' | 'payment' | 'confirmation'

function CheckoutPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  
  // Refs for focus management - Address fields
  const titleInputRef = useRef<HTMLInputElement>(null)
  const fullNameInputRef = useRef<HTMLInputElement>(null)
  const phoneInputRef = useRef<HTMLInputElement>(null)
  const addressLine1InputRef = useRef<HTMLInputElement>(null)
  const addressLine2InputRef = useRef<HTMLInputElement>(null)
  const cityInputRef = useRef<HTMLInputElement>(null)
  const stateInputRef = useRef<HTMLInputElement>(null)
  const postalCodeInputRef = useRef<HTMLInputElement>(null)
  const landmarkInputRef = useRef<HTMLInputElement>(null)
  const deliveryInstructionsInputRef = useRef<HTMLInputElement>(null)
  
  // Refs for focus management - Payment fields
  const aliasInputRef = useRef<HTMLInputElement>(null)
  const cardNumberInputRef = useRef<HTMLInputElement>(null)
  const cardHolderNameInputRef = useRef<HTMLInputElement>(null)
  const cvvInputRef = useRef<HTMLInputElement>(null)
  const expiryMonthInputRef = useRef<HTMLInputElement>(null)
  const expiryYearInputRef = useRef<HTMLInputElement>(null)
  const upiIdInputRef = useRef<HTMLInputElement>(null)
  const bankNameInputRef = useRef<HTMLInputElement>(null)
  const walletProviderInputRef = useRef<HTMLInputElement>(null)
  
  // Cursor position tracking - Address fields
  const [titleCursorPos, setTitleCursorPos] = useState<number | null>(null)
  const [fullNameCursorPos, setFullNameCursorPos] = useState<number | null>(null)
  const [phoneCursorPos, setPhoneCursorPos] = useState<number | null>(null)
  const [addressLine1CursorPos, setAddressLine1CursorPos] = useState<number | null>(null)
  const [addressLine2CursorPos, setAddressLine2CursorPos] = useState<number | null>(null)
  const [cityCursorPos, setCityCursorPos] = useState<number | null>(null)
  const [stateCursorPos, setStateCursorPos] = useState<number | null>(null)
  const [postalCodeCursorPos, setPostalCodeCursorPos] = useState<number | null>(null)
  const [landmarkCursorPos, setLandmarkCursorPos] = useState<number | null>(null)
  const [deliveryInstructionsCursorPos, setDeliveryInstructionsCursorPos] = useState<number | null>(null)
  
  // Cursor position tracking - Payment fields
  const [aliasCursorPos, setAliasCursorPos] = useState<number | null>(null)
  const [cardNumberCursorPos, setCardNumberCursorPos] = useState<number | null>(null)
  const [cardHolderNameCursorPos, setCardHolderNameCursorPos] = useState<number | null>(null)
  const [cvvCursorPos, setCvvCursorPos] = useState<number | null>(null)
  const [expiryMonthCursorPos, setExpiryMonthCursorPos] = useState<number | null>(null)
  const [expiryYearCursorPos, setExpiryYearCursorPos] = useState<number | null>(null)
  const [upiIdCursorPos, setUpiIdCursorPos] = useState<number | null>(null)
  const [bankNameCursorPos, setBankNameCursorPos] = useState<number | null>(null)
  const [walletProviderCursorPos, setWalletProviderCursorPos] = useState<number | null>(null)
  
  // State
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('cart')
  const [cart, setCart] = useState<Cart | null>(null)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form states (separated to prevent focus loss)
  const [couponInput, setCouponInput] = useState('')
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)
  const [showNewAddressForm, setShowNewAddressForm] = useState(false)
  const [showNewPaymentForm, setShowNewPaymentForm] = useState(false)
  
  const [newAddress, setNewAddress] = useState<NewAddress>({
    full_name: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    postal_code: '',
    phone: '',
    delivery_instructions: '',
    type: 'HOME',
    save_for_future: false,
    title: '',
    landmark: ''
  })
  
  const [newPaymentMethod, setNewPaymentMethod] = useState<NewPaymentMethod>({
    alias: '',
    method_type: 'CREDIT_CARD',
    card_number: '',
    card_holder_name: '',
    expiry_month: '',
    expiry_year: '',
    cvv: '',
    upi_id: '',
    bank_name: '',
    wallet_provider: '',
    save_for_future: false
  })

  // Confetti effect for successful order
  const triggerSuccessConfetti = () => {
    const end = Date.now() + 3 * 1000 // 3 seconds
    const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"]

    const frame = () => {
      if (Date.now() > end) return

      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        startVelocity: 60,
        origin: { x: 0, y: 0.5 },
        colors: colors,
      })
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        startVelocity: 60,
        origin: { x: 1, y: 0.5 },
        colors: colors,
      })

      requestAnimationFrame(frame)
    }

    frame()
  }

  // Load initial data
  useEffect(() => {
    console.log('useEffect triggered, isAuthenticated:', isAuthenticated)
    if (isAuthenticated) {
      loadCartData()
    } else {
      console.log('User not authenticated, skipping cart load')
    }
  }, [isAuthenticated])

  // Trigger confetti when reaching confirmation step
  useEffect(() => {
    if (currentStep === 'confirmation') {
      // Small delay to ensure the page has rendered
      const timer = setTimeout(() => {
        triggerSuccessConfetti()
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [currentStep])

  const loadCartData = async () => {
    try {
      setIsLoading(true)
      console.log('Loading cart data...')
      const data = await apiRequest(API_CONFIG.ENDPOINTS.CART.GET, { method: 'GET' }, true) as ApiResponse<{
        cart: Cart
        items: CartItem[]
      }>
      
      console.log('Cart API response:', data)
      
      if (data.success) {
        console.log('Setting cart:', data.data.cart)
        console.log('Setting cart items:', data.data.items)
        setCart(data.data.cart)
        setCartItems(data.data.items)
      } else {
        console.log('Cart API error:', data.message)
        setError(data.message || 'Failed to load cart')
      }
    } catch (error) {
      console.error('Cart loading error:', error)
      setError('Failed to load cart data')
    } finally {
      setIsLoading(false)
    }
  }

  const loadAddresses = async () => {
    try {
      const data = await apiRequest(API_CONFIG.ENDPOINTS.USER.ADDRESSES, { method: 'GET' }, true) as ApiResponse<Address[]>
      
      if (data.success) {
        setAddresses(data.data)
        // Auto-select default address
        const defaultAddress = data.data.find((addr: Address) => addr.is_default)
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress._id)
        }
      }
    } catch {
      setError('Failed to load addresses')
    }
  }

  const loadPaymentMethods = async () => {
    try {
      const data = await apiRequest(API_CONFIG.ENDPOINTS.PAYMENT_METHODS, { method: 'GET' }, true) as ApiResponse<PaymentMethod[]>
      
      if (data.success) {
        setPaymentMethods(data.data)
        // Auto-select default payment method
        const defaultPayment = data.data.find((pm: PaymentMethod) => pm.is_default)
        if (defaultPayment) {
          setSelectedPaymentMethodId(defaultPayment._id)
        }
      }
    } catch {
      setError('Failed to load payment methods')
    }
  }

  const applyCoupon = async () => {
    if (!couponInput.trim()) return
    
    try {
      setIsApplyingCoupon(true)
      setError(null)
      
      const data = await apiRequest(`${API_CONFIG.ENDPOINTS.CART.GET}/apply-coupon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coupon_code: couponInput })
      }, true) as ApiResponse<{ cart: Cart }>
      
      if (data.success) {
        setCart(data.data.cart)
        setCouponInput('')
        setError(null)
      } else {
        setError(data.message || 'Invalid coupon code')
      }
    } catch {
      setError('Failed to apply coupon')
    } finally {
      setIsApplyingCoupon(false)
    }
  }

  const proceedToNextStep = () => {
    switch (currentStep) {
      case 'cart':
        setCurrentStep('address')
        loadAddresses()
        break
      case 'address':
        setCurrentStep('payment')
        loadPaymentMethods()
        break
      case 'payment':
        placeOrder()
        break
    }
  }

  const goBackToPreviousStep = () => {
    switch (currentStep) {
      case 'address':
        setCurrentStep('cart')
        break
      case 'payment':
        setCurrentStep('address')
        break
      case 'confirmation':
        router.push('/')
        break
    }
  }

  const placeOrder = async () => {
    try {
      setIsPlacingOrder(true)
      setError(null)
      
      // Get the selected address or new address data
      let addressData
      if (selectedAddressId) {
        // Find the selected address from the addresses list
        const selectedAddress = addresses.find(addr => addr._id === selectedAddressId)
        if (!selectedAddress) {
          setError('Selected address not found')
          return
        }
        addressData = {
          full_name: selectedAddress.full_name,
          address_line1: selectedAddress.address_line_1,
          address_line2: selectedAddress.address_line_2 || '',
          city: selectedAddress.city,
          state: selectedAddress.state,
          pincode: selectedAddress.postal_code,
          phone_number: selectedAddress.phone
        }
      } else if (showNewAddressForm && isNewAddressValid) {
        // Use the new address form data
        addressData = {
          full_name: newAddress.full_name,
          address_line1: newAddress.address_line_1,
          address_line2: newAddress.address_line_2 || '',
          city: newAddress.city,
          state: newAddress.state,
          pincode: newAddress.postal_code,
          phone_number: newAddress.phone
        }
      } else {
        setError('Please select or add a delivery address')
        return
      }
      
      // Create order payload with the expected structure
      const orderData = {
        shipping_address: addressData,
        billing_address: addressData, // Using same address for billing
        payment_method_id: selectedPaymentMethodId,
        items: cartItems.map(item => ({
          product_variant_id: item.product_variant_id._id,
          quantity: item.quantity,
          price: item.product_variant_id.effective_price
        }))
      }
      
      console.log('🔍 Order payload debug:', {
        'payment_method_id': orderData.payment_method_id,
        'items_count': orderData.items.length,
        'full orderData': orderData
      })
      
      // Validate required fields before sending
      if (!orderData.payment_method_id) {
        setError('Please select a payment method')
        return
      }
      
      if (!orderData.items || orderData.items.length === 0) {
        setError('No items in cart')
        return
      }
      
      console.log('Sending order data:', orderData) // Debug log
      
      const data = await apiRequest(API_CONFIG.ENDPOINTS.ORDERS.CREATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      }, true) as ApiResponse<unknown>
      
      if (data.success) {
        setCurrentStep('confirmation')
      } else {
        setError(data.message || 'Failed to place order')
      }
    } catch (error) {
      console.error('Order placement error:', error)
      setError('Failed to place order')
    } finally {
      setIsPlacingOrder(false)
    }
  }

  // Validation - Memoized to prevent re-renders
  const isNewAddressValid = React.useMemo(() => {
    return !!(
      newAddress.full_name.trim() &&
      newAddress.address_line_1.trim() &&
      newAddress.city.trim() &&
      newAddress.state.trim() &&
      newAddress.postal_code.trim() &&
      newAddress.phone.trim() &&
      newAddress.title.trim()
    )
  }, [newAddress])

  const isNewPaymentMethodValid = React.useMemo(() => {
    const baseValid = !!newPaymentMethod.alias.trim()
    
    switch (newPaymentMethod.method_type) {
      case 'CREDIT_CARD':
      case 'DEBIT_CARD':
        return !!(
          baseValid &&
          newPaymentMethod.card_number.replace(/\s/g, '').length >= 13 &&
          newPaymentMethod.card_holder_name.trim() &&
          newPaymentMethod.expiry_month.trim() &&
          newPaymentMethod.expiry_year.trim() &&
          newPaymentMethod.cvv.trim().length >= 3
        )
      case 'UPI':
        return !!(baseValid && newPaymentMethod.upi_id.trim() && newPaymentMethod.upi_id.includes('@'))
      default:
        return baseValid
    }
  }, [newPaymentMethod])

  const canProceed = React.useMemo(() => {
    switch (currentStep) {
      case 'cart':
        return cartItems.length > 0
      case 'address':
        return selectedAddressId || (showNewAddressForm && isNewAddressValid)
      case 'payment':
        return selectedPaymentMethodId || (showNewPaymentForm && isNewPaymentMethodValid)
      default:
        return false
    }
  }, [currentStep, cartItems.length, selectedAddressId, showNewAddressForm, isNewAddressValid, selectedPaymentMethodId, showNewPaymentForm, isNewPaymentMethodValid])

  // Optimized input handlers with useCallback - Address fields
  const handleTitleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const cursorPosition = e.target.selectionStart
    setTitleCursorPos(cursorPosition)
    setNewAddress(prev => ({ ...prev, title: e.target.value }))
  }, [])

  const handleFullNameChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const cursorPosition = e.target.selectionStart
    setFullNameCursorPos(cursorPosition)
    setNewAddress(prev => ({ ...prev, full_name: e.target.value }))
  }, [])

  const handlePhoneChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const cursorPosition = e.target.selectionStart
    setPhoneCursorPos(cursorPosition)
    setNewAddress(prev => ({ ...prev, phone: e.target.value }))
  }, [])

  const handleAddressLine1Change = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const cursorPosition = e.target.selectionStart
    setAddressLine1CursorPos(cursorPosition)
    setNewAddress(prev => ({ ...prev, address_line_1: e.target.value }))
  }, [])

  const handleAddressLine2Change = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const cursorPosition = e.target.selectionStart
    setAddressLine2CursorPos(cursorPosition)
    setNewAddress(prev => ({ ...prev, address_line_2: e.target.value }))
  }, [])

  const handleCityChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const cursorPosition = e.target.selectionStart
    setCityCursorPos(cursorPosition)
    setNewAddress(prev => ({ ...prev, city: e.target.value }))
  }, [])

  const handleStateChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const cursorPosition = e.target.selectionStart
    setStateCursorPos(cursorPosition)
    setNewAddress(prev => ({ ...prev, state: e.target.value }))
  }, [])

  const handlePostalCodeChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const cursorPosition = e.target.selectionStart
    setPostalCodeCursorPos(cursorPosition)
    setNewAddress(prev => ({ ...prev, postal_code: e.target.value }))
  }, [])

  const handleLandmarkChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const cursorPosition = e.target.selectionStart
    setLandmarkCursorPos(cursorPosition)
    setNewAddress(prev => ({ ...prev, landmark: e.target.value }))
  }, [])

  const handleDeliveryInstructionsChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const cursorPosition = e.target.selectionStart
    setDeliveryInstructionsCursorPos(cursorPosition)
    setNewAddress(prev => ({ ...prev, delivery_instructions: e.target.value }))
  }, [])

  // Optimized input handlers with useCallback - Payment fields
  const handleAliasChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const cursorPosition = e.target.selectionStart
    setAliasCursorPos(cursorPosition)
    setNewPaymentMethod(prev => ({ ...prev, alias: e.target.value }))
  }, [])

  const handleCardNumberChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const cursorPosition = e.target.selectionStart
    setCardNumberCursorPos(cursorPosition)
    setNewPaymentMethod(prev => ({ ...prev, card_number: e.target.value }))
  }, [])

  const handleCardHolderNameChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const cursorPosition = e.target.selectionStart
    setCardHolderNameCursorPos(cursorPosition)
    setNewPaymentMethod(prev => ({ ...prev, card_holder_name: e.target.value }))
  }, [])

  const handleCvvChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const cursorPosition = e.target.selectionStart
    setCvvCursorPos(cursorPosition)
    setNewPaymentMethod(prev => ({ ...prev, cvv: e.target.value }))
  }, [])

  const handleExpiryMonthChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const cursorPosition = e.target.selectionStart
    setExpiryMonthCursorPos(cursorPosition)
    setNewPaymentMethod(prev => ({ ...prev, expiry_month: e.target.value }))
  }, [])

  const handleExpiryYearChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const cursorPosition = e.target.selectionStart
    setExpiryYearCursorPos(cursorPosition)
    setNewPaymentMethod(prev => ({ ...prev, expiry_year: e.target.value }))
  }, [])

  const handleUpiIdChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const cursorPosition = e.target.selectionStart
    setUpiIdCursorPos(cursorPosition)
    setNewPaymentMethod(prev => ({ ...prev, upi_id: e.target.value }))
  }, [])

  const handleBankNameChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const cursorPosition = e.target.selectionStart
    setBankNameCursorPos(cursorPosition)
    setNewPaymentMethod(prev => ({ ...prev, bank_name: e.target.value }))
  }, [])

  const handleWalletProviderChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const cursorPosition = e.target.selectionStart
    setWalletProviderCursorPos(cursorPosition)
    setNewPaymentMethod(prev => ({ ...prev, wallet_provider: e.target.value }))
  }, [])

  // Restore cursor position after each render - Address fields
  useLayoutEffect(() => {
    if (titleInputRef.current && titleCursorPos !== null) {
      titleInputRef.current.setSelectionRange(titleCursorPos, titleCursorPos)
      titleInputRef.current.focus()
    }
  }, [newAddress.title, titleCursorPos])

  useLayoutEffect(() => {
    if (fullNameInputRef.current && fullNameCursorPos !== null) {
      fullNameInputRef.current.setSelectionRange(fullNameCursorPos, fullNameCursorPos)
      fullNameInputRef.current.focus()
    }
  }, [newAddress.full_name, fullNameCursorPos])

  useLayoutEffect(() => {
    if (phoneInputRef.current && phoneCursorPos !== null) {
      phoneInputRef.current.setSelectionRange(phoneCursorPos, phoneCursorPos)
      phoneInputRef.current.focus()
    }
  }, [newAddress.phone, phoneCursorPos])

  useLayoutEffect(() => {
    if (addressLine1InputRef.current && addressLine1CursorPos !== null) {
      addressLine1InputRef.current.setSelectionRange(addressLine1CursorPos, addressLine1CursorPos)
      addressLine1InputRef.current.focus()
    }
  }, [newAddress.address_line_1, addressLine1CursorPos])

  useLayoutEffect(() => {
    if (addressLine2InputRef.current && addressLine2CursorPos !== null) {
      addressLine2InputRef.current.setSelectionRange(addressLine2CursorPos, addressLine2CursorPos)
      addressLine2InputRef.current.focus()
    }
  }, [newAddress.address_line_2, addressLine2CursorPos])

  useLayoutEffect(() => {
    if (cityInputRef.current && cityCursorPos !== null) {
      cityInputRef.current.setSelectionRange(cityCursorPos, cityCursorPos)
      cityInputRef.current.focus()
    }
  }, [newAddress.city, cityCursorPos])

  useLayoutEffect(() => {
    if (stateInputRef.current && stateCursorPos !== null) {
      stateInputRef.current.setSelectionRange(stateCursorPos, stateCursorPos)
      stateInputRef.current.focus()
    }
  }, [newAddress.state, stateCursorPos])

  useLayoutEffect(() => {
    if (postalCodeInputRef.current && postalCodeCursorPos !== null) {
      postalCodeInputRef.current.setSelectionRange(postalCodeCursorPos, postalCodeCursorPos)
      postalCodeInputRef.current.focus()
    }
  }, [newAddress.postal_code, postalCodeCursorPos])

  useLayoutEffect(() => {
    if (landmarkInputRef.current && landmarkCursorPos !== null) {
      landmarkInputRef.current.setSelectionRange(landmarkCursorPos, landmarkCursorPos)
      landmarkInputRef.current.focus()
    }
  }, [newAddress.landmark, landmarkCursorPos])

  useLayoutEffect(() => {
    if (deliveryInstructionsInputRef.current && deliveryInstructionsCursorPos !== null) {
      deliveryInstructionsInputRef.current.setSelectionRange(deliveryInstructionsCursorPos, deliveryInstructionsCursorPos)
      deliveryInstructionsInputRef.current.focus()
    }
  }, [newAddress.delivery_instructions, deliveryInstructionsCursorPos])

  // Restore cursor position after each render - Payment fields
  useLayoutEffect(() => {
    if (aliasInputRef.current && aliasCursorPos !== null) {
      aliasInputRef.current.setSelectionRange(aliasCursorPos, aliasCursorPos)
      aliasInputRef.current.focus()
    }
  }, [newPaymentMethod.alias, aliasCursorPos])

  useLayoutEffect(() => {
    if (cardNumberInputRef.current && cardNumberCursorPos !== null) {
      cardNumberInputRef.current.setSelectionRange(cardNumberCursorPos, cardNumberCursorPos)
      cardNumberInputRef.current.focus()
    }
  }, [newPaymentMethod.card_number, cardNumberCursorPos])

  useLayoutEffect(() => {
    if (cardHolderNameInputRef.current && cardHolderNameCursorPos !== null) {
      cardHolderNameInputRef.current.setSelectionRange(cardHolderNameCursorPos, cardHolderNameCursorPos)
      cardHolderNameInputRef.current.focus()
    }
  }, [newPaymentMethod.card_holder_name, cardHolderNameCursorPos])

  useLayoutEffect(() => {
    if (cvvInputRef.current && cvvCursorPos !== null) {
      cvvInputRef.current.setSelectionRange(cvvCursorPos, cvvCursorPos)
      cvvInputRef.current.focus()
    }
  }, [newPaymentMethod.cvv, cvvCursorPos])

  useLayoutEffect(() => {
    if (expiryMonthInputRef.current && expiryMonthCursorPos !== null) {
      expiryMonthInputRef.current.setSelectionRange(expiryMonthCursorPos, expiryMonthCursorPos)
      expiryMonthInputRef.current.focus()
    }
  }, [newPaymentMethod.expiry_month, expiryMonthCursorPos])

  useLayoutEffect(() => {
    if (expiryYearInputRef.current && expiryYearCursorPos !== null) {
      expiryYearInputRef.current.setSelectionRange(expiryYearCursorPos, expiryYearCursorPos)
      expiryYearInputRef.current.focus()
    }
  }, [newPaymentMethod.expiry_year, expiryYearCursorPos])

  useLayoutEffect(() => {
    if (upiIdInputRef.current && upiIdCursorPos !== null) {
      upiIdInputRef.current.setSelectionRange(upiIdCursorPos, upiIdCursorPos)
      upiIdInputRef.current.focus()
    }
  }, [newPaymentMethod.upi_id, upiIdCursorPos])

  useLayoutEffect(() => {
    if (bankNameInputRef.current && bankNameCursorPos !== null) {
      bankNameInputRef.current.setSelectionRange(bankNameCursorPos, bankNameCursorPos)
      bankNameInputRef.current.focus()
    }
  }, [newPaymentMethod.bank_name, bankNameCursorPos])

  useLayoutEffect(() => {
    if (walletProviderInputRef.current && walletProviderCursorPos !== null) {
      walletProviderInputRef.current.setSelectionRange(walletProviderCursorPos, walletProviderCursorPos)
      walletProviderInputRef.current.focus()
    }
  }, [newPaymentMethod.wallet_provider, walletProviderCursorPos])

  if (!isAuthenticated) {
    return (
      <AuthGuard>
        <div></div>
      </AuthGuard>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading checkout...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <Logo />
            </div>
            
            {/* Security Badge */}
            <div className="flex items-center space-x-2 text-green-600">
              <Shield className="h-5 w-5" />
              <span className="text-sm font-medium">100% Secure</span>
            </div>
          </div>
        </div>
      </header>

      {/* Page Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <CompactPageHeader
            badge="Checkout"
            title={
              currentStep === 'cart' ? 'Review Your Order' :
              currentStep === 'address' ? 'Delivery Address' :
              currentStep === 'payment' ? 'Payment Method' :
              'Order Confirmed!'
            }
            subtitle={
              currentStep === 'cart' ? 'Review your items and proceed to checkout' :
              currentStep === 'address' ? 'Choose where you want your order delivered' :
              currentStep === 'payment' ? 'Select your preferred payment method' :
              'Thank you for your order!'
            }
          />
          
          {/* Progress Steps */}
          <div className="mt-8 flex items-center justify-center">
            <div className="flex items-center space-x-4">
              {[
                { key: 'cart', label: 'Cart', icon: ShoppingCart },
                { key: 'address', label: 'Address', icon: MapPin },
                { key: 'payment', label: 'Payment', icon: CreditCard },
                { key: 'confirmation', label: 'Confirmed', icon: CheckCircle2 }
              ].map(({ key, label, icon: Icon }, index) => {
                const isActive = currentStep === key
                const isCompleted = ['cart', 'address', 'payment', 'confirmation'].indexOf(currentStep) > index
                
                return (
                  <React.Fragment key={key}>
                    <div className={`flex items-center space-x-2 ${
                      isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isActive ? 'bg-blue-100' : isCompleted ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium">{label}</span>
                    </div>
                    {index < 3 && (
                      <ArrowRight className={`w-4 h-4 ${
                        isCompleted ? 'text-green-600' : 'text-gray-300'
                      }`} />
                    )}
                  </React.Fragment>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentStep === 'confirmation' ? (
          <ConfirmationStep />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Column 1: Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {currentStep === 'cart' && <CartStep />}
              {currentStep === 'address' && <AddressStep />}
              {currentStep === 'payment' && <PaymentStep />}
            </div>

            {/* Column 2: Sidebar */}
            <div className="space-y-6">
              {/* Coupon Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Tag className="h-5 w-5 mr-2" />
                    Apply Coupon
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Enter coupon code"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      onClick={applyCoupon}
                      disabled={isApplyingCoupon || !couponInput.trim()}
                      size="sm"
                    >
                      {isApplyingCoupon ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Apply'
                      )}
                    </Button>
                  </div>
                  {cart?.applied_coupon_code && (
                    <div className="mt-2 text-sm text-green-600">
                      Coupon &quot;{cart.applied_coupon_code}&quot; applied successfully!
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal ({cartItems.length} items)</span>
                      <span>${(cart?.cart_total_amount || 0) + (cart?.coupon_discount_amount || 0)}</span>
                    </div>
                    {cart?.coupon_discount_amount && cart.coupon_discount_amount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Coupon Discount</span>
                        <span>-${cart.coupon_discount_amount}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span>Shipping</span>
                      <span className="text-green-600">Free</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Total</span>
                      <span>${cart?.cart_total_amount || 0}</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 space-y-3">
                    {currentStep !== 'cart' && (
                      <Button
                        variant="outline"
                        onClick={goBackToPreviousStep}
                        className="w-full"
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                      </Button>
                    )}
                    
                    <Button
                      onClick={proceedToNextStep}
                      disabled={!canProceed || isPlacingOrder}
                      className="w-full"
                    >
                      {isPlacingOrder ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Placing Order...
                        </>
                      ) : (
                        <>
                          {currentStep === 'cart' && 'Continue to Address'}
                          {currentStep === 'address' && 'Continue to Payment'}
                          {currentStep === 'payment' && 'Place Order'}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {error && (
                    <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-md">
                      {error}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  // Cart Step Component
  function CartStep() {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShoppingCart className="h-5 w-5 mr-2" />
            Your Cart ({cartItems.length} items)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cartItems.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Your cart is empty</p>
              <Button onClick={() => router.push('/')}>
                Continue Shopping
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item._id} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <Image
                    src={item.product_variant_id.images[0] || '/placeholder.png'}
                    alt={item.product_variant_id.product_id.name}
                    width={80}
                    height={80}
                    className="rounded-md object-cover"
                  />
                  
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      {item.product_variant_id.product_id.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {item.product_variant_id.option_values.map(opt => opt.full_name).join(', ')}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600 ml-1">
                          {item.product_variant_id.average_rating} ({item.product_variant_id.reviews_count})
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">Qty: {item.quantity}</span>
                    </div>
                    <div className="mt-1">
                      {item.product_variant_id.discount_details.is_on_sale ? (
                        <div>
                          <span className="text-sm text-gray-500 line-through">
                            ${item.product_variant_id.price}
                          </span>
                          <span className="text-lg font-medium text-gray-900 ml-2">
                            ${item.product_variant_id.effective_price}
                          </span>
                        </div>
                      ) : (
                        <span className="text-lg font-medium text-gray-900">
                          ${item.product_variant_id.effective_price}
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-medium text-gray-900 mt-1">
                      Total: ${item.current_subtotal}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Address Step Component  
  function AddressStep() {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Delivery Address
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNewAddressForm(!showNewAddressForm)}
            >
              <Plus className="h-4 w-4 mr-2" />
              {showNewAddressForm ? 'Cancel' : 'Add New Address'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showNewAddressForm ? (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <h3 className="font-medium">Add New Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Address Title</Label>
                  <Input
                    ref={titleInputRef}
                    id="title"
                    placeholder="e.g., Home, Office"
                    value={newAddress.title}
                    onChange={handleTitleChange}
                  />
                </div>
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    ref={fullNameInputRef}
                    id="full_name"
                    placeholder="Enter full name"
                    value={newAddress.full_name}
                    onChange={handleFullNameChange}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    ref={phoneInputRef}
                    id="phone"
                    placeholder="Enter phone number"
                    value={newAddress.phone}
                    onChange={handlePhoneChange}
                  />
                </div>
                <div>
                  <Label htmlFor="type">Address Type</Label>
                  <select
                    id="type"
                    className="w-full p-2 border rounded-md"
                    value={newAddress.type}
                    onChange={(e) => setNewAddress(prev => ({ ...prev, type: e.target.value as 'HOME' | 'OFFICE' | 'OTHER' }))}
                  >
                    <option value="HOME">Home</option>
                    <option value="OFFICE">Office</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="address_line_1">Address Line 1</Label>
                  <Input
                    ref={addressLine1InputRef}
                    id="address_line_1"
                    placeholder="Street address"
                    value={newAddress.address_line_1}
                    onChange={handleAddressLine1Change}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="address_line_2">Address Line 2 (Optional)</Label>
                  <Input
                    ref={addressLine2InputRef}
                    id="address_line_2"
                    placeholder="Apartment, suite, etc."
                    value={newAddress.address_line_2}
                    onChange={handleAddressLine2Change}
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    ref={cityInputRef}
                    id="city"
                    placeholder="Enter city"
                    value={newAddress.city}
                    onChange={handleCityChange}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    ref={stateInputRef}
                    id="state"
                    placeholder="Enter state"
                    value={newAddress.state}
                    onChange={handleStateChange}
                  />
                </div>
                <div>
                  <Label htmlFor="postal_code">Postal Code</Label>
                  <Input
                    ref={postalCodeInputRef}
                    id="postal_code"
                    placeholder="Enter postal code"
                    value={newAddress.postal_code}
                    onChange={handlePostalCodeChange}
                  />
                </div>
                <div>
                  <Label htmlFor="landmark">Landmark (Optional)</Label>
                  <Input
                    ref={landmarkInputRef}
                    id="landmark"
                    placeholder="Nearby landmark"
                    value={newAddress.landmark}
                    onChange={handleLandmarkChange}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="delivery_instructions">Delivery Instructions (Optional)</Label>
                  <Input
                    ref={deliveryInstructionsInputRef}
                    id="delivery_instructions"
                    placeholder="Special delivery instructions"
                    value={newAddress.delivery_instructions}
                    onChange={handleDeliveryInstructionsChange}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="save_address"
                  checked={newAddress.save_for_future}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, save_for_future: e.target.checked }))}
                />
                <Label htmlFor="save_address">Save address for future use</Label>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {addresses.length === 0 ? (
                <div className="text-center py-8">
                  <MapPinIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No saved addresses found</p>
                  <Button onClick={() => setShowNewAddressForm(true)}>
                    Add Your First Address
                  </Button>
                </div>
              ) : (
                <RadioGroup value={selectedAddressId || ''} onValueChange={setSelectedAddressId}>
                  {addresses.map((address) => (
                    <div key={address._id} className="flex items-center space-x-3 p-4 border rounded-lg">
                      <RadioGroupItem value={address._id} id={address._id} />
                      <label htmlFor={address._id} className="flex-1 cursor-pointer">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{address.title}</span>
                              {address.is_default && (
                                <Badge variant="secondary" className="text-xs">Default</Badge>
                              )}
                              <div className="flex items-center text-gray-500">
                                {address.type === 'HOME' && <Home className="h-4 w-4" />}
                                {address.type === 'OFFICE' && <Building className="h-4 w-4" />}
                                {address.type === 'OTHER' && <MapPinIcon className="h-4 w-4" />}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {address.full_name} • {address.phone}
                            </p>
                            <p className="text-sm text-gray-600">
                              {address.address_line_1}, {address.address_line_2 && `${address.address_line_2}, `}
                              {address.city}, {address.state} {address.postal_code}
                            </p>
                            {address.delivery_instructions && (
                              <p className="text-xs text-gray-500 mt-1">
                                Instructions: {address.delivery_instructions}
                              </p>
                            )}
                          </div>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Payment Step Component
  function PaymentStep() {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Payment Method
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNewPaymentForm(!showNewPaymentForm)}
            >
              <Plus className="h-4 w-4 mr-2" />
              {showNewPaymentForm ? 'Cancel' : 'Add New Method'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showNewPaymentForm ? (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <h3 className="font-medium">Add New Payment Method</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="alias">Payment Method Name</Label>
                  <Input
                    ref={aliasInputRef}
                    id="alias"
                    placeholder="e.g., Primary Visa"
                    value={newPaymentMethod.alias}
                    onChange={handleAliasChange}
                  />
                </div>
                <div>
                  <Label htmlFor="method_type">Method Type</Label>
                  <select
                    id="method_type"
                    className="w-full p-2 border rounded-md"
                    value={newPaymentMethod.method_type}
                    onChange={(e) => setNewPaymentMethod(prev => ({ 
                      ...prev, 
                      method_type: e.target.value as 'CREDIT_CARD' | 'DEBIT_CARD' | 'UPI' | 'NETBANKING' | 'WALLET'
                    }))}
                  >
                    <option value="CREDIT_CARD">Credit Card</option>
                    <option value="DEBIT_CARD">Debit Card</option>
                    <option value="UPI">UPI</option>
                    <option value="NETBANKING">Net Banking</option>
                    <option value="WALLET">Wallet</option>
                  </select>
                </div>
                
                {(newPaymentMethod.method_type === 'CREDIT_CARD' || newPaymentMethod.method_type === 'DEBIT_CARD') && (
                  <>
                    <div className="md:col-span-2">
                      <Label htmlFor="card_number">Card Number</Label>
                      <Input
                        ref={cardNumberInputRef}
                        id="card_number"
                        placeholder="1234 5678 9012 3456"
                        value={newPaymentMethod.card_number}
                        onChange={handleCardNumberChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="card_holder_name">Card Holder Name</Label>
                      <Input
                        ref={cardHolderNameInputRef}
                        id="card_holder_name"
                        placeholder="John Doe"
                        value={newPaymentMethod.card_holder_name}
                        onChange={handleCardHolderNameChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        ref={cvvInputRef}
                        id="cvv"
                        placeholder="123"
                        maxLength={4}
                        value={newPaymentMethod.cvv}
                        onChange={handleCvvChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="expiry_month">Expiry Month</Label>
                      <Input
                        ref={expiryMonthInputRef}
                        id="expiry_month"
                        placeholder="12"
                        maxLength={2}
                        value={newPaymentMethod.expiry_month}
                        onChange={handleExpiryMonthChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="expiry_year">Expiry Year</Label>
                      <Input
                        ref={expiryYearInputRef}
                        id="expiry_year"
                        placeholder="2028"
                        maxLength={4}
                        value={newPaymentMethod.expiry_year}
                        onChange={handleExpiryYearChange}
                      />
                    </div>
                  </>
                )}
                
                {newPaymentMethod.method_type === 'UPI' && (
                  <div className="md:col-span-2">
                    <Label htmlFor="upi_id">UPI ID</Label>
                    <Input
                      ref={upiIdInputRef}
                      id="upi_id"
                      placeholder="user@paytm"
                      value={newPaymentMethod.upi_id}
                      onChange={handleUpiIdChange}
                    />
                  </div>
                )}
                
                {newPaymentMethod.method_type === 'NETBANKING' && (
                  <div className="md:col-span-2">
                    <Label htmlFor="bank_name">Bank Name</Label>
                    <Input
                      ref={bankNameInputRef}
                      id="bank_name"
                      placeholder="State Bank of India"
                      value={newPaymentMethod.bank_name}
                      onChange={handleBankNameChange}
                    />
                  </div>
                )}
                
                {newPaymentMethod.method_type === 'WALLET' && (
                  <div className="md:col-span-2">
                    <Label htmlFor="wallet_provider">Wallet Provider</Label>
                    <Input
                      ref={walletProviderInputRef}
                      id="wallet_provider"
                      placeholder="Paytm, PhonePe, etc."
                      value={newPaymentMethod.wallet_provider}
                      onChange={handleWalletProviderChange}
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="save_payment"
                  checked={newPaymentMethod.save_for_future}
                  onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, save_for_future: e.target.checked }))}
                />
                <Label htmlFor="save_payment">Save payment method for future use</Label>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {paymentMethods.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No saved payment methods found</p>
                  <Button onClick={() => setShowNewPaymentForm(true)}>
                    Add Your First Payment Method
                  </Button>
                </div>
              ) : (
                <RadioGroup value={selectedPaymentMethodId || ''} onValueChange={setSelectedPaymentMethodId}>
                  {paymentMethods.map((method) => (
                    <div key={method._id} className="flex items-center space-x-3 p-4 border rounded-lg">
                      <RadioGroupItem value={method._id} id={method._id} />
                      <label htmlFor={method._id} className="flex-1 cursor-pointer">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{method.display_name}</span>
                              {method.is_default && (
                                <Badge variant="secondary" className="text-xs">Default</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {method.method_type.replace('_', ' ')}
                              {method.details.last4_digits && ` ending in ${method.details.last4_digits}`}
                            </p>
                            {method.details.card_holder_name && (
                              <p className="text-xs text-gray-500">
                                {method.details.card_holder_name}
                              </p>
                            )}
                          </div>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Confirmation Step Component
  function ConfirmationStep() {
    return (
      <div className="min-h-[60vh] flex justify-center px-4">
        <div className="text-center py-12 max-w-md w-full">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Placed Successfully!</h2>
          <p className="text-gray-600 mb-8">
            Thank you for your order. You will receive a confirmation email shortly.
          </p>
          <div className="space-y-4">
            <Button onClick={() => router.push('/orders')} className="w-full sm:w-auto">
              View Order Details
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/')} 
              className="w-full sm:w-auto sm:ml-4"
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    )
  }
}

export default function CheckoutPageWrapper() {
  return (
    <AuthGuard>
      <CheckoutPage />
    </AuthGuard>
  )
}
