/**
 * Seed script for Email Templates
 * Creates sample email templates for testing the email system
 */

require('dotenv').config();
const mongoose = require('mongoose');
const EmailTemplate = require('../models/EmailTemplate');
const User = require('../models/User');

// Sample email templates data
const sampleEmailTemplates = [
  // Welcome Email Template
  {
    name: 'Welcome Email - New User',
    description: 'Welcome email template for new user registrations',
    subject_template: 'Welcome to {{company_name}}, {{user_name}}! 🎉',
    html_template: `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to {{company_name}}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #007bff, #0056b3); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 28px;">Welcome to {{company_name}}!</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">Your journey starts here</p>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #007bff; margin-top: 0;">Hi {{user_name}},</h2>
              <p>We're thrilled to have you join our community! Your account has been successfully created and you're now part of something amazing.</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff;">
                  <h3 style="margin-top: 0; color: #007bff;">What's Next?</h3>
                  <ul style="padding-left: 20px;">
                      <li>Complete your profile setup</li>
                      <li>Explore our latest products</li>
                      <li>Join our newsletter for exclusive offers</li>
                      <li>Follow us on social media</li>
                  </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                  <a href="{{dashboard_url}}" style="display: inline-block; background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Get Started</a>
              </div>
              
              <p>If you have any questions, our support team is here to help. Just reply to this email or visit our help center.</p>
              
              <p>Welcome aboard!</p>
              <p><strong>The {{company_name}} Team</strong></p>
          </div>
      </body>
      </html>
    `,
    category: 'WELCOME',
    variables: [
      {
        name: 'user_name',
        description: 'User\'s full name',
        type: 'string',
        required: true
      },
      {
        name: 'company_name',
        description: 'Company name',
        type: 'string',
        required: true,
        default_value: 'Zyvo'
      },
      {
        name: 'dashboard_url',
        description: 'URL to user dashboard',
        type: 'string',
        required: true
      }
    ],
    design: {
      layout: 'SINGLE_COLUMN',
      theme: {
        primary_color: '#007bff',
        secondary_color: '#6c757d',
        background_color: '#f8f9fa',
        text_color: '#333333'
      }
    },
    visibility: 'PUBLIC',
    tags: ['welcome', 'onboarding', 'new-user']
  },

  // Order Confirmation Template
  {
    name: 'Order Confirmation',
    description: 'Email template for order confirmations',
    subject_template: 'Order Confirmed - #{{order_number}} 📦',
    html_template: `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Confirmation</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">Order Confirmed! ✅</h1>
              <p style="margin: 10px 0 0 0;">Thank you for your purchase</p>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <p>Hi {{customer_name}},</p>
              <p>Great news! We've received your order and it's being processed. Here are the details:</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #28a745;">Order Details</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                          <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Order Number:</strong></td>
                          <td style="padding: 8px 0; border-bottom: 1px solid #eee;">#{{order_number}}</td>
                      </tr>
                      <tr>
                          <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Order Date:</strong></td>
                          <td style="padding: 8px 0; border-bottom: 1px solid #eee;">{{order_date}}</td>
                      </tr>
                      <tr>
                          <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Total Amount:</strong></td>
                          <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #28a745;">{{total_amount}}</td>
                      </tr>
                      <tr>
                          <td style="padding: 8px 0;"><strong>Estimated Delivery:</strong></td>
                          <td style="padding: 8px 0;">{{estimated_delivery}}</td>
                      </tr>
                  </table>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                  <a href="{{order_tracking_url}}" style="display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Track Your Order</a>
              </div>
              
              <p>We'll send you another email when your order ships with tracking information.</p>
              <p>Thank you for choosing {{company_name}}!</p>
          </div>
      </body>
      </html>
    `,
    category: 'ORDER_CONFIRMATION',
    variables: [
      {
        name: 'customer_name',
        description: 'Customer\'s name',
        type: 'string',
        required: true
      },
      {
        name: 'order_number',
        description: 'Order number',
        type: 'string',
        required: true
      },
      {
        name: 'order_date',
        description: 'Order date',
        type: 'string',
        required: true
      },
      {
        name: 'total_amount',
        description: 'Total order amount',
        type: 'string',
        required: true
      },
      {
        name: 'estimated_delivery',
        description: 'Estimated delivery date',
        type: 'string',
        required: true
      },
      {
        name: 'order_tracking_url',
        description: 'URL to track the order',
        type: 'string',
        required: true
      },
      {
        name: 'company_name',
        description: 'Company name',
        type: 'string',
        default_value: 'Zyvo'
      }
    ],
    design: {
      layout: 'SINGLE_COLUMN',
      theme: {
        primary_color: '#28a745',
        secondary_color: '#6c757d',
        background_color: '#f8f9fa',
        text_color: '#333333'
      }
    },
    visibility: 'PUBLIC',
    tags: ['order', 'confirmation', 'transactional']
  },

  // Newsletter Template
  {
    name: 'Monthly Newsletter',
    description: 'Template for monthly newsletter campaigns',
    subject_template: '{{newsletter_title}} - {{month}} {{year}}',
    html_template: `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>{{newsletter_title}}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #6f42c1, #5a2d91); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 28px;">{{newsletter_title}}</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">{{month}} {{year}} Edition</p>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <p>Hi {{subscriber_name}},</p>
              <p>Welcome to our {{month}} newsletter! Here's what's happening this month:</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #6f42c1;">🌟 Featured Content</h3>
                  <p>{{featured_content}}</p>
              </div>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #6f42c1;">🎉 Special Offers</h3>
                  <p>{{special_offers}}</p>
                  <div style="text-align: center; margin: 20px 0;">
                      <a href="{{offers_url}}" style="display: inline-block; background: #6f42c1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Offers</a>
                  </div>
              </div>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #6f42c1;">📰 Company News</h3>
                  <p>{{company_news}}</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0; padding: 20px; background: #e9ecef; border-radius: 8px;">
                  <p style="margin: 0; font-size: 14px; color: #6c757d;">
                      You're receiving this because you subscribed to our newsletter.
                      <a href="{{unsubscribe_url}}" style="color: #6f42c1;">Unsubscribe</a> | 
                      <a href="{{update_preferences_url}}" style="color: #6f42c1;">Update Preferences</a>
                  </p>
              </div>
          </div>
      </body>
      </html>
    `,
    category: 'NEWSLETTER',
    variables: [
      {
        name: 'subscriber_name',
        description: 'Subscriber\'s name',
        type: 'string',
        required: true
      },
      {
        name: 'newsletter_title',
        description: 'Newsletter title',
        type: 'string',
        required: true
      },
      {
        name: 'month',
        description: 'Current month',
        type: 'string',
        required: true
      },
      {
        name: 'year',
        description: 'Current year',
        type: 'string',
        required: true
      },
      {
        name: 'featured_content',
        description: 'Featured content for the month',
        type: 'string',
        required: true
      },
      {
        name: 'special_offers',
        description: 'Special offers content',
        type: 'string',
        required: true
      },
      {
        name: 'company_news',
        description: 'Company news content',
        type: 'string',
        required: true
      },
      {
        name: 'offers_url',
        description: 'URL to view offers',
        type: 'string',
        required: true
      },
      {
        name: 'unsubscribe_url',
        description: 'Unsubscribe URL',
        type: 'string',
        required: true
      },
      {
        name: 'update_preferences_url',
        description: 'Update preferences URL',
        type: 'string',
        required: true
      }
    ],
    design: {
      layout: 'SINGLE_COLUMN',
      theme: {
        primary_color: '#6f42c1',
        secondary_color: '#6c757d',
        background_color: '#f8f9fa',
        text_color: '#333333'
      }
    },
    visibility: 'PUBLIC',
    tags: ['newsletter', 'marketing', 'monthly']
  },

  // Password Reset Template
  {
    name: 'Password Reset Request',
    description: 'Template for password reset emails',
    subject_template: 'Reset Your Password - {{company_name}}',
    html_template: `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">🔐 Password Reset Request</h1>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <p>Hi {{user_name}},</p>
              <p>We received a request to reset your password for your {{company_name}} account. If you made this request, click the button below to reset your password:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                  <a href="{{reset_url}}" style="display: inline-block; background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Reset Password</a>
              </div>
              
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; color: #856404;"><strong>⚠️ Important Security Information:</strong></p>
                  <ul style="margin: 10px 0; color: #856404; padding-left: 20px;">
                      <li>This link will expire in {{expiry_hours}} hours</li>
                      <li>If you didn't request this reset, please ignore this email</li>
                      <li>Your password won't change until you create a new one</li>
                  </ul>
              </div>
              
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 14px;">{{reset_url}}</p>
              
              <p>If you didn't request a password reset, please contact our support team immediately.</p>
              
              <p>Stay secure,<br><strong>The {{company_name}} Security Team</strong></p>
          </div>
      </body>
      </html>
    `,
    category: 'TRANSACTIONAL',
    variables: [
      {
        name: 'user_name',
        description: 'User\'s name',
        type: 'string',
        required: true
      },
      {
        name: 'reset_url',
        description: 'Password reset URL',
        type: 'string',
        required: true
      },
      {
        name: 'expiry_hours',
        description: 'Reset link expiry hours',
        type: 'string',
        required: true,
        default_value: '24'
      },
      {
        name: 'company_name',
        description: 'Company name',
        type: 'string',
        default_value: 'Zyvo'
      }
    ],
    design: {
      layout: 'SINGLE_COLUMN',
      theme: {
        primary_color: '#dc3545',
        secondary_color: '#6c757d',
        background_color: '#f8f9fa',
        text_color: '#333333'
      }
    },
    visibility: 'PUBLIC',
    tags: ['password', 'reset', 'security', 'transactional']
  },

  // Promotional Template
  {
    name: 'Flash Sale Promotion',
    description: 'Template for flash sale and promotional emails',
    subject_template: '🔥 Flash Sale: {{discount_percentage}}% OFF Everything! Limited Time',
    html_template: `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Flash Sale</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ff6b6b, #ee5a24); color: white; padding: 40px; text-align: center; border-radius: 15px 15px 0 0; position: relative;">
              <div style="background: #ff4757; color: white; padding: 8px 20px; border-radius: 20px; display: inline-block; font-size: 14px; font-weight: bold; margin-bottom: 20px;">
                  ⚡ FLASH SALE
              </div>
              <h1 style="margin: 0; font-size: 36px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">{{discount_percentage}}% OFF</h1>
              <p style="margin: 10px 0 0 0; font-size: 18px;">Everything Must Go!</p>
              <div style="background: rgba(255,255,255,0.2); padding: 10px; border-radius: 8px; margin-top: 20px;">
                  <p style="margin: 0; font-size: 16px;">Sale ends in: <strong>{{countdown_timer}}</strong></p>
              </div>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 15px 15px;">
              <p style="font-size: 18px; text-align: center; margin-top: 0;">Hi {{customer_name}},</p>
              <p style="text-align: center; font-size: 16px;">This is it! Our biggest sale of the year is here, but only for a limited time.</p>
              
              <div style="background: white; padding: 25px; border-radius: 10px; margin: 25px 0; border: 2px dashed #ff6b6b;">
                  <div style="text-align: center;">
                      <h2 style="color: #ff6b6b; margin: 0 0 15px 0; font-size: 24px;">Use Code:</h2>
                      <div style="background: #ff6b6b; color: white; padding: 15px 30px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 2px; display: inline-block;">
                          {{promo_code}}
                      </div>
                  </div>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                  <a href="{{shop_url}}" style="display: inline-block; background: linear-gradient(135deg, #ff6b6b, #ee5a24); color: white; padding: 18px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; text-transform: uppercase; box-shadow: 0 4px 15px rgba(255,107,107,0.3);">
                      Shop Now & Save {{discount_percentage}}%
                  </a>
              </div>
              
              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                  <p style="margin: 0; color: #856404;"><strong>⏰ Hurry! This offer expires {{expiry_date}}</strong></p>
                  <p style="margin: 10px 0 0 0; color: #856404; font-size: 14px;">*Terms and conditions apply. Cannot be combined with other offers.</p>
              </div>
              
              <p style="text-align: center; font-size: 14px; color: #6c757d; margin-top: 30px;">
                  Don't want to receive promotional emails? 
                  <a href="{{unsubscribe_url}}" style="color: #ff6b6b;">Unsubscribe here</a>
              </p>
          </div>
      </body>
      </html>
    `,
    category: 'PROMOTIONAL',
    variables: [
      {
        name: 'customer_name',
        description: 'Customer\'s name',
        type: 'string',
        required: true
      },
      {
        name: 'discount_percentage',
        description: 'Discount percentage',
        type: 'string',
        required: true
      },
      {
        name: 'promo_code',
        description: 'Promotional code',
        type: 'string',
        required: true
      },
      {
        name: 'countdown_timer',
        description: 'Countdown timer display',
        type: 'string',
        required: true
      },
      {
        name: 'expiry_date',
        description: 'Sale expiry date',
        type: 'string',
        required: true
      },
      {
        name: 'shop_url',
        description: 'URL to shop',
        type: 'string',
        required: true
      },
      {
        name: 'unsubscribe_url',
        description: 'Unsubscribe URL',
        type: 'string',
        required: true
      }
    ],
    design: {
      layout: 'SINGLE_COLUMN',
      theme: {
        primary_color: '#ff6b6b',
        secondary_color: '#ee5a24',
        background_color: '#f8f9fa',
        text_color: '#333333'
      }
    },
    visibility: 'PUBLIC',
    tags: ['promotion', 'sale', 'discount', 'marketing']
  }
];

