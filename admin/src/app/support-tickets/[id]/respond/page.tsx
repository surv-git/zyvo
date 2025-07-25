"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  MessageSquare, 
  User, 
  Send,
  Loader2,
  AlertCircle,
  FileText,
  Paperclip,
  X,
  Eye,
  EyeOff,
  Bell,
  BellOff
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  SupportTicket,
  TicketStatus,
  TICKET_STATUS_LABELS,
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY_LABELS
} from '@/types/support-ticket';
import { 
  getSupportTicketById, 
  respondToSupportTicket,
  getSupportTicketServiceErrorMessage 
} from '@/services/support-ticket-service';

export default function SupportTicketRespondPage() {
  const router = useRouter();
  const params = useParams();
  const ticketId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [ticket, setTicket] = useState<SupportTicket | null>(null);

  // Form state
  const [message, setMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [notifyUser, setNotifyUser] = useState(true);
  const [statusUpdate, setStatusUpdate] = useState<TicketStatus | ''>('');
  const [attachments, setAttachments] = useState<File[]>([]);

  // Load ticket data
  useEffect(() => {
    const loadTicket = async () => {
      try {
        const ticketData = await getSupportTicketById(ticketId);
        setTicket(ticketData);
        
        // Set default status update based on current status
        if (ticketData.status === 'OPEN') {
          setStatusUpdate('IN_PROGRESS');
        } else if (ticketData.status === 'PENDING_USER') {
          setStatusUpdate('IN_PROGRESS');
        }
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
    router.push(`/support-tickets/${ticketId}`);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const maxSize = 10 * 1024 * 1024; // 10MB per file
    const maxFiles = 5;

    // Validate file sizes
    const oversizedFiles = files.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      toast.error(`Files must be smaller than 10MB: ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }

    // Validate total number of files
    if (attachments.length + files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      toast.error('Message is required');
      return;
    }

    if (!ticket) return;

    setSubmitting(true);

    try {
      const responseData = {
        message: message.trim(),
        is_internal: isInternal,
        notify_user: notifyUser,
        status_update: statusUpdate || undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
      };

      await respondToSupportTicket(ticket._id, responseData);
      
      toast.success('Response sent successfully');
      router.push(`/support-tickets/${ticketId}`);
    } catch (error) {
      console.error('Failed to send response:', error);
      toast.error(`Failed to send response: ${getSupportTicketServiceErrorMessage(error)}`);
    } finally {
      setSubmitting(false);
    }
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
          <p className="text-muted-foreground mb-4">The support ticket you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={() => router.push('/support-tickets')}>
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
              Respond to Ticket
            </h1>
            <p className="text-muted-foreground mt-1">
              {ticket.ticket_number} - {ticket.subject}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - Response Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Send className="h-5 w-5 mr-2" />
                  Compose Response
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Response Message */}
                <div className="space-y-2">
                  <Label htmlFor="message">
                    Response Message *
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Type your response to the customer here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={8}
                    className="min-h-[200px]"
                    required
                  />
                  <div className="text-xs text-muted-foreground">
                    {message.length}/5000 characters
                  </div>
                </div>

                {/* Response Options */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        {isInternal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        <Label htmlFor="internal" className="text-base font-medium">
                          Internal Note
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {isInternal 
                          ? "This message will only be visible to admin users"
                          : "This message will be sent to the customer"
                        }
                      </p>
                    </div>
                    <Switch
                      id="internal"
                      checked={isInternal}
                      onCheckedChange={setIsInternal}
                    />
                  </div>

                  {!isInternal && (
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          {notifyUser ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                          <Label htmlFor="notify" className="text-base font-medium">
                            Notify Customer
                          </Label>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Send email notification to the customer
                        </p>
                      </div>
                      <Switch
                        id="notify"
                        checked={notifyUser}
                        onCheckedChange={setNotifyUser}
                      />
                    </div>
                  )}
                </div>

                <Separator />

                {/* Status Update */}
                <div className="space-y-2">
                  <Label htmlFor="status">Update Ticket Status (Optional)</Label>
                  <Select 
                    value={statusUpdate} 
                    onValueChange={(value) => setStatusUpdate(value as TicketStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Keep current status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Keep current status</SelectItem>
                      {Object.entries(TICKET_STATUS_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {statusUpdate && (
                    <p className="text-sm text-muted-foreground">
                      Status will be updated to: <strong>{TICKET_STATUS_LABELS[statusUpdate]}</strong>
                    </p>
                  )}
                </div>

                <Separator />

                {/* File Attachments */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Attachments (Optional)</Label>
                    <div className="flex items-center">
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif"
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('file-upload')?.click()}
                        disabled={attachments.length >= 5}
                      >
                        <Paperclip className="h-4 w-4 mr-2" />
                        Add Files
                      </Button>
                    </div>
                  </div>

                  {attachments.length > 0 && (
                    <div className="space-y-2">
                      {attachments.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttachment(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Accepted formats: PDF, DOC, DOCX, TXT, PNG, JPG, JPEG, GIF. Max size: 10MB per file. Max files: 5.
                  </p>
                </div>

                <Separator />

                {/* Submit Button */}
                <div className="flex justify-end space-x-3">
                  <Button type="button" variant="outline" onClick={handleBack}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting || !message.trim()}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Response
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>

        {/* Sidebar - Ticket Summary */}
        <div className="space-y-6">
          {/* Ticket Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Ticket Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Ticket Number</label>
                <p className="text-lg font-mono">{ticket.ticket_number}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Subject</label>
                <p className="text-base font-medium">{ticket.subject}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Current Status</label>
                <Badge variant="outline" className="mt-1">
                  {TICKET_STATUS_LABELS[ticket.status]}
                </Badge>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Priority</label>
                <Badge variant="outline" className="mt-1">
                  {TICKET_PRIORITY_LABELS[ticket.priority]}
                </Badge>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Category</label>
                <Badge variant="outline" className="mt-1">
                  {TICKET_CATEGORY_LABELS[ticket.category]}
                </Badge>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Created</label>
                <p className="text-sm">{formatDate(ticket.created_at)}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                <p className="text-sm">{formatDate(ticket.updated_at)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="text-base font-medium">{ticket.user.name}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="text-sm">{ticket.user.email}</p>
              </div>

              {ticket.user.phone && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <p className="text-sm">{ticket.user.phone}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground">Preferred Contact</label>
                <Badge variant="outline" className="mt-1">
                  {ticket.communication_preferences.preferred_method}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Recent Messages */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Messages</CardTitle>
            </CardHeader>
            <CardContent>
              {ticket.messages.length === 0 ? (
                <p className="text-sm text-muted-foreground">No messages yet</p>
              ) : (
                <div className="space-y-3">
                  {ticket.messages.slice(-3).map((message) => (
                    <div
                      key={message._id}
                      className={`p-3 rounded-lg text-sm ${
                        message.sent_by === 'ADMIN'
                          ? 'bg-blue-50 border-l-2 border-blue-500'
                          : 'bg-gray-50 border-l-2 border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant={message.sent_by === 'ADMIN' ? 'default' : 'secondary'} className="text-xs">
                          {message.sent_by === 'ADMIN' ? 'Admin' : 'Customer'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.sent_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm line-clamp-3">{message.message}</p>
                    </div>
                  ))}
                  {ticket.messages.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center">
                      {ticket.messages.length - 3} more messages...
                    </p>
                  )}
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
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push(`/support-tickets/${ticketId}`)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Full Ticket
              </Button>
              
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href={`mailto:${ticket.user.email}`}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Email Customer
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
