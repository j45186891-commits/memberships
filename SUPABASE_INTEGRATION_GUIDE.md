# Supabase Integration Guide for Membership App

## Overview

This guide provides step-by-step instructions for integrating Supabase into your membership management application, replacing the existing PostgreSQL/Redis setup with Supabase for database and authentication.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Supabase Setup](#supabase-setup)
3. [Database Schema Migration](#database-schema-migration)
4. [Backend Integration](#backend-integration)
5. [Frontend Integration](#frontend-integration)
6. [Authentication Migration](#authentication-migration)
7. [Deployment](#deployment)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js 20.x or higher
- Git repository access
- Supabase account and project
- Your Supabase credentials (provided)

## Supabase Setup

### 1. Access Your Supabase Project

Your Supabase project is already configured:
- **URL**: `https://tdqwgjbkkldvioxzator.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkcXdnamJra2xkdmlveHphdG9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNDgwOTIsImV4cCI6MjA3NTYyNDA5Mn0.R9-OWeBeRwYSduQ7n8tLaqEfsCtE6Hdarq3hZBjBbKQ`
- **Service Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkcXdnamJra2xkdmlveHphdG9yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDA0ODA5MiwiZXhwIjoyMDc1NjI0MDkyfQ.CETODpNxEJ1tRouJ0RGm5k9D1vgThlywHmddbSa8_-c`

### 2. Apply Database Schema

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **SQL Editor**
4. Copy and paste the contents of `supabase/schema.sql`
5. Run the SQL commands to create all tables and RLS policies

### 3. Seed Initial Data

After creating the schema, run the seed script:
```sql
-- Copy and paste the contents of supabase/seed.sql
-- This will create sample data for testing
```

## Database Schema Migration

### 1. Install Dependencies

```bash
cd memberships
npm install @supabase/supabase-js
cd backend
npm install @supabase/supabase-js
```

### 2. Set Up Environment Variables

Create `.env` file in backend directory:
```env
# Supabase Configuration
SUPABASE_URL=https://tdqwgjbkkldvioxzator.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkcXdnamJra2xkdmlveHphdG9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNDgwOTIsImV4cCI6MjA3NTYyNDA5Mn0.R9-OWeBeRwYSduQ7n8tLaqEfsCtE6Hdarq3hZBjBbKQ
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkcXdnamJra2xkdmlveHphdG9yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDA0ODA5MiwiZXhwIjoyMDc1NjI0MDkyfQ.CETODpNxEJ1tRouJ0RGm5k9D1vgThlywHmddbSa8_-c
```

### 3. Migrate Existing Data (Optional)

If you have existing data in your local PostgreSQL database:

```bash
cd supabase
node migrate-to-supabase.js
```

## Backend Integration

### 1. Authentication Middleware

The new authentication middleware (`middleware/supabaseAuth.js`) provides:
- JWT token validation through Supabase
- Role-based authorization
- Organization-based access control
- Admin and super admin authorization

### 2. Updated Routes

New Supabase-compatible routes have been created:
- `routes/auth-supabase.js` - Authentication endpoints
- `routes/events-supabase.js` - Events CRUD operations

### 3. Supabase Client Wrapper

The `utils/supabaseClient.js` provides a comprehensive wrapper for:
- User management
- Organization management
- CRUD operations for all entities
- Authentication methods

## Frontend Integration

### 1. Install Supabase Client

```bash
cd frontend
npm install @supabase/supabase-js @supabase/auth-helpers-react
```

### 2. Configure Supabase Client

Create `src/utils/supabase.js`:
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 3. Update Authentication Context

Replace your existing auth context with Supabase authentication:
```javascript
import { supabase } from '../utils/supabase'

// Use supabase.auth for authentication
const { data: { user } } = await supabase.auth.getUser()
```

## Authentication Migration

### 1. New Authentication Endpoints

The new auth system provides these endpoints:
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/refresh` - Refresh token

### 2. Token Management

Tokens are now managed by Supabase:
- Access tokens expire after 1 hour
- Refresh tokens are used to get new access tokens
- All tokens are validated against Supabase

### 3. User Roles

The system supports these roles:
- `member` - Basic member access
- `admin` - Administrative access
- `superadmin` - Full system access

## Deployment

### 1. Run the Deployment Script

```bash
chmod +x deploy-supabase.sh
./deploy-supabase.sh
```

### 2. Manual Deployment Steps

If you prefer manual deployment:

1. **Install Dependencies**:
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

2. **Build Frontend**:
```bash
cd frontend
npm run build
```

3. **Configure Environment**:
Create `.env` file with Supabase credentials

4. **Start Application**:
```bash
pm2 start server.js --name membership-app
```

### 3. Nginx Configuration

The deployment script configures Nginx to:
- Serve static frontend files
- Proxy API requests to Node.js
- Handle WebSocket connections for real-time features
- Proxy Supabase storage requests

## Testing

### 1. Test Authentication

```bash
# Test registration
curl -X POST http://localhost/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","firstName":"Test","lastName":"User"}'

# Test login
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 2. Test CRUD Operations

```bash
# Get events (requires authentication)
curl -X GET http://localhost/api/events \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Create event (requires admin role)
curl -X POST http://localhost/api/events \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Event","description":"Test description","start_date":"2024-01-01T10:00:00Z","end_date":"2024-01-01T12:00:00Z"}'
```

### 3. Test Real-time Features

Supabase provides real-time capabilities. Test with:
- Live event updates
- Real-time notifications
- Live forum discussions

## Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   - Verify Supabase URL and keys
   - Check network connectivity
   - Ensure RLS policies are properly configured

2. **Authentication Failures**:
   - Verify JWT token format
   - Check token expiration
   - Ensure user exists in both auth and users table

3. **Permission Errors**:
   - Verify RLS policies
   - Check user roles and organization membership
   - Ensure proper middleware is applied

### Debug Commands

```bash
# Check PM2 logs
pm2 logs membership-app

# Test Supabase connection
node -e "const {createClient} = require('@supabase/supabase-js'); const sb = createClient('YOUR_URL', 'YOUR_KEY'); sb.from('users').select().then(console.log).catch(console.error);"

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Performance Optimization

1. **Database Indexes**: Ensure all necessary indexes are created
2. **Query Optimization**: Use selective queries with proper filters
3. **Caching**: Implement Redis caching for frequently accessed data
4. **CDN**: Use Supabase CDN for file storage

## Security Considerations

1. **Row Level Security (RLS)**: All tables have RLS policies enabled
2. **JWT Validation**: All requests are validated through Supabase
3. **Role-based Access**: Proper authorization checks are implemented
4. **Data Encryption**: Sensitive data is encrypted in transit and at rest

## Next Steps

1. **SSL Configuration**: Set up SSL certificates for production
2. **Monitoring**: Implement application monitoring and alerting
3. **Backup Strategy**: Set up automated database backups
4. **Scaling**: Configure auto-scaling for high availability
5. **CDN**: Set up content delivery network for global access

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Supabase documentation
3. Check application logs
4. Verify environment configuration

## Files Created

- `config/supabase.js` - Supabase configuration
- `middleware/supabaseAuth.js` - Authentication middleware
- `routes/auth-supabase.js` - Authentication routes
- `routes/events-supabase.js` - Events CRUD routes
- `utils/supabaseClient.js` - Supabase client wrapper
- `supabase/schema.sql` - Database schema
- `supabase/seed.sql` - Sample data
- `supabase/migrate-to-supabase.js` - Migration script
- `deploy-supabase.sh` - Deployment script
- `SUPABASE_INTEGRATION_GUIDE.md` - This guide

This integration provides a robust, scalable foundation for your membership management system with modern authentication and real-time capabilities.