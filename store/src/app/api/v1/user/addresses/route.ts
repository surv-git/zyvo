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

    // Mock user addresses data
    const mockAddresses = [
      {
        _id: 'addr_1',
        full_name: 'John Doe',
        type: 'HOME',
        is_default: true,
        address_line_1: '123 Main Street',
        address_line_2: 'Apt 4B',
        city: 'Mumbai',
        state: 'Maharashtra',
        postal_code: '400001',
        phone: '+91 9876543210',
        delivery_instructions: 'Ring the doorbell twice'
      },
      {
        _id: 'addr_2',
        full_name: 'John Doe',
        type: 'OFFICE',
        is_default: false,
        address_line_1: '456 Business Plaza',
        address_line_2: 'Floor 12, Office 1201',
        city: 'Mumbai',
        state: 'Maharashtra',
        postal_code: '400051',
        phone: '+91 9876543210',
        delivery_instructions: 'Contact security before delivery'
      }
    ]

    return NextResponse.json({
      success: true,
      data: mockAddresses,
      message: 'Addresses retrieved successfully'
    })
  } catch (error) {
    console.error('Error fetching addresses:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch addresses'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Mock address creation
    const newAddress = {
      _id: `addr_${Date.now()}`,
      ...body,
      is_default: false
    }

    return NextResponse.json({
      success: true,
      data: newAddress,
      message: 'Address added successfully'
    })
  } catch (error) {
    console.error('Error creating address:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create address'
      },
      { status: 500 }
    )
  }
}
