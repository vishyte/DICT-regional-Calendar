# Verification Email Template Setup

This guide shows you how to set up the EmailJS template for email verification codes (OTP).

## Template Variables

The verification email service sends these variables to your EmailJS template:

### Required Variables:
- `{{to_email}}` - Recipient email address (where to send)
- `{{verification_code}}` - The 6-digit verification code (most important!)

### Optional Variables:
- `{{to_name}}` - Username or email name (e.g., "john" from "john@dict.gov.ph")
- `{{username}}` - The username the user registered with
- `{{from_name}}` - Sender name (set to "DICT Regional Calendar")
- `{{message}}` - Pre-formatted message text
- `{{subject}}` - Email subject (but you can set your own in EmailJS)

## EmailJS Template Setup

### Step 1: Create a New Template in EmailJS

1. Log in to https://www.emailjs.com
2. Go to "Email Templates"
3. Click "Create New Template"
4. Name it: "Verification Code" or "OTP Verification"

### Step 2: Set the Subject Line

**Subject:**
```
Email Verification Code - DICT Regional Calendar
```

Or you can use:
```
Your Verification Code: {{verification_code}}
```

### Step 3: Configure the "To Email" Field

**IMPORTANT:** In the template settings, set:
- **To Email:** `{{to_email}}`

This tells EmailJS where to send the email.

### Step 4: Add Template Content

Here's a simple template you can use:

**Plain Text Version:**
```
Hello {{to_name}},

Thank you for registering with DICT Regional Calendar.

Your verification code is: {{verification_code}}

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.

---
DICT Regional Calendar System
```

**HTML Version (Better looking):**
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      color: white;
      padding: 20px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .content {
      background: #f9fafb;
      padding: 30px;
      border: 1px solid #e5e7eb;
    }
    .code-box {
      background: white;
      border: 2px solid #3b82f6;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      margin: 20px 0;
    }
    .code {
      font-size: 32px;
      font-weight: bold;
      color: #1e40af;
      letter-spacing: 8px;
      font-family: 'Courier New', monospace;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #6b7280;
      font-size: 12px;
      border-top: 1px solid #e5e7eb;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Email Verification</h1>
  </div>
  
  <div class="content">
    <p>Hello <strong>{{to_name}}</strong>,</p>
    
    <p>Thank you for registering with DICT Regional Calendar.</p>
    
    <p>Please use the verification code below to complete your registration:</p>
    
    <div class="code-box">
      <div class="code">{{verification_code}}</div>
    </div>
    
    <p>This code will expire in 10 minutes.</p>
    
    <p><strong>Username:</strong> {{username}}</p>
    
    <p>If you didn't request this code, please ignore this email.</p>
  </div>
  
  <div class="footer">
    <p>DICT Regional Calendar System</p>
    <p>Department of Information and Communications Technology - Region 11</p>
  </div>
</body>
</html>
```

### Step 5: Save Your Template

1. Click "Save" in EmailJS
2. Copy your **Template ID** (looks like: `template_xxxxxxx`)

### Step 6: Add to .env File (Optional)

If you want to use a separate template for verification codes:

Create or edit `.env` in your project root:
```
VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
VITE_EMAILJS_TEMPLATE_ID=template_xxxxxxx (your existing activity template)
VITE_EMAILJS_VERIFICATION_TEMPLATE_ID=template_yyyyyyy (your new verification template)
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```

**Note:** If you don't set `VITE_EMAILJS_VERIFICATION_TEMPLATE_ID`, it will use the regular `VITE_EMAILJS_TEMPLATE_ID` instead.

### Step 7: Test It!

1. Restart your dev server if you changed `.env`
2. Try registering a new account
3. Check the email for the verification code
4. Enter the code to complete registration

## Quick Template (Minimal)

If you want the simplest possible template:

**Subject:** `Your Verification Code`

**Content:**
```
Your verification code is: {{verification_code}}
```

**To Email:** `{{to_email}}`

That's it! The most important thing is to include `{{verification_code}}` in your template content.

## Troubleshooting

- **Code not in email?** Make sure `{{verification_code}}` is in your template content
- **Email not sending?** Check that `{{to_email}}` is set in the "To Email" field
- **Wrong email?** Verify the email address in the registration form ends with @dict.gov.ph
- **Check console (F12):** The code is also logged to console in development mode
