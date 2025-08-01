'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/logo'
import { Menu, X, User, LogOut, ShoppingCart, Heart, Package, ChevronDown, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import React from 'react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import { useCart } from '@/contexts/cart-context'
import { CategoryService } from '@/services/category-service'
import { Category } from '@/types/api'
import CartSheetPerformant from './cart-sheet'
import { Badge } from '@/components/ui/badge'

export const CompactHeader = () => {
    const [menuState, setMenuState] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState("")
    const [categories, setCategories] = React.useState<Category[]>([])
    const [categoriesLoading, setCategoriesLoading] = React.useState(true)
    const { user, isAuthenticated, logout, isLoading } = useAuth()
    const { totalItems } = useCart()
    const router = useRouter()

    // Fetch categories on component mount
    React.useEffect(() => {
        const fetchCategories = async () => {
            try {
                setCategoriesLoading(true)
                const fetchedCategories = await CategoryService.getAllCategories()
                setCategories(fetchedCategories)
            } catch (error) {
                console.error('Error fetching categories for navigation:', error)
            } finally {
                setCategoriesLoading(false)
            }
        }

        fetchCategories()
    }, [])

    // Group categories by parent category
    const groupedCategories = React.useMemo(() => {
        const parentCategories = categories.filter(cat => !cat.parent_category)
        const subcategoriesMap = new Map<string, Category[]>()
        
        // Group subcategories by their parent
        categories.forEach(cat => {
            if (cat.parent_category) {
                const parentId = cat.parent_category._id
                if (!subcategoriesMap.has(parentId)) {
                    subcategoriesMap.set(parentId, [])
                }
                subcategoriesMap.get(parentId)!.push(cat)
            }
        })

        // Create grouped structure
        return parentCategories.map(parent => ({
            parent,
            subcategories: subcategoriesMap.get(parent._id) || []
        }))
    }, [categories])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            router.push(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`)
        }
    }

    const toggleMenu = () => {
        setMenuState(!menuState)
    }

    return (
        <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-border/40">
            <nav className="relative z-50 h-auto w-full lg:px-36 px-4 py-3">
                <div className="w-full px-0">
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <div className="flex lg:flex-1">
                            <Link href="/" className="-m-1.5 p-1.5">
                                <Logo className="h-10 w-auto" />
                            </Link>
                        </div>

                        {/* Desktop Search */}
                        <div className="hidden lg:flex lg:flex-1 lg:justify-center max-w-lg mx-8">
                            <form onSubmit={handleSearch} className="relative w-full">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                                    <Input
                                        type="text"
                                        placeholder="Search products..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 w-full"
                                    />
                                </div>
                            </form>
                        </div>

                        {/* Desktop Actions */}
                        <div className="hidden lg:flex lg:flex-1 lg:justify-end items-center space-x-2">
                            {!isLoading && (
                                <>
                                    {isAuthenticated ? (
                                        <>
                                            <CartSheetPerformant>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="flex items-center gap-2 relative">
                                                    <ShoppingCart size={16} />
                                                    <span className="hidden sm:inline">Cart</span>
                                                    {totalItems > 0 && (
                                                        <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground">
                                                            {totalItems}
                                                        </Badge>
                                                    )}
                                                </Button>
                                            </CartSheetPerformant>

                                            <div className="relative group">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="flex items-center gap-2">
                                                    <User size={16} />
                                                    <span className="hidden sm:inline">{user?.name || 'Account'}</span>
                                                    <ChevronDown className="w-3 h-3" />
                                                </Button>
                                                
                                                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[9999]">
                                                    <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                                        <User size={16} />
                                                        <span>Profile</span>
                                                    </Link>
                                                    <Link href="/profile/orders" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                                        <Package size={16} />
                                                        <span>Orders</span>
                                                    </Link>
                                                    <Link href="/profile/favorites" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                                        <Heart size={16} />
                                                        <span>Favorites</span>
                                                    </Link>
                                                    <div className="h-px bg-border my-2"></div>
                                                    <Button
                                                        variant="ghost"
                                                        className="w-full justify-start gap-2 h-auto py-2 text-red-600 hover:text-red-600 hover:bg-red-50 px-4"
                                                        onClick={logout}>
                                                        <LogOut size={16} />
                                                        <span>Logout</span>
                                                    </Button>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <Button asChild variant="ghost" size="sm">
                                                <Link href="/login">Login</Link>
                                            </Button>
                                            <Button asChild size="sm">
                                                <Link href="/signup">Sign Up</Link>
                                            </Button>
                                        </>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Mobile menu button */}
                        <div className="flex lg:hidden">
                            <button
                                type="button"
                                onClick={toggleMenu}
                                data-state={menuState ? 'active' : 'inactive'}
                                aria-label={menuState ? 'Close Menu' : 'Open Menu'}
                                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5">
                                <Menu className={cn("m-auto size-6 duration-200", menuState && "rotate-180 scale-0 opacity-0")} />
                                <X className={cn("absolute inset-0 m-auto size-6 duration-200", 
                                    menuState ? "rotate-0 scale-100 opacity-100" : "-rotate-180 scale-0 opacity-0")} />
                            </button>
                        </div>
                    </div>

                    {/* Desktop Category Navigation */}
                    <div className="hidden lg:flex lg:justify-center mt-3 pt-3 border-t border-border/20">
                        <nav className="flex items-center space-x-1">
                            {categoriesLoading ? (
                                <div className="px-4 py-2 text-sm text-gray-500">Loading...</div>
                            ) : (
                                groupedCategories.map((categoryGroup) => (
                                    <div key={categoryGroup.parent._id} className="relative group">
                                        <button className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors px-4 py-2 flex items-center space-x-1 rounded-md hover:bg-gray-50">
                                            <span>{categoryGroup.parent.name}</span>
                                            <ChevronDown className="w-4 h-4" />
                                        </button>
                                        
                                        {/* Dropdown Menu */}
                                        <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-6 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[9999]">
                                            <div className="grid grid-cols-1 gap-2">
                                                <Link
                                                    href={`/catalog?category=${encodeURIComponent(categoryGroup.parent.name)}`}
                                                    className="group/link grid h-auto w-full items-center justify-start gap-1 rounded-md bg-white p-4 text-sm font-medium transition-colors hover:bg-accent-50 hover:text-accent-600 focus:bg-accent-50 focus:text-accent-600 focus:outline-none"
                                                >
                                                    <div className="text-sm font-medium leading-none group-hover/link:underline">
                                                        All {categoryGroup.parent.name}
                                                    </div>
                                                    <div className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                                        Browse all {categoryGroup.parent.name.toLowerCase()} products
                                                    </div>
                                                </Link>
                                                {categoryGroup.subcategories.length > 0 && (
                                                    <div className="border-t pt-2 mt-2">
                                                        <div className="text-xs font-medium text-gray-500 mb-2">
                                                            Categories
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {categoryGroup.subcategories.slice(0, 6).map((subcategory) => (
                                                                <Link
                                                                    key={subcategory._id}
                                                                    href={`/catalog?category=${encodeURIComponent(categoryGroup.parent.name)}&subcategory=${encodeURIComponent(subcategory.name)}`}
                                                                    className="text-sm text-gray-600 hover:text-primary-600 hover:underline transition-colors p-1 rounded"
                                                                >
                                                                    {subcategory.name}
                                                                </Link>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </nav>
                    </div>

                    {/* Mobile Menu */}
                    <div className={cn(
                        "fixed inset-0 top-0 z-10 lg:hidden",
                        menuState ? "visible" : "invisible"
                    )}>
                        <div className={cn(
                            "fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300",
                            menuState ? "opacity-100" : "opacity-0"
                        )} onClick={() => setMenuState(false)} />
                        
                        <div className={cn(
                            "fixed right-0 top-0 h-full w-80 bg-white shadow-xl transition-transform duration-300 ease-in-out",
                            menuState ? "translate-x-0" : "translate-x-full"
                        )}>
                            <div className="flex h-full flex-col">
                                <div className="flex items-center justify-between p-4 border-b">
                                    <Logo className="h-8 w-auto" />
                                    <button
                                        onClick={() => setMenuState(false)}
                                        className="p-2 hover:bg-gray-100 rounded-md">
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4">
                                    {/* Mobile Search */}
                                    <div className="mb-6">
                                        <form onSubmit={handleSearch} className="relative w-full">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                                                <Input
                                                    type="text"
                                                    placeholder="Search products..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="pl-10 pr-4 w-full"
                                                />
                                            </div>
                                        </form>
                                    </div>

                                    {/* Mobile Categories */}
                                    {categoriesLoading ? (
                                        <div className="text-sm text-gray-500">Loading...</div>
                                    ) : (
                                        <div className="space-y-4">
                                            {groupedCategories.map((categoryGroup) => (
                                                <div key={categoryGroup.parent._id} className="space-y-2">
                                                    <Link
                                                        href={`/catalog?category=${encodeURIComponent(categoryGroup.parent.name)}`}
                                                        className="text-base font-medium text-gray-900 hover:text-primary-600 block transition-colors"
                                                        onClick={() => setMenuState(false)}
                                                    >
                                                        {categoryGroup.parent.name}
                                                    </Link>
                                                    {categoryGroup.subcategories.length > 0 && (
                                                        <div className="ml-3 space-y-1">
                                                            {categoryGroup.subcategories.slice(0, 4).map((subcategory) => (
                                                                <Link
                                                                    key={subcategory._id}
                                                                    href={`/catalog?category=${encodeURIComponent(categoryGroup.parent.name)}&subcategory=${encodeURIComponent(subcategory.name)}`}
                                                                    className="text-sm text-gray-600 hover:text-primary-600 block transition-colors"
                                                                    onClick={() => setMenuState(false)}
                                                                >
                                                                    {subcategory.name}
                                                                </Link>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Mobile Actions */}
                                <div className="border-t p-4 space-y-3">
                                    {!isLoading && (
                                        <>
                                            {isAuthenticated ? (
                                                <>
                                                    <CartSheetPerformant>
                                                        <Button
                                                            variant="ghost"
                                                            className="w-full justify-start gap-2 relative">
                                                            <ShoppingCart size={16} />
                                                            <span>Cart</span>
                                                            {totalItems > 0 && (
                                                                <Badge className="ml-auto h-5 w-5 p-0 flex items-center justify-center text-xs">
                                                                    {totalItems}
                                                                </Badge>
                                                            )}
                                                        </Button>
                                                    </CartSheetPerformant>
                                                    
                                                    <Link href="/profile" onClick={() => setMenuState(false)}>
                                                        <Button variant="ghost" className="w-full justify-start gap-2">
                                                            <User size={16} />
                                                            <span>Profile</span>
                                                        </Button>
                                                    </Link>
                                                    
                                                    <Button
                                                        variant="ghost"
                                                        className="w-full justify-start gap-2 text-red-600 hover:text-red-600 hover:bg-red-50"
                                                        onClick={() => {
                                                            logout()
                                                            setMenuState(false)
                                                        }}>
                                                        <LogOut size={16} />
                                                        <span>Logout</span>
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    <Button asChild variant="ghost" className="w-full">
                                                        <Link href="/login" onClick={() => setMenuState(false)}>
                                                            Login
                                                        </Link>
                                                    </Button>
                                                    <Button asChild className="w-full">
                                                        <Link href="/signup" onClick={() => setMenuState(false)}>
                                                            Sign Up
                                                        </Link>
                                                    </Button>
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    )
}
