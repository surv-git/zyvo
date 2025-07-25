"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  Search,
  RefreshCw,
  Loader2,
  AlertCircle,
  Copy,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  User,
  Clock,
  AlertTriangle,
  MessageSquare,
  CheckCircle,
  Users,
  Calendar
} from 'lucide-react';

import { 
  SupportTicket, 
  SupportTicketTableFilters, 
  TicketStatus,
  TicketCategory,
  TicketPriority,
  SortField,
  SortOrder,
  TICKET_STATUS_LABELS,
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY_LABELS
} from '@/types/support-ticket';
import { 
  getSupportTicketList, 
  deleteSupportTicket, 
  getSupportTicketServiceErrorMessage 
} from '@/services/support-ticket-service';
import { toast } from 'sonner';
import { useScrollPreservation } from '@/hooks/use-scroll-preservation';
import { TableFooter } from '@/components/ui/table-footer';
import { getSiteConfigSync } from '@/config/site';

// Simple confirmation dialog component
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  isDestructive?: boolean;
}

function ConfirmDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  description, 
  confirmText = "Confirm",
  isDestructive = false 
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/80" onClick={onClose} />
      <div className="relative z-50 grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg sm:rounded-lg">
        <div className="flex flex-col space-y-2 text-center sm:text-left">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <Button variant="outline" onClick={onClose} className="mt-2 sm:mt-0">
            Cancel
          </Button>
          <Button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={isDestructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function SupportTicketManagementTable() {
  const router = useRouter();
  const siteConfig = getSiteConfigSync();
  
  // State for table data and loading
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(siteConfig.admin.itemsPerPage);
  
  // State for filters and sorting
  const [filters, setFilters] = useState<SupportTicketTableFilters>({
    search: '',
    status: 'ALL',
    category: 'ALL',
    priority: 'ALL',
    sla_breached: 'ALL',
    assigned_to: '',
    date_from: '',
    date_to: '',
    sort_by: 'createdAt',
    sort_order: 'desc',
  });
  
  // State for action loading and confirmation dialogs
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    ticketId: string;
    title: string;
    description: string;
    action: () => void;
  }>({
    isOpen: false,
    ticketId: '',
    title: '',
    description: '',
    action: () => {},
  });
  
  // Scroll preservation
  const { preserveScroll } = useScrollPreservation();

  // Fetch tickets with current filters and pagination
  const fetchTickets = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      const apiFilters = {
        page: currentPage,
        limit: itemsPerPage,
        search: filters.search.trim() || undefined,
        status: filters.status !== 'ALL' ? filters.status as TicketStatus : undefined,
        category: filters.category !== 'ALL' ? filters.category as TicketCategory : undefined,
        priority: filters.priority !== 'ALL' ? filters.priority as TicketPriority : undefined,
        sla_breached: filters.sla_breached !== 'ALL' ? filters.sla_breached as boolean : undefined,
        assigned_to: filters.assigned_to.trim() || undefined,
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined,
        sort_by: filters.sort_by,
        sort_order: filters.sort_order,
      };

      const response = await getSupportTicketList(apiFilters);
      
      setTickets(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.totalItems);
      
    } catch (err) {
      const errorMessage = getSupportTicketServiceErrorMessage(err);
      setError(errorMessage);
      toast.error(`Failed to load tickets: ${errorMessage}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, itemsPerPage, filters]);

  // Effect to fetch tickets when dependencies change
  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Handle filter changes
  const handleFilterChange = (key: keyof SupportTicketTableFilters, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Handle sorting
  const handleSort = (sortBy: SortField) => {
    const newSortOrder: SortOrder = 
      filters.sort_by === sortBy && filters.sort_order === 'desc' ? 'asc' : 'desc';
    
    setFilters(prev => ({
      ...prev,
      sort_by: sortBy,
      sort_order: newSortOrder,
    }));
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    preserveScroll(() => setCurrentPage(page));
  };

  // Handle items per page change
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchTickets(false);
  };

  // Handle view ticket
  const handleView = (ticketId: string) => {
    preserveScroll(() => router.push(`/support-tickets/${ticketId}`));
  };

  // Handle edit/respond to ticket
  const handleEdit = (ticketId: string) => {
    preserveScroll(() => router.push(`/support-tickets/${ticketId}/respond`));
  };

  // Handle delete ticket
  const handleDelete = (ticket: SupportTicket) => {
    setConfirmDialog({
      isOpen: true,
      ticketId: ticket._id,
      title: 'Delete Support Ticket',
      description: `Are you sure you want to delete ticket "${ticket.ticket_number}"? This action cannot be undone and will permanently remove all ticket data including messages and attachments.`,
      action: () => performDelete(ticket._id),
    });
  };

  // Perform delete action
  const performDelete = async (ticketId: string) => {
    try {
      setActionLoading(`delete-${ticketId}`);
      await deleteSupportTicket(ticketId);
      toast.success('Support ticket deleted successfully');
      await fetchTickets(false);
    } catch (err) {
      const errorMessage = getSupportTicketServiceErrorMessage(err);
      toast.error(`Failed to delete ticket: ${errorMessage}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Copy ticket ID to clipboard
  const handleCopyId = async (ticketId: string, ticketNumber: string) => {
    try {
      await navigator.clipboard.writeText(ticketId);
      toast.success(`Ticket ID copied: ${ticketNumber}`);
    } catch {
      toast.error('Failed to copy ticket ID');
    }
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: TicketStatus) => {
    switch (status) {
      case 'OPEN': return 'destructive';
      case 'IN_PROGRESS': return 'default';
      case 'PENDING_USER': return 'secondary';
      case 'RESOLVED': return 'outline';
      case 'CLOSED': return 'outline';
      case 'ESCALATED': return 'destructive';
      default: return 'secondary';
    }
  };

  // Get priority badge variant
  const getPriorityBadgeVariant = (priority: TicketPriority) => {
    switch (priority) {
      case 'CRITICAL': return 'destructive';
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'default';
      case 'LOW': return 'secondary';
      default: return 'secondary';
    }
  };

  // Get SLA status indicator
  const getSLAIndicator = (ticket: SupportTicket) => {
    if (ticket.sla.is_sla_breached) {
      return (
        <div title="SLA Breached">
          <AlertTriangle className="h-4 w-4 text-destructive" />
        </div>
      );
    }
    
    const dueDate = new Date(ticket.sla.resolution_due);
    const now = new Date();
    const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilDue < 2) {
      return (
        <div title="SLA Due Soon">
          <Clock className="h-4 w-4 text-orange-500" />
        </div>
      );
    }
    
    return (
      <div title="SLA On Track">
        <CheckCircle className="h-4 w-4 text-green-500" />
      </div>
    );
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Render sort icon
  const renderSortIcon = (sortBy: SortField) => {
    if (filters.sort_by !== sortBy) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return filters.sort_order === 'asc' 
      ? <ArrowUp className="ml-2 h-4 w-4" />
      : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Support Tickets</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardTitle>
          <CardDescription>
            {totalItems > 0 ? (
              `Showing ${((currentPage - 1) * itemsPerPage) + 1} to ${Math.min(currentPage * itemsPerPage, totalItems)} of ${totalItems} tickets`
            ) : (
              'No tickets found'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tickets, descriptions..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                {Object.entries(TICKET_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                {Object.entries(TICKET_CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select value={filters.priority} onValueChange={(value) => handleFilterChange('priority', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Priorities</SelectItem>
                {Object.entries(TICKET_PRIORITY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* SLA Breached Filter */}
            <Select 
              value={filters.sla_breached === 'ALL' ? 'ALL' : String(filters.sla_breached)} 
              onValueChange={(value) => handleFilterChange('sla_breached', value === 'ALL' ? 'ALL' : value === 'true')}
            >
              <SelectTrigger>
                <SelectValue placeholder="SLA Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All SLA Status</SelectItem>
                <SelectItem value="true">SLA Breached</SelectItem>
                <SelectItem value="false">SLA On Track</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <span>Loading tickets...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Tickets</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => fetchTickets()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Support Tickets</h3>
              <p className="text-muted-foreground">No tickets match your current filters.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer select-none"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center">
                      Ticket
                      {renderSortIcon('createdAt')}
                    </div>
                  </TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead 
                    className="cursor-pointer select-none"
                    onClick={() => handleSort('priority')}
                  >
                    <div className="flex items-center">
                      Priority
                      {renderSortIcon('priority')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer select-none"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center">
                      Status
                      {renderSortIcon('status')}
                    </div>
                  </TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>SLA</TableHead>
                  <TableHead 
                    className="cursor-pointer select-none"
                    onClick={() => handleSort('updatedAt')}
                  >
                    <div className="flex items-center">
                      Updated
                      {renderSortIcon('updatedAt')}
                    </div>
                  </TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket._id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-sm">{ticket.ticket_number}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyId(ticket._id, ticket.ticket_number)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(ticket.created_at)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px]">
                        <div className="font-medium truncate" title={ticket.subject}>
                          {ticket.subject}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center space-x-2">
                          <MessageSquare className="h-3 w-3" />
                          <span>{ticket.metrics.response_count} responses</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{ticket.user.name}</div>
                        <div className="text-sm text-muted-foreground">{ticket.user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {TICKET_CATEGORY_LABELS[ticket.category]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityBadgeVariant(ticket.priority)}>
                        {TICKET_PRIORITY_LABELS[ticket.priority]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(ticket.status)}>
                        {TICKET_STATUS_LABELS[ticket.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {ticket.assigned_to ? (
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span className="text-sm">{ticket.assigned_to.name}</span>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground flex items-center space-x-2">
                          <Users className="h-4 w-4" />
                          <span>Unassigned</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getSLAIndicator(ticket)}
                        <span className="text-xs text-muted-foreground">
                          {ticket.sla.is_sla_breached ? 'Breached' : 'On Track'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(ticket.updated_at)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(ticket._id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(ticket._id)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Respond
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(ticket)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {!loading && !error && tickets.length > 0 && (
        <TableFooter
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          itemsPerPageOptions={siteConfig.admin.itemsPerPageOptions}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.action}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText="Delete"
        isDestructive={true}
      />
    </div>
  );
}
