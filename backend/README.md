# DICT Regional Calendar Backend

Node.js/Express backend for the DICT Regional Calendar application, handling user registration and calendar activity management.

## Features

- User registration and authentication with JWT
- CRUD operations for calendar activities
- PostgreSQL database integration
- RESTful API endpoints
- Rate limiting and security middleware

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up PostgreSQL database and update `.env` file with your database URL.

3. Run database migrations:
   ```bash
   npm run db:migrate
   ```

4. Seed the database with initial data:
   ```bash
   npm run db:seed
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login user
- `GET /api/users/profile` - Get current user profile

### Activities
- `GET /api/activities` - Get all activities
- `POST /api/activities` - Create new activity
- `PUT /api/activities/:id` - Update activity
- `DELETE /api/activities/:id` - Delete activity

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `PORT` - Server port (default: 3001)
- `FRONTEND_URL` - Frontend URL for CORS

## Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Start production server:
   ```bash
   npm start
   ```

For NAS deployment, consider using Docker or the NAS's package manager to run Node.js applications.