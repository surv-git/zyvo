import { NextRequest, NextResponse } from 'next/server'

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

    // Mock user payment methods data
    const mockPaymentMethods = [
      {
        _id: 'pm_1',
        alias: 'Personal Card',
        method_type: 'CREDIT_CARD',
        is_default: true,
        details: {
          last4_digits: '4242',
          card_brand: 'Visa',
          expiry_month: '12',
          expiry_year: '2027'
        }
      },
      {
        _id: 'pm_2',
        alias: 'UPI Payment',
        method_type: 'UPI',
        is_default: false,
        details: {
          upi_id: 'john.doe@paytm'
        }
      },
      {
        _id: 'pm_3',
        alias: 'Digital Wallet',
        method_type: 'WALLET',
        is_default: false,
        details: {
          wallet_provider: 'PhonePe'
        }
      }
    ]

    return NextResponse.json({
      success: true,
      data: mockPaymentMethods,
      message: 'Payment methods retrieved successfully'
    })
  } catch (error) {
    console.error('Error fetching payment methods:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch payment methods'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Mock payment method creation
    const newPaymentMethod = {
      _id: `pm_${Date.now()}`,
      ...body,
      is_default: false
    }

    return NextResponse.json({
      success: true,
      data: newPaymentMethod,
      message: 'Payment method added successfully'
    })
  } catch (error) {
    console.error('Error creating payment method:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create payment method'
      },
      { status: 500 }
    )
  }
}
