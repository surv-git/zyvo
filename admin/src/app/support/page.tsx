"use client";

import { useState } from "react";
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  LifeBuoy, 
  MessageCircle, 
  FileText, 
  Phone, 
  Mail, 
  Clock,
  CheckCircle,
  AlertCircle,
  Book,
  Video,
  Download,
  ExternalLink,
  Zap,
  Copy
} from "lucide-react";
import { toast } from "sonner";
import { API_ENDPOINTS, buildUrl, getHeaders } from "@/config/api";

// Contact options
const contactOptions = [
  {
    title: "Live Chat",
    description: "Get instant help from our support team",
    icon: MessageCircle,
    action: "Start Chat",
    available: true,
    response: "< 2 minutes"
  },
  {
    title: "Email Support",
    description: "Send us detailed questions and feedback",
    icon: Mail,
    action: "Send Email",
    available: true,
    response: "< 24 hours"
  },
  {
    title: "Phone Support",
    description: "Speak directly with a support specialist",
    icon: Phone,
    action: "Call Now",
    available: false,
    response: "Mon-Fri 9AM-5PM"
  },
  {
    title: "Documentation",
    description: "Browse our comprehensive guides and tutorials",
    icon: FileText,
    action: "View Docs",
    available: true,
    response: "Self-service"
  }
];

// Resource links
const resources = [
  {
    title: "User Guide",
    description: "Complete guide to using the admin panel",
    icon: Book,
    type: "PDF",
    link: "#"
  },
  {
    title: "Video Tutorials",
    description: "Step-by-step video walkthroughs",
    icon: Video,
    type: "Videos",
    link: "#"
  },
  {
    title: "API Documentation",
    description: "Technical documentation for developers",
    icon: FileText,
    type: "Web",
    link: "#"
  },
  {
    title: "System Status",
    description: "Real-time system status and uptime",
    icon: Zap,
    type: "Live",
    link: "#"
  }
];

