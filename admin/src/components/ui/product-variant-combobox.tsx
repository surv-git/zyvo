"use client"

import * as React from "react"
import { Combobox } from "@/components/ui/combobox"
import { getProductVariantList } from "@/services/product-variant-service"
import type { ProductVariant } from "@/types/product-variant"

interface ProductVariantComboboxProps {
  value?: string
  onValueChange: (value: string, variant?: ProductVariant) => void
  disabled?: boolean
  className?: string
  placeholder?: string
}

export function ProductVariantCombobox({
  value,
  onValueChange,
  disabled = false,
  className,
  placeholder = "Search product variants...",
}: ProductVariantComboboxProps) {
  const [variants, setVariants] = React.useState<ProductVariant[]>([])
  const [loading, setLoading] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  const searchVariants = React.useCallback(async (query: string) => {
    try {
      setLoading(true)
      const response = await getProductVariantList({
        page: 1,
        limit: 50, // Reasonable limit for search results
        search: query,
        sort: 'sku_code',
        order: 'asc',
        is_active: true
      })
      setVariants(response.data || [])
    } catch (error) {
      console.error('Error searching product variants:', error)
      setVariants([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounced search effect
  React.useEffect(() => {
    const handler = setTimeout(() => {
      searchVariants(searchQuery)
    }, 300)

    return () => {
      clearTimeout(handler)
    }
  }, [searchQuery, searchVariants])

  // Initial load
  React.useEffect(() => {
    searchVariants("")
  }, [searchVariants])

  const options = variants.map((variant) => ({
    value: variant.id,
    label: `${variant.sku_code} - ${variant.product_id.name}`,
  }))

  return (
    <Combobox
      options={options}
      value={value}
      onValueChange={(selectedValue) => {
        const selectedVariant = variants.find(v => v.id === selectedValue);
        onValueChange(selectedValue, selectedVariant);
      }}
      onSearch={setSearchQuery}
      placeholder={placeholder}
      emptyMessage="No product variants found"
      searchPlaceholder="Search by SKU or product name..."
      loading={loading}
      disabled={disabled}
      className={className}
    />
  )
}
