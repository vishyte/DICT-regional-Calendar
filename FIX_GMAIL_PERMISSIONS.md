# Fix Gmail Authentication Error

## The Problem
Error: "Gmail_API: Request had insufficient authentication scopes"

This means your Gmail service in EmailJS doesn't have permission to send emails on your behalf.

## Solution: Reconnect Gmail Service with Proper Permissions

### Step 1: Go to EmailJS Dashboard
1. Log in to https://www.emailjs.com
2. Go to "Email Services"
3. Find your service: `service_kziqd16`
4. Click on it to edit

### Step 2: Reconnect Gmail Account
1. Click "Reconnect Account" or "Disconnect" then "Connect Account"
2. You'll be redirected to Google to authorize
3. **IMPORTANT:** Make sure you grant ALL requested permissions
4. Look for permissions like:
   - "Send email on your behalf"
   - "Manage your email"
   - "Access your Gmail account"

### Step 3: Use App Password (Alternative Method)
If reconnecting doesn't work, use Gmail App Password:

1. **Enable 2-Step Verification** (if not already enabled):
   - Go to https://myaccount.google.com/security
   - Enable "2-Step Verification"

2. **Generate App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter name: "EmailJS"
   - Click "Generate"
   - Copy the 16-character password

3. **Update EmailJS Service**:
   - In EmailJS, go to your Gmail service
   - Instead of "Connect Account", choose "Custom SMTP" or "Gmail (App Password)"
   - Use these settings:
     - **SMTP Server:** smtp.gmail.com
     - **SMTP Port:** 587 (or 465 for SSL)
     - **Username:** Your Gmail address (vishy.te@dict.gov.ph or your Gmail)
     - **Password:** The 16-character app password you generated
     - **Security:** TLS (for port 587) or SSL (for port 465)

### Step 4: Test the Connection
1. Save the service settings
2. Test by creating a new activity
3. Check if email is received

## Alternative: Use a Different Email Service

If Gmail continues to have issues, you can use:

### Option 1: Outlook/Office 365
1. In EmailJS, add new service
2. Choose "Outlook"
3. Connect your Outlook/Office 365 account
4. Update your template ID if needed

### Option 2: Custom SMTP
1. Use your organization's SMTP server
2. Get SMTP credentials from IT
3. Configure in EmailJS as "Custom SMTP"

## Quick Checklist

✅ Gmail service is connected in EmailJS  
✅ All permissions granted during Google authorization  
✅ Service is active (not paused)  
✅ Template uses `{{to_email}}` for recipient  
✅ Test email works from EmailJS dashboard  

## Still Having Issues?

1. **Check EmailJS Dashboard:**
   - Go to "Email Services"
   - Make sure service shows "Connected" or "Active"
   - Check for any error messages

2. **Try Test Email:**
   - In EmailJS dashboard, go to "Email Templates"
   - Click "Test" on your template
   - See if test email works

3. **Check Gmail Settings:**
   - Make sure "Less secure app access" is enabled (if using older method)
   - Or use App Password (recommended)

4. **Contact Support:**
   - EmailJS support: support@emailjs.com
   - Or check EmailJS documentation
