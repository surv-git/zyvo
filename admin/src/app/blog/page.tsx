'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import BlogManagementTable from '@/components/blog/blog-management-table';
import { Plus, FileText, TrendingUp, Users, Eye } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function BlogPage() {
  const router = useRouter();

  return (
    <div className="page-container">
      <PageHeader
        title="Blog Management"
        description="Create, manage, and publish blog posts and articles for your platform."
        actions={[
          {
            label: 'New Blog Post',
            onClick: () => router.push('/blog/new'),
            icon: Plus,
          },
        ]}
      />
        <BlogManagementTable />
    </div>
  );
}
