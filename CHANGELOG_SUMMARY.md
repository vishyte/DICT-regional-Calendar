# Changelog Summary - Registration & Activity Form Updates

## Overview
Major updates to registration system, activity form improvements, and email verification implementation.

## Features Added

### 1. Email Verification System (New)
- **Two-step registration process** with email verification
- Users receive 6-digit OTP code via email before account creation
- Verification code generation and EmailJS integration
- Template ID: `template_4qq3q9o` for OTP emails
- Added `verificationEmailService.ts` utility for sending verification codes
- Session storage for secure code validation
- Resend code functionality

### 2. Registration Form Redesign
- **Removed fields:** ID NUMBER, Full Name
- **New fields:** Username (required)
- **Simplified registration:** Username, DICT Email, Password, Confirm Password only
- Login now uses username instead of ID number
- Updated `AuthContext.tsx` to use username-based authentication
- Removed demo credentials display from login page

### 3. Activity Form Enhancements

#### Location Information
- **Separated Province and City fields** (previously combined)
- Added "Davao City" as standalone province option
- City field automatically hides when "Davao City" is selected
- **Dynamic city filtering** - cities update based on selected province
- Added "Other" option to all city dropdowns
- Updated city lists:
  - Davao Occidental: Don Marcelino, Jose Abad Santos, Malita, Santa Maria, Sarangani
  - Davao Del Sur: Digos City, Davao City (removed), Bansalan, Hagonoy, Kiblawan, Magsaysay, Malalag, Matanao, Padada, Santa Cruz, Sulop

#### Project/Program
- **Multiple selection support** - Users can select multiple projects/programs
- Changed from dropdown to checkbox grid layout
- Projects are joined with commas when saved (e.g., "IIDB, Free Wi-Fi for All, Cybersecurity")

#### Activity Name
- **Two-part input with "FOR" separator**
- Format: `[Part 1] FOR [Part 2]`
- Example: "Cybersecurity Awareness" FOR "Rebel Returnees"
- Both parts are required
- Visual "FOR" badge between input fields

## Technical Changes

### New Files
- `components/utils/verificationEmailService.ts` - Email verification service
- `VERIFICATION_EMAIL_TEMPLATE_SETUP.md` - Setup guide for EmailJS verification template
- `CHANGELOG_SUMMARY.md` - This file

### Modified Files
- `components/LoginPage.tsx` - Registration form redesign, email verification flow, removed demo credentials
- `components/AuthContext.tsx` - Username-based authentication, removed ID number requirement
- `components/ActivityForm.tsx` - Location fields, project multi-select, activity name format
- `components/utils/emailService.ts` - (No changes, but referenced)

### Configuration
- EmailJS verification template ID: `template_4qq3q9o`
- Optional: Add `VITE_EMAILJS_VERIFICATION_TEMPLATE_ID` to `.env` for custom template

## Breaking Changes
⚠️ **Note:** Registration now requires email verification. Users must verify their email with OTP code before account creation.

## Migration Notes
- Existing users can still log in with their username (if previously using ID numbers as usernames)
- New registrations require email verification
- Activity location format changed from single field to "Province, City" format
- Activity projects now support multiple values (comma-separated)

## Bug Fixes
- Fixed calendar not updating in real-time (was showing October 2025 instead of current month)
- Fixed white screen error on registration form (missing verification functions)
- Fixed city dropdown not updating when province changes

## UI/UX Improvements
- Cleaner registration form (fewer fields)
- Better visual separation in activity form sections
- Improved form validation and error messages
- More intuitive location selection with province/city separation
- Clear format instructions for activity name field

---

**Date:** January 2026
**Version:** v1.1.0
