"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  MessageSquare, 
  User, 
  Loader2,
  AlertCircle,
  Copy,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Mail,
  Phone,
  Send,
  FileText,
  Users,
  Tag,
  TrendingUp,
  Eye,
  ArrowUpCircle,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  SupportTicket,
  TicketStatus,
  TicketPriority,
  TICKET_STATUS_LABELS,
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_SOURCE_LABELS
} from '@/types/support-ticket';
import { 
  getSupportTicketById, 
  updateSupportTicket,
  escalateSupportTicket,
  closeSupportTicket,
  reopenSupportTicket,
  deleteSupportTicket,
  getSupportTicketServiceErrorMessage 
} from '@/services/support-ticket-service';

export default function SupportTicketViewPage() {
  const router = useRouter();
  const params = useParams();
  const ticketId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Form states for quick actions
  const [statusUpdate, setStatusUpdate] = useState<TicketStatus | ''>('');
  const [priorityUpdate, setPriorityUpdate] = useState<TicketPriority | ''>('');
  const [internalNote, setInternalNote] = useState('');

  // Load ticket data
  useEffect(() => {
    const loadTicket = async () => {
      try {
        const ticketData = await getSupportTicketById(ticketId);
        setTicket(ticketData);
        setStatusUpdate(ticketData.status);
        setPriorityUpdate(ticketData.priority);
      } catch (error) {
        console.error('Failed to load ticket:', error);
        toast.error('Failed to load ticket data');
        router.push('/support-tickets');
      } finally {
        setLoading(false);
      }
    };

    if (ticketId) {
      loadTicket();
    }
  }, [ticketId, router]);

  const handleBack = () => {
    router.push('/support-tickets');
  };

  const handleRespond = () => {
    router.push(`/support-tickets/${ticketId}/respond`);
  };

  const handleCopyId = async () => {
    if (ticket) {
      try {
        await navigator.clipboard.writeText(ticket._id);
        toast.success('Ticket ID copied to clipboard');
      } catch (err) {
        toast.error('Failed to copy to clipboard');
      }
    }
  };

  const handleCopyTicketNumber = async () => {
    if (ticket) {
      try {
        await navigator.clipboard.writeText(ticket.ticket_number);
        toast.success('Ticket number copied to clipboard');
      } catch (err) {
        toast.error('Failed to copy ticket number');
      }
    }
  };

  const handleUpdateStatus = async () => {
    if (!ticket || !statusUpdate || statusUpdate === ticket.status) return;

    setActionLoading('status');
    try {
      const updatedTicket = await updateSupportTicket(ticket._id, { status: statusUpdate });
      setTicket(updatedTicket);
      toast.success('Ticket status updated successfully');
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error(`Failed to update status: ${getSupportTicketServiceErrorMessage(error)}`);
      setStatusUpdate(ticket.status); // Reset on error
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdatePriority = async () => {
    if (!ticket || !priorityUpdate || priorityUpdate === ticket.priority) return;

    setActionLoading('priority');
    try {
      const updatedTicket = await updateSupportTicket(ticket._id, { priority: priorityUpdate });
      setTicket(updatedTicket);
      toast.success('Ticket priority updated successfully');
    } catch (error) {
      console.error('Failed to update priority:', error);
      toast.error(`Failed to update priority: ${getSupportTicketServiceErrorMessage(error)}`);
      setPriorityUpdate(ticket.priority); // Reset on error
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddInternalNote = async () => {
    if (!ticket || !internalNote.trim()) return;

    setActionLoading('note');
    try {
      const updatedTicket = await updateSupportTicket(ticket._id, { internal_notes: internalNote.trim() });
      setTicket(updatedTicket);
      setInternalNote('');
      toast.success('Internal note added successfully');
    } catch (error) {
      console.error('Failed to add internal note:', error);
      toast.error(`Failed to add note: ${getSupportTicketServiceErrorMessage(error)}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleEscalate = async () => {
    if (!ticket) return;

    const reason = window.prompt('Please provide a reason for escalation (optional):');
    if (reason === null) return; // User cancelled

    setActionLoading('escalate');
    try {
      const updatedTicket = await escalateSupportTicket(ticket._id, reason || undefined);
      setTicket(updatedTicket);
      toast.success('Ticket escalated successfully');
    } catch (error) {
      console.error('Failed to escalate ticket:', error);
      toast.error(`Failed to escalate ticket: ${getSupportTicketServiceErrorMessage(error)}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleClose = async () => {
    if (!ticket) return;

    const resolutionNote = window.prompt('Please provide a resolution note:');
    if (!resolutionNote?.trim()) {
      toast.error('Resolution note is required');
      return;
    }

    setActionLoading('close');
    try {
      const updatedTicket = await closeSupportTicket(ticket._id, resolutionNote.trim());
      setTicket(updatedTicket);
      toast.success('Ticket closed successfully');
    } catch (error) {
      console.error('Failed to close ticket:', error);
      toast.error(`Failed to close ticket: ${getSupportTicketServiceErrorMessage(error)}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReopen = async () => {
    if (!ticket) return;

    const reason = window.prompt('Please provide a reason for reopening (optional):');
    if (reason === null) return; // User cancelled

    setActionLoading('reopen');
    try {
      const updatedTicket = await reopenSupportTicket(ticket._id, reason || undefined);
      setTicket(updatedTicket);
      toast.success('Ticket reopened successfully');
    } catch (error) {
      console.error('Failed to reopen ticket:', error);
      toast.error(`Failed to reopen ticket: ${getSupportTicketServiceErrorMessage(error)}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!ticket) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ticket "${ticket.ticket_number}"? This action cannot be undone and will permanently remove all ticket data including messages and attachments.`
    );

    if (!confirmed) return;

    setActionLoading('delete');
    try {
      await deleteSupportTicket(ticket._id);
      toast.success('Ticket deleted successfully');
      router.push('/support-tickets');
    } catch (error) {
      console.error('Failed to delete ticket:', error);
      toast.error(`Failed to delete ticket: ${getSupportTicketServiceErrorMessage(error)}`);
      setActionLoading(null);
    }
  };

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

  const getPriorityBadgeVariant = (priority: TicketPriority) => {
    switch (priority) {
      case 'CRITICAL': return 'destructive';
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'default';
      case 'LOW': return 'secondary';
      default: return 'secondary';
    }
  };

  const getSLAIndicator = (ticket: SupportTicket) => {
    if (ticket.sla.is_sla_breached) {
      return (
        <div className="flex items-center space-x-2 text-destructive">
          <AlertTriangle className="h-4 w-4" />
          <span>SLA Breached</span>
        </div>
      );
    }
    
    const dueDate = new Date(ticket.sla.resolution_due);
    const now = new Date();
    const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilDue < 2) {
      return (
        <div className="flex items-center space-x-2 text-orange-500">
          <Clock className="h-4 w-4" />
          <span>Due Soon</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center space-x-2 text-green-500">
        <CheckCircle className="h-4 w-4" />
        <span>On Track</span>
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading ticket...</span>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Ticket Not Found</h2>
          <p className="text-muted-foreground mb-4">The support ticket you're looking for doesn't exist.</p>
          <Button onClick={handleBack}>
            Back to Tickets
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <MessageSquare className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {ticket.ticket_number}
            </h1>
            <p className="text-muted-foreground mt-1">
              {ticket.subject}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleRespond}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Respond
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={actionLoading === 'delete'}
          >
            {actionLoading === 'delete' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Ticket Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Subject</label>
                  <p className="text-lg font-semibold">{ticket.subject}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Category</label>
                  <p className="text-lg">
                    <Badge variant="outline">
                      {TICKET_CATEGORY_LABELS[ticket.category]}
                    </Badge>
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <div className="mt-2 p-4 bg-muted rounded-lg">
                  <p className="text-base whitespace-pre-wrap">{ticket.description}</p>
                </div>
              </div>

              {ticket.tags.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tags</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {ticket.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-lg font-semibold">{ticket.user.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <div className="flex items-center space-x-2">
                    <p className="text-lg">{ticket.user.email}</p>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={`mailto:${ticket.user.email}`}>
                        <Mail className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>

              {ticket.user.phone && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                    <div className="flex items-center space-x-2">
                      <p className="text-lg">{ticket.user.phone}</p>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={`tel:${ticket.user.phone}`}>
                          <Phone className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">User Status</label>
                    <p className="text-lg">
                      <Badge variant={ticket.user.user_id.isActive ? 'default' : 'secondary'}>
                        {ticket.user.user_id.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground">Preferred Contact Method</label>
                <p className="text-lg">
                  <Badge variant="outline">
                    {ticket.communication_preferences.preferred_method}
                  </Badge>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Messages ({ticket.messages.length})
                </div>
                <Button size="sm" onClick={handleRespond}>
                  <Send className="h-4 w-4 mr-2" />
                  Add Response
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ticket.messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                  <p>No messages yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {ticket.messages.map((message) => (
                    <div
                      key={message._id}
                      className={`p-4 rounded-lg ${
                        message.sent_by === 'ADMIN'
                          ? 'bg-blue-50 border-l-4 border-blue-500'
                          : 'bg-gray-50 border-l-4 border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant={message.sent_by === 'ADMIN' ? 'default' : 'secondary'}>
                            {message.sent_by === 'ADMIN' ? 'Admin' : 'Customer'}
                          </Badge>
                          {message.sender_info && (
                            <span className="text-sm font-medium">
                              {message.sender_info.name}
                            </span>
                          )}
                          {message.is_internal && (
                            <Badge variant="destructive" className="text-xs">
                              Internal
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(message.sent_at)}
                        </span>
                      </div>
                      <p className="text-base whitespace-pre-wrap">{message.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Internal Notes */}
          {ticket.internal_notes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Internal Notes ({ticket.internal_notes.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ticket.internal_notes.map((note) => (
                    <div key={note._id} className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{note.created_by.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(note.created_at)}
                        </span>
                      </div>
                      <p className="text-base whitespace-pre-wrap">{note.note}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Priority */}
          <Card>
            <CardHeader>
              <CardTitle>Status & Priority</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <div className="flex space-x-2">
                  <Select 
                    value={statusUpdate} 
                    onValueChange={(value) => setStatusUpdate(value as TicketStatus)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TICKET_STATUS_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {statusUpdate !== ticket.status && (
                    <Button
                      size="sm"
                      onClick={handleUpdateStatus}
                      disabled={actionLoading === 'status'}
                    >
                      {actionLoading === 'status' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Update'
                      )}
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <div className="flex space-x-2">
                  <Select 
                    value={priorityUpdate} 
                    onValueChange={(value) => setPriorityUpdate(value as TicketPriority)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TICKET_PRIORITY_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {priorityUpdate !== ticket.priority && (
                    <Button
                      size="sm"
                      onClick={handleUpdatePriority}
                      disabled={actionLoading === 'priority'}
                    >
                      {actionLoading === 'priority' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Update'
                      )}
                    </Button>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <label className="text-sm font-medium">Current Status</label>
                <Badge variant={getStatusBadgeVariant(ticket.status)} className="w-fit">
                  {TICKET_STATUS_LABELS[ticket.status]}
                </Badge>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Current Priority</label>
                <Badge variant={getPriorityBadgeVariant(ticket.priority)} className="w-fit">
                  {TICKET_PRIORITY_LABELS[ticket.priority]}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* SLA Information */}
          <Card>
            <CardHeader>
              <CardTitle>SLA Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                {getSLAIndicator(ticket)}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Response Due</span>
                <span className="text-sm font-mono">{formatDate(ticket.sla.response_due)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Resolution Due</span>
                <span className="text-sm font-mono">{formatDate(ticket.sla.resolution_due)}</span>
              </div>

              {ticket.sla.first_response_at && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">First Response</span>
                  <span className="text-sm font-mono">{formatDate(ticket.sla.first_response_at)}</span>
                </div>
              )}

              {ticket.sla.response_time_minutes && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Response Time</span>
                  <span className="text-sm">{Math.round(ticket.sla.response_time_minutes / 60)}h {ticket.sla.response_time_minutes % 60}m</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assignment */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ticket.assigned_to ? (
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{ticket.assigned_to.name}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {ticket.assigned_to.email}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Assigned: {formatDate(ticket.assigned_to.assigned_at)}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Unassigned</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ticket Details */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Ticket ID</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-mono">{ticket._id.slice(-8)}</span>
                  <Button variant="ghost" size="sm" onClick={handleCopyId}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Ticket Number</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-mono">{ticket.ticket_number}</span>
                  <Button variant="ghost" size="sm" onClick={handleCopyTicketNumber}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Source</span>
                <Badge variant="outline">
                  {TICKET_SOURCE_LABELS[ticket.source]}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm">{formatDate(ticket.created_at)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last Updated</span>
                <span className="text-sm">{formatDate(ticket.updated_at)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last Activity</span>
                <span className="text-sm">{formatDate(ticket.last_activity_at)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Views</span>
                <div className="flex items-center space-x-2">
                  <Eye className="h-4 w-4" />
                  <span className="text-sm">{ticket.metrics.view_count}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Responses</span>
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-sm">{ticket.metrics.response_count}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Reopened</span>
                <div className="flex items-center space-x-2">
                  <RotateCcw className="h-4 w-4" />
                  <span className="text-sm">{ticket.metrics.reopened_count}</span>
                </div>
              </div>

              {ticket.metrics.last_viewed_by_user && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">User Last Viewed</span>
                  <span className="text-xs">{formatDate(ticket.metrics.last_viewed_by_user)}</span>
                </div>
              )}

              {ticket.metrics.last_viewed_by_admin && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Admin Last Viewed</span>
                  <span className="text-xs">{formatDate(ticket.metrics.last_viewed_by_admin)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={handleRespond}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Respond to Ticket
              </Button>
              
              {ticket.status !== 'ESCALATED' && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleEscalate}
                  disabled={actionLoading === 'escalate'}
                >
                  {actionLoading === 'escalate' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ArrowUpCircle className="h-4 w-4 mr-2" />
                  )}
                  Escalate Ticket
                </Button>
              )}
              
              {ticket.status !== 'CLOSED' && ticket.status !== 'RESOLVED' ? (
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleClose}
                  disabled={actionLoading === 'close'}
                >
                  {actionLoading === 'close' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Close Ticket
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleReopen}
                  disabled={actionLoading === 'reopen'}
                >
                  {actionLoading === 'reopen' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4 mr-2" />
                  )}
                  Reopen Ticket
                </Button>
              )}
              
              <Button 
                variant="destructive" 
                className="w-full justify-start"
                onClick={handleDelete}
                disabled={actionLoading === 'delete'}
              >
                {actionLoading === 'delete' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete Ticket
              </Button>
            </CardContent>
          </Card>

          {/* Add Internal Note */}
          <Card>
            <CardHeader>
              <CardTitle>Add Internal Note</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Add an internal note (only visible to admin users)..."
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                rows={3}
              />
              <Button
                onClick={handleAddInternalNote}
                disabled={!internalNote.trim() || actionLoading === 'note'}
                className="w-full"
              >
                {actionLoading === 'note' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                Add Note
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
