# Membership Management System - Quick Start Guide

Get your membership management system up and running in 5 minutes!

## Prerequisites

- Ubuntu 20.04+ or Debian 11+ server
- Root or sudo access
- Domain name pointing to your server
- Email account for SMTP (Gmail recommended)

## Installation Steps

### Step 1: Download the Application

```bash
# Clone or download the repository
git clone <repository-url>
cd membership-app
```

### Step 2: Run the Deployment Script

```bash
cd deployment
sudo chmod +x deploy.sh
sudo ./deploy.sh
```

### Step 3: Follow the Prompts

The script will ask you for:

1. **Domain Name**: Enter your domain (e.g., membership.example.com)
2. **Admin Email**: Your email for SSL certificates
3. **Database Password**: Choose a secure password
4. **JWT Secret**: Press Enter to auto-generate

### Step 4: Wait for Installation

The script will automatically:
- Install all dependencies (Node.js, PostgreSQL, Nginx)
- Set up the database
- Configure SSL certificates
- Deploy the application
- Create an admin account

This takes about 5-10 minutes.

### Step 5: Access Your Application

Once complete, you'll see:

```
==========================================
Deployment completed successfully!
==========================================

Application URL: https://yourdomain.com
Admin Email: admin@yourdomain.com
Admin Password: [generated-password]

IMPORTANT: Save these credentials securely!
```

**Save these credentials immediately!**

### Step 6: First Login

1. Open your browser
2. Navigate to your domain (https://yourdomain.com)
3. Click "Sign In"
4. Enter the admin credentials provided
5. You'll be logged into the admin dashboard

### Step 7: Initial Configuration

After logging in:

1. **Change Your Password**
   - Click your name → Profile
   - Go to Security
   - Change password

2. **Update Organization Details**
   - Go to Settings → Organization
   - Update name, email, phone, address
   - Upload your logo
   - Set your brand colors

3. **Configure Email**
   - Go to Settings → Email
   - Enter your SMTP details
   - Test the connection

4. **Create Membership Types**
   - Go to Membership Types
   - Click "Add Membership Type"
   - Configure pricing and duration
   - Add custom fields if needed

5. **Set Up Email Templates**
   - Go to Email Templates
   - Review default templates
   - Customize as needed

## Email Configuration (Gmail)

For Gmail SMTP:

1. Enable 2-factor authentication on your Google account
2. Generate an App Password:
   - Go to Google Account → Security
   - Select "App passwords"
   - Generate password for "Mail"
3. Use these settings:
   - SMTP Host: smtp.gmail.com
   - SMTP Port: 587
   - Username: your-email@gmail.com
   - Password: [app-password]

## Troubleshooting

### Can't Access the Site

1. Check DNS is pointing to your server
2. Verify firewall allows ports 80 and 443
3. Check Nginx status: `sudo systemctl status nginx`

### Application Not Starting

1. Check logs: `pm2 logs membership-backend`
2. Verify database: `sudo systemctl status postgresql`
3. Check environment: `cat /opt/membership-app/backend/.env`

### Email Not Sending

1. Verify SMTP settings in Settings → Email
2. Test SMTP connection
3. Check firewall allows outbound SMTP

## Next Steps

1. **Invite Administrators**
   - Go to Users → Add User
   - Create admin accounts for your team

2. **Create Committees**
   - Go to Committees
   - Set up your organization's committees
   - Add positions and members

3. **Upload Documents**
   - Go to Documents
   - Upload policies, forms, resources

4. **Create Events**
   - Go to Events
   - Add upcoming events

5. **Start Accepting Members**
   - Share registration link with potential members
   - Review and approve applications

## Useful Commands

```bash
# View application logs
pm2 logs membership-backend

# Restart application
pm2 restart membership-backend

# Check application status
pm2 status

# View Nginx logs
sudo tail -f /var/log/nginx/error.log

# Backup database
sudo -u postgres pg_dump membership_db > backup.sql

# Restart Nginx
sudo systemctl restart nginx
```

## Getting Help

- **Documentation**: Check the `docs/` folder
- **Admin Guide**: `docs/ADMIN_GUIDE.md`
- **User Guide**: `docs/USER_GUIDE.md`
- **Deployment Guide**: `docs/DEPLOYMENT_GUIDE.md`

## Support

For issues or questions:
- Review the documentation
- Check the troubleshooting section
- Contact your system administrator

---

**Congratulations! Your membership management system is now running!**

Start managing your organization more efficiently today.