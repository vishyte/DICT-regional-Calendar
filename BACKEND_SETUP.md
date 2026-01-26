# DICT Regional Calendar - Backend Setup

This guide explains how to set up the backend for the DICT Regional Calendar application.

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

## Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up PostgreSQL database:**
   - Create a new PostgreSQL database
   - Update the `DATABASE_URL` in `.env` with your database connection string
   - Example: `postgresql://username:password@localhost:5432/dict_calendar`

4. **Run database migrations:**
   ```bash
   npm run db:migrate
   ```

5. **Seed the database with initial data:**
   ```bash
   npm run db:seed
   ```

6. **Start the backend server:**
   ```bash
   npm run dev
   ```

The backend will run on `http://localhost:3001`.

## Frontend Setup

1. **Install axios in the frontend:**
   ```bash
   npm install
   ```

2. **Update environment variables:**
   - The `.env` file should include: `VITE_API_URL=http://localhost:3001/api`

3. **Start the frontend:**
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login
- `GET /api/users/profile` - Get user profile

### Activities
- `GET /api/activities` - Get all activities
- `POST /api/activities` - Create new activity
- `PUT /api/activities/:id` - Update activity
- `DELETE /api/activities/:id` - Delete activity

## Database Schema

The backend uses PostgreSQL with the following main tables:
- `users` - User accounts
- `activities` - Calendar activities
- `assigned_personnel` - Personnel assignments
- `documents` - Activity documents

## Deployment to NAS

1. **Build the backend:**
   ```bash
   npm run build
   ```

2. **Set up PostgreSQL on your NAS** (if not already available)

3. **Deploy the built application** to your NAS using Docker or the NAS's application manager

4. **Update frontend environment** to point to your NAS backend URL

## Features

- JWT-based authentication
- CRUD operations for activities
- User registration and login
- Data synchronization across devices
- Secure API with rate limiting