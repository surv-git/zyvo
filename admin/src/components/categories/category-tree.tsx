"use client";

import React, { useState, useEffect } from 'react';
import { ChevronRight, Folder, FolderOpen, Tag, Loader2, AlertCircle } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Category } from '@/types/category';
import { getCategoryList } from '@/services/category-service';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface CategoryNode extends Category {
  children: CategoryNode[];
}

interface CategoryTreeProps {
  className?: string;
}

export function CategoryTree({ className }: CategoryTreeProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryTree, setCategoryTree] = useState<CategoryNode[]>([]);

  // Load and build category tree
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load all categories
        const response = await getCategoryList({ 
          page: 1, 
          limit: 1000, 
          include_inactive: true 
        });
        
        // Build tree structure
        const tree = buildCategoryTree(response.categories);
        setCategoryTree(tree);
      } catch (err) {
        console.error('Failed to load categories:', err);
        setError('Failed to load category tree');
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  // Build hierarchical tree from flat category list
  const buildCategoryTree = (categories: Category[]): CategoryNode[] => {
    const categoryMap = new Map<string, CategoryNode>();
    const rootCategories: CategoryNode[] = [];

    // First pass: create all nodes
    categories.forEach(category => {
      categoryMap.set(category._id, { ...category, children: [] });
    });

    // Second pass: build parent-child relationships
    categories.forEach(category => {
      const node = categoryMap.get(category._id)!;
      
      if (category.parent_category) {
        const parent = categoryMap.get(category.parent_category._id);
        if (parent) {
          parent.children.push(node);
        } else {
          // Parent not found, treat as root
          rootCategories.push(node);
        }
      } else {
        rootCategories.push(node);
      }
    });

    // Sort categories by name
    const sortCategories = (nodes: CategoryNode[]) => {
      nodes.sort((a, b) => a.name.localeCompare(b.name));
      nodes.forEach(node => sortCategories(node.children));
    };

    sortCategories(rootCategories);
    return rootCategories;
  };

  const handleCategoryClick = (category: CategoryNode) => {
    router.push(`/categories/${category._id}`);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Folder className="h-5 w-5 mr-2" />
            Category Tree
          </CardTitle>
          <CardDescription>
            Hierarchical view of all categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-muted-foreground">Loading category tree...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Folder className="h-5 w-5 mr-2" />
            Category Tree
          </CardTitle>
          <CardDescription>
            Hierarchical view of all categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
              <p className="text-destructive font-medium mb-2">Error loading tree</p>
              <p className="text-muted-foreground text-sm mb-4">{error}</p>
              <Button onClick={() => window.location.reload()} variant="outline" size="sm">
                Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (categoryTree.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Folder className="h-5 w-5 mr-2" />
            Category Tree
          </CardTitle>
          <CardDescription>
            Hierarchical view of all categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Folder className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No categories found</p>
              <Button 
                onClick={() => router.push('/categories/new')} 
                variant="outline" 
                size="sm"
                className="mt-4"
              >
                Create First Category
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Folder className="h-5 w-5 mr-2" />
          Category Tree
        </CardTitle>
        <CardDescription>
          Hierarchical view of all categories ({categoryTree.length} root categories)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {categoryTree.map((category) => (
            <CategoryTreeNode 
              key={category._id} 
              category={category} 
              onCategoryClick={handleCategoryClick}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface CategoryTreeNodeProps {
  category: CategoryNode;
  onCategoryClick: (category: CategoryNode) => void;
  level?: number;
}

function CategoryTreeNode({ category, onCategoryClick, level = 0 }: CategoryTreeNodeProps) {
  const hasChildren = category.children.length > 0;
  const [isOpen, setIsOpen] = useState(level < 2); // Auto-expand first 2 levels

  if (!hasChildren) {
    return (
      <div 
        className="flex items-center space-x-2 py-1 px-2 rounded hover:bg-muted/50 cursor-pointer group"
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        onClick={() => onCategoryClick(category)}
      >
        <Tag className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm group-hover:text-primary">{category.name}</span>
        <div className="flex items-center space-x-1 ml-auto">
          {!category.is_active && (
            <Badge variant="secondary" className="text-xs">
              Inactive
            </Badge>
          )}
          {category.children.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {category.children.length}
            </Badge>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div 
            className="flex items-center space-x-2 py-1 px-2 rounded hover:bg-muted/50 cursor-pointer group w-full"
            style={{ paddingLeft: `${level * 20 + 8}px` }}
          >
            <ChevronRight 
              className={`h-4 w-4 text-muted-foreground transition-transform ${
                isOpen ? 'rotate-90' : ''
              }`} 
            />
            {isOpen ? (
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Folder className="h-4 w-4 text-muted-foreground" />
            )}
            <span 
              className="text-sm group-hover:text-primary font-medium"
              onClick={(e) => {
                e.stopPropagation();
                onCategoryClick(category);
              }}
            >
              {category.name}
            </span>
            <div className="flex items-center space-x-1 ml-auto">
              {!category.is_active && (
                <Badge variant="secondary" className="text-xs">
                  Inactive
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {category.children.length}
              </Badge>
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-1">
            {category.children.map((child) => (
              <CategoryTreeNode 
                key={child._id} 
                category={child} 
                onCategoryClick={onCategoryClick}
                level={level + 1}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
