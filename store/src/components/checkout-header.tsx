'use client'

import Link from 'next/link'
import { Logo } from '@/components/logo'
import { Shield } from 'lucide-react'

export const CheckoutHeader = () => {
  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo - Left side */}
        <Link href="/" className="flex items-center">
          <Logo />
        </Link>

        {/* Security Banner - Right side */}
        <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
          <Shield className="h-4 w-4" />
          <span>100% Secure</span>
        </div>
      </div>
    </header>
  )
}
