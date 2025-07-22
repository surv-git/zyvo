"use client"

import * as React from "react"
import { Combobox } from "@/components/ui/combobox"
import { getPlatformList } from "@/services/platform-service"
import type { Platform } from "@/types/platform"

interface PlatformComboboxProps {
  value?: string
  onValueChange: (value: string, platform?: Platform) => void
  disabled?: boolean
  className?: string
  placeholder?: string
}

export function PlatformCombobox({
  value,
  onValueChange,
  disabled = false,
  className,
  placeholder = "Search platforms...",
}: PlatformComboboxProps) {
  const [platforms, setPlatforms] = React.useState<Platform[]>([])
  const [loading, setLoading] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  const searchPlatforms = React.useCallback(async (query: string) => {
    try {
      setLoading(true)
      const response = await getPlatformList({
        page: 1,
        limit: 50, // Reasonable limit for search results
        search: query,
        sort: 'name',
        order: 'asc',
        is_active: true
      })
      setPlatforms(response.data || [])
    } catch (error) {
      console.error('Error searching platforms:', error)
      setPlatforms([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounced search effect
  React.useEffect(() => {
    const handler = setTimeout(() => {
      searchPlatforms(searchQuery)
    }, 300)

    return () => {
      clearTimeout(handler)
    }
  }, [searchQuery, searchPlatforms])

  // Initial load
  React.useEffect(() => {
    searchPlatforms("")
  }, [searchPlatforms])

  const options = platforms.map((platform) => ({
    value: platform._id,
    label: `${platform.name}${platform.is_active ? '' : ' (Inactive)'}`,
  }))

  return (
    <Combobox
      options={options}
      value={value}
      onValueChange={(selectedValue) => {
        const selectedPlatform = platforms.find(p => p._id === selectedValue);
        onValueChange(selectedValue, selectedPlatform);
      }}
      onSearch={setSearchQuery}
      placeholder={placeholder}
      emptyMessage="No platforms found"
      searchPlaceholder="Search by platform name..."
      loading={loading}
      disabled={disabled}
      className={className}
    />
  )
}
