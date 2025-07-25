/**
 * Admin Email Service
 * Handles actual email sending for the admin email management system
 */

const { sendEmail } = require('./sendEmail');

/**
 * Send admin email to recipients
 * @param {Object} email - Email object from database
 * @returns {Promise} Promise resolving to send result
 */
const sendAdminEmail = async (email) => {
  try {
    console.log(`Starting to send email ${email._id} to ${email.recipients.to.length} recipients`);
    
    let successCount = 0;
    let failureCount = 0;
    
    // Process each recipient
    for (let i = 0; i < email.recipients.to.length; i++) {
      const recipient = email.recipients.to[i];
      
      try {
        // Prepare email content
        let htmlContent = email.content.html;
        let textContent = email.content.text || email.content.html.replace(/<[^>]*>/g, '').trim();
        let subject = email.subject;
        
        // Replace basic variables if any
        if (recipient.name) {
          htmlContent = htmlContent.replace(/{{name}}/g, recipient.name);
          textContent = textContent.replace(/{{name}}/g, recipient.name);  
          subject = subject.replace(/{{name}}/g, recipient.name);
        }
        
        // Replace email variable
        htmlContent = htmlContent.replace(/{{email}}/g, recipient.email);
        textContent = textContent.replace(/{{email}}/g, recipient.email);
        
        // Add unsubscribe link if enabled
        if (email.settings.allow_unsubscribe) {
          const unsubscribeUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/unsubscribe?email=${encodeURIComponent(recipient.email)}&id=${email._id}`;
          htmlContent += `<br><br><small><a href="${unsubscribeUrl}">Unsubscribe</a></small>`;
          textContent += `\n\nUnsubscribe: ${unsubscribeUrl}`;
        }
        
        // Send email using the existing sendEmail utility
        await sendEmail({
          email: recipient.email,
          subject: subject,
          message: textContent,
          html: htmlContent
        });
        
        // Update recipient status to SENT
        email.updateRecipientStatus(recipient.email, 'SENT');
        successCount++;
        
        console.log(`✅ Email sent to ${recipient.email}`);
        
        // Small delay to avoid overwhelming the email service
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Failed to send email to ${recipient.email}:`, error.message);
        
        // Update recipient status to FAILED with reason
        email.updateRecipientStatus(recipient.email, 'FAILED', {
          reason: error.message
        });
        failureCount++;
      }
    }
    
    // Update email status based on results
    if (failureCount === 0) {
      email.status = 'SENT';
    } else if (successCount === 0) {
      email.status = 'FAILED';
    } else {
      email.status = 'SENT'; // Partially sent is still considered sent
    }
    
    email.completed_at = new Date();
    await email.save();
    
    console.log(`📊 Email ${email._id} completed: ${successCount} sent, ${failureCount} failed`);
    
    return {
      success: true,
      sent_count: successCount,
      failed_count: failureCount,
      total_recipients: email.recipients.to.length
    };
    
  } catch (error) {
    console.error('Error in sendAdminEmail:', error);
    
    // Update email status to failed
    email.status = 'FAILED';
    email.errors.push({
      error_type: 'SENDING',
      error_message: error.message,
      error_code: 'SEND_FAILED',
      occurred_at: new Date()
    });
    
    await email.save();
    
    throw new Error(`Failed to send admin email: ${error.message}`);
  }
};

/**
 * Send email with template processing
 * @param {Object} email - Email object from database with template
 * @returns {Promise} Promise resolving to send result
 */
const sendTemplatedEmail = async (email) => {
  try {
    if (!email.template?.template_id) {
      return await sendAdminEmail(email);
    }
    
    // Load the template
    const EmailTemplate = require('../models/EmailTemplate');
    const template = await EmailTemplate.findById(email.template.template_id);
    
    if (!template) {
      throw new Error('Email template not found');
    }
    
    console.log(`Sending templated email ${email._id} using template ${template.name}`);
    
    let successCount = 0;
    let failureCount = 0;
    
    // Process each recipient with template
    for (let i = 0; i < email.recipients.to.length; i++) {
      const recipient = email.recipients.to[i];
      
      try {
        // Merge template variables with email variables
        const templateVars = {
          ...email.template.variables,
          name: recipient.name || '',
          email: recipient.email,
          ...email.template.variables // Email-specific variables override defaults
        };
        
        // Process template
        let htmlContent = template.html_template;
        let textContent = template.text_template || template.html_template.replace(/<[^>]*>/g, '').trim();
        let subject = template.subject_template;
        
        // Replace variables in templates
        Object.keys(templateVars).forEach(key => {
          const value = templateVars[key] || '';
          const regex = new RegExp(`{{${key}}}`, 'g');
          htmlContent = htmlContent.replace(regex, value);
          textContent = textContent.replace(regex, value);
          subject = subject.replace(regex, value);
        });
        
        // Add unsubscribe link if enabled
        if (email.settings.allow_unsubscribe) {
          const unsubscribeUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/unsubscribe?email=${encodeURIComponent(recipient.email)}&id=${email._id}`;
          htmlContent += `<br><br><small><a href="${unsubscribeUrl}">Unsubscribe</a></small>`;
          textContent += `\n\nUnsubscribe: ${unsubscribeUrl}`;
        }
        
        // Send email
        await sendEmail({
          email: recipient.email,
          subject: subject,
          message: textContent,
          html: htmlContent
        });
        
        // Update recipient status
        email.updateRecipientStatus(recipient.email, 'SENT');
        successCount++;
        
        console.log(`✅ Templated email sent to ${recipient.email}`);
        
        // Small delay
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Failed to send templated email to ${recipient.email}:`, error.message);
        
        email.updateRecipientStatus(recipient.email, 'FAILED', {
          reason: error.message
        });
        failureCount++;
      }
    }
    
    // Update email status
    if (failureCount === 0) {
      email.status = 'SENT';
    } else if (successCount === 0) {
      email.status = 'FAILED';
    } else {
      email.status = 'SENT';
    }
    
    email.completed_at = new Date();
    await email.save();
    
    console.log(`📊 Templated email ${email._id} completed: ${successCount} sent, ${failureCount} failed`);
    
    return {
      success: true,
      sent_count: successCount,
      failed_count: failureCount,
      total_recipients: email.recipients.to.length
    };
    
  } catch (error) {
    console.error('Error in sendTemplatedEmail:', error);
    
    email.status = 'FAILED';
    email.errors.push({
      error_type: 'TEMPLATE',
      error_message: error.message,
      error_code: 'TEMPLATE_FAILED'
    });
    
    await email.save();
    
    throw new Error(`Failed to send templated email: ${error.message}`);
  }
};

module.exports = {
  sendAdminEmail,
  sendTemplatedEmail
};
