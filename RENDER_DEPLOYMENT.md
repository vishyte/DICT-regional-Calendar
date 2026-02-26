# Render Deployment Guide

## Overview
This document outlines the steps to deploy the DICT Regional Calendar application on Render.

## Architecture
- **Frontend**: React + Vite (static site)
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL (Render managed PostgreSQL)
- **Authentication**: JWT tokens

## Prerequisites
1. GitHub repository with the latest code
2. Render account (render.com)

## Deployment Steps

### 1. Backend Deployment

1. **Create a new Web Service on Render**
   - Connect your GitHub repository
   - Select the `backend` directory
   - Build command: `npm install && npm run build`
   - Start command: `npm start`

2. **Environment Variables**
   Add these in Render dashboard:
   - `DATABASE_URL`: PostgreSQL connection string (from Render's managed PostgreSQL)
   - `JWT_SECRET`: A secure random string for JWT signing
   - `PORT`: 3000
   - `NODE_ENV`: production

3. **Create PostgreSQL Database**
   - In Render dashboard, create a new PostgreSQL instance
   - Copy the connection string to `DATABASE_URL`

### 2. Frontend Deployment

1. **Create a new Static Site on Render**
   - Connect your GitHub repository
   - Select root directory (or configure for frontend)
   - Build command: `npm install && npm run build`
   - Publish directory: `dist`

2. **Environment Variables**
   - `VITE_API_URL`: Your backend URL (e.g., https://your-backend.onrender.com)
   - `VITE_FIREBASE_API_KEY`: Your Firebase API key
   - `VITE_FIREBASE_AUTH_DOMAIN`: Your Firebase auth domain
   - `VITE_FIREBASE_PROJECT_ID`: Your Firebase project ID
   - `VITE_FIREBASE_STORAGE_BUCKET`: Your Firebase storage bucket
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`: Your Firebase sender ID
   - `VITE_FIREBASE_APP_ID`: Your Firebase app ID

### 3. Database Migrations

The backend automatically runs migrations on startup:
- Creates `users` table
- Creates `activities` table
- Creates `assigned_personnel` table
- Creates `documents` table

### 4. Post-Deployment

1. Test user registration
2. Test login
3. Test activity creation
4. Verify data is persisted in PostgreSQL

## Troubleshooting

### Common Issues

1. **500 Error on Activity Creation**
   - Check that migrations ran successfully
   - Verify DATABASE_URL is correct
   - Check Render logs for detailed errors

2. **Login Failing**
   - Ensure JWT_SECRET is set
   - Check database connectivity

3. **Static Assets Not Loading**
   - Verify build completed successfully
   - Check the publish directory setting

## Important Code Changes for PostgreSQL

The following changes were made for PostgreSQL compatibility:

1. **database.ts**: Added `convertPlaceholders()` to convert SQLite `?` to PostgreSQL `$1, $2`
2. **routes/activities.ts**: Added `RETURNING id` to INSERT statements
3. **routes/users.ts**: Added `RETURNING id` to INSERT statements
4. **server.ts**: Added automatic migrations on startup
