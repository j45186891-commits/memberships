#!/bin/bash

# Troubleshooting Script for Membership App Deployment

set -e

echo "\ud83d\udd27 Membership App Troubleshooting Tool"
echo "====================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[\u2713]${NC} $1"
}

print_error() {
    echo -e "${RED}[\u2717]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[i]${NC} $1"
}

# Check Node.js
echo -e "\
${BLUE}--- Node.js Check ---${NC}"
if command -v node &> /dev/null; then
    print_status "Node.js is installed: $(node --version)"
else
    print_error "Node.js is not installed"
fi

# Check npm
echo -e "\
${BLUE}--- NPM Check ---${NC}"
if command -v npm &> /dev/null; then
    print_status "npm is installed: $(npm --version)"
else
    print_error "npm is not installed"
fi

# Check PostgreSQL
echo -e "\
${BLUE}--- PostgreSQL Check ---${NC}"
if pg_isready -q; then
    print_status "PostgreSQL is running"
else
    print_error "PostgreSQL is not running"
    print_info "Try: sudo systemctl start postgresql"
fi

# Check Redis
echo -e "\
${BLUE}--- Redis Check ---${NC}"
if redis-cli ping &> /dev/null; then
    print_status "Redis is running"
else
    print_error "Redis is not running"
    print_info "Try: sudo systemctl start redis-server"
fi

# Check PM2
echo -e "\
${BLUE}--- PM2 Check ---${NC}"
if command -v pm2 &> /dev/null; then
    print_status "PM2 is installed"
    pm2 status
else
    print_error "PM2 is not installed"
    print_info "Try: sudo npm install -g pm2"
fi

# Check ports
echo -e "\
${BLUE}--- Port Check ---${NC}"
if lsof -i :3000 &> /dev/null; then
    print_status "Port 3000 is in use"
    lsof -i :3000 | head -2
else
    print_warning "Port 3000 is free"
fi

if lsof -i :5000 &> /dev/null; then
    print_status "Port 5000 is in use"
    lsof -i :5000 | head -2
else
    print_warning "Port 5000 is free"
fi

# Check application directory
echo -e "\
${BLUE}--- Application Directory ---${NC}"
if [ -d "/var/www/membership-app" ]; then
    print_status "Application directory exists: /var/www/membership-app"
else
    print_warning "Application directory does not exist"
fi

# Check database
echo -e "\
${BLUE}--- Database Check ---${NC}"
if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw membership_app; then
    print_status "Database 'membership_app' exists"
else
    print_error "Database 'membership_app' does not exist"
    print_info "Try: sudo -u postgres createdb membership_app"
fi

# Check environment variables
echo -e "\
${BLUE}--- Environment Check ---${NC}"
if [ -f "/var/www/membership-app/backend/.env" ]; then
    print_status "Environment file exists"
else
    print_warning "Environment file does not exist"
fi

# Check logs
echo -e "\
${BLUE}--- Log Check ---${NC}"
if [ -d "/var/www/membership-app/backend/logs" ]; then
    print_status "Log directory exists"
    if [ -f "/var/www/membership-app/backend/logs/app.log" ]; then
        print_info "Recent log entries:"
        tail -5 /var/www/membership-app/backend/logs/app.log 2>/dev/null || print_warning "No log entries found"
    fi
else
    print_warning "Log directory does not exist"
fi

# Check PM2 logs
echo -e "\
${BLUE}--- PM2 Logs ---${NC}"
if pm2 list | grep -q "membership-app"; then
    print_status "PM2 process exists"
    print_info "Recent PM2 logs:"
    pm2 logs --lines 5 --nostream
else
    print_warning "PM2 process not found"
fi

# Check Nginx
echo -e "\
${BLUE}--- Nginx Check ---${NC}"
if systemctl is-active nginx &> /dev/null; then
    print_status "Nginx is running"
else
    print_error "Nginx is not running"
    print_info "Try: sudo systemctl start nginx"
fi

# Check service status
echo -e "\
${BLUE}--- Service Status ---${NC}"
print_info "PostgreSQL: $(systemctl is-active postgresql)"
print_info "Redis: $(systemctl is-active redis-server)"
print_info "Nginx: $(systemctl is-active nginx)"

# Quick fixes
echo -e "\
${BLUE}--- Quick Fixes ---${NC}"
echo "Common issues and solutions:"
echo "1. Node.js conflict: sudo apt remove -y nodejs libnode-dev && sudo apt autoremove -y"
echo "2. Database issues: sudo -u postgres psql -c 'DROP DATABASE membership_app;' && npm run migrate"
echo "3. PM2 restart: pm2 restart membership-app"
echo "4. Clear npm cache: npm cache clean --force"
echo "5. Reinstall dependencies: rm -rf node_modules && npm install"

echo -e "\
${GREEN}Troubleshooting complete!${NC}"
