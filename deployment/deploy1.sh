#!/bin/bash

# Enhanced Membership App Deployment Script
# Version 2.0 - Includes Admin CRUD features and frontend enhancements
# Fixes Node.js installation conflicts

set -e  # Exit on any error

echo "\ud83d\ude80 Starting Enhanced Membership App Deployment..."
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

print_status "Updating system packages..."
sudo apt update
sudo apt upgrade -y

print_status "Installing system dependencies..."
sudo apt install -y curl wget git build-essential software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Fix Node.js installation conflict
# print_status "Resolving Node.js installation conflicts..."
# print_status "Removing conflicting packages..."
# sudo apt remove -y nodejs libnode-dev libnode72:amd64 || true
# sudo apt autoremove -y
# sudo apt autoclean

# Install Node.js 20.x properly
# print_status "Installing Node.js 20.x..."
# curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
# sudo apt install -y nodejs

# Verify Node.js installation
# print_status "Verifying Node.js installation..."
# node --version
# npm --version

# Install PM2 globally
print_status "Installing PM2 process manager..."
sudo npm install -g pm2

# Install PostgreSQL
print_status "Installing PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
print_status "Starting PostgreSQL service..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
print_status "Setting up PostgreSQL database..."
sudo -u postgres psql << EOF
CREATE USER membership_user WITH PASSWORD 'membership_pass';
CREATE DATABASE membership_app OWNER membership_user;
GRANT ALL PRIVILEGES ON DATABASE membership_app TO membership_user;
\c membership_app;
GRANT ALL ON SCHEMA public TO membership_user;
EOF

# Install Redis
print_status "Installing Redis..."
sudo apt install -y redis-server

# Start and enable Redis
print_status "Starting Redis service..."
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Install Nginx
print_status "Installing Nginx..."
sudo apt install -y nginx

# Create app directory
print_status "Creating application directory..."
sudo mkdir -p /var/www/membership-app
sudo chown -R $USER:$USER /var/www/membership-app

# Clone the repository
print_status "Cloning the membership app repository..."
cd /var/www/membership-app
if [ -d ".git" ]; then
    print_status "Repository already exists, pulling latest changes..."
    git pull origin main
else
    git clone https://github.com/j45186891-commits/memberships.git .
fi

# Install backend dependencies
print_status "Installing backend dependencies..."
cd backend
npm install

# Install frontend dependencies
print_status "Installing frontend dependencies..."
cd ../frontend
npm install

# Build frontend
print_status "Building frontend..."
npm run build

# Copy frontend build to backend public directory
print_status "Copying frontend build to backend..."
cd ..
cp -r frontend/build/* backend/public/

# Create .env file for backend
print_status "Creating environment configuration..."
cat > backend/.env << EOF
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=membership_app
DB_USER=membership_user
DB_PASSWORD=membership_pass
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
REDIS_HOST=localhost
REDIS_PORT=6379
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-email-password
EOF

# Run database migrations
print_status "Running database migrations..."
cd backend
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all

# Create systemd service for the app
print_status "Creating systemd service..."
sudo tee /etc/systemd/system/membership-app.service > /dev/null << EOF
[Unit]
Description=Membership App
After=network.target postgresql.service redis-server.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/membership-app/backend
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=membership-app

[Install]
WantedBy=multi-user.target
EOF

# Create Nginx configuration
print_status "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/membership-app > /dev/null << EOF
server {
    listen 80;
    server_name localhost;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Static files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        root /var/www/membership-app/backend/public;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable Nginx site
print_status "Enabling Nginx site..."
sudo ln -sf /etc/nginx/sites-available/membership-app /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
print_status "Testing Nginx configuration..."
sudo nginx -t

# Reload Nginx
print_status "Reloading Nginx..."
sudo systemctl reload nginx

# Start the application with PM2
print_status "Starting application with PM2..."
cd /var/www/membership-app/backend
pm2 start server.js --name membership-app
pm2 startup systemd -u $USER --hp $HOME
pm2 save

# Create systemd service for PM2
print_status "Setting up PM2 systemd service..."
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME
pm2 save

# Create log rotation
print_status "Setting up log rotation..."
sudo tee /etc/logrotate.d/membership-app > /dev/null << EOF
/var/www/membership-app/backend/logs/*.log {
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

# Create backup script
print_status "Creating backup script..."
sudo mkdir -p /opt/membership-backup
sudo tee /opt/membership-backup/backup.sh > /dev/null << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/membership-backup/backups"
mkdir -p $BACKUP_DIR

# Database backup
pg_dump membership_app > $BACKUP_DIR/db_backup_$DATE.sql

# Files backup
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz /var/www/membership-app/backend/uploads

# Clean old backups (keep last 7 days)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF
sudo chmod +x /opt/membership-backup/backup.sh

# Create cron job for backups
print_status "Setting up automated backups..."
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/membership-backup/backup.sh") | crontab -

# Set up firewall (if ufw is available)
if command -v ufw > /dev/null; then
    print_status "Configuring firewall..."
    sudo ufw allow 'Nginx Full'
    sudo ufw allow ssh
    sudo ufw --force enable
fi

# Create admin user
print_status "Creating default admin user..."
cd /var/www/membership-app/backend
node -e "
const bcrypt = require('bcryptjs');
const { User } = require('./models');
(async () => {
    try {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await User.create({
            email: 'admin@example.com',
            password: hashedPassword,
            firstName: 'Admin',
            lastName: 'User',
            role: 'superadmin',
            isVerified: true
        });
        console.log('Admin user created: admin@example.com / admin123');
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            console.log('Admin user already exists');
        } else {
            console.error('Error creating admin user:', error);
        }
    }
})();
"

# Final status check
print_status "Checking application status..."
pm2 status

print_status "Testing application endpoint..."
sleep 5
curl -I http://localhost:3000

# Display final information
echo ""
echo "=============================================="
echo "\ud83c\udf89 Deployment Complete!"
echo "=============================================="
echo ""
echo "Application URLs:"
echo "  - Main App: http://localhost"
echo "  - API: http://localhost/api"
echo ""
echo "Admin Credentials:"
echo "  - Email: admin@example.com"
echo "  - Password: admin123"
echo ""
echo "Important Files:"
echo "  - App Directory: /var/www/membership-app"
echo "  - Logs: /var/www/membership-app/backend/logs"
echo "  - Backups: /opt/membership-backup/backups"
echo ""
echo "PM2 Commands:"
echo "  - pm2 status"
echo "  - pm2 logs"
echo "  - pm2 restart membership-app"
echo ""
echo "Services:"
echo "  - Nginx: sudo systemctl status nginx"
echo "  - PostgreSQL: sudo systemctl status postgresql"
echo "  - Redis: sudo systemctl status redis-server"
echo ""
echo "=============================================="
