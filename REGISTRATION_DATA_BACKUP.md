# Registration Data Backup & Recovery System

## Overview
A backup and recovery system has been implemented to prevent data loss when registration encounters database errors.

## What Changed

### 1. Enhanced Registration Error Handling
- Added detailed error logging to identify the exact cause of registration failures
- Implemented automatic backup of registration data to JSON files when database insertion fails
- Backup files are stored in `backend/registration_backup/` directory with timestamp-based naming

### 2. Backup Data Structure
When a registration fails, the following data is backed up:
```
{
  "username": "user's username",
  "email": "user@dict.gov.ph",
  "firstName": "First Name",
  "middleName": "Middle Name (optional)",
  "lastName": "Last Name",
  "project": "Project Name",
  "backedUp_at": "ISO timestamp",
  "status": "pending_database_entry"
}
```

**Note:** Passwords are NOT saved in backups for security reasons.

### 3. New Recovery Endpoints

#### Check Backup Status
```
GET /api/users/backup-status
```
Returns the number of pending backups and their details.

**Response:**
```json
{
  "pendingBackups": 2,
  "backupDirectory": "/path/to/backend/registration_backup",
  "files": [
    {
      "name": "registration_2026-01-30T10-30-45-123Z_username.json",
      "createdAt": "2026-01-30T10:30:45.123Z"
    }
  ]
}
```

#### Recover Backups
```
POST /api/users/recover-backups
```
Processes all backed-up registrations and attempts to insert them into the database.

**Response:**
```json
{
  "message": "Recovery process completed",
  "recovered": 2,
  "failed": 0,
  "results": [
    {
      "username": "successful_user",
      "status": "recovered"
    }
  ]
}
```

**Important:** Users recovered from backups will receive a temporary password that they should change on first login.

### 4. User Experience Improvements
- When registration fails, users now see a more informative error message
- If data was successfully backed up, users are told: "Registration data has been saved. Please try again later."
- Reduced user frustration from silent failures

## How to Use

### For Users
1. If you receive an error during registration, your data has been automatically saved
2. Try registering again once the system is back online
3. If the error persists, contact your administrator

### For Administrators

#### Check if there are pending registrations:
```bash
# Check backup status
curl http://localhost:3001/api/users/backup-status
```

#### Process pending registrations:
```bash
# Once database is fixed, recover all backed-up registrations
curl -X POST http://localhost:3001/api/users/recover-backups
```

#### Manually Process a Backup
Backup files are stored as JSON in `backend/registration_backup/` directory. You can:
1. Open the JSON file
2. Manually create the user account with the data (using a temp password)
3. Move the file to `backend/registration_backup/processed/`

## Troubleshooting

### Registration still failing after database fix
1. Check for pending backups: `GET /api/users/backup-status`
2. Process them: `POST /api/users/recover-backups`
3. Check the detailed error logs in the backend console

### Backup directory not created
The directory is created automatically when the first backup is needed. If issues persist:
```bash
mkdir -p backend/registration_backup
```

### Need to see detailed errors
Set `NODE_ENV=development` to see detailed error messages in responses:
```bash
NODE_ENV=development npm start
```

## Security Notes
- Passwords are never saved in backups
- Recovered users get temporary passwords
- Backup files are automatically moved to `processed/` folder after successful recovery
- Only system administrators should access recovery endpoints

## File Structure
```
DICT-regional-Calendar/
└── backend/
    ├── registration_backup/
    │   ├── registration_2026-01-30T10-30-45-123Z_username.json
    │   └── processed/
    │       └── registration_2026-01-30T09-15-22-456Z_olduser.json
    └── src/
        └── routes/
            └── users.ts (updated with backup logic)
```
