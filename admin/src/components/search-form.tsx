"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Search, Command, Hash, FileText, Package, Users, Building2, ShoppingCart, BarChart3, Settings, Plus } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

// Define navigation items and actions
interface SearchItem {
  id: string
  title: string
  description?: string
  icon: React.ComponentType<{ className?: string }>
  href?: string
  action?: () => void
  category: 'pages' | 'actions' | 'entities' | 'fields'
  keywords: string[]
}

interface SearchFormProps extends React.ComponentProps<"form"> {
  onNavigate?: (href: string) => void
}

export function SearchForm({ onNavigate, ...props }: SearchFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")

  // Define searchable items
  const searchItems: SearchItem[] = useMemo(() => [
    // Main Pages
    {
      id: "dashboard",
      title: "Dashboard",
      description: "View analytics and overview",
      icon: BarChart3,
      href: "/dashboard",
      category: "pages",
      keywords: ["dashboard", "analytics", "overview", "home", "stats"]
    },
    {
      id: "purchases",
      title: "Purchases",
      description: "Manage purchase orders",
      icon: ShoppingCart,
      href: "/purchases",
      category: "pages",
      keywords: ["purchases", "orders", "buying", "procurement", "suppliers"]
    },
    {
      id: "products",
      title: "Products",
      description: "Manage product catalog",
      icon: Package,
      href: "/products",
      category: "pages",
      keywords: ["products", "catalog", "inventory", "items"]
    },
    {
      id: "product-variants",
      title: "Product Variants",
      description: "Manage product variations",
      icon: Package,
      href: "/product-variants",
      category: "pages",
      keywords: ["variants", "variations", "sku", "options"]
    },
    {
      id: "brands",
      title: "Brands",
      description: "Manage product brands",
      icon: Hash,
      href: "/brands",
      category: "pages",
      keywords: ["brands", "manufacturers", "labels"]
    },
    {
      id: "categories",
      title: "Categories",
      description: "Manage product categories",
      icon: FileText,
      href: "/categories",
      category: "pages",
      keywords: ["categories", "classification", "groups", "taxonomy"]
    },
    {
      id: "options",
      title: "Options",
      description: "Manage product options",
      icon: Settings,
      href: "/options",
      category: "pages",
      keywords: ["options", "attributes", "properties", "features"]
    },
    {
      id: "users",
      title: "Users",
      description: "Manage user accounts",
      icon: Users,
      href: "/users",
      category: "pages",
      keywords: ["users", "accounts", "people", "staff", "team"]
    },
    {
      id: "suppliers",
      title: "Suppliers",
      description: "Manage suppliers",
      icon: Building2,
      href: "/suppliers",
      category: "pages",
      keywords: ["suppliers", "vendors", "partners", "companies"]
    },
    {
      id: "settings",
      title: "Settings",
      description: "Application settings",
      icon: Settings,
      href: "/settings",
      category: "pages",
      keywords: ["settings", "configuration", "preferences", "admin"]
    },

    // Quick Actions
    {
      id: "new-purchase",
      title: "New Purchase",
      description: "Create a new purchase order",
      icon: Plus,
      href: "/purchases/new",
      category: "actions",
      keywords: ["new", "create", "add", "purchase", "order"]
    },
    {
      id: "new-product",
      title: "New Product",
      description: "Add a new product",
      icon: Plus,
      href: "/products/new",
      category: "actions",
      keywords: ["new", "create", "add", "product"]
    },
    {
      id: "new-variant",
      title: "New Product Variant",
      description: "Create a new product variant",
      icon: Plus,
      href: "/product-variants/new",
      category: "actions",
      keywords: ["new", "create", "add", "variant", "sku"]
    },
    {
      id: "new-brand",
      title: "New Brand",
      description: "Add a new brand",
      icon: Plus,
      href: "/brands/new",
      category: "actions",
      keywords: ["new", "create", "add", "brand"]
    },
    {
      id: "new-category",
      title: "New Category",
      description: "Create a new category",
      icon: Plus,
      href: "/categories/new",
      category: "actions",
      keywords: ["new", "create", "add", "category"]
    },
    {
      id: "new-option",
      title: "New Option",
      description: "Add a new option",
      icon: Plus,
      href: "/options/new",
      category: "actions",
      keywords: ["new", "create", "add", "option"]
    },
    {
      id: "new-user",
      title: "New User",
      description: "Add a new user",
      icon: Plus,
      href: "/users/new",
      category: "actions",
      keywords: ["new", "create", "add", "user", "account"]
    },

    // Form Fields - Purchase Forms
    {
      id: "purchase-order-number",
      title: "Purchase Order Number",
      description: "Jump to purchase order number field",
      icon: Hash,
      href: "/purchases/new#purchase_order_number",
      category: "fields",
      keywords: ["purchase", "order", "number", "field", "form", "po"]
    },
    {
      id: "purchase-date",
      title: "Purchase Date",
      description: "Jump to purchase date field",
      icon: FileText,
      href: "/purchases/new#purchase_date",
      category: "fields",
      keywords: ["purchase", "date", "field", "form"]
    },
    {
      id: "supplier-selection",
      title: "Supplier Selection",
      description: "Jump to supplier selection field",
      icon: Building2,
      href: "/purchases/new#supplier_id",
      category: "fields",
      keywords: ["supplier", "selection", "field", "form", "vendor"]
    },
    {
      id: "product-variant-selection",
      title: "Product Variant Selection",
      description: "Jump to product variant field",
      icon: Package,
      href: "/purchases/new#product_variant_id",
      category: "fields",
      keywords: ["product", "variant", "selection", "field", "form", "sku"]
    },
    {
      id: "quantity-field",
      title: "Quantity",
      description: "Jump to quantity field",
      icon: Hash,
      href: "/purchases/new#quantity",
      category: "fields",
      keywords: ["quantity", "amount", "field", "form", "number"]
    },
    {
      id: "unit-price-field",
      title: "Unit Price",
      description: "Jump to unit price field",
      icon: FileText,
      href: "/purchases/new#unit_price_at_purchase",
      category: "fields",
      keywords: ["unit", "price", "cost", "field", "form", "money"]
    },

    // Form Fields - Product Forms
    {
      id: "product-name-field",
      title: "Product Name",
      description: "Jump to product name field",
      icon: Package,
      href: "/products/new#name",
      category: "fields",
      keywords: ["product", "name", "title", "field", "form"]
    },
    {
      id: "product-slug-field",
      title: "Product Slug",
      description: "Jump to product slug field",
      icon: Hash,
      href: "/products/new#slug",
      category: "fields",
      keywords: ["product", "slug", "url", "field", "form"]
    },
    {
      id: "product-description-field",
      title: "Product Description",
      description: "Jump to product description field",
      icon: FileText,
      href: "/products/new#description",
      category: "fields",
      keywords: ["product", "description", "details", "field", "form"]
    },
    {
      id: "product-price-field",
      title: "Product Price",
      description: "Jump to product price field",
      icon: FileText,
      href: "/products/new#min_price",
      category: "fields",
      keywords: ["product", "price", "cost", "field", "form", "money"]
    },
    {
      id: "category-selection-field",
      title: "Category Selection",
      description: "Jump to category selection field",
      icon: FileText,
      href: "/products/new#category_id",
      category: "fields",
      keywords: ["category", "selection", "field", "form", "classification"]
    },
    {
      id: "brand-selection-field",
      title: "Brand Selection",
      description: "Jump to brand selection field",
      icon: Hash,
      href: "/products/new#brand_id",
      category: "fields",
      keywords: ["brand", "selection", "field", "form", "manufacturer"]
    },

    // Form Fields - User Forms
    {
      id: "user-name-field",
      title: "User Name",
      description: "Jump to user name field",
      icon: Users,
      href: "/users/new#name",
      category: "fields",
      keywords: ["user", "name", "field", "form", "person"]
    },
    {
      id: "user-email-field",
      title: "User Email",
      description: "Jump to user email field",
      icon: Users,
      href: "/users/new#email",
      category: "fields",
      keywords: ["user", "email", "field", "form", "contact"]
    },
    {
      id: "user-password-field",
      title: "User Password",
      description: "Jump to user password field",
      icon: Users,
      href: "/users/new#password",
      category: "fields",
      keywords: ["user", "password", "field", "form", "security"]
    },
    {
      id: "user-role-field",
      title: "User Role",
      description: "Jump to user role field",
      icon: Users,
      href: "/users/new#role",
      category: "fields",
      keywords: ["user", "role", "permission", "field", "form"]
    },

    // Form Fields - Brand Forms
    {
      id: "brand-name-field",
      title: "Brand Name",
      description: "Jump to brand name field",
      icon: Hash,
      href: "/brands/new#name",
      category: "fields",
      keywords: ["brand", "name", "field", "form", "manufacturer"]
    },
    {
      id: "brand-website-field",
      title: "Brand Website",
      description: "Jump to brand website field",
      icon: Hash,
      href: "/brands/new#website",
      category: "fields",
      keywords: ["brand", "website", "url", "field", "form"]
    },
    {
      id: "brand-email-field",
      title: "Brand Contact Email",
      description: "Jump to brand contact email field",
      icon: Hash,
      href: "/brands/new#contact_email",
      category: "fields",
      keywords: ["brand", "contact", "email", "field", "form"]
    },

    // Form Fields - Supplier Forms
    {
      id: "supplier-name-field",
      title: "Supplier Name",
      description: "Jump to supplier name field",
      icon: Building2,
      href: "/suppliers/new#name",
      category: "fields",
      keywords: ["supplier", "name", "field", "form", "vendor"]
    },
    {
      id: "supplier-email-field",
      title: "Supplier Email",
      description: "Jump to supplier email field",
      icon: Building2,
      href: "/suppliers/new#email",
      category: "fields",
      keywords: ["supplier", "email", "field", "form", "contact"]
    },
    {
      id: "supplier-address-field",
      title: "Supplier Address",
      description: "Jump to supplier address field",
      icon: Building2,
      href: "/suppliers/new#address_line_1",
      category: "fields",
      keywords: ["supplier", "address", "location", "field", "form"]
    },

    // Statistics Pages
    {
      id: "purchase-stats",
      title: "Purchase Statistics",
      description: "View purchase analytics",
      icon: BarChart3,
      href: "/purchases/stats",
      category: "pages",
      keywords: ["statistics", "stats", "analytics", "purchase", "reports"]
    },
    {
      id: "product-stats",
      title: "Product Statistics",
      description: "View product analytics",
      icon: BarChart3,
      href: "/products/stats",
      category: "pages",
      keywords: ["statistics", "stats", "analytics", "product", "reports"]
    },
    {
      id: "variant-stats",
      title: "Product Variant Statistics",
      description: "View variant analytics",
      icon: BarChart3,
      href: "/product-variants/stats",
      category: "pages",
      keywords: ["statistics", "stats", "analytics", "variant", "reports"]
    },
  ], [])

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!searchValue.trim()) return searchItems

    const query = searchValue.toLowerCase()
    return searchItems.filter(item => 
      item.title.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.keywords.some(keyword => keyword.toLowerCase().includes(query))
    )
  }, [searchItems, searchValue])

  // Group filtered items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, SearchItem[]> = {
      pages: [],
      actions: [],
      entities: [],
      fields: []
    }

    filteredItems.forEach(item => {
      groups[item.category].push(item)
    })

    return groups
  }, [filteredItems])

  // Handle item selection
  const handleSelect = (item: SearchItem) => {
    setOpen(false)
    setSearchValue("")
    
    if (item.action) {
      item.action()
    } else if (item.href) {
      if (onNavigate) {
        onNavigate(item.href)
      } else {
        router.push(item.href)
      }
      
      // If it's a field, try to focus it after navigation
      if (item.category === 'fields' && item.href.includes('#')) {
        const fieldId = item.href.split('#')[1]
        setTimeout(() => {
          const element = document.getElementById(fieldId)
          if (element) {
            element.focus()
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 100)
      }
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'pages':
        return 'Pages'
      case 'actions':
        return 'Quick Actions'
      case 'entities':
        return 'Entities'
      case 'fields':
        return 'Form Fields'
      default:
        return category
    }
  }

  const getCategoryDescription = (category: string) => {
    switch (category) {
      case 'pages':
        return 'Navigate to different sections'
      case 'actions':
        return 'Create new items quickly'
      case 'entities':
        return 'Manage data entities'
      case 'fields':
        return 'Jump to specific form fields'
      default:
        return ''
    }
  }

  return (
    <>
      <form {...props}>
        <div className="relative">
          <Label htmlFor="search" className="sr-only">
            Search
          </Label>
          <Button
            type="button"
            variant="outline"
            className="h-8 w-48 justify-start px-3 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            onClick={() => setOpen(true)}
          >
            <Search className="mr-2 h-4 w-4" />
            <span>Search...</span>
            <Badge 
              variant="secondary" 
              className="ml-auto px-1.5 py-0.5 text-xs font-normal"
            >
              <Command className="mr-1 h-3 w-3" />
              K
            </Badge>
          </Button>
        </div>
      </form>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Type to search pages, actions, entities, or form fields..." 
          value={searchValue}
          onValueChange={setSearchValue}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          
          {Object.entries(groupedItems).map(([category, items]) => {
            if (items.length === 0) return null
            
            return (
              <React.Fragment key={category}>
                <CommandGroup 
                  heading={
                    <div className="flex items-center justify-between">
                      <span>{getCategoryLabel(category)}</span>
                      <span className="text-xs text-muted-foreground">
                        {getCategoryDescription(category)}
                      </span>
                    </div>
                  }
                >
                  {items.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={`${item.title} ${item.description} ${item.keywords.join(' ')}`}
                      onSelect={() => handleSelect(item)}
                      className="flex items-center gap-3 px-3 py-2"
                    >
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {item.title}
                        </p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground">
                            {item.description}
                          </p>
                        )}
                      </div>
                      {item.href && (
                        <Badge variant="outline" className="text-xs">
                          {item.href.startsWith('/') ? item.href.slice(1) : item.href}
                        </Badge>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </React.Fragment>
            )
          })}

          {filteredItems.length === 0 && searchValue && (
            <CommandGroup heading="No results">
              <CommandItem disabled>
                <div className="flex flex-col items-center py-6 text-center">
                  <Search className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No results found for &ldquo;{searchValue}&rdquo;
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Try searching for pages, actions, entities, or form field names
                  </p>
                </div>
              </CommandItem>
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
