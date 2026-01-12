# Suggested GitHub Commit Message

## Title
```
feat: Add email verification, redesign registration form, and enhance activity form
```

## Description
```
Major updates to registration system, activity form improvements, and email verification implementation.

### New Features
- ✨ Email verification with OTP code (6-digit) via EmailJS
- ✨ Two-step registration process (form → verification → account creation)
- ✨ Multiple project/program selection in activity form
- ✨ Separated province and city fields in location information
- ✨ Activity name format: [Part 1] FOR [Part 2]

### Registration Form Redesign
- 🔄 Simplified registration: Username, DICT Email, Password, Confirm Password
- ❌ Removed: ID NUMBER and Full Name fields
- 🔐 Login now uses username instead of ID number
- 🗑️ Removed demo credentials display

### Activity Form Improvements
- 📍 Location: Separated province and city fields with dynamic filtering
- 📍 Added "Davao City" as standalone province (hides city field)
- 📍 Updated city lists for Davao Occidental and Davao Del Sur
- 📍 Added "Other" option to all city dropdowns
- 📋 Projects: Multiple selection with checkbox grid
- 📝 Activity Name: Two-part input with "FOR" separator

### Technical Changes
- ➕ New: verificationEmailService.ts for OTP emails
- ➕ New: VERIFICATION_EMAIL_TEMPLATE_SETUP.md guide
- 🔧 Updated: AuthContext.tsx for username-based auth
- 🔧 Updated: LoginPage.tsx for verification flow
- 🔧 Updated: ActivityForm.tsx for new fields and layouts

### Bug Fixes
- 🐛 Fixed calendar not updating in real-time
- 🐛 Fixed white screen error on registration form
- 🐛 Fixed city dropdown not updating when province changes

### Configuration
- EmailJS verification template: template_4qq3q9o
- Optional: VITE_EMAILJS_VERIFICATION_TEMPLATE_ID in .env

Breaking Changes: Registration now requires email verification.
```

## Alternative Short Version
```
feat: Email verification, simplified registration, and activity form enhancements

- Add email verification with OTP code
- Simplify registration: remove ID NUMBER, add username
- Separate province/city fields with dynamic filtering
- Multiple project selection support
- Activity name format: [Part 1] FOR [Part 2]
- Updated city lists for Davao regions
```
