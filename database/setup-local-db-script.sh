#!/bin/bash

# Complete Local PostgreSQL Setup Script with Installation
# This script will install PostgreSQL and set up your membership database from scratch

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}=========================================="
echo "Local PostgreSQL Database Setup"
echo "==========================================${NC}"
echo ""

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

print_info() {
    echo -e "${BLUE}[i]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run this script WITH sudo"
    exit 1
fi

# Step 1: Install PostgreSQL if not installed
if ! command -v psql &> /dev/null; then
    print_status "Installing PostgreSQL..."
    apt-get update
    apt-get install -y postgresql postgresql-contrib
    print_status "PostgreSQL installed successfully"
else
    print_status "PostgreSQL is already installed"
fi

# Step 2: Start PostgreSQL
print_status "Starting PostgreSQL..."
systemctl start postgresql
systemctl enable postgresql
sleep 2

print_status "PostgreSQL is running"

# Get configuration from user
echo ""
echo -e "${BLUE}Database Configuration${NC}"
echo "Enter your desired settings (or press Enter for defaults):"
echo ""

read -p "Database name [membership_db]: " DB_NAME
DB_NAME=${DB_NAME:-membership_db}

read -p "Database user [membership_user]: " DB_USER
DB_USER=${DB_USER:-membership_user}

read -sp "Database password [Plainbob1260!]: " DB_PASSWORD
echo ""
DB_PASSWORD=${DB_PASSWORD:-Plainbob1260!}

read -p "Organization name [Development Organization]: " ORG_NAME
ORG_NAME=${ORG_NAME:-Development Organization}

read -p "Organization slug [default]: " ORG_SLUG
ORG_SLUG=${ORG_SLUG:-default}

read -p "Organization email [info@example.com]: " ORG_EMAIL
ORG_EMAIL=${ORG_EMAIL:-info@example.com}

read -p "Admin email [admin@example.com]: " ADMIN_EMAIL
ADMIN_EMAIL=${ADMIN_EMAIL:-admin@example.com}

read -sp "Admin password [admin123]: " ADMIN_PASSWORD
echo ""
ADMIN_PASSWORD=${ADMIN_PASSWORD:-admin123}

read -p "Admin first name [Admin]: " ADMIN_FIRST
ADMIN_FIRST=${ADMIN_FIRST:-Admin}

read -p "Admin last name [User]: " ADMIN_LAST
ADMIN_LAST=${ADMIN_LAST:-User}

echo ""
print_info "Configuration:"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Organization: $ORG_NAME"
echo "  Admin Email: $ADMIN_EMAIL"
echo ""

read -p "Continue with these settings? (y/n): " CONFIRM
if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
    print_warning "Setup cancelled"
    exit 0
fi

# Find PostgreSQL version
PG_VERSION=$(psql --version | grep -oP '\d+' | head -1)
PG_HBA_CONF="/etc/postgresql/${PG_VERSION}/main/pg_hba.conf"

print_info "PostgreSQL version: $PG_VERSION"

# Step 3: Backup existing pg_hba.conf
print_status "Backing up pg_hba.conf..."
cp "$PG_HBA_CONF" "${PG_HBA_CONF}.backup.$(date +%Y%m%d_%H%M%S)"

# Step 4: Configure PostgreSQL authentication
print_status "Configuring PostgreSQL authentication..."
cat > "$PG_HBA_CONF" << 'EOF'
# PostgreSQL Client Authentication Configuration File
# TYPE  DATABASE        USER            ADDRESS                 METHOD

# "local" is for Unix domain socket connections only
local   all             postgres                                peer
local   all             all                                     md5

# IPv4 local connections:
host    all             all             127.0.0.1/32            md5

# IPv6 local connections:
host    all             all             ::1/128                 md5

# Allow replication connections from localhost
local   replication     all                                     peer
host    replication     all             127.0.0.1/32            md5
host    replication     all             ::1/128                 md5
EOF

# Step 5: Reload PostgreSQL
print_status "Reloading PostgreSQL configuration..."
systemctl reload postgresql
sleep 2

# Step 6: Drop existing database and user if they exist
print_status "Cleaning up existing database and user..."
sudo -u postgres psql << EOF
DROP DATABASE IF EXISTS $DB_NAME;
DROP USER IF EXISTS $DB_USER;
EOF

# Step 7: Create new database user
print_status "Creating database user..."
sudo -u postgres psql << EOF
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD' LOGIN CREATEDB;
EOF

# Step 8: Create database
print_status "Creating database..."
sudo -u postgres psql << EOF
CREATE DATABASE $DB_NAME OWNER $DB_USER;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
EOF

# Step 9: Connect to the database and grant schema permissions
print_status "Setting up database permissions..."
sudo -u postgres psql -d $DB_NAME << EOF
GRANT ALL ON SCHEMA public TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO $DB_USER;
EOF

# Step 10: Test connection
print_status "Testing database connection..."
if PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1; then
    print_status "Database connection successful!"
else
    print_error "Database connection failed!"
    exit 1
fi

# Step 11: Run schema migration (embedded in script)
print_status "Creating database schema..."
PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME << 'SCHEMA_EOF'
-- Membership Management System Database Schema
-- PostgreSQL 12+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table (for multi-tenancy support)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    logo_url VARCHAR(500),
    primary_color VARCHAR(7) DEFAULT '#1976d2',
    secondary_color VARCHAR(7) DEFAULT '#dc004e',
    timezone VARCHAR(50) DEFAULT 'UTC',
    currency VARCHAR(3) DEFAULT 'USD',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    email_verified BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    last_login TIMESTAMP,
    login_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CUR