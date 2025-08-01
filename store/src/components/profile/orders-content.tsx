'use client'

import { Package, Search, Filter, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useState, useEffect, useCallback } from 'react'
import { UserOrdersService, UserOrderData, OrdersFilters } from '@/services/user-orders-service'
import Image from 'next/image'

interface OrdersState {
  orders: UserOrderData[]
  isLoading: boolean
  error: string | null
  pagination: {
    current_page: number
    total_pages: number
    total_count: number
    per_page: number
  } | null
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'delivered':
      return 'bg-green-100 text-green-800'
    case 'shipped':
      return 'bg-blue-100 text-blue-800'
    case 'processing':
    case 'confirmed':
      return 'bg-yellow-100 text-yellow-800'
    case 'cancelled':
    case 'returned':
      return 'bg-red-100 text-red-800'
    case 'pending':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getPaymentStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'paid':
      return 'bg-green-100 text-green-800'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'failed':
    case 'refunded':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default function OrdersContent() {
  const [ordersState, setOrdersState] = useState<OrdersState>({
    orders: [],
    isLoading: true,
    error: null,
    pagination: null
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrdersFilters['status']>()
  
  // TODO: Implement status filter functionality with setStatusFilter

  const loadOrders = useCallback(async (page: number = 1) => {
    setOrdersState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      const filters: OrdersFilters = {
        page,
        limit: 10,
        ...(statusFilter && { status: statusFilter })
      }
      
      const response = await UserOrdersService.getUserOrders(filters)
      
      if (response.success) {
        setOrdersState(prev => ({
          ...prev,
          orders: page === 1 ? response.data.orders : [...prev.orders, ...response.data.orders],
          pagination: response.data.pagination,
          isLoading: false
        }))
      } else {
        setOrdersState(prev => ({
          ...prev,
          error: response.message || 'Failed to load orders',
          isLoading: false
        }))
      }
    } catch (error) {
      console.error('Error loading orders:', error)
      setOrdersState(prev => ({
        ...prev,
        error: 'Failed to load orders. Please try again.',
        isLoading: false
      }))
    }
  }, [statusFilter])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  const loadMoreOrders = () => {
    if (ordersState.pagination && ordersState.pagination.current_page < ordersState.pagination.total_pages) {
      loadOrders(ordersState.pagination.current_page + 1)
    }
  }

  const filteredOrders = ordersState.orders.filter(orderData =>
    orderData.order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    orderData.order.formatted_order_number.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (ordersState.isLoading && ordersState.orders.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading your orders...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (ordersState.error && ordersState.orders.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error loading orders</h3>
            <p className="text-gray-600 mb-6">{ordersState.error}</p>
            <Button onClick={() => loadOrders()}>Try Again</Button>
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
            <CardTitle className="text-2xl font-bold">My Orders</CardTitle>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search orders..."
                  className="pl-10 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? 'No orders match your search.' : 'When you place your first order, it will appear here.'}
            </p>
            <Button>Start Shopping</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((orderData) => (
            <Card key={orderData.order._id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {orderData.order.formatted_order_number}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Placed on {new Date(orderData.order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge className={getStatusColor(orderData.order.order_status)}>
                          {orderData.order.order_status.charAt(0).toUpperCase() + 
                           orderData.order.order_status.slice(1).toLowerCase()}
                        </Badge>
                        <Badge className={getPaymentStatusColor(orderData.order.payment_status)}>
                          Payment: {orderData.order.payment_status.charAt(0).toUpperCase() + 
                                   orderData.order.payment_status.slice(1).toLowerCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ₹{orderData.order.grand_total_amount.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {orderData.items.length} item{orderData.items.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {/* Order Items Preview */}
                <div className="mb-4">
                  <div className="space-y-2">
                    {orderData.items.slice(0, 2).map((item) => (
                      <div key={item._id} className="flex items-center space-x-3 text-sm">
                        <div className="w-12 h-12 bg-gray-100 rounded-md flex-shrink-0 relative overflow-hidden">
                          {item.product_variant_id.images && item.product_variant_id.images.length > 0 ? (
                            <Image
                              src={item.product_variant_id.images[0]}
                              alt={item.product_name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 rounded-md" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.product_name}</p>
                          <p className="text-gray-600">
                            {item.formatted_options} • Qty: {item.quantity}
                          </p>
                        </div>
                        <p className="font-medium">₹{item.total_value.toFixed(2)}</p>
                      </div>
                    ))}
                    {orderData.items.length > 2 && (
                      <p className="text-sm text-gray-600 pl-15">
                        +{orderData.items.length - 2} more item{orderData.items.length - 2 > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    {orderData.order.tracking_number ? (
                      <p className="text-sm text-gray-600">
                        Tracking: <span className="font-medium">{orderData.order.tracking_number}</span>
                        {orderData.order.shipping_carrier && (
                          <span className="ml-2">({orderData.order.shipping_carrier})</span>
                        )}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-600">Tracking number will be provided soon</p>
                    )}
                  </div>
                  <div className="flex space-x-3">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    {orderData.order.order_status === 'DELIVERED' && (
                      <Button variant="outline" size="sm">
                        Reorder
                      </Button>
                    )}
                    {orderData.order.tracking_number && (
                      <Button variant="outline" size="sm">
                        Track Package
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Load More Button */}
      {ordersState.pagination && 
       ordersState.pagination.current_page < ordersState.pagination.total_pages && (
        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={loadMoreOrders}
            disabled={ordersState.isLoading}
          >
            {ordersState.isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More Orders'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
