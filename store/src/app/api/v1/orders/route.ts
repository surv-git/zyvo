import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Check for authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized - Missing or invalid auth token'
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Mock order creation
    const newOrder = {
      _id: `order_${Date.now()}`,
      order_number: `ORD-${Date.now()}`,
      status: 'CONFIRMED',
      total_amount: body.total_amount,
      items: body.items,
      delivery_address_id: body.delivery_address_id,
      payment_method_id: body.payment_method_id,
      coupon_code: body.coupon_code,
      created_at: new Date().toISOString(),
      estimated_delivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days from now
    }

    return NextResponse.json({
      success: true,
      data: newOrder,
      message: 'Order placed successfully'
    })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to place order'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check for authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized - Missing or invalid auth token'
        },
        { status: 401 }
      )
    }

    // Mock user orders data
    const mockOrders = [
      {
        _id: 'order_1',
        order_number: 'ORD-001',
        status: 'DELIVERED',
        total_amount: 2499.99,
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        items: []
      }
    ]

    return NextResponse.json({
      success: true,
      data: mockOrders,
      message: 'Orders retrieved successfully'
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch orders'
      },
      { status: 500 }
    )
  }
}
