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

## Render Deployment

### Option 1: Using Render Blueprint (Recommended)

1. Push your code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click "New" and select "Blueprint"
4. Select your GitHub repository
5. The `render.yaml` file will be auto-detected
6. Fill in the required environment variables:
   - `DATABASE_URL`: PostgreSQL connection string (auto-provisioned by Render)
   - `JWT_SECRET`: Generate a secure random string
   - `FRONTEND_URL`: Your frontend URL on Render
   - `SUPERADMIN_USERNAME`: Set a secure username
   - `SUPERADMIN_PASSWORD`: Set a secure password
7. Click "Apply"

### Option 2: Manual Deployment

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
4. Add environment variables:
   - `DATABASE_URL`: PostgreSQL connection string
   - `JWT_SECRET`: Your secure JWT secret
   - `FRONTEND_URL`: Frontend URL
   - `SUPERADMIN_USERNAME`: Superadmin username
   - `SUPERADMIN_PASSWORD`: Superadmin password
5. Create a PostgreSQL database in Render and attach it to your service
6. Click "Create Web Service"

### Database Setup on Render

After deployment, run migrations using Render's bash console or SSH:
```
npm run db:migrate
```

### Local Development with PostgreSQL (Optional)

To test with PostgreSQL locally:
```
export DATABASE_URL=postgres://username:password@localhost:5432/yourdb
npm run db:migrate
npm run dev
```

To use SQLite locally (default):
```
# Unset or remove DATABASE_URL from .env
npm run db:migrate
npm run dev
```
