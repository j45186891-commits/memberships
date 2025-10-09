#!/bin/bash

# Membership Management System - Deployment Script
# For Ubuntu/Debian servers

set -e

echo "=========================================="
echo "Membership Management System Deployment"
echo "=========================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

# Get deployment configuration
read -p "Enter domain name (e.g., membership.example.com): " DOMAIN
read -p "Enter admin email for SSL certificates: " ADMIN_EMAIL
read -p "Enter database password: " DB_PASSWORD
read -sp "Enter JWT secret (press enter to generate): " JWT_SECRET
echo ""

if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 32)
    echo -e "${GREEN}Generated JWT secret${NC}"
fi

SESSION_SECRET=$(openssl rand -base64 32)

# Update system packages
print_status "Updating system packages..."
apt-get update
apt-get upgrade -y

# Install essential dependencies
print_status "Installing essential dependencies..."
apt-get install -y \
    curl \
    wget \
    gnupg \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    lsb-release \
    build-essential \
    git \
    nginx \
    postgresql \
    postgresql-contrib \
    certbot \
    python3-certbot-nginx

# Clean up any existing Node.js installations
print_status "Cleaning up existing Node.js installations..."
apt-get remove -y nodejs npm 2>/dev/null || true
apt-get autoremove -y
apt-get autoclean

# Remove old Node.js repositories
rm -f /etc/apt/sources.list.d/nodesource.list*
rm -f /usr/share/keyrings/nodesource.gpg

