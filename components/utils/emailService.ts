/**
 * Email Service Utility
 * Sends email notifications when activities are created
 * Uses EmailJS (free email service)
 */

export interface ActivityEmailData {
  name: string;
  date: string;
  time: string;
  endTime: string;
  location: string;
  venue: string;
  project: string;
  description?: string;
  participants?: number;
  facilitator?: string;
  createdBy?: string;
  sector?: string;
  partnerInstitution?: string;
}

/**
 * Formats activity data into HTML email content
 */
function formatActivityEmailHTML(activity: ActivityEmailData): string {
  const date = new Date(activity.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  
  const timeRange = `${activity.time} - ${activity.endTime}`;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .activity-details { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #3b82f6; }
        .detail-row { margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
        .detail-label { font-weight: bold; color: #1e40af; display: inline-block; width: 150px; }
        .detail-value { color: #374151; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        .badge { display: inline-block; background: #3b82f6; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; margin: 2px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>📅 New Activity Created</h2>
          <p style="margin: 0;">DICT Regional Calendar Notification</p>
        </div>
        <div class="content">
          <div class="activity-details">
            <h3 style="margin-top: 0; color: #1e40af;">${activity.name}</h3>
            
            <div class="detail-row">
              <span class="detail-label">Date:</span>
              <span class="detail-value">${date}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Time:</span>
              <span class="detail-value">${timeRange}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Location:</span>
              <span class="detail-value">${activity.location}</span>
            </div>
            
            ${activity.venue ? `
            <div class="detail-row">
              <span class="detail-label">Venue:</span>
              <span class="detail-value">${activity.venue}</span>
            </div>
            ` : ''}
            
            <div class="detail-row">
              <span class="detail-label">Project:</span>
              <span class="detail-value">${activity.project}</span>
            </div>
            
            ${activity.sector ? `
            <div class="detail-row">
              <span class="detail-label">Target Sector:</span>
              <span class="detail-value">${activity.sector}</span>
            </div>
            ` : ''}
            
            ${activity.participants ? `
            <div class="detail-row">
              <span class="detail-label">Expected Participants:</span>
              <span class="detail-value">${activity.participants}</span>
            </div>
            ` : ''}
            
            ${activity.facilitator ? `
            <div class="detail-row">
              <span class="detail-label">Facilitator:</span>
              <span class="detail-value">${activity.facilitator}</span>
            </div>
            ` : ''}
            
            ${activity.partnerInstitution ? `
            <div class="detail-row">
              <span class="detail-label">Partner Institution:</span>
              <span class="detail-value">${activity.partnerInstitution}</span>
            </div>
            ` : ''}
            
            ${activity.createdBy ? `
            <div class="detail-row">
              <span class="detail-label">Created by:</span>
              <span class="detail-value">${activity.createdBy}</span>
            </div>
            ` : ''}
            
            ${activity.description ? `
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
              <span class="detail-label" style="display: block; margin-bottom: 8px;">Description:</span>
              <span class="detail-value" style="display: block; white-space: pre-wrap;">${activity.description}</span>
            </div>
            ` : ''}
          </div>
        </div>
        <div class="footer">
          <p>This is an automated notification from DICT Regional Calendar System.</p>
          <p>Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Formats activity data into plain text email
 */
function formatActivityEmailText(activity: ActivityEmailData): string {
  const date = new Date(activity.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  
  const timeRange = `${activity.time} - ${activity.endTime}`;
  
  let text = `📅 NEW ACTIVITY CREATED\n\n`;
  text += `Activity: ${activity.name}\n`;
  text += `Date: ${date}\n`;
  text += `Time: ${timeRange}\n`;
  text += `Location: ${activity.location}\n`;
  
  if (activity.venue) {
    text += `Venue: ${activity.venue}\n`;
  }
  
  text += `Project: ${activity.project}\n`;
  
  if (activity.sector) {
    text += `Target Sector: ${activity.sector}\n`;
  }
  
  if (activity.participants) {
    text += `Expected Participants: ${activity.participants}\n`;
  }
  
  if (activity.facilitator) {
    text += `Facilitator: ${activity.facilitator}\n`;
  }
  
  if (activity.partnerInstitution) {
    text += `Partner Institution: ${activity.partnerInstitution}\n`;
  }
  
  if (activity.createdBy) {
    text += `Created by: ${activity.createdBy}\n`;
  }
  
  if (activity.description) {
    text += `\nDescription:\n${activity.description}\n`;
  }
  
  text += `\n---\nThis is an automated notification from DICT Regional Calendar System.`;
  
  return text;
}

/**
 * Sends email notification using EmailJS
 * EmailJS is a free service that works from the frontend
 */
export async function sendActivityEmail(
  recipientEmail: string,
  activity: ActivityEmailData
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // Check if EmailJS is configured
    const emailjsServiceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const emailjsTemplateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const emailjsPublicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
    
    if (!emailjsServiceId || !emailjsTemplateId || !emailjsPublicKey) {
      // Fallback: Log email details (don't redirect page)
      console.log('📧 Email Notification Prepared:');
      console.log('To:', recipientEmail);
      console.log('Subject: New Activity Created:', activity.name);
      console.log('Activity Details:', activity);
      console.log('\n📧 To enable automatic email sending:');
      console.log('1. Sign up for EmailJS (free): https://www.emailjs.com');
      console.log('2. Create email service and template');
      console.log('3. Add to .env:');
      console.log('   VITE_EMAILJS_SERVICE_ID=your_service_id');
      console.log('   VITE_EMAILJS_TEMPLATE_ID=your_template_id');
      console.log('   VITE_EMAILJS_PUBLIC_KEY=your_public_key');
      console.log('4. Restart your dev server');
      
      return {
        success: false,
        error: 'Email service not configured. Check console (F12) for setup instructions.',
        message: 'Email notification prepared but not sent. Configure EmailJS to enable automatic email sending.'
      };
    }
    
    // Use EmailJS API directly (no library installation needed)
    return await sendEmailViaAPI(recipientEmail, activity, {
      serviceId: emailjsServiceId,
      templateId: emailjsTemplateId,
      publicKey: emailjsPublicKey
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Fallback: Send email via EmailJS API directly (if library not installed)
 */
async function sendEmailViaAPI(
  recipientEmail: string,
  activity: ActivityEmailData,
  config: { serviceId: string; templateId: string; publicKey: string }
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // EmailJS template parameters
    // Note: The recipient email must match the field name in your EmailJS template
    // Common field names: to_email, to_name, reply_to, etc.
    const templateParams = {
      to_email: recipientEmail, // This is the recipient - make sure your template has this field
      to_name: recipientEmail.split('@')[0],
      reply_to: recipientEmail, // Optional: for reply-to field
      from_name: 'DICT Regional Calendar',
      subject: `New Activity Created: ${activity.name}`,
      activity_name: activity.name,
      activity_date: new Date(activity.date).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }),
      activity_time: `${activity.time} - ${activity.endTime}`,
      activity_location: activity.location,
      activity_venue: activity.venue || 'Not specified',
      activity_project: activity.project,
      activity_sector: activity.sector || 'Not specified',
      activity_participants: activity.participants?.toString() || 'Not specified',
      activity_facilitator: activity.facilitator || 'Not specified',
      activity_partner: activity.partnerInstitution || 'Not specified',
      activity_created_by: activity.createdBy || 'System',
      activity_description: activity.description || 'No description provided',
      message_html: formatActivityEmailHTML(activity),
      message_text: formatActivityEmailText(activity),
    };
    
    // Log template params for debugging (without sensitive data)
    console.log('📧 Email Template Parameters:');
    console.log('Recipient (to_email):', recipientEmail);
    console.log('Activity Name:', activity.name);
    console.log('All params keys:', Object.keys(templateParams));
    
    console.log('📧 Sending email via EmailJS...');
    console.log('Service ID:', config.serviceId);
    console.log('Template ID:', config.templateId);
    console.log('To:', recipientEmail);
    console.log('⚠️ If you get "insufficient authentication scopes" error:');
    console.log('   1. Go to EmailJS dashboard → Email Services');
    console.log('   2. Reconnect your Gmail account');
    console.log('   3. Grant ALL permissions when asked');
    console.log('   4. Or use Gmail App Password (see FIX_GMAIL_PERMISSIONS.md)');
    
    const response = await fetch(`https://api.emailjs.com/api/v1.0/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: config.serviceId,
        template_id: config.templateId,
        user_id: config.publicKey,
        template_params: templateParams,
      }),
    });
    
    // Handle response - EmailJS can return text or JSON
    let responseText: string;
    try {
      responseText = await response.text();
    } catch (textError) {
      console.error('Error reading response:', textError);
      return { success: false, error: 'Failed to read response from EmailJS' };
    }
    
    console.log('EmailJS Response Status:', response.status);
    console.log('EmailJS Response:', responseText);
    
    if (response.ok) {
      // EmailJS returns "OK" as plain text on success
      if (responseText.trim() === 'OK' || responseText.includes('OK')) {
        console.log('✅ Email sent successfully');
        return { success: true, message: 'Email sent successfully' };
      }
      
      // Try to parse as JSON if it's not "OK"
      try {
        const data = JSON.parse(responseText);
        if (data.status === 'success' || data.text === 'OK' || responseText.includes('OK')) {
          console.log('✅ Email sent successfully (JSON response)');
          return { success: true, message: 'Email sent successfully' };
        }
        const errorMsg = data.text || data.message || 'Failed to send email';
        console.error('❌ EmailJS error:', errorMsg);
        return { success: false, error: errorMsg };
      } catch (parseError) {
        // If response is OK but not JSON, assume success
        console.log('✅ Email sent successfully (non-JSON response)');
        return { success: true, message: 'Email sent successfully' };
      }
    } else {
      // Error response
      console.error('❌ EmailJS HTTP Error:', response.status);
      console.error('Response:', responseText);
      
      // Try to parse error as JSON
      try {
        const errorData = JSON.parse(responseText);
        const errorMsg = errorData.text || errorData.message || errorData.error || `HTTP ${response.status}: Failed to send email`;
        return { success: false, error: errorMsg };
      } catch (parseError) {
        // If not JSON, return the text response
        const errorMsg = responseText || `HTTP ${response.status}: Failed to send email`;
        return { success: false, error: errorMsg };
      }
    }
  } catch (error) {
    console.error('❌ Exception sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
