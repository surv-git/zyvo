"use client";

import { useAuth } from '@/contexts/auth-context';

export default function FavoritesTestPage() {
  const { isAuthenticated, isLoading, user } = useAuth();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Favorites Test Page</h1>
      <div className="space-y-2">
        <p>Auth Loading: {isLoading ? 'Yes' : 'No'}</p>
        <p>Is Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
        <p>User: {user ? JSON.stringify(user, null, 2) : 'None'}</p>
      </div>
    </div>
  );
}
