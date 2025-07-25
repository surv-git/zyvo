"use client";

import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, Search, Book, Shield, Bug } from 'lucide-react';

// FAQ data
const faqData = [
  {
    category: "Getting Started",
    icon: Book,
    questions: [
      {
        question: "How do I create my first user account?",
        answer: "Navigate to User Management > Add User, fill in the required information including name, email, and role, then click Create User."
      },
      {
        question: "How do I set up product categories?",
        answer: "Go to Catalog Management > Categories, click 'Add Category', enter the category name and description, then save."
      },
      {
        question: "Where can I view system health status?",
        answer: "The system health indicator is always visible in the top header. You can also visit the Health Check page for detailed system metrics."
      }
    ]
  },
  {
    category: "Account & Authentication",
    icon: Shield,
    questions: [
      {
        question: "I forgot my password, how do I reset it?",
        answer: "Click 'Forgot Password' on the login page, enter your email address, and follow the instructions sent to your email."
      },
      {
        question: "How do I change my account settings?",
        answer: "Click on your profile in the sidebar, then select 'Account Settings' to update your personal information and preferences."
      },
      {
        question: "Why am I getting logged out frequently?",
        answer: "Your session may be expiring due to inactivity. Check with your administrator about session timeout settings."
      }
    ]
  },
  {
    category: "Technical Issues",
    icon: Bug,
    questions: [
      {
        question: "The page is loading slowly, what should I do?",
        answer: "Check your internet connection, clear your browser cache, or try refreshing the page. If issues persist, contact technical support."
      },
      {
        question: "I'm seeing error messages, how do I resolve them?",
        answer: "Note down the exact error message and the steps that led to it, then contact support with these details for faster resolution."
      },
      {
        question: "Some features are not working properly",
        answer: "Try logging out and logging back in. If the issue persists, check if you have the necessary permissions for those features."
      }
    ]
  }
];

export default function FaqPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Filter FAQ based on search and category
  const filteredFAQ = faqData
    .map(category => ({
      ...category,
      questions: category.questions.filter(q => 
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }))
    .filter(category => 
      selectedCategory === "all" || 
      category.category.toLowerCase().includes(selectedCategory.toLowerCase())
    )
    .filter(category => category.questions.length > 0);

  return (
    <div className="page-container">
      <PageHeader
        title="Frequently Asked Questions"
        description="Find answers to common questions about using the admin panel and managing your account."
        icon={HelpCircle}
      />

      <div className="grid gap-6">
        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Search FAQ
            </CardTitle>
            <div className="flex gap-4 mt-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search FAQ..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="getting started">Getting Started</SelectItem>
                  <SelectItem value="account">Account & Auth</SelectItem>
                  <SelectItem value="technical">Technical Issues</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {filteredFAQ.length === 0 ? (
              <div className="text-center py-8">
                <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No FAQ found</h3>
                <p className="text-muted-foreground">Try adjusting your search terms or category filter.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredFAQ.map((category) => (
                  <div key={category.category}>
                    <div className="flex items-center gap-2 mb-4">
                      <category.icon className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">{category.category}</h3>
                      <Badge variant="outline">{category.questions.length}</Badge>
                    </div>
                    <div className="space-y-3">
                      {category.questions.map((faq, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <h4 className="font-medium mb-2">{faq.question}</h4>
                          <p className="text-sm text-muted-foreground">{faq.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}