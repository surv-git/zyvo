// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://localhost:3100',
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/v1/auth/login',
      REGISTER: '/api/v1/auth/register',
      LOGOUT: '/api/v1/auth/logout',
    },
    CATEGORIES: {
      LIST: '/api/v1/categories',
      DETAIL: (id: string) => `/api/v1/categories/${id}`,
    },
    PRODUCTS: {
      LIST: '/api/v1/products',
      DETAIL: (id: string) => `/api/v1/products/${id}`,
      SEARCH: '/api/v1/products/search',
      FEATURED: '/api/v1/products/featured',
      VARIANTS: '/api/v1/product-variants',
      VARIANT_DETAIL: (id: string) => `/api/v1/product-variants/${id}`,
    },
    BRANDS: {
      LIST: '/api/v1/brands',
      DETAIL: (id: string) => `/api/v1/brands/${id}`,
    },
    ORDERS: {
      LIST: '/api/v1/orders',
      DETAIL: (id: string) => `/api/v1/orders/${id}`,
      CREATE: '/api/v1/user/orders',
    },
    CART: {
      GET: '/api/v1/user/cart',
      ADD_ITEM: '/api/v1/user/cart/items',
      UPDATE_ITEM: (productVariantId: string) => `/api/v1/user/cart/items/${productVariantId}`,
      REMOVE_ITEM: (productVariantId: string) => `/api/v1/user/cart/items/${productVariantId}`,
    },
    WISHLIST: {
      LIST: '/api/v1/wishlist',
      ADD: '/api/v1/wishlist/add',
      REMOVE: '/api/v1/wishlist/remove',
    },
    USER: {
      FAVORITES: '/api/v1/user/favorites',
      ADDRESSES: '/api/v1/user/addresses',
      ORDERS: '/api/v1/user/orders',
    },
    PAYMENT_METHODS: '/api/v1/user/payment-methods',
    UNSPLASH: {
      PRODUCT_SUGGESTIONS: (productId: string) => `/api/v1/unsplash/product/${productId}/suggestions`,
    },
  },
}

// API Helper Functions
export const getFullUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`
}

// Default request headers
export const getDefaultHeaders = (includeAuth: boolean = false): HeadersInit => {
  console.log('🔍 getDefaultHeaders called with includeAuth:', includeAuth)
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  
  if (includeAuth && typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken')
    console.log('🔑 Auth requested:', includeAuth, 'Token found:', !!token)
    console.log('🔑 Actual token value:', token ? `${token.substring(0, 20)}...` : 'null')
    
    if (token) {
      headers.Authorization = `Bearer ${token}`
      console.log('✅ Authorization header added to request')
    } else {
      console.log('❌ No token found in localStorage - request will be unauthorized')
    }
  } else {
    if (!includeAuth) {
      console.log('🚫 Auth not requested for this API call')
    }
    if (typeof window === 'undefined') {
      console.log('🚫 Running on server-side, skipping auth')
    }
  }
  
  console.log('📋 Final headers:', headers)
  return headers
}

// Generic API fetch function
export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {},
  includeAuth: boolean = false
): Promise<T> => {
  const url = getFullUrl(endpoint)
  const headers = getDefaultHeaders(includeAuth)
  
  console.log('Making API request:', { url, headers, includeAuth }) // Debug log
  console.log('Request options:', options) // Debug log
  console.log('Request body:', options.body) // Debug the actual body being sent
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  })
  
  console.log('API response status:', response.status) // Debug log
  
  if (!response.ok) {
    console.log('API request failed:', response.status, response.statusText) // Debug log
    
    // Try to get the error response body for better debugging
    try {
      const errorData = await response.json()
      console.log('Error response data:', errorData)
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`)
    } catch {
      console.log('Could not parse error response as JSON')
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }
  }

  // Handle 204 No Content responses (successful but no body)
  if (response.status === 204) {
    console.log('API response: 204 No Content (successful)') // Debug log
    return { success: true } as T
  }

  const data = await response.json()
  console.log('API response data:', data) // Debug log
  return data
}

// Specific API methods
export const apiGet = async <T>(endpoint: string, includeAuth: boolean = false): Promise<T> => {
  return apiRequest<T>(endpoint, { method: 'GET' }, includeAuth)
}

export const apiPost = async <T>(
  endpoint: string, 
  data: any, 
  includeAuth: boolean = false
): Promise<T> => {
  return apiRequest<T>(
    endpoint, 
    { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }, 
    includeAuth
  )
}

export const apiPut = async <T>(
  endpoint: string, 
  data: any, 
  includeAuth: boolean = false
): Promise<T> => {
  return apiRequest<T>(
    endpoint, 
    { 
      method: 'PUT', 
      body: JSON.stringify(data) 
    }, 
    includeAuth
  )
}

export const apiPatch = async <T>(
  endpoint: string, 
  data: any, 
  includeAuth: boolean = false
): Promise<T> => {
  return apiRequest<T>(
    endpoint, 
    { 
      method: 'PATCH', 
      body: JSON.stringify(data) 
    }, 
    includeAuth
  )
}

export const apiDelete = async <T>(
  endpoint: string, 
  includeAuth: boolean = false
): Promise<T> => {
  return apiRequest<T>(endpoint, { method: 'DELETE' }, includeAuth)
}
