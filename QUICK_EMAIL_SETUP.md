# Quick Email Setup - Get Emails Working in 5 Minutes

## Why you're not receiving emails
EmailJS is not configured yet. The system is currently only logging email details to the console instead of sending them.

## Quick Setup (5 minutes)

### Step 1: Sign Up for EmailJS (FREE)
1. Go to: https://www.emailjs.com
2. Click "Sign Up" (free, no credit card required)
3. Free plan: 200 emails/month

### Step 2: Create Email Service
1. After signing up, go to "Email Services" in dashboard
2. Click "Add New Service"
3. Choose **Gmail** (works with @dict.gov.ph emails)
4. Click "Connect Account" and sign in with your Gmail
5. Copy your **Service ID** (looks like: `service_xxxxxxx`)

### Step 3: Create Email Template
1. Go to "Email Templates" in dashboard
2. Click "Create New Template"
3. Use this template:

**Template Name:** Activity Notification

**Subject:** `New Activity Created: {{activity_name}}`

**Content:**
```
📅 New Activity Created

Activity: {{activity_name}}
Date: {{activity_date}}
Time: {{activity_time}}
Location: {{activity_location}}
Venue: {{activity_venue}}
Project: {{activity_project}}
Target Sector: {{activity_sector}}
Expected Participants: {{activity_participants}}
Facilitator: {{activity_facilitator}}
Partner Institution: {{activity_partner}}
Created by: {{activity_created_by}}

Description:
{{activity_description}}

---
This is an automated notification from DICT Regional Calendar System.
```

4. Save and copy your **Template ID** (looks like: `template_xxxxxxx`)

### Step 4: Get Your Public Key
1. Go to "Account" → "General"
2. Copy your **Public Key** (also called User ID)

### Step 5: Create .env File
1. In your project root (`DICT-regional-Calendar` folder), create a file named `.env`
2. Add these lines (replace with your actual values):

```
VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
VITE_EMAILJS_TEMPLATE_ID=template_xxxxxxx
VITE_EMAILJS_PUBLIC_KEY=your_public_key_here
```

**Example:**
```
VITE_EMAILJS_SERVICE_ID=service_abc123
VITE_EMAILJS_TEMPLATE_ID=template_xyz789
VITE_EMAILJS_PUBLIC_KEY=abcdefghijklmnop
```

### Step 6: Restart Your Dev Server
1. Stop your current dev server (Ctrl+C)
2. Run `npm run dev` again
3. This loads the new `.env` variables

### Step 7: Test
1. Create a new activity
2. You should receive an email at vishy.te@dict.gov.ph! 📧

## Troubleshooting

**Still not receiving emails?**
- Check browser console (F12) for error messages
- Verify all three values in `.env` are correct
- Make sure you restarted the dev server after creating `.env`
- Check spam/junk folder
- Verify email address: vishy.te@dict.gov.ph

**"Email not configured" message?**
- Make sure `.env` file exists in project root
- Check that variable names start with `VITE_`
- Restart dev server after creating/editing `.env`

**Need help?**
- EmailJS Docs: https://www.emailjs.com/docs
- Check console (F12) for detailed errors