# Clear apt cache
apt-get clean
rm -rf /var/lib/apt/lists/*

# Method 1: Install Node.js 20 via NodeSource repository (Recommended)
install_via_nodesource() {
    print_status "Installing Node.js 20 via NodeSource repository..."
    
    # Download and execute NodeSource setup script
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    
    # Install Node.js
    apt-get install -y nodejs
    
    # Verify installation
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_status "Node.js installed successfully: $NODE_VERSION"
    else
        return 1
    fi
}

# Method 2: Install via Node Version Manager (NVM) - Fallback
install_via_nvm() {
    print_status "Installing Node.js 20 via NVM (fallback method)..."
    
    # Install NVM
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    
    # Load NVM
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
    
    # Install Node.js 20
    nvm install 20
    nvm use 20
    nvm alias default 20
    
    # Make node available system-wide
    ln -sf "$NVM_DIR/versions/node/$(nvm version)/bin/node" /usr/local/bin/node
    ln -sf "$NVM_DIR/versions/node/$(nvm version)/bin/npm" /usr/local/bin/npm
    ln -sf "$NVM_DIR/versions/node/$(nvm version)/bin/npx" /usr/local/bin/npx
}

# Method 3: Manual installation from official binaries - Last resort
install_manual() {
    print_status "Installing Node.js 20 manually from official binaries..."
    
    # Detect architecture
    ARCH=$(dpkg --print-architecture)
    case "$ARCH" in
        amd64) NODE_ARCH="x64" ;;
        arm64) NODE_ARCH="arm64" ;;
        armhf) NODE_ARCH="armv7l" ;;
        *) print_error "Unsupported architecture: $ARCH"; exit 1 ;;
    esac
    
    # Download Node.js binary
    NODE_VERSION="v20.11.0"  # Specify exact version
    NODE_DISTRO="node-${NODE_VERSION}-linux-${NODE_ARCH}"
    
    cd /tmp
    wget "https://nodejs.org/dist/${NODE_VERSION}/${NODE_DISTRO}.tar.xz"
    
    # Extract and install
    tar -xJf "${NODE_DISTRO}.tar.xz" -C /usr/local --strip-components=1
    
    # Clean up
    rm "${NODE_DISTRO}.tar.xz"
}

# Try installation methods in order
print_status "Attempting to install Node.js 20..."

if ! install_via_nodesource; then
    print_warning "NodeSource installation failed, trying NVM..."
    if ! install_via_nvm; then
        print_warning "NVM installation failed, trying manual installation..."
        install_manual
    fi
fi

# Verify final installation
print_status "Verifying Node.js installation..."
if command -v node &> /dev/null && command -v npm &> /dev/null; then
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    print_status "Node.js version: $NODE_VERSION"
    print_status "npm version: $NPM_VERSION"
    
    # Check if it's version 20
    if [[ $NODE_VERSION == v20* ]]; then
        print_status "Node.js 20 successfully installed!"
    else
        print_warning "Node.js installed but not version 20. Version: $NODE_VERSION"
    fi
else
    print_error "Node.js installation failed!"
    exit 1
fi

# Install PM2 globally
print_status "Installing PM2 and Yarn globally..."
npm install -g pm2 yarn

# Set npm registry (helps with package issues)
npm config set registry https://registry.npmjs.org/

# Clear npm cache
print_status "Clearing npm cache..."
npm cache clean --force

# Create application user
print_status "Creating application user..."
if ! id -u membership >/dev/null 2>&1; then
    useradd -m -s /bin/bash membership
fi

# Setup PostgreSQL
print_status "Setting up PostgreSQL..."
sudo -u postgres psql -c "CREATE USER membership_user WITH PASSWORD '$DB_PASSWORD';" || true
sudo -u postgres psql -c "CREATE DATABASE membership_db OWNER membership_user;" || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE membership_db TO membership_user;" || true

# Create application directory
APP_DIR="/opt/membership-app"
print_status "Creating application directory: $APP_DIR"
mkdir -p $APP_DIR
cd $APP_DIR

# Copy application files (assumes script is run from deployment directory)
print_status "Copying application files..."
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cp -r $SCRIPT_DIR/../backend $APP_DIR/
cp -r $SCRIPT_DIR/../frontend $APP_DIR/
cp -r $SCRIPT_DIR/../database $APP_DIR/

# Create uploads directory
mkdir -p $APP_DIR/backend/uploads
chown -R membership:membership $APP_DIR

# Setup backend environment
print_status "Configuring backend environment..."
cat > $APP_DIR/backend/.env << EOF
NODE_ENV=production
PORT=5000
API_URL=https://$DOMAIN
FRONTEND_URL=https://$DOMAIN

DB_HOST=localhost
DB_PORT=5432
DB_NAME=membership_db
DB_USER=membership_user
DB_PASSWORD=$DB_PASSWORD

JWT_SECRET=$JWT_SECRET
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_EXPIRE=30d

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
EMAIL_FROM=noreply@$DOMAIN
EMAIL_FROM_NAME=Membership System

MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

SESSION_SECRET=$SESSION_SECRET

BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

ENABLE_PAYMENTS=true
ENABLE_EVENTS=true
ENABLE_FORUM=true
ENABLE_BOOKING=true
ENABLE_2FA=true

ORG_NAME=Your Organization
ORG_EMAIL=info@$DOMAIN
ORG_DOMAIN=$DOMAIN
EOF

# Install backend dependencies
print_status "Installing backend dependencies..."
cd $APP_DIR/backend
sudo -u membership npm ci --only=production || sudo -u membership npm install --production

# Initialize database
print_status "Initializing database..."
PGPASSWORD=$DB_PASSWORD psql -h localhost -U membership_user -d membership_db -f $APP_DIR/database/schema.sql

# Create initial organization and admin user
print_status "Creating initial organization and admin user..."
ADMIN_PASSWORD=$(openssl rand -base64 12)
ADMIN_HASH=$(node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('$ADMIN_PASSWORD', 12));")

PGPASSWORD=$DB_PASSWORD psql -h localhost -U membership_user -d membership_db << EOF
-- Create organization
INSERT INTO organizations (name, slug, email, settings)
VALUES ('Your Organization', 'default', 'info@$DOMAIN', '{}')
ON CONFLICT DO NOTHING;

-- Create admin user
INSERT INTO users (organization_id, email, password_hash, first_name, last_name, role, status, email_verified)
SELECT id, 'admin@$DOMAIN', '$ADMIN_HASH', 'Admin', 'User', 'super_admin', 'active', true
FROM organizations WHERE slug = 'default'
ON CONFLICT DO NOTHING;

-- Create session table
CREATE TABLE IF NOT EXISTS session (
  sid varchar NOT NULL COLLATE "default",
  sess json NOT NULL,
  expire timestamp(6) NOT NULL,
  PRIMARY KEY (sid)
);
CREATE INDEX IF NOT EXISTS IDX_session_expire ON session (expire);
EOF

# Build frontend
print_status "Building frontend..."
cd $APP_DIR/frontend

# Create frontend environment
cat > $APP_DIR/frontend/.env.production << EOF
REACT_APP_API_URL=https://$DOMAIN/api
REACT_APP_DOMAIN=$DOMAIN
EOF

sudo -u membership npm install
sudo -u membership npm run build

# Setup Nginx
print_status "Configuring Nginx..."
cat > /etc/nginx/sites-available/membership << EOF
server {
    listen 80;
    server_name $DOMAIN;

    client_max_body_size 10M;

    # Frontend
    location / {
        root $APP_DIR/frontend/build;
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API
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

    # Uploads
    location /uploads {
        alias $APP_DIR/backend/uploads;
    }
}
EOF

ln -sf /etc/nginx/sites-available/membership /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Restart Nginx
systemctl restart nginx

# Setup PM2 for backend
print_status "Setting up PM2 for backend..."
cd $APP_DIR/backend
sudo -u membership pm2 start server.js --name membership-backend
sudo -u membership pm2 save
pm2 startup systemd -u membership --hp /home/membership
env PATH=$PATH:/usr/bin pm2 startup systemd -u membership --hp /home/membership

# Setup SSL with Certbot
print_status "Setting up SSL certificate..."
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email $ADMIN_EMAIL --redirect

# Setup automatic SSL renewal
echo "0 0 * * * root certbot renew --quiet" > /etc/cron.d/certbot-renew

# Setup log rotation
cat > /etc/logrotate.d/membership << EOF
$APP_DIR/backend/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 membership membership
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

# Create backup script
cat > /usr/local/bin/backup-membership.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/membership"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup database
PGPASSWORD=$DB_PASSWORD pg_dump -h localhost -U membership_user membership_db | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C /opt/membership-app/backend uploads

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /usr/local/bin/backup-membership.sh

# Setup daily backup cron
echo "0 2 * * * root /usr/local/bin/backup-membership.sh" > /etc/cron.d/membership-backup

# Setup firewall
print_status "Configuring firewall..."
ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# System optimizations for Node.js
print_status "Applying system optimizations..."

# Increase file descriptor limits
echo "* soft nofile 65536" | tee -a /etc/security/limits.conf
echo "* hard nofile 65536" | tee -a /etc/security/limits.conf

# Enable swap if not present (useful for low-memory servers)
if [ ! -f /swapfile ]; then
    print_status "Creating swap file..."
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo "/swapfile none swap sw 0 0" | tee -a /etc/fstab
fi

# Create update script
cat > /usr/local/bin/update-membership.sh << 'EOF'
#!/bin/bash
set -e

APP_DIR="/opt/membership-app"
cd $APP_DIR

echo "Pulling latest changes..."
git pull

echo "Installing backend dependencies..."
cd backend
npm install --production

echo "Building frontend..."
cd ../frontend
npm install
npm run build

echo "Restarting backend..."
pm2 restart membership-backend

echo "Update completed!"
EOF

chmod +x /usr/local/bin/update-membership.sh

# Final setup
chown -R membership:membership $APP_DIR

echo ""
echo -e "${GREEN}=========================================="
echo "Deployment completed successfully!"
echo "==========================================${NC}"
echo ""
echo "Application URL: https://$DOMAIN"
echo "Admin Email: admin@$DOMAIN"
echo "Admin Password: $ADMIN_PASSWORD"
echo ""
echo -e "${YELLOW}IMPORTANT: Save these credentials securely!${NC}"
echo ""
echo "Node.js $(node --version) is ready to use"
echo ""
echo "Next steps:"
echo "1. Configure SMTP settings in $APP_DIR/backend/.env"
echo "2. Update organization details via admin panel"
echo "3. Change admin password after first login"
echo "4. Configure payment gateway if needed"
echo ""
echo "Useful commands:"
echo "- View backend logs: pm2 logs membership-backend"
echo "- Restart backend: pm2 restart membership-backend"
echo "- Update application: /usr/local/bin/update-membership.sh"
echo "- Backup database: /usr/local/bin/backup-membership.sh"
echo ""
echo -e "${GREEN}Deployment script completed!${NC}"