# EmailJS Template Setup - Fix "Receipt is Empty" Error

## The Problem
If you're getting "receipt is empty" error, it means EmailJS doesn't know where to send the email. This happens when the recipient email field is not configured correctly in your EmailJS template.

## Solution: Update Your EmailJS Template

### Step 1: Go to Your EmailJS Template
1. Log in to https://www.emailjs.com
2. Go to "Email Templates"
3. Click on your template (template_2q9zw3j)

### Step 2: Configure the Recipient Field

**IMPORTANT:** You need to set the "To Email" field in your template.

#### Option A: Use Template Variable (Recommended)
1. In your template, find the "To Email" field
2. Set it to: `{{to_email}}`
3. This will use the `to_email` parameter we're sending

#### Option B: Set Default Recipient in Service
1. Go to "Email Services"
2. Click on your service (service_kziqd16)
3. In the service settings, you can set a default "To Email"
4. Or configure it to use template variables

### Step 3: Update Your Template Content

Make sure your template has these variables (they're already being sent):

**Required Variables:**
- `{{to_email}}` - Recipient email (vishy.te@dict.gov.ph)
- `{{to_name}}` - Recipient name
- `{{activity_name}}` - Activity name
- `{{activity_date}}` - Activity date
- `{{activity_time}}` - Activity time
- `{{activity_location}}` - Activity location

**Optional Variables:**
- `{{activity_venue}}` - Venue
- `{{activity_project}}` - Project name
- `{{activity_sector}}` - Target sector
- `{{activity_participants}}` - Expected participants
- `{{activity_facilitator}}` - Facilitator
- `{{activity_partner}}` - Partner institution
- `{{activity_created_by}}` - Creator name
- `{{activity_description}}` - Description

### Step 4: Example Template

**Subject:**
```
New Activity Created: {{activity_name}}
```

**Content:**
```
📅 New Activity Created

Hello {{to_name}},

A new activity has been created in the DICT Regional Calendar.

Activity Details:
- Name: {{activity_name}}
- Date: {{activity_date}}
- Time: {{activity_time}}
- Location: {{activity_location}}
- Venue: {{activity_venue}}
- Project: {{activity_project}}
- Target Sector: {{activity_sector}}
- Expected Participants: {{activity_participants}}
- Facilitator: {{activity_facilitator}}
- Created by: {{activity_created_by}}

Description:
{{activity_description}}

---
This is an automated notification from DICT Regional Calendar System.
```

### Step 5: Save and Test
1. Save your template
2. Test by creating a new activity
3. Check that the email is received

## Quick Fix Checklist

✅ Template has `{{to_email}}` in the "To Email" field  
✅ All template variables match the names above  
✅ Email service is connected and active  
✅ Template is saved  
✅ .env file has correct credentials  

## Still Having Issues?

1. Check browser console (F12) for detailed logs
2. Verify the "To Email" field in your EmailJS template
3. Make sure your email service (Gmail) is connected
4. Check EmailJS dashboard for any error messages
