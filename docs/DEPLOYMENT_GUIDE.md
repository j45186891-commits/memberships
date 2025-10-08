# Membership Management System - Deployment Guide

## Table of Contents
1. [System Requirements](#system-requirements)
2. [Quick Deployment](#quick-deployment)
3. [Manual Deployment](#manual-deployment)
4. [Configuration](#configuration)
5. [SSL Setup](#ssl-setup)
6. [Troubleshooting](#troubleshooting)

## System Requirements

### Minimum Requirements
- **OS**: Ubuntu 20.04+ or Debian 11+
- **RAM**: 2GB minimum, 4GB recommended
- **Storage**: 20GB minimum
- **CPU**: 2 cores minimum
- **Network**: Public IP address and domain name

### Software Requirements
- Node.js 20.x
- PostgreSQL 12+
- Nginx
- Certbot (for SSL)
- PM2 (process manager)

## Quick Deployment

### Using the Automated Script

1. **Prepare Your Server**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install git
   sudo apt install -y git
   ```

2. **Clone the Repository**
   ```bash
   git clone <your-repository-url>
   cd membership-app
   ```

3. **Run Deployment Script**
   ```bash
   cd deployment
   sudo chmod +x deploy.sh
   sudo ./deploy.sh
   ```

4. **Follow the Prompts**
   - Enter your domain name (e.g., membership.example.com)
   - Enter admin email for SSL certificates
   - Enter database password
   - Optionally provide JWT secret (or let it auto-generate)

5. **Save Credentials**
   The script will output:
   - Admin login URL
   - Admin email
   - Admin password
   
   **IMPORTANT**: Save these credentials securely!

## Manual Deployment

### Step 1: Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Install PM2
sudo npm install -g pm2
```

### Step 2: Setup PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE USER membership_user WITH PASSWORD 'your_secure_password';
CREATE DATABASE membership_db OWNER membership_user;
GRANT ALL PRIVILEGES ON DATABASE membership_db TO membership_user;
\q
```

### Step 3: Setup Application

```bash
# Create application directory
sudo mkdir -p /opt/membership-app
cd /opt/membership-app

# Copy application files
# (Assuming you've cloned the repo)
sudo cp -r /path/to/membership-app/* .

# Create application user
sudo useradd -m -s /bin/bash membership
sudo chown -R membership:membership /opt/membership-app
```

### Step 4: Configure Backend

```bash
cd /opt/membership-app/backend

# Copy environment file
cp .env.example .env

# Edit configuration
sudo nano .env
```

Update the following values:
```env
NODE_ENV=production
PORT=5000
API_URL=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com

DB_HOST=localhost
DB_PORT=5432
DB_NAME=membership_db
DB_USER=membership_user
DB_PASSWORD=your_secure_password

JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=7d

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
EMAIL_FROM=noreply@yourdomain.com

ORG_NAME=Your Organization
ORG_EMAIL=info@yourdomain.com
ORG_DOMAIN=yourdomain.com
```

### Step 5: Install Dependencies and Initialize Database

```bash
# Install backend dependencies
cd /opt/membership-app/backend
sudo -u membership npm install --production

# Initialize database
PGPASSWORD=your_password psql -h localhost -U membership_user -d membership_db -f ../database/schema.sql

# Create initial admin user
PGPASSWORD=your_password psql -h localhost -U membership_user -d membership_db << EOF
-- Create organization
INSERT INTO organizations (name, slug, email, settings)
VALUES ('Your Organization', 'default', 'info@yourdomain.com', '{}');

-- Create admin user (password: admin123 - CHANGE THIS!)
INSERT INTO users (organization_id, email, password_hash, first_name, last_name, role, status, email_verified)
SELECT id, 'admin@yourdomain.com', '\$2a\$12\$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIeWYgmmK6', 'Admin', 'User', 'super_admin', 'active', true
FROM organizations WHERE slug = 'default';

-- Create session table
CREATE TABLE IF NOT EXISTS session (
  sid varchar NOT NULL COLLATE "default",
  sess json NOT NULL,
  expire timestamp(6) NOT NULL,
  PRIMARY KEY (sid)
);
CREATE INDEX IF NOT EXISTS IDX_session_expire ON session (expire);
EOF
```

### Step 6: Build Frontend

```bash
cd /opt/membership-app/frontend

# Create production environment
cat > .env.production << EOF
REACT_APP_API_URL=https://yourdomain.com/api
REACT_APP_DOMAIN=yourdomain.com
EOF

# Install dependencies and build
sudo -u membership npm install
sudo -u membership npm run build
```

### Step 7: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/membership
```

Add the following configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    client_max_body_size 10M;

    # Frontend
    location / {
        root /opt/membership-app/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploads
    location /uploads {
        alias /opt/membership-app/backend/uploads;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/membership /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### Step 8: Setup PM2

```bash
cd /opt/membership-app/backend
sudo -u membership pm2 start server.js --name membership-backend
sudo -u membership pm2 save
sudo pm2 startup systemd -u membership --hp /home/membership
```

### Step 9: Setup SSL with Certbot

```bash
sudo certbot --nginx -d yourdomain.com --non-interactive --agree-tos --email admin@yourdomain.com --redirect
```

### Step 10: Setup Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

## Configuration

### Email Configuration

For Gmail:
1. Enable 2-factor authentication
2. Generate an App Password
3. Use the App Password in SMTP_PASSWORD

For other providers, update SMTP settings accordingly.

### Environment Variables

Key environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Environment mode | production |
| PORT | Backend port | 5000 |
| DB_HOST | Database host | localhost |
| DB_PORT | Database port | 5432 |
| JWT_SECRET | JWT signing secret | (required) |
| SMTP_HOST | Email server host | smtp.gmail.com |
| SMTP_PORT | Email server port | 587 |

## SSL Setup

### Automatic Renewal

Certbot automatically sets up renewal. Verify with:
```bash
sudo certbot renew --dry-run
```

### Manual Renewal

```bash
sudo certbot renew
sudo systemctl reload nginx
```

## Maintenance

### Backup Database

```bash
sudo -u postgres pg_dump membership_db | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Backup Uploads

```bash
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz /opt/membership-app/backend/uploads
```

### View Logs

```bash
# Backend logs
pm2 logs membership-backend

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Restart Services

```bash
# Restart backend
pm2 restart membership-backend

# Restart Nginx
sudo systemctl restart nginx

# Restart PostgreSQL
sudo systemctl restart postgresql
```

## Troubleshooting

### Backend Won't Start

1. Check logs: `pm2 logs membership-backend`
2. Verify database connection
3. Check environment variables
4. Ensure port 5000 is available

### Database Connection Issues

1. Verify PostgreSQL is running: `sudo systemctl status postgresql`
2. Check credentials in .env
3. Test connection: `psql -h localhost -U membership_user -d membership_db`

### Frontend Not Loading

1. Check Nginx configuration: `sudo nginx -t`
2. Verify build files exist: `ls /opt/membership-app/frontend/build`
3. Check Nginx logs

### SSL Certificate Issues

1. Verify domain points to server IP
2. Check firewall allows ports 80 and 443
3. Run: `sudo certbot certificates`

### Email Not Sending

1. Verify SMTP credentials
2. Check firewall allows outbound SMTP
3. Test with: `telnet smtp.gmail.com 587`

## Security Recommendations

1. **Change Default Passwords**: Immediately change the default admin password
2. **Use Strong JWT Secret**: Generate a strong random JWT secret
3. **Enable Firewall**: Only allow necessary ports
4. **Regular Updates**: Keep system and dependencies updated
5. **Backup Regularly**: Implement automated backup strategy
6. **Monitor Logs**: Regularly review application and system logs
7. **Use HTTPS Only**: Ensure all traffic uses SSL
8. **Limit Database Access**: PostgreSQL should only accept local connections

## Performance Optimization

1. **Enable Nginx Caching**
2. **Use CDN for Static Assets**
3. **Optimize Database Queries**
4. **Enable Compression**
5. **Monitor Resource Usage**

## Support

For issues or questions:
- Check the troubleshooting section
- Review application logs
- Consult the API documentation
- Contact support team

## Updates

To update the application:

```bash
cd /opt/membership-app
git pull
cd backend && npm install --production
cd ../frontend && npm install && npm run build
pm2 restart membership-backend
```