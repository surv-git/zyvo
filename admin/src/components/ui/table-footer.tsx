'use client';

import React from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface TableFooterProps {
  /** Current page number (1-based) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Total number of items */
  totalItems: number;
  /** Number of items per page */
  itemsPerPage: number;
  /** Function to handle page changes */
  onPageChange: (page: number) => void;
  /** Function to handle items per page changes */
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  /** Available options for items per page */
  itemsPerPageOptions?: number[];
  /** Show items per page selector */
  showItemsPerPageSelector?: boolean;
  /** Entity name for display (e.g., "products", "users") */
  entityName?: string;
  /** Additional CSS classes */
  className?: string;
}

export function TableFooter({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [10, 20, 50, 100],
  showItemsPerPageSelector = false,
  entityName = 'items',
  className = ''
}: TableFooterProps) {
  // Calculate start and end item numbers
  const startItem = Math.min(((currentPage - 1) * itemsPerPage) + 1, totalItems);
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    const pageNumbers: number[] = [];
    const maxVisiblePages = 5;
    const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return { pageNumbers, startPage, endPage };
  };

  const { pageNumbers, startPage, endPage } = generatePageNumbers();

  const renderPageButtons = () => {
    const buttons = [];
    
    // Show first page and ellipsis if needed
    if (startPage > 1) {
      buttons.push(
        <PaginationItem key="start">
          <PaginationLink
            onClick={() => onPageChange(1)}
            isActive={false}
            className="cursor-pointer"
          >
            1
          </PaginationLink>
        </PaginationItem>
      );
      if (startPage > 2) {
        buttons.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }
    
    // Show page numbers
    pageNumbers.forEach((pageNum) => {
      buttons.push(
        <PaginationItem key={pageNum}>
          <PaginationLink
            onClick={() => onPageChange(pageNum)}
            isActive={pageNum === currentPage}
            className="cursor-pointer"
          >
            {pageNum}
          </PaginationLink>
        </PaginationItem>
      );
    });
    
    // Show last page and ellipsis if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      buttons.push(
        <PaginationItem key="end">
          <PaginationLink
            onClick={() => onPageChange(totalPages)}
            isActive={false}
            className="cursor-pointer"
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return buttons;
  };

  // Don't render if there are no items
  if (totalItems === 0) {
    return null;
  }

  return (
    <div className={`grid grid-cols-5 gap-4 items-center px-2 ${className}`}>
      {/* Items count - spans 2 columns */}
      <div className="col-span-1 flex items-center space-x-4 text-xs text-muted-foreground">        
          Showing {startItem.toLocaleString()} to {endItem.toLocaleString()} of {totalItems.toLocaleString()}        
      </div>

      {/* Pagination controls - spans 3 columns, centered */}
      <div className="col-span-3 flex justify-center">
        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                  className={`cursor-pointer ${
                    currentPage <= 1 ? 'pointer-events-none opacity-50' : ''
                  }`}
                />
              </PaginationItem>
              {renderPageButtons()}
              <PaginationItem>
                <PaginationNext
                  onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
                  className={`cursor-pointer ${
                    currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''
                  }`}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>

      {/* Empty columns for balance - no content needed as grid handles spacing */}
      <div className="col-span-1 flex items-center space-x-4 text-xs text-muted-foreground">        
        &nbsp;
        </div>
    </div>
  );
}
