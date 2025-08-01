'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Package, ArrowRight } from 'lucide-react'

export default function OrderSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('order')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8 px-4">
      <div className="max-w-2xl w-full">
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Order Placed Successfully!
            </h1>
            
            {orderNumber && (
              <p className="text-lg text-gray-600 mb-2">
                Order Number: <span className="font-semibold text-gray-900">{orderNumber}</span>
              </p>
            )}
            
            <p className="text-gray-600 mb-8">
              Thank you for your order. We&apos;ll send you a confirmation email shortly with your order details and tracking information.
            </p>

            <div className="space-y-4">
              <Button 
                className="w-full sm:w-auto"
                onClick={() => router.push('/profile/orders')}
              >
                <Package className="h-4 w-4 mr-2" />
                View My Orders
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full sm:w-auto ml-0 sm:ml-4"
                onClick={() => router.push('/catalog')}
              >
                Continue Shopping
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>

            <div className="mt-12 p-6 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">What&apos;s Next?</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• You&apos;ll receive an order confirmation email</li>
                <li>• We&apos;ll process your order within 24 hours</li>
                <li>• You&apos;ll get tracking details once shipped</li>
                <li>• Expected delivery: 3-5 business days</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
