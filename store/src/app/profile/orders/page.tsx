import { HeroHeader } from '@/components/header'
import { CompactPageHeader } from '@/components/ui/compact-page-header'
import FooterSection from '@/components/footer-one'
import ProfileSidebar from '@/components/profile/profile-sidebar'
import OrdersContent from '@/components/profile/orders-content'

export default function OrdersPage() {
  return (
    <>
      <HeroHeader />
      
      {/* Compact Header Section with proper margin for sticky header */}
      <section className="pt-24 pb-6 bg-gradient-to-br from-neutral-50 via-white to-neutral-100">
        <div className="max-w-full mx-auto text-center lg:px-36 px-4">
          <CompactPageHeader
            badge="Order History"
            title="My Orders"
            subtitle="Track your purchases and view order history"
          />
        </div>
      </section>
      
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <div className="lg:w-1/4">
              <ProfileSidebar />
            </div>
            
            {/* Main Content */}
            <div className="lg:w-3/4">
              <OrdersContent />
            </div>
          </div>
        </div>
      </div>
      
      <FooterSection />
    </>
  )
}
