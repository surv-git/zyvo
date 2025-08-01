'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/logo'
import { Menu, X, User, LogOut, ShoppingCart, Heart, Settings, Package, ChevronDown, Search, Home } from 'lucide-react'
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

export const HeroHeader = () => {
    const [menuState, setMenuState] = React.useState(false)
    const [isScrolled, setIsScrolled] = React.useState(false)
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
                const parentId = cat.parent_category._id || cat.parent_category.name
                if (!subcategoriesMap.has(parentId)) {
                    subcategoriesMap.set(parentId, [])
                }
                subcategoriesMap.get(parentId)?.push(cat)
            }
        })

        return parentCategories.map(parent => ({
            parent,
            subcategories: subcategoriesMap.get(parent._id) || []
        }))
    }, [categories])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            // Navigate to catalog with search query
            router.push(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`)
            setMenuState(false) // Close mobile menu if open
        }
    }

    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])
    return (
        <header>
            <nav
                data-state={menuState && 'active'}
                className={cn('fixed z-[100] w-full transition-all duration-300', isScrolled && 'bg-background border-b border-black border-opacity-5')}
                style={isScrolled ? { backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } : {}}>
                <div className="mx-auto px-6">
                    <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0">
                        <div className="flex w-full justify-between gap-6 lg:w-auto">
                            <Link
                                href="/"
                                aria-label="home"
                                className="flex items-center space-x-2">
                                <Logo />
                            </Link>

                            <button
                                onClick={() => setMenuState(!menuState)}
                                aria-label={menuState == true ? 'Close Menu' : 'Open Menu'}
                                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden">
                                <Menu className="in-data-[state=active]:rotate-180 in-data-[state=active]:scale-0 in-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                                <X className="in-data-[state=active]:rotate-0 in-data-[state=active]:scale-100 in-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
                            </button>

                            <div className="m-auto hidden size-fit lg:block">
                                <nav className="flex space-x-1">                                    
                                    <Link 
                                        href="/"
                                        className="text-sm font-semibold text-gray-700 hover:text-primary-600 transition-colors px-3 py-2"
                                    >
                                        <Home className="w-4 h-4 mr-1 inline" />
                                    </Link>
                                    {categoriesLoading ? (
                                        <div className="px-4 py-2 text-sm text-gray-500">Loading...</div>
                                    ) : (
                                        groupedCategories.map((categoryGroup) => (
                                            <div key={categoryGroup.parent._id} className="relative group">
                                                <button className="text-sm font-semibold text-gray-700 hover:text-primary-600 transition-colors px-3 py-2 flex items-center space-x-1">
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
                                    <Link 
                                        href="/catalog"
                                        className="text-sm font-semibold text-gray-700 hover:text-primary-600 transition-colors px-3 py-2"
                                    >
                                        More...
                                    </Link>
                                </nav>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="hidden md:flex flex-1 max-w-md mx-6">
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

                        <div className="bg-background in-data-[state=active]:block lg:in-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent" style={{ boxShadow: '0 0 40px rgba(161, 161, 170, 0.2)' }}>
                            <div className="lg:hidden">
                                <div className="mb-4">
                                    <Link
                                        href="/catalog"
                                        className="text-base font-medium text-gray-900 hover:text-primary-600 block transition-colors"
                                        onClick={() => setMenuState(false)}
                                    >
                                        Catalog
                                    </Link>
                                </div>
                                {categoriesLoading ? (
                                    <div className="text-center py-4 text-sm text-gray-500">Loading categories...</div>
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
                            
                            {/* Mobile Search */}
                            <div className="lg:hidden w-full mb-4">
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
                            
                            <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
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
                                                        {totalItems > 0 && (
                                                            <Badge 
                                                                variant="destructive" 
                                                                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                                                            >
                                                                {totalItems}
                                                            </Badge>
                                                        )}                                                 
                                                    </Button>
                                                </CartSheetPerformant>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="flex items-center gap-2">
                                                    <Heart size={16} />                                                    
                                                </Button>
                                                
                                                <div className="relative group">
                                                    <button className="flex items-center gap-2 px-3 py-2 text-sm font-semibold hover:bg-gray-100 rounded-md transition-colors">
                                                        <User size={16} />
                                                        <span className="hidden sm:inline">Welcome, {user?.name}</span>
                                                        <ChevronDown size={14} />
                                                    </button>
                                                    <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[9999]">
                                                        <div className="space-y-1">
                                                            <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                                                                {user?.email}
                                                            </div>
                                                            <div className="h-px bg-border my-2"></div>                                                                    
                                                            <Button
                                                                variant="ghost"
                                                                className="w-full justify-start gap-2 h-auto py-2"
                                                                asChild>
                                                                <Link href="/profile">
                                                                    <User size={16} />
                                                                    <span>My Profile</span>
                                                                </Link>
                                                            </Button>
                                                            
                                                            <Button
                                                                variant="ghost"
                                                                className="w-full justify-start gap-2 h-auto py-2"
                                                                asChild>
                                                                <Link href="/orders">
                                                                    <Package size={16} />
                                                                    <span>My Orders</span>
                                                                </Link>
                                                            </Button>
                                                            
                                                            <Button
                                                                variant="ghost"
                                                                className="w-full justify-start gap-2 h-auto py-2"
                                                                asChild>
                                                                <Link href="/settings">
                                                                    <Settings size={16} />
                                                                    <span>Settings</span>
                                                                </Link>
                                                            </Button>
                                                            
                                                            <div className="h-px bg-border my-2"></div>
                                                            
                                                            <Button
                                                                variant="ghost"
                                                                className="w-full justify-start gap-2 h-auto py-2 text-red-600 hover:text-red-600 hover:bg-red-50"
                                                                onClick={logout}>
                                                                <LogOut size={16} />
                                                                <span>Logout</span>
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <Button
                                                    asChild
                                                    variant="ghost"
                                                    size="sm"
                                                    className={cn(isScrolled && 'lg:hidden')}>
                                                    <Link href="/login">
                                                        <span>Login</span>
                                                    </Link>
                                                </Button>
                                                <Button
                                                    asChild
                                                    size="sm"
                                                    className={cn(isScrolled && 'lg:hidden')}>
                                                    <Link href="/signup">
                                                        <span>Sign Up</span>
                                                    </Link>
                                                </Button>
                                                <Button
                                                    asChild
                                                    size="sm"
                                                    className={cn(isScrolled ? 'lg:inline-flex' : 'hidden')}>
                                                    <Link href="#">
                                                        <span>Get Started</span>
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
            </nav>
        </header>
    )
}
