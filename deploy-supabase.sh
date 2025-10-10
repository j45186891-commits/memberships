#!/bin/bash

# Supabase Integration Deployment Script
# This script deploys the membership app with Supabase integration

set -e

echo "🚀 Starting Supabase Integration Deployment..."
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[i]${NC} $1"
}

# Configuration
SUPABASE_URL="https://tdqwgjbkkldvioxzator.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkcXdnamJra2xkdmlveHphdG9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNDgwOTIsImV4cCI6MjA3NTYyNDA5Mn0.R9-OWeBeRwYSduQ7n8tLaqEfsCtE6Hdarq3hZBjBbKQ"
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkcXdnamJra2xkdmlveHphdG9yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDA0ODA5MiwiZXhwIjoyMDc1NjI0MDkyfQ.CETODpNxEJ1tRouJ0RGm5k9D1vgThlywHmddbSa8_-c"

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

print_status "Installing Node.js and dependencies..."
# Remove conflicting packages
sudo apt remove -y nodejs libnode-dev libnode72:amd64 || true
sudo apt autoremove -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs build-essential git

# Verify Node.js installation
node --version
npm --version

print_status "Installing PM2 process manager..."
sudo npm install -g pm2

print_status "Setting up application directory..."
sudo mkdir -p /var/www/membership-app
sudo chown -R $USER:$USER /var/www/membership-app

print_status "Copying application files..."
cd /var/www/membership-app

# Copy backend files
cp -r /workspace/memberships/backend/* ./

# Copy frontend build
if [ -d "/workspace/memberships/frontend/build" ]; then
    cp -r /workspace/memberships/frontend/build ./public
fi

print_status "Installing backend dependencies..."
npm install

print_status "Creating environment configuration..."
cat > .env << EOF
# Server Configuration
NODE_ENV=production
PORT=5000
API_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000

# Supabase Configuration
SUPABASE_URL=${SUPABASE_URL}
SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Membership System

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Feature Flags
ENABLE_PAYMENTS=false
ENABLE_EVENTS=true
ENABLE_FORUM=true
ENABLE_BOOKING=true
ENABLE_2FA=true

# Organization Defaults
ORG_NAME=Your Organization
ORG_EMAIL=info@yourdomain.com
ORG_DOMAIN=yourdomain.com
EOF

print_status "Creating uploads directory..."
mkdir -p uploads
chmod 755 uploads

print_status "Setting up Supabase database..."
# Note: Database schema should be applied through Supabase dashboard or CLI
print_info "Please ensure the Supabase database schema is applied using the provided schema.sql file"

print_status "Creating systemd service..."
sudo tee /etc/systemd/system/membership-app-supabase.service > /dev/null << EOF
[Unit]
Description=Membership App with Supabase
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/membership-app
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=membership-app-supabase
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

print_status "Installing Nginx..."
sudo apt install -y nginx

print_status "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/membership-app-supabase > /dev/null << EOF
server {
    listen 80;
    server_name localhost;

    # Frontend static files
    location / {
        root /var/www/membership-app/public;
        try_files \$uri \$uri/ /index.html;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Supabase storage proxy (for file uploads)
    location /storage {
        proxy_pass ${SUPABASE_URL}/storage/v1;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # WebSocket support for real-time features
    location /realtime {
        proxy_pass ${SUPABASE_URL}/realtime/v1;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

print_status "Enabling Nginx site..."
sudo ln -sf /etc/nginx/sites-available/membership-app-supabase /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

print_status "Testing Nginx configuration..."
sudo nginx -t

print_status "Reloading Nginx..."
sudo systemctl reload nginx

print_status "Starting application with PM2..."
pm2 start server.js --name membership-app-supabase
pm2 startup systemd -u $USER --hp $HOME
pm2 save

print_status "Creating backup script..."
sudo mkdir -p /opt/membership-backup
sudo tee /opt/membership-backup/backup-supabase.sh > /dev/null << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/membership-backup/backups"
LOG_FILE="/opt/membership-backup/backup.log"

mkdir -p $BACKUP_DIR

echo "[$DATE] Starting Supabase backup..." >> $LOG_FILE

# Backup application files (excluding node_modules and uploads)
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz \
    --exclude='node_modules' \
    --exclude='uploads' \
    /var/www/membership-app

# Backup uploads separately
if [ -d "/var/www/membership-app/uploads" ]; then
    tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz /var/www/membership-app/uploads
fi

# Clean old backups (keep last 7 days)
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "[$DATE] Backup completed" >> $LOG_FILE
EOF
sudo chmod +x /opt/membership-backup/backup-supabase.sh

print_status "Setting up automated backups..."
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/membership-backup/backup-supabase.sh") | crontab -

print_status "Setting up log rotation..."
sudo tee /etc/logrotate.d/membership-app-supabase > /dev/null << EOF
/var/www/membership-app/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0640 www-data www-data
    postrotate
        pm2 reload all
    endscript
}
EOF

print_status "Setting up firewall..."
if command -v ufw > /dev/null; then
    sudo ufw allow 'Nginx Full'
    sudo ufw allow ssh
    sudo ufw --force enable
fi

print_status "Creating health check endpoint..."
cat > health-check.js << 'EOF'
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/health',
  method: 'GET',
  timeout: 3000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    console.log('Health check passed');
    process.exit(0);
  } else {
    console.log(`Health check failed with status: ${res.statusCode}`);
    process.exit(1);
  }
});

req.on('error', (err) => {
  console.log('Health check failed:', err.message);
  process.exit(1);
});

req.on('timeout', () => {
  console.log('Health check timed out');
  process.exit(1);
});

req.end();
EOF

print_status "Creating monitoring script..."
cat > monitor-supabase.sh << 'EOF'
#!/bin/bash

# Check if PM2 process is running
if ! pm2 list | grep -q "membership-app-supabase"; then
    echo "PM2 process not running, restarting..."
    pm2 start server.js --name membership-app-supabase
fi

# Check if port 5000 is listening
if ! netstat -tuln | grep -q ":5000"; then
    echo "Port 5000 not listening, restarting PM2..."
    pm2 restart membership-app-supabase
fi

# Health check
if node health-check.js; then
    echo "Health check passed"
else
    echo "Health check failed, restarting PM2..."
    pm2 restart membership-app-supabase
fi
EOF
chmod +x monitor-supabase.sh

print_status "Setting up monitoring cron job..."
(crontab -l 2>/dev/null; echo "*/5 * * * * /var/www/membership-app/monitor-supabase.sh >> /var/www/membership-app/monitor.log 2>&1") | crontab -

