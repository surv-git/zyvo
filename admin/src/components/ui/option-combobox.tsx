"use client"

import * as React from "react"
import { Combobox } from "@/components/ui/combobox"
import { getOptionList } from "@/services/option-service"
import type { Option } from "@/types/option"

interface OptionComboboxProps {
  value?: string
  onValueChange: (value: string) => void
  disabled?: boolean
  className?: string
  excludeIds?: string[] // Options to exclude from the list
}

export function OptionCombobox({
  value,
  onValueChange,
  disabled = false,
  className,
  excludeIds = [],
}: OptionComboboxProps) {
  const [options, setOptions] = React.useState<Option[]>([])
  const [loading, setLoading] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  const searchOptions = React.useCallback(async (query: string) => {
    try {
      setLoading(true)
      const response = await getOptionList({
        page: 1,
        limit: 50, // Reasonable limit for search results
        search: query,
        sort: 'name',
        order: 'asc',
        include_inactive: false
      })
      // Filter out excluded options
      const filteredOptions = response.options.filter(
        option => !excludeIds.includes(option._id)
      )
      setOptions(filteredOptions)
    } catch (error) {
      console.error('Error searching options:', error)
      setOptions([])
    } finally {
      setLoading(false)
    }
  }, [excludeIds])

  // Debounced search effect
  React.useEffect(() => {
    const handler = setTimeout(() => {
      searchOptions(searchQuery)
    }, 300)

    return () => {
      clearTimeout(handler)
    }
  }, [searchQuery, searchOptions])

  // Initial load with empty query
  React.useEffect(() => {
    searchOptions("")
  }, [searchOptions])

  const comboboxOptions = React.useMemo(
    () =>
      options.map((option) => ({
        value: option._id,
        label: option.name,
        // Remove description - we'll show ID separately
      })),
    [options]
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
      placeholder="Search options..."
      searchPlaceholder="Search by option name or ID..."
      emptyMessage="No options found."
      loading={loading}
      disabled={disabled}
      className={className}
    />
  )
}
