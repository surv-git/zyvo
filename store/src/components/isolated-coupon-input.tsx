'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface IsolatedCouponInputProps {
  onApplyCoupon: (code: string) => Promise<void>
  isApplying: boolean
  disabled?: boolean
}

export const IsolatedCouponInput = React.memo(({ onApplyCoupon, isApplying, disabled }: IsolatedCouponInputProps) => {
  const [couponCode, setCouponCode] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCouponCode(e.target.value)
  }, [])

  const handleApply = useCallback(async () => {
    if (!couponCode.trim()) return
    
    try {
      await onApplyCoupon(couponCode.trim())
      setCouponCode('') // Clear on success
    } catch (error) {
      // Error handling is done by parent component
      console.error('Coupon application failed:', error)
    }
  }, [couponCode, onApplyCoupon])

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isApplying && couponCode.trim()) {
      handleApply()
    }
  }, [handleApply, isApplying, couponCode])

  // Maintain focus on the input
  useEffect(() => {
    if (inputRef.current && document.activeElement === inputRef.current) {
      // Keep focus if input was already focused
      const currentSelection = inputRef.current.selectionStart
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
          inputRef.current.setSelectionRange(currentSelection || 0, currentSelection || 0)
        }
      }, 0)
    }
  })

  return (
    <div className="flex gap-2">
      <Input
        ref={inputRef}
        value={couponCode}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        placeholder="Enter coupon code"
        className="flex-1"
        disabled={disabled || isApplying}
      />
      <Button
        onClick={handleApply}
        disabled={isApplying || !couponCode.trim() || disabled}
        size="sm"
      >
        {isApplying ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          'Apply'
        )}
      </Button>
    </div>
  )
})

IsolatedCouponInput.displayName = 'IsolatedCouponInput'