export default function SupportPage() {
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    subject: "",
    category: "",
    priority: "",
    description: ""
  });

  const handleSubmitTicket = async () => {
    if (!ticketForm.subject || !ticketForm.category || !ticketForm.description) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    try {
      // Show loading state
      toast.info("Submitting your support ticket...");
      
      // Construct email content
      const emailSubject = `Support Ticket: ${ticketForm.subject}`;
      const textBody = `
Support Ticket Details:
=======================

Subject: ${ticketForm.subject}
Category: ${ticketForm.category}
Priority: ${ticketForm.priority || 'Not specified'}

Description:
${ticketForm.description}

--
Submitted from: Admin Panel Support Center
Date: ${new Date().toLocaleString()}
      `.trim();
      
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px;">Support Ticket Details</h2>
          
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Subject:</strong> ${ticketForm.subject}</p>
            <p><strong>Category:</strong> ${ticketForm.category}</p>
            <p><strong>Priority:</strong> ${ticketForm.priority || 'Not specified'}</p>
          </div>
          
          <div style="margin: 20px 0;">
            <h3 style="color: #333;">Description:</h3>
            <div style="background: white; padding: 15px; border-left: 4px solid #007bff; border-radius: 4px;">
              ${ticketForm.description.replace(/\n/g, '<br>')}
            </div>
          </div>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            Submitted from: Admin Panel Support Center<br>
            Date: ${new Date().toLocaleString()}
          </p>
        </div>
      `;

      // Map priority values
      const priorityMap: Record<string, string> = {
        'low': 'LOW',
        'medium': 'MEDIUM', 
        'high': 'HIGH',
        'urgent': 'URGENT'
      };

      const apiPriority = priorityMap[ticketForm.priority] || 'MEDIUM';

      // Prepare API payload
      const payload = {
        subject: emailSubject,
        content: {
          html: htmlBody,
          text: textBody
        },
        email_type: "CUSTOM",
        priority: apiPriority,
        recipients: {
          type: "INDIVIDUAL",
          to: [
            {
              email: "zyvostore.com@gmail.com",
              name: "Zyvo Store"
            }
          ]
        },
        scheduling: {
          send_type: "IMMEDIATE"
        }
      };

      // Build API URL using configuration
      const apiUrl = buildUrl(API_ENDPOINTS.EMAILS.SEND);

      // Get auth token from sessionStorage
      const authToken = sessionStorage.getItem('auth_token');

      // Make API call
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: getHeaders({
          authToken: authToken || undefined,
        }),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      await response.json(); // Consume the response
      
      // Show success message and reset form
      toast.success("Support ticket submitted successfully! We'll get back to you soon.");
      setTicketForm({
        subject: "",
        category: "",
        priority: "",
        description: ""
      });

    } catch (error) {
      console.error('Failed to submit support ticket:', error);
      toast.error("Failed to submit support ticket. Please try again or contact support directly.");
    }
  };

  const copyEmailToClipboard = async () => {
    try {
      await navigator.clipboard.writeText('zyvostore.com@gmail.com');
      toast.success("Email address copied to clipboard!");
    } catch {
      toast.error("Failed to copy email address. Please copy manually: zyvostore.com@gmail.com");
    }
  };

  const openEmailClient = () => {
    window.location.href = "mailto:zyvostore.com@gmail.com";
    toast.success("Opening email client...");
    setShowEmailDialog(false);
  };

  const handleContactAction = (title: string) => {
    switch (title) {
      case "Live Chat":
        toast.info("Opening live chat...");
        break;
      case "Email Support":
        setShowEmailDialog(true);
        break;
      case "Phone Support":
        toast.info("Phone support is currently unavailable");
        break;
      case "Documentation":
        toast.info("Opening documentation...");
        break;
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Support Center"
        description="Get help with your questions, report issues, and access resources to make the most of your admin panel."
        icon={LifeBuoy}
      />

      <div className="grid gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {contactOptions.map((option) => (
                <div
                  key={option.title}
                  className="flex flex-col p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleContactAction(option.title)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <option.icon className="h-5 w-5 text-primary" />
                    {option.available ? (
                      <Badge variant="secondary" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Available
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        Offline
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-medium mb-1">{option.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{option.description}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-xs text-muted-foreground">{option.response}</span>
                    <Button size="sm" variant="ghost" className="h-8 px-2">
                      {option.action}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Submit Ticket */}
          <div className="lg:col-span-2">
            <Card data-ticket-form>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Submit Support Ticket
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      placeholder="Brief description of your issue"
                      value={ticketForm.subject}
                      onChange={(e) => setTicketForm({...ticketForm, subject: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={ticketForm.category} onValueChange={(value) => setTicketForm({...ticketForm, category: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technical">Technical Issue</SelectItem>
                        <SelectItem value="account">Account & Access</SelectItem>
                        <SelectItem value="billing">Billing & Payments</SelectItem>
                        <SelectItem value="feature">Feature Request</SelectItem>
                        <SelectItem value="bug">Bug Report</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority Level</Label>
                  <Select value={ticketForm.priority} onValueChange={(value) => setTicketForm({...ticketForm, priority: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - General question</SelectItem>
                      <SelectItem value="medium">Medium - Functionality issue</SelectItem>
                      <SelectItem value="high">High - Critical business impact</SelectItem>
                      <SelectItem value="urgent">Urgent - System down</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Please provide detailed information about your issue, including steps to reproduce if applicable..."
                    className="min-h-[120px]"
                    value={ticketForm.description}
                    onChange={(e) => setTicketForm({...ticketForm, description: e.target.value})}
                  />
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    For urgent issues affecting business operations, please use live chat or phone support for faster response.
                  </AlertDescription>
                </Alert>

                <Button onClick={handleSubmitTicket} className="align-right" variant={'default'}>
                  Submit Ticket
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Resources */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Resources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {resources.map((resource) => (
                  <div
                    key={resource.title}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <resource.icon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <h4 className="text-sm font-medium">{resource.title}</h4>
                        <p className="text-xs text-muted-foreground">{resource.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {resource.type}
                      </Badge>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* System Status */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">API Services</span>
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Operational
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database</span>
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Operational
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">File Storage</span>
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Operational
                  </Badge>
                </div>
                <Separator />
                <Button variant="outline" size="sm" className="w-full">
                  View Full Status Page
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Email Support Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="pb-6">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Mail className="h-5 w-5" />
              Email Support
            </DialogTitle>
            <DialogDescription className="text-base leading-relaxed pt-2">
              You can contact our support team via email. Choose your preferred method below.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 px-1">
            <div className="flex items-center justify-between p-5 border rounded-lg bg-card">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-card-foreground truncate">zyvostore.com@gmail.com</p>
                  <p className="text-sm text-muted-foreground">Our support email address</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyEmailToClipboard}
                className="flex items-center gap-2 ml-4 flex-shrink-0"
              >
                <Copy className="h-3 w-3" />
                Copy
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground space-y-3">
              <p className="text-base font-medium text-foreground">Choose an option:</p>
              <ul className="space-y-2 ml-6 text-sm leading-relaxed">
                <li>• Copy the email address and compose your own email</li>
                <li>• Open your email client with a pre-filled email</li>
                <li>• Use the support ticket form for structured submissions</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-3 pt-6">
            <Button
              variant="outline"
              onClick={() => setShowEmailDialog(false)}
              className="w-full sm:w-auto min-w-[100px]"
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={openEmailClient}
              className="w-full sm:w-auto min-w-[140px]"
            >
              Open Email Client
            </Button>
            <Button
              variant={'default'}
              onClick={() => {
                setShowEmailDialog(false);
                // Scroll to ticket form
                document.querySelector('[data-ticket-form]')?.scrollIntoView({ 
                  behavior: 'smooth',
                  block: 'start'
                });
              }}
              className="w-full sm:w-auto min-w-[150px]"
            >
              Submit Ticket Instead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