/**
 * Seed email templates
 */
const seedEmailTemplates = async () => {
  try {
    console.log('📧 Starting email templates seeding...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing email templates
    const deleteResult = await EmailTemplate.deleteMany({});
    console.log(`🗑️  Cleared ${deleteResult.deletedCount} existing email templates`);

    // Get admin users to assign as template creators
    const adminUsers = await User.find({ role: { $in: ['admin', 'superadmin'] } }).limit(5);
    console.log(`👥 Found ${adminUsers.length} admin users for template assignment`);

    if (adminUsers.length === 0) {
      console.log('❌ No admin users found. Please run user seeding first.');
      return;
    }

    let templateCount = 0;
    
    // Create email templates
    for (let i = 0; i < sampleEmailTemplates.length; i++) {
      const templateData = { ...sampleEmailTemplates[i] };
      
      // Assign random admin as creator
      const randomAdmin = adminUsers[Math.floor(Math.random() * adminUsers.length)];
      templateData.created_by = randomAdmin._id;
      
      const emailTemplate = new EmailTemplate(templateData);
      
      // Validate template
      emailTemplate.validateTemplate();
      
      await emailTemplate.save();
      templateCount++;
      
      console.log(`📧 Created "${templateData.name}" template (Category: ${templateData.category})`);
    }

    console.log(`\n🎉 Email templates seeding completed successfully!`);
    console.log(`📊 Summary:`);
    console.log(`   - Created ${templateCount} email templates`);
    console.log(`   - Assigned to ${adminUsers.length} admin users`);
    console.log(`   - Categories: WELCOME, ORDER_CONFIRMATION, NEWSLETTER, TRANSACTIONAL, PROMOTIONAL`);
    console.log(`   - All templates include comprehensive variable definitions`);

    // Display template statistics
    const categoryStats = await EmailTemplate.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avg_variables: { $avg: { $size: '$variables' } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    console.log(`\n📈 Template Statistics by Category:`);
    categoryStats.forEach(stat => {
      console.log(`   - ${stat._id}: ${stat.count} templates (avg ${Math.round(stat.avg_variables)} variables)`);
    });

    const validationStats = await EmailTemplate.aggregate([
      {
        $group: {
          _id: '$validation.is_valid',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log(`\n✅ Validation Status:`);
    validationStats.forEach(stat => {
      const status = stat._id ? 'Valid' : 'Invalid';
      console.log(`   - ${status}: ${stat.count} templates`);
    });

    // Show sample templates
    console.log(`\n📧 Sample Email Templates:`);
    const sampleTemplates = await EmailTemplate.find({})
      .populate('created_by', 'name email')
      .limit(3)
      .lean();
    
    sampleTemplates.forEach(template => {
      console.log(`   - "${template.name}" by ${template.created_by.name}`);
      console.log(`     Category: ${template.category} | Variables: ${template.variables.length} | Status: ${template.status}`);
    });

  } catch (error) {
    console.error('❌ Error seeding email templates:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedEmailTemplates();
}

module.exports = { seedEmailTemplates };
