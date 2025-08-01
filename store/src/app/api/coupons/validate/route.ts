import { NextRequest, NextResponse } from 'next/server'

// Mock coupons data
const mockCoupons = [
  {
    code: 'SAVE10',
    description: 'Get 10% off on your order',
    discount_type: 'PERCENTAGE',
    discount_amount: 10,
    minimum_order_amount: 500,
    is_active: true
  },
  {
    code: 'FLAT100',
    description: 'Get ₹100 off on your order',
    discount_type: 'FIXED',
    discount_amount: 100,
    minimum_order_amount: 1000,
    is_active: true
  },
  {
    code: 'WELCOME20',
    description: 'Welcome offer - 20% off',
    discount_type: 'PERCENTAGE',
    discount_amount: 20,
    minimum_order_amount: 300,
    is_active: true
  }
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { coupon_code, cart_total } = body
    
    if (!coupon_code) {
      return NextResponse.json(
        {
          success: false,
          message: 'Coupon code is required'
        },
        { status: 400 }
      )
    }
    
    // Find the coupon
    const coupon = mockCoupons.find(
      c => c.code.toLowerCase() === coupon_code.toLowerCase() && c.is_active
    )
    
    if (!coupon) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid or expired coupon code'
        },
        { status: 400 }
      )
    }
    
    // Check minimum order amount
    if (coupon.minimum_order_amount && cart_total < coupon.minimum_order_amount) {
      return NextResponse.json(
        {
          success: false,
          message: `Minimum order amount of ₹${coupon.minimum_order_amount} required for this coupon`
        },
        { status: 400 }
      )
    }
    
    // Calculate discount amount
    let discountAmount = 0
    if (coupon.discount_type === 'PERCENTAGE') {
      discountAmount = (cart_total * coupon.discount_amount) / 100
    } else {
      discountAmount = coupon.discount_amount
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ...coupon,
        calculated_discount: discountAmount
      }
    })
  } catch (error) {
    console.error('Error validating coupon:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to validate coupon'
      },
      { status: 500 }
    )
  }
}
