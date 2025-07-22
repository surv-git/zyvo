'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LucideIcon } from 'lucide-react';

export interface PageHeaderAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  icon?: LucideIcon;
  disabled?: boolean;
}

export interface PageHeaderProps {
  /** Optional back button - if provided, shows back button that goes back in history */
  showBackButton?: boolean;
  /** Custom back function - if not provided, uses router.back() */
  onBack?: () => void;
  /** Icon to display next to the title */
  icon?: LucideIcon;
  /** Main page title */
  title: string;
  /** Optional description/subtitle */
  description?: string;
  /** Array of action buttons to display on the right */
  actions?: PageHeaderAction[];
  /** Additional CSS classes */
  className?: string;
}

export function PageHeader({
  showBackButton = false,
  onBack,
  icon: Icon,
  title,
  description,
  actions = [],
  className = ''
}: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {/* Left side - Back button, Icon, Title & Description */}
      <div className="flex items-start space-x-3">
        {showBackButton && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />            
            <span>Back</span>
          </Button>
        )}
        
        {Icon && (
          <Icon className="h-8 w-8 text-primary" />
        )}
        
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </div>

      {/* Right side - Action buttons */}
      {actions.length > 0 && (
        <div className="flex items-center space-x-2">
          {actions.map((action, index) => {
            const ActionIcon = action.icon;
            return (
              <Button
                key={index}
                variant={action.variant || 'default'}
                onClick={action.onClick}
                disabled={action.disabled}
                className="flex items-center space-x-2"
              >
                {ActionIcon && <ActionIcon className="h-4 w-4" />}
                <span>{action.label}</span>
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PageHeader;
