// Support Ticket types based on API specification

export interface User {
  user_id: {
    _id: string;
    name: string;
    email: string;
    isActive: boolean;
  };
  name: string;
  email: string;
  phone?: string;
}

export interface Admin {
  admin_id: string;
  name: string;
  email: string;
}

export interface AssignedTo {
  admin_id: {
    _id: string;
    name: string;
    email: string;
  };
  name: string;
  email: string;
  assigned_at: string;
}

export interface Resolution {
  resolved_by: Admin;
  resolved_at: string;
  resolution_note: string;
  resolution_type: 'SYSTEM_FIX' | 'USER_ERROR' | 'FEATURE_REQUEST' | 'DUPLICATE' | 'NOT_REPRODUCIBLE' | 'WONT_FIX';
}

export interface SLA {
  response_due: string;
  resolution_due: string;
  first_response_at?: string;
  response_time_minutes?: number;
  resolution_time_minutes?: number;
  is_sla_breached: boolean;
}

export interface Escalation {
  is_escalated: boolean;
  escalation_level: number;
  escalated_at?: string;
  escalated_by?: Admin;
  escalation_reason?: string;
}

export interface CommunicationPreferences {
  preferred_method: 'EMAIL' | 'SMS' | 'PHONE' | 'CHAT';
  notify_on_updates: boolean;
}

export interface Metrics {
  view_count: number;
  last_viewed_by_user?: string;
  last_viewed_by_admin?: string;
  response_count: number;
  reopened_count: number;
}

export interface Message {
  _id: string;
  message: string;
  sent_by: 'USER' | 'ADMIN';
  sent_at: string;
  sender_info?: Admin;
  is_internal?: boolean;
}

export interface Attachment {
  _id: string;
  filename: string;
  file_url: string;
  file_size: number;
  uploaded_by: 'USER' | 'ADMIN';
  uploaded_at: string;
  content_type: string;
}

export interface InternalNote {
  _id: string;
  note: string;
  created_by: Admin;
  created_at: string;
  updated_at?: string;
}

export interface SupportTicket {
  _id: string;
  ticket_number: string;
  subject: string;
  description: string;
  user: User;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assigned_to?: AssignedTo;
  resolution?: Resolution;
  sla: SLA;
  tags: string[];
  escalation: Escalation;
  communication_preferences: CommunicationPreferences;
  metrics: Metrics;
  source: TicketSource;
  messages: Message[];
  attachments: Attachment[];
  internal_notes: InternalNote[];
  created_at: string;
  updated_at: string;
  last_activity_at: string;
  __v: number;
}

// Enums
export type TicketStatus = 
  | 'OPEN' 
  | 'IN_PROGRESS' 
  | 'PENDING_USER' 
  | 'RESOLVED' 
  | 'CLOSED' 
  | 'ESCALATED';

export type TicketCategory = 
  | 'ORDER_ISSUE'
  | 'PAYMENT_ISSUE' 
  | 'PRODUCT_INQUIRY'
  | 'TECHNICAL_SUPPORT'
  | 'ACCOUNT_ISSUE'
  | 'SHIPPING_INQUIRY'
  | 'RETURN_REFUND'
  | 'GENERAL_INQUIRY'
  | 'FEATURE_REQUEST'
  | 'BUG_REPORT';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TicketSource = 'EMAIL' | 'CHAT' | 'PHONE' | 'WEB_FORM' | 'API';

export type SortField = 'createdAt' | 'updatedAt' | 'priority' | 'status' | 'sla_due_date';
export type SortOrder = 'asc' | 'desc';

// Filter interfaces
export interface SupportTicketFilters {
  page?: number;
  limit?: number;
  status?: TicketStatus;
  category?: TicketCategory;
  priority?: TicketPriority;
  assigned_to?: string;
  escalation_level?: number;
  sla_breached?: boolean;
  user_id?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: SortField;
  sort_order?: SortOrder;
}

export interface SupportTicketTableFilters {
  search: string;
  status: TicketStatus | 'ALL';
  category: TicketCategory | 'ALL';
  priority: TicketPriority | 'ALL';
  sla_breached: boolean | 'ALL';
  assigned_to: string;
  date_from: string;
  date_to: string;
  sort_by: SortField;
  sort_order: SortOrder;
}

// API Response interfaces
export interface GetSupportTicketsResponse {
  success: boolean;
  data: SupportTicket[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface SupportTicketResponse {
  success: boolean;
  data: SupportTicket;
  message?: string;
}

// Form interfaces
export interface SupportTicketUpdateData {
  status?: TicketStatus;
  priority?: TicketPriority;
  assigned_to?: string;
  tags?: string[];
  internal_notes?: string;
  resolution_note?: string;
  resolution_type?: Resolution['resolution_type'];
}

export interface TicketResponseData {
  message: string;
  is_internal?: boolean;
  notify_user?: boolean;
  status_update?: TicketStatus;
  attachments?: File[];
}

// Constants
export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  PENDING_USER: 'Pending User',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
  ESCALATED: 'Escalated',
};

export const TICKET_CATEGORY_LABELS: Record<TicketCategory, string> = {
  ORDER_ISSUE: 'Order Issue',
  PAYMENT_ISSUE: 'Payment Issue',
  PRODUCT_INQUIRY: 'Product Inquiry',
  TECHNICAL_SUPPORT: 'Technical Support',
  ACCOUNT_ISSUE: 'Account Issue',
  SHIPPING_INQUIRY: 'Shipping Inquiry',
  RETURN_REFUND: 'Return/Refund',
  GENERAL_INQUIRY: 'General Inquiry',
  FEATURE_REQUEST: 'Feature Request',
  BUG_REPORT: 'Bug Report',
};

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

export const TICKET_SOURCE_LABELS: Record<TicketSource, string> = {
  EMAIL: 'Email',
  CHAT: 'Chat',
  PHONE: 'Phone',
  WEB_FORM: 'Web Form',
  API: 'API',
};
