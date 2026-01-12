# Email Notification Setup Guide

This guide will help you set up email notifications for activity creation using EmailJS (FREE email service).

## Quick Setup (5 minutes)

### Step 1: Sign Up for EmailJS (FREE)
1. Go to https://www.emailjs.com
2. Sign up for a free account (no credit card required)
3. Free plan includes: 200 emails/month

### Step 2: Create an Email Service
1. After signing up, go to "Email Services" in the dashboard
2. Click "Add New Service"
3. Choose your email provider:
   - **Gmail** (recommended for @dict.gov.ph emails)
   - **Outlook** (if using Outlook/Office 365)
   - **Custom SMTP** (for other providers)
4. Follow the setup instructions for your provider
5. Note your **Service ID** (e.g., `service_xxxxxxx`)

### Step 3: Create an Email Template
1. Go to "Email Templates" in the dashboard
2. Click "Create New Template"
3. Use this template:

**Template Name:** Activity Notification

**Subject:** New Activity Created: {{activity_name}}

**Content (HTML):**
```html
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
        <h3 style="margin-top: 0; color: #1e40af;">{{activity_name}}</h3>
        
        <div class="detail-row">
          <span class="detail-label">Date:</span>
          <span class="detail-value">{{activity_date}}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Time:</span>
          <span class="detail-value">{{activity_time}}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Location:</span>
          <span class="detail-value">{{activity_location}}</span>
        </div>
        
        {{#activity_venue}}
        <div class="detail-row">
          <span class="detail-label">Venue:</span>
          <span class="detail-value">{{activity_venue}}</span>
        </div>
        {{/activity_venue}}
        
        <div class="detail-row">
          <span class="detail-label">Project:</span>
          <span class="detail-value">{{activity_project}}</span>
        </div>
        
        {{#activity_sector}}
        <div class="detail-row">
          <span class="detail-label">Target Sector:</span>
          <span class="detail-value">{{activity_sector}}</span>
        </div>
        {{/activity_sector}}
        
        {{#activity_participants}}
        <div class="detail-row">
          <span class="detail-label">Expected Participants:</span>
          <span class="detail-value">{{activity_participants}}</span>
        </div>
        {{/activity_participants}}
        
        {{#activity_facilitator}}
        <div class="detail-row">
          <span class="detail-label">Facilitator:</span>
          <span class="detail-value">{{activity_facilitator}}</span>
        </div>
        {{/activity_facilitator}}
        
        {{#activity_created_by}}
        <div class="detail-row">
          <span class="detail-label">Created by:</span>
          <span class="detail-value">{{activity_created_by}}</span>
        </div>
        {{/activity_created_by}}
        
        {{#activity_description}}
        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
          <span class="detail-label" style="display: block; margin-bottom: 8px;">Description:</span>
          <span class="detail-value" style="display: block; white-space: pre-wrap;">{{activity_description}}</span>
        </div>
        {{/activity_description}}
      </div>
    </div>
    <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
      <p>This is an automated notification from DICT Regional Calendar System.</p>
      <p>Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
```

4. Save the template and note your **Template ID** (e.g., `template_xxxxxxx`)

### Step 4: Get Your Public Key
1. Go to "Account" → "General" in EmailJS dashboard
2. Copy your **Public Key** (also called User ID)

### Step 5: Configure Your App
1. Create a `.env` file in your project root (if it doesn't exist)
2. Add these lines:
   ```
   VITE_EMAILJS_SERVICE_ID=your_service_id_here
   VITE_EMAILJS_TEMPLATE_ID=your_template_id_here
   VITE_EMAILJS_PUBLIC_KEY=your_public_key_here
   ```
3. Replace with your actual EmailJS credentials

### Step 6: Restart Your App
Restart your development server (`npm run dev`)

### Step 7: Test
1. Create a new activity in your calendar
2. You should receive an email at vishy.te@dict.gov.ph!

## EmailJS Free Plan Limits

- **200 emails per month** (FREE)
- **No credit card required**
- **Works from frontend** (no backend needed)

## Troubleshooting

- **"Email not sent" error**: 
  - Check that EmailJS credentials are correct in `.env`
  - Verify your email service is connected in EmailJS dashboard
  - Check browser console (F12) for detailed error messages

- **"Service not configured"**: 
  - Make sure `.env` file exists with all three EmailJS variables
  - Restart your dev server after adding `.env` variables

- **No email received**: 
  - Check spam/junk folder
  - Verify email address is correct: vishy.te@dict.gov.ph
  - Check EmailJS dashboard for delivery status

## Alternative: Using Gmail SMTP

If you prefer to use Gmail directly:

1. Enable "Less secure app access" or use "App Password" in Gmail settings
2. In EmailJS, add Gmail service
3. Connect your Gmail account
4. Use the service ID in your `.env` file

## Need Help?

- EmailJS Documentation: https://www.emailjs.com/docs
- Check browser console (F12) for error messages
- Verify all credentials in EmailJS dashboard