print_status "Final status check..."
pm2 status

print_status "Testing application endpoint..."
sleep 5
curl -I http://localhost:5000/api/health || echo "Health check endpoint not available yet"

# Display final information
echo ""
echo "=============================================="
echo "🎉 Supabase Integration Deployment Complete!"
echo "=============================================="
echo ""
echo "Application URLs:"
echo "  - Main App: http://localhost"
echo "  - API: http://localhost/api"
echo "  - Supabase Dashboard: https://app.supabase.com"
echo ""
echo "Supabase Configuration:"
echo "  - URL: ${SUPABASE_URL}"
echo "  - Anon Key: ${SUPABASE_ANON_KEY:0:20}..."
echo "  - Service Key: ${SUPABASE_SERVICE_KEY:0:20}..."
echo ""
echo "Important Files:"
echo "  - App Directory: /var/www/membership-app"
echo "  - Logs: /var/www/membership-app/logs"
echo "  - Backups: /opt/membership-backup/backups"
echo "  - Health Check: /var/www/membership-app/health-check.js"
echo ""
echo "PM2 Commands:"
echo "  - pm2 status"
echo "  - pm2 logs membership-app-supabase"
echo "  - pm2 restart membership-app-supabase"
echo ""
echo "Services:"
echo "  - Nginx: sudo systemctl status nginx"
echo "  - Application: pm2 list"
echo ""
echo "Next Steps:"
echo "1. Apply the Supabase database schema using the provided schema.sql file"
echo "2. Update your frontend to use Supabase authentication"
echo "3. Test all functionality to ensure proper integration"
echo "4. Configure SSL certificates for production"
echo ""
echo "=============================================="