/**
 * Support Ticket Seeder
 * Seeds support ticket data with realistic scenarios using hardcoded data
 */

/**
 * Support ticket categories and their common issues
 */
const ticketScenarios = {
  ORDER_ISSUE: [
    'Order not received after 5 days',
    'Wrong item delivered instead of what I ordered',
    'Order showing delivered but not received',
    'Missing items from my order',
    'Order cancelled without notification'
  ],
  PAYMENT_PROBLEM: [
    'Payment deducted but order not confirmed',
    'Double payment charged for single order',
    'Refund not received after cancellation',
    'Payment failed but money deducted',
    'Unable to complete payment through UPI'
  ],
  PRODUCT_INQUIRY: [
    'Need more details about product specifications',
    'Is this product compatible with iPhone 14?',
    'What is the warranty period for this item?',
    'Do you have this product in different colors?',
    'When will this product be back in stock?'
  ],
  SHIPPING_DELIVERY: [
    'Delivery delayed beyond expected date',
    'Unable to change delivery address',
    'Package damaged during delivery',
    'Delivery person asking for extra charges',
    'Need to reschedule delivery time'
  ],
  RETURNS_REFUNDS: [
    'How to return a defective product?',
    'Refund amount is less than paid amount',
    'Return pickup not arranged after request',
    'Product return rejected without proper reason',
    'Need to exchange product for different size'
  ],
  ACCOUNT_ACCESS: [
    'Unable to login to my account',
    'Forgot password and not receiving reset email',
    'Account locked due to multiple failed attempts',
    'Unable to update profile information',
    'Two-factor authentication not working'
  ],
  TECHNICAL_SUPPORT: [
    'Website not loading properly on mobile',
    'App crashing during checkout process',
    'Images not displaying in product gallery',
    'Search function not working correctly',
    'Unable to apply coupon code'
  ],
  BILLING_INQUIRY: [
    'Invoice not generated for completed order',
    'GST details incorrect in the bill',
    'Need duplicate copy of invoice',
    'Billing address different from what I provided',
    'Corporate billing requirements not met'
  ],
  PRODUCT_DEFECT: [
    'Product received is damaged/defective',
    'Product not working as described',
    'Missing accessories in the product box',
    'Product quality is very poor',
    'Manufacturing defect in the product'
  ],
  WEBSITE_BUG: [
    'Cart items disappearing after adding',
    'Checkout page showing error message',
    'Product reviews not loading',
    'Wishlist items getting removed automatically',
    'Notification emails not being received'
  ],
  FEATURE_REQUEST: [
    'Please add cash on delivery option',
    'Need dark mode for the app',
    'Wishlist sharing feature required',
    'Product comparison feature needed',
    'Multiple payment methods in single order'
  ],
  COMPLAINT: [
    'Very poor customer service experience',
    'Delivery person was rude and unprofessional',
    'Product quality not matching the price',
    'False advertising on product page',
    'Refund policy not being followed properly'
  ]
};

// Hardcoded sample names
const sampleNames = [
  'Rahul Sharma', 'Priya Patel', 'Amit Kumar', 'Sunita Singh', 'Rohit Gupta',
  'Neha Agarwal', 'Vikash Yadav', 'Kavya Jain', 'Suresh Reddy', 'Divya Mehta',
  'Rajesh Bansal', 'Meera Nair', 'Deepak Tiwari', 'Shreya Iyer', 'Ajay Verma',
  'Pooja Malhotra', 'Manoj Chopra', 'Rekha Shah', 'Sandeep Joshi', 'Ananya Desai'
];

// Hardcoded sample emails
const sampleEmails = [
  'rahul.sharma@gmail.com', 'priya.patel@yahoo.com', 'amit.k@hotmail.com',
  'sunita.singh@gmail.com', 'rohit.gupta@outlook.com', 'neha.agarwal@gmail.com',
  'vikash.yadav@yahoo.com', 'kavya.jain@gmail.com', 'suresh.reddy@hotmail.com',
  'divya.mehta@gmail.com', 'rajesh.bansal@yahoo.com', 'meera.nair@gmail.com',
  'deepak.tiwari@outlook.com', 'shreya.iyer@gmail.com', 'ajay.verma@yahoo.com',
  'pooja.malhotra@gmail.com', 'manoj.chopra@hotmail.com', 'rekha.shah@gmail.com',
  'sandeep.joshi@yahoo.com', 'ananya.desai@outlook.com'
];

// Hardcoded phone numbers
const samplePhones = [
  '+919876543210', '+919123456789', '+919987654321', '+919456123789',
  '+919321654987', '+919654987321', '+919789456123', '+919147258369',
  '+919963852741', '+919852741963', '+919741852963', '+919258147369',
  '+919369147258', '+919159753246', '+919246813579', '+919357924681',
  '+919468135792', '+919579246813', '+919681357924', '+919792468135'
];

// Admin responses
const adminResponses = [
  'Thank you for contacting us. I have reviewed your case and I am looking into this issue right away. I will update you within 24 hours with a resolution.',
  'I apologize for the inconvenience caused. Let me check with our logistics team and get back to you with an update soon.',
  'I understand your concern and I am here to help you resolve this issue. I have escalated this to the concerned department for immediate action.',
  'Thank you for bringing this to our attention. I have initiated the process to resolve your issue and you should see an update within 2 business days.',
  'I have checked your order details and I can see the issue. Let me work with our team to get this sorted out for you immediately.'
];

// Product names
const productNames = [
  'Samsung Galaxy Smartphone', 'Apple iPhone 14', 'Dell Laptop XPS 15', 'HP Pavilion Desktop',
  'Sony Wireless Headphones', 'Canon DSLR Camera', 'LG Smart TV 55 inch', 'Asus Gaming Laptop',
  'Nike Running Shoes', 'Adidas Sports Jacket', 'Philips Air Fryer', 'Whirlpool Refrigerator',
  'Bosch Washing Machine', 'Lenovo ThinkPad', 'Microsoft Surface Pro', 'Fitbit Smartwatch'
];

// Helper functions
const getRandomElement = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

const getRandomElements = (array, count) => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const getRandomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const getRandomBool = (probability = 0.5) => {
  return Math.random() < probability;
};

const getRandomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Generate realistic messages for tickets
 */
const generateMessages = (category, subject, isUserFirst = true) => {
  const messages = [];
  
  // Initial user message
  const userMessages = {
    ORDER_ISSUE: [
      `Hi, I placed an order on last week but haven't received it yet. The tracking shows delivered but I never received the package. Please help me track my order.`,
      `Hello, I received a wrong item in my recent order. I ordered a blue t-shirt but received a red one. Please arrange for exchange or refund.`,
      `My order was supposed to be delivered yesterday but it's still showing as 'in transit'. Can you please check what's the issue?`
    ],
    PAYMENT_PROBLEM: [
      `I made a payment of ₹2,500 for my order but the order status is still showing as 'payment pending'. My bank statement shows the amount has been debited. Please resolve this urgently.`,
      `Money was deducted from my account twice for the same order. I have attached the bank statement for your reference. Please refund the extra amount.`,
      `I cancelled my order 3 days ago but still haven't received the refund. When can I expect the money back in my account?`
    ],
    PRODUCT_INQUIRY: [
      `I'm interested in buying this smartphone but need to know if it supports 5G networks in India. Also, what accessories come with it?`,
      `Does this laptop have a backlit keyboard? I couldn't find this information in the product description.`,
      `When will this product be available again? It's showing out of stock but I really need it urgently.`
    ]
  };
  
  // Add initial user message
  if (userMessages[category]) {
    messages.push({
      content: getRandomElement(userMessages[category]),
      isAdmin: false,
      isInternal: false
    });
  } else {
    messages.push({
      content: `Hi, I'm facing an issue with ${subject.toLowerCase()}. Could you please help me resolve this?`,
      isAdmin: false,
      isInternal: false
    });
  }
  
  // Add admin response for some tickets (70% chance)
  if (getRandomBool(0.7)) {
    messages.push({
      content: getRandomElement(adminResponses),
      isAdmin: true,
      isInternal: false
    });
    
    // Add follow-up user message sometimes (40% chance)
    if (getRandomBool(0.4)) {
      messages.push({
        content: `Thank you for the quick response. I'll wait for the update. Please keep me posted.`,
        isAdmin: false,
        isInternal: false
      });
    }
  }
  
  // Add internal admin notes sometimes (30% chance)
  if (getRandomBool(0.3)) {
    const internalNotes = [
      `Internal note: Customer seems genuine. Checked order history - this is their first complaint. Priority handling required.`,
      `Internal note: Escalate to logistics team. This is a recurring issue with this delivery partner.`,
      `Internal note: Customer has premium membership. Ensure quick resolution to maintain satisfaction.`,
      `Internal note: Check with payment team about this transaction. May be a gateway issue.`,
      `Internal note: This customer had similar issue last month. May need to review their account settings.`
    ];
    messages.push({
      content: getRandomElement(internalNotes),
      isAdmin: true,
      isInternal: true
    });
  }
  
  return messages;
};

/**
 * Generate sample support tickets
 */
const generateSupportTickets = async (userIds, adminIds, count = 30) => {
  const tickets = [];
  const categories = Object.keys(ticketScenarios);
  const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
  const statuses = ['OPEN', 'IN_PROGRESS', 'PENDING_USER', 'RESOLVED', 'CLOSED'];
  const sources = ['WEB_PORTAL', 'MOBILE_APP', 'EMAIL', 'PHONE', 'CHAT'];
  
  for (let i = 0; i < count; i++) {
    const category = getRandomElement(categories);
    const subject = getRandomElement(ticketScenarios[category]);
    const userIndex = getRandomInt(0, sampleNames.length - 1);
    const createdDate = getRandomDate(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      new Date()
    );
    
    const status = getRandomElement(statuses);
    const priority = getRandomElement(priorities);
    
    // Generate realistic ticket data
    const ticket = {
      subject: subject,
      description: `Detailed description: ${subject}\n\nI need assistance with this issue as it's affecting my experience with your platform. Please provide a solution at the earliest.`,
      user: {
        user_id: userIds.length > 0 ? getRandomElement(userIds) : null,
        name: sampleNames[userIndex],
        email: sampleEmails[userIndex],
        phone: samplePhones[userIndex]
      },
      category: category,
      priority: priority,
      status: status,
      source: getRandomElement(sources),
      created_at: createdDate,
      last_activity_at: createdDate,
      
      // Add assignment for some tickets (60% chance)
      ...(getRandomBool(0.6) && adminIds.length > 0 && {
        assigned_to: {
          admin_id: getRandomElement(adminIds),
          name: getRandomElement(sampleNames),
          email: getRandomElement(sampleEmails),
          assigned_at: getRandomDate(createdDate, new Date())
        }
      }),
      
      // Add related order for order-related tickets (80% chance)
      ...(category === 'ORDER_ISSUE' && getRandomBool(0.8) && {
        related_order: {
          order_number: `ORD-${getRandomInt(100000, 999999)}`
        }
      }),
      
      // Add related product for product-related tickets (70% chance)
      ...(['PRODUCT_INQUIRY', 'PRODUCT_DEFECT'].includes(category) && getRandomBool(0.7) && {
        related_product: {
          product_name: getRandomElement(productNames),
          sku: `SKU${getRandomInt(10000, 99999)}`
        }
      }),
      
      // Add tags
      tags: getRandomElements([
        'urgent', 'customer-complaint', 'billing', 'technical', 'refund', 
        'exchange', 'delivery', 'payment', 'quality-issue', 'account'
      ], getRandomInt(0, 3)),
      
      // Add SLA dates
      sla: {
        response_due: new Date(createdDate.getTime() + 24 * 60 * 60 * 1000), // 24 hours
        resolution_due: new Date(createdDate.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days
        ...(status === 'IN_PROGRESS' && {
          first_response_at: getRandomDate(createdDate, new Date()),
          response_time_minutes: getRandomInt(30, 1440)
        }),
        ...((['RESOLVED', 'CLOSED'].includes(status)) && {
          resolution_time_minutes: getRandomInt(60, 10080)
        }),
        is_sla_breached: getRandomBool(0.2)
      },
      
      // Add resolution for resolved/closed tickets
      ...((['RESOLVED', 'CLOSED'].includes(status)) && adminIds.length > 0 && {
        resolution: {
          resolved_by: {
            admin_id: getRandomElement(adminIds),
            name: getRandomElement(sampleNames),
            email: getRandomElement(sampleEmails)
          },
          resolved_at: getRandomDate(createdDate, new Date()),
          resolution_note: `Issue has been resolved. ${getRandomElement([
            'Refund has been processed and will reflect in 3-5 business days.',
            'Product has been replaced and new order is being shipped.',
            'Technical issue has been fixed and functionality is restored.',
            'Account access has been restored and password reset email sent.',
            'Billing issue has been corrected and updated invoice sent.'
          ])}`,
          resolution_type: getRandomElement(['SOLVED', 'WORKAROUND', 'DUPLICATE', 'INVALID', 'USER_ERROR']),
          ...(getRandomBool(0.6) && {
            user_satisfaction: {
              rating: getRandomInt(3, 5),
              feedback: getRandomElement([
                'Very satisfied with the quick resolution',
                'Good customer service experience',
                'Issue resolved but took longer than expected',
                'Helpful and professional support team',
                'Quick and efficient problem solving'
              ]),
              rated_at: getRandomDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date())
            }
          })
        }
      }),
      
      // Add escalation for some high priority tickets (30% chance)
      ...(priority === 'URGENT' && getRandomBool(0.3) && adminIds.length > 0 && {
        escalation: {
          is_escalated: true,
          escalated_at: getRandomDate(createdDate, new Date()),
          escalated_by: getRandomElement(adminIds),
          escalation_reason: 'High priority customer complaint requiring senior management attention',
          escalation_level: getRandomInt(1, 3)
        }
      }),
      
      // Communication preferences
      communication_preferences: {
        preferred_method: getRandomElement(['EMAIL', 'PHONE', 'SMS', 'IN_APP']),
        notify_on_updates: getRandomBool(0.9)
      },
      
      // Metrics
      metrics: {
        view_count: getRandomInt(1, 20),
        last_viewed_by_user: getRandomDate(createdDate, new Date()),
        last_viewed_by_admin: getRandomDate(createdDate, new Date()),
        response_count: getRandomInt(0, 8),
        reopened_count: getRandomInt(0, 2)
      }
    };
    
    tickets.push(ticket);
  }
  
  return tickets;
};

/**
 * Seed support tickets table
 */
const seed = async (SupportTicketModel, UserModel) => {
  try {
    console.log('   📝 Fetching users for ticket assignments...');
    
    // Get existing users to assign tickets to
    const users = await UserModel.find({ isActive: true }).select('_id name email role');
    const regularUsers = users.filter(u => u.role === 'user').map(u => u._id);
    const adminUsers = users.filter(u => u.role === 'admin').map(u => u._id);
    
    if (regularUsers.length === 0) {
      throw new Error('No regular users found. Please seed users first.');
    }
    
    if (adminUsers.length === 0) {
      console.log('   ⚠️  No admin users found. Some tickets may not be assigned.');
    }
    
    console.log('   📝 Generating support ticket data...');
    const tickets = await generateSupportTickets(regularUsers, adminUsers, 50);
    
    console.log('   💾 Inserting support tickets into database...');
    const insertedTickets = [];
    
    for (let i = 0; i < tickets.length; i++) {
      try {
        const ticket = new SupportTicketModel(tickets[i]);
        const savedTicket = await ticket.save();
        insertedTickets.push(savedTicket);
        
        if ((i + 1) % 10 === 0) {
          console.log(`   ✓ Inserted ${i + 1}/${tickets.length} tickets`);
        }
      } catch (error) {
        console.log(`   ⚠️  Failed to insert ticket ${i + 1}: ${error.message}`);
      }
    }
    
    // Count by status
    const statusCounts = insertedTickets.reduce((acc, ticket) => {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1;
      return acc;
    }, {});
    
    // Count by priority
    const priorityCounts = insertedTickets.reduce((acc, ticket) => {
      acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
      return acc;
    }, {});
    
    const statusSummary = Object.entries(statusCounts).map(([status, count]) => `${count} ${status}`).join(', ');
    const prioritySummary = Object.entries(priorityCounts).map(([priority, count]) => `${count} ${priority}`).join(', ');
    
    return {
      count: insertedTickets.length,
      summary: `Status: ${statusSummary} | Priority: ${prioritySummary}`
    };
    
  } catch (error) {
    throw new Error(`Failed to seed support tickets: ${error.message}`);
  }
};

/**
 * Clean support tickets table
 */
const clean = async (SupportTicketModel) => {
  const count = await SupportTicketModel.countDocuments();
  await SupportTicketModel.deleteMany({});
  return { count };
};

/**
 * Get sample support ticket data for testing
 */
const getSampleTickets = () => {
  return [
    {
      subject: 'Order not received',
      category: 'ORDER_ISSUE',
      priority: 'HIGH',
      status: 'OPEN'
    },
    {
      subject: 'Refund request',
      category: 'RETURNS_REFUNDS',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS'
    },
    {
      subject: 'Product inquiry',
      category: 'PRODUCT_INQUIRY',
      priority: 'LOW',
      status: 'RESOLVED'
    }
  ];
};

module.exports = {
  seed,
  clean,
  getSampleTickets,
  generateSupportTickets
};
