"use client"

import * as React from "react"
import { Combobox } from "@/components/ui/combobox"
import { getProductList } from "@/services/product-service"
import type { Product } from "@/types/product"

interface ProductComboboxProps {
  value?: string
  onValueChange: (value: string) => void
  disabled?: boolean
  className?: string
}

export function ProductCombobox({
  value,
  onValueChange,
  disabled = false,
  className,
}: ProductComboboxProps) {
  const [products, setProducts] = React.useState<Product[]>([])
  const [loading, setLoading] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  const searchProducts = React.useCallback(async (query: string) => {
    try {
      setLoading(true)
      const response = await getProductList({
        page: 1,
        limit: 50, // Reasonable limit for search results
        search: query,
        sort: 'name',
        order: 'asc',
        include_inactive: false
      })
      setProducts(response.products)
    } catch (error) {
      console.error('Error searching products:', error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounced search effect
  React.useEffect(() => {
    const handler = setTimeout(() => {
      searchProducts(searchQuery)
    }, 300)

    return () => {
      clearTimeout(handler)
    }
  }, [searchQuery, searchProducts])

  // Initial load with empty query
  React.useEffect(() => {
    searchProducts("")
  }, [searchProducts])

  const comboboxOptions = React.useMemo(
    () =>
      products.map((product) => ({
        value: product._id,
        label: product.name,
        // Remove description - we'll show ID separately
      })),
    [products]
  )

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  return (
    <Combobox
      value={value}
      onValueChange={onValueChange}
      onSearch={handleSearch}
      options={comboboxOptions}
      placeholder="Search products..."
      searchPlaceholder="Search by product name or ID..."
      emptyMessage="No products found."
      loading={loading}
      disabled={disabled}
      className={className}
    />
  )
}
