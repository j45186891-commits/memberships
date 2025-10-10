#!/bin/bash

# Create or Reset Admin User for Membership System
# This script creates a new admin user or resets an existing one

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Membership System - Admin User Creation${NC}"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

# Configuration
APP_DIR="/opt/membership-app"
DB_NAME="membership_db"
DB_USER="membership_user"

# Check if backend directory exists
if [ ! -d "$APP_DIR/backend" ]; then
    echo -e "${RED}Error: Backend directory not found at $APP_DIR/backend${NC}"
    echo "Please ensure the application is deployed first."
    exit 1
fi

# Get database password
read -sp "Enter database password for $DB_USER: " DB_PASSWORD
echo ""

# Get admin details
read -p "Enter admin email (default: admin@example.com): " ADMIN_EMAIL
ADMIN_EMAIL=${ADMIN_EMAIL:-admin@example.com}

read -p "Enter admin first name (default: Admin): " ADMIN_FIRST
ADMIN_FIRST=${ADMIN_FIRST:-Admin}

read -p "Enter admin last name (default: User): " ADMIN_LAST
ADMIN_LAST=${ADMIN_LAST:-User}

# Ask if they want to specify a password or generate one
read -p "Generate random password? (y/n, default: y): " GEN_PASS
GEN_PASS=${GEN_PASS:-y}

if [[ "$GEN_PASS" =~ ^[Yy]$ ]]; then
    ADMIN_PASSWORD=$(openssl rand -base64 16)
    echo -e "${GREEN}Generated password: $ADMIN_PASSWORD${NC}"
else
    read -sp "Enter admin password: " ADMIN_PASSWORD
    echo ""
    read -sp "Confirm admin password: " ADMIN_PASSWORD_CONFIRM
    echo ""
    
    if [ "$ADMIN_PASSWORD" != "$ADMIN_PASSWORD_CONFIRM" ]; then
        echo -e "${RED}Passwords do not match!${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${YELLOW}Creating admin user...${NC}"

# Test database connection first
if ! PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${RED}Error: Cannot connect to database!${NC}"
    echo "Please check your database password and ensure PostgreSQL is running."
    exit 1
fi

# Create a temporary Node.js script to hash the password
HASH_SCRIPT="/tmp/hash_password_$$.js"
cat > "$HASH_SCRIPT" << 'EOF'
const bcrypt = require('bcryptjs');
const password = process.argv[2];
const saltRounds = 12;

bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
        console.error('Error hashing password:', err);
        process.exit(1);
    }
    console.log(hash);
});
EOF

# Generate hash using the backend's bcryptjs
cd "$APP_DIR/backend"

# Check if bcryptjs is installed
if [ ! -d "node_modules/bcryptjs" ]; then
    echo -e "${YELLOW}Installing bcryptjs...${NC}"
    npm install bcryptjs
fi

# Generate the hash
ADMIN_HASH=$(node "$HASH_SCRIPT" "$ADMIN_PASSWORD")
rm "$HASH_SCRIPT"

if [ -z "$ADMIN_HASH" ]; then
    echo -e "${RED}Error: Failed to generate password hash${NC}"
    exit 1
fi

echo -e "${GREEN}Password hashed successfully${NC}"

# Get organization ID or create default organization
ORG_ID=$(PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME -t -c "SELECT id FROM organizations WHERE slug = 'default' LIMIT 1;" | xargs)

if [ -z "$ORG_ID" ]; then
    echo -e "${YELLOW}Creating default organization...${NC}"
    PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME << EOF
INSERT INTO organizations (name, slug, email, settings)
VALUES ('Default Organization', 'default', 'info@example.com', '{}')
ON CONFLICT (slug) DO NOTHING;
EOF
    ORG_ID=$(PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME -t -c "SELECT id FROM organizations WHERE slug = 'default' LIMIT 1;" | xargs)
fi

echo -e "${GREEN}Organization ID: $ORG_ID${NC}"

# Check if user already exists
USER_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM users WHERE email = '$ADMIN_EMAIL';" | xargs)

if [ "$USER_EXISTS" -gt 0 ]; then
    echo -e "${YELLOW}User with email $ADMIN_EMAIL already exists. Updating...${NC}"
    
    PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME << EOF
UPDATE users 
SET password_hash = '$ADMIN_HASH',
    first_name = '$ADMIN_FIRST',
    last_name = '$ADMIN_LAST',
    role = 'super_admin',
    status = 'active',
    email_verified = true,
    updated_at = NOW()
WHERE email = '$ADMIN_EMAIL';
EOF
    
    echo -e "${GREEN}Admin user updated successfully!${NC}"
else
    echo -e "${YELLOW}Creating new admin user...${NC}"
    
    PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME << EOF
INSERT INTO users (
    organization_id, 
    email, 
    password_hash, 
    first_name, 
    last_name, 
    role, 
    status, 
    email_verified,
    created_at,
    updated_at
)
VALUES (
    $ORG_ID,
    '$ADMIN_EMAIL',
    '$ADMIN_HASH',
    '$ADMIN_FIRST',
    '$ADMIN_LAST',
    'super_admin',
    'active',
    true,
    NOW(),
    NOW()
);
EOF
    
    echo -e "${GREEN}Admin user created successfully!${NC}"
fi

# Verify the user was created/updated
USER_CHECK=$(PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME -t -c "SELECT email, role, status FROM users WHERE email = '$ADMIN_EMAIL';" | xargs)

echo ""
echo -e "${GREEN}=========================================="
echo "Admin User Setup Complete!"
echo "==========================================${NC}"
echo ""
echo "Email: $ADMIN_EMAIL"
echo "Password: $ADMIN_PASSWORD"
echo "Role: super_admin"
echo "Status: active"
echo ""
echo -e "${YELLOW}IMPORTANT: Save these credentials securely!${NC}"
echo ""
echo "You can now log in to the membership system using these credentials."
echo ""

# Offer to test the hash
echo -e "${YELLOW}Verification Info:${NC}"
echo "User details: $USER_CHECK"
echo ""