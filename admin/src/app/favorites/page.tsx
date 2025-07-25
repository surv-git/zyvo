"use client";

import FavoriteManagementTable from '@/components/favorites/favorite-management-table';
import { PageHeader } from '@/components/ui/page-header';
import { Plus, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function FavoritesPage() {
  const router = useRouter();

  const handleAddFavorite = () => {
    router.push('/favorites/new');
  };

  return (
    <div className="page-container">
      <PageHeader
        icon={Heart}
        title="Favorites Management"
        description="Manage user favorites, status, and settings across the platform."
        actions={[
          {
            label: "Add Favorite",
            onClick: handleAddFavorite,
            icon: Plus,
            variant: "default"
          }
        ]}
      />
      
      <FavoriteManagementTable />
    </div>
  );
}
