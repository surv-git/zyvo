'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  User, 
  MapPin, 
  CreditCard, 
  Heart, 
  Package, 
  Shield, 
  FileText,
  Settings,
  LogOut,
  Bell,
  Gift
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'

interface MenuItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

interface MenuGroup {
  title: string
  items: MenuItem[]
}

const menuGroups: MenuGroup[] = [
  {
    title: 'Account',
    items: [
      {
        title: 'My Profile',
        href: '/profile',
        icon: User,
      },
      {
        title: 'Notifications',
        href: '/profile/notifications',
        icon: Bell,
      },
      {
        title: 'Account Settings',
        href: '/profile/settings',
        icon: Settings,
      },
    ],
  },
  {
    title: 'Shopping',
    items: [
      {
        title: 'My Orders',
        href: '/profile/orders',
        icon: Package,
      },
      {
        title: 'Favorites',
        href: '/profile/favorites',
        icon: Heart,
      },
      {
        title: 'Wishlist',
        href: '/profile/wishlist',
        icon: Gift,
      },
    ],
  },
  {
    title: 'Payment & Address',
    items: [
      {
        title: 'Saved Addresses',
        href: '/profile/addresses',
        icon: MapPin,
      },
      {
        title: 'Payment Methods',
        href: '/profile/payment-methods',
        icon: CreditCard,
      },
    ],
  },
  {
    title: 'Legal',
    items: [
      {
        title: 'Privacy Policy',
        href: '/profile/privacy-policy',
        icon: Shield,
      },
      {
        title: 'Terms of Use',
        href: '/profile/terms-of-use',
        icon: FileText,
      },
    ],
  },
]

export default function ProfileSidebar() {
  const pathname = usePathname()
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold text-gray-900">My Account</h2>
      </div>

      {/* Menu Groups */}
      <div className="p-4">
        {menuGroups.map((group, groupIndex) => (
          <div key={group.title} className={cn("mb-6", groupIndex === menuGroups.length - 1 && "mb-4")}>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              {group.title}
            </h3>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors relative",
                        isActive
                          ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      <Icon className={cn("mr-3 h-5 w-5", isActive ? "text-blue-700" : "text-gray-400")} />
                      <span className="flex-1">{item.title}</span>
                      {item.badge && (
                        <span className="ml-3 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}

        {/* Logout Button */}
        <div className="pt-4 border-t">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  )
}
