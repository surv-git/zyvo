export interface CartItem {
  _id: string
  cart_id: string
  product_variant_id: {
    _id: string
    product_id: {
      _id: string
      category_id: string
      name: string
      description: string
      brand_id: string
      primary_image: string | null
      id: string
    }
    option_values: {
      _id: string
      option_type: string
      option_value: string
      name: string
      full_name: string
      id: string
    }[]
    sku_code: string
    price: number
    discount_details: {
      price: number | null
      percentage: number | null
      end_date: string | null
      is_on_sale: boolean
    }
    slug: string
    dimensions: {
      length: number
      width: number
      height: number
      unit: string
    }
    weight: {
      value: number
      unit: string
    }
    packaging_cost: number
    shipping_cost: number
    images: string[]
    is_active: boolean
    sort_order: number
    average_rating: number
    reviews_count: number
    rating_distribution: {
      1: number
      2: number
      3: number
      4: number
      5: number
      _id: string
      id: string
    }
    createdAt: string
    updatedAt: string
    __v: number
    effective_price: number
    savings: number
    discount_percentage_calculated: number
    id: string
  }
  quantity: number
  price_at_addition: number
  added_at: string
  __v: number
  current_subtotal: number
  historical_subtotal: number
  id: string
}

export interface Cart {
  _id: string
  user_id: string
  applied_coupon_code: string | null
  coupon_discount_amount: number
  cart_total_amount: number
  last_updated_at: string
  createdAt: string
  updatedAt: string
  __v: number
  id: string
}

export interface CartResponse {
  success: boolean
  message: string
  data: {
    cart: Cart
    items: CartItem[]
  }
}

export interface AddToCartRequest {
  product_variant_id: string
  quantity: number
}

export interface AddToCartResponse {
  success: boolean
  message: string
  data: CartItem
}

export interface UpdateCartItemRequest {
  quantity: number
}

export interface UpdateCartItemResponse {
  success: boolean
  message: string
  data: CartItem
}
