# Membership Management System - Administrator Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Membership Management](#membership-management)
4. [User Management](#user-management)
5. [Committee Management](#committee-management)
6. [Email System](#email-system)
7. [Document Management](#document-management)
8. [Events Management](#events-management)
9. [Organization Settings](#organization-settings)
10. [Feature Flags](#feature-flags)
11. [Reports & Analytics](#reports--analytics)

## Getting Started

### First Login

1. Navigate to your organization's URL (e.g., https://membership.example.com)
2. Click "Sign In"
3. Enter your admin credentials
4. You'll be redirected to the admin dashboard

### Initial Setup Checklist

- [ ] Change default admin password
- [ ] Update organization details
- [ ] Upload organization logo
- [ ] Configure email settings
- [ ] Create membership types
- [ ] Set up email templates
- [ ] Create committees and positions
- [ ] Configure feature flags
- [ ] Review and customize workflows

## Dashboard Overview

The admin dashboard provides a quick overview of your organization:

### Key Metrics
- **Total Members**: Current member count
- **Active Memberships**: Number of active memberships
- **Pending Applications**: Applications awaiting approval
- **Upcoming Events**: Events scheduled in the future
- **Expiring Soon**: Memberships expiring in the next 30 days
- **Recent Activity**: Actions taken in the last 7 days

### Quick Actions
- Approve pending memberships
- View expiring memberships
- Access recent applications
- Check upcoming events

## Membership Management

### Viewing Memberships

1. Navigate to **Memberships** from the sidebar
2. Use filters to find specific memberships:
   - Status (Active, Pending, Expired)
   - Membership Type
   - Search by name or email
3. Click on any membership to view details

### Approving Memberships

1. Go to **Memberships** > Filter by "Pending"
2. Click on a pending membership
3. Review the application details
4. Click **Approve** button
5. Set start date (defaults to today)
6. Set end date (auto-calculated based on membership type)
7. Add any notes
8. Confirm approval

**What Happens After Approval:**
- Member receives welcome email
- User account is activated
- Member gains access to the system
- Automated workflows are triggered

### Rejecting Memberships

1. Open the pending membership
2. Click **Reject** button
3. Provide a reason for rejection
4. Confirm rejection

**What Happens After Rejection:**
- Member receives rejection notification
- Application is marked as rejected
- User account remains inactive

### Renewing Memberships

1. Open an active or expired membership
2. Click **Renew** button
3. Review renewal details
4. Confirm renewal

**Renewal Process:**
- New membership period starts after current period ends
- Payment status is set to "unpaid"
- Renewal reminder emails are sent

### Managing Linked Members

For family memberships or memberships with multiple people:

1. Open the membership
2. Scroll to **Linked Members** section
3. Click **Add Linked Member**
4. Fill in member details:
   - First Name
   - Last Name
   - Date of Birth (for juniors)
   - Relationship
   - Email (optional)
5. Save

**To Remove a Linked Member:**
1. Find the linked member in the list
2. Click the delete icon
3. Confirm removal

### Expiring Memberships Report

1. Navigate to **Memberships** > **Reports**
2. Select **Expiring Soon**
3. Choose time period (default: 30 days)
4. View list of expiring memberships
5. Export to CSV if needed

**Actions for Expiring Memberships:**
- Send renewal reminders
- Contact members directly
- Process renewals in bulk

## User Management

### Viewing Users

1. Navigate to **Users** from the sidebar
2. View all system users
3. Filter by:
   - Role (Member, Admin, Super Admin)
   - Status (Active, Pending, Inactive)
   - Search by name or email

### Creating Users

1. Click **Add User** button
2. Fill in user details:
   - Email
   - Password
   - First Name
   - Last Name
   - Phone
   - Role
   - Status
3. Click **Create**

**User Roles:**
- **Member**: Basic access, can view own information
- **Admin**: Can manage memberships, users, and content
- **Super Admin**: Full system access including settings

### Editing Users

1. Click on a user to view details
2. Click **Edit** button
3. Update information
4. Save changes

**Editable Fields:**
- Personal information
- Role (admin only)
- Status (admin only)
- Contact details

### Deactivating Users

1. Open user profile
2. Change status to "Inactive"
3. Save changes

**Effects of Deactivation:**
- User cannot log in
- Access to all features is revoked
- Data is retained for records

## Committee Management

### Creating Committees

1. Navigate to **Committees**
2. Click **Add Committee**
3. Fill in details:
   - Committee Name
   - Description
   - Email Address (for mailing list)
   - Active Status
4. Save

**Automatic Features:**
- Mailing list is created automatically
- Committee members are auto-synced to mailing list

### Adding Positions

1. Open a committee
2. Go to **Positions** tab
3. Click **Add Position**
4. Fill in:
   - Position Title
   - Description
   - Can Send Emails (checkbox)
   - Permissions (select from list)
   - Display Order
5. Save

**Position Permissions:**
- Approve Memberships
- Manage Users
- Send Emails
- Manage Documents
- Manage Events
- Custom permissions

### Adding Committee Members

1. Open a committee
2. Go to **Members** tab
3. Click **Add Member**
4. Select:
   - User
   - Position
   - Start Date
   - End Date (optional)
5. Save

**What Happens:**
- Member is added to committee mailing list
- Member gains position permissions
- Member can access committee resources

### Removing Committee Members

1. Find member in committee list
2. Click **Remove** button
3. Confirm removal

**Effects:**
- Member is removed from mailing list
- Position permissions are revoked
- End date is set to today

### Committee Mailing Lists

**Automatic Synchronization:**
- All committee members are automatically added to the committee mailing list
- When members are removed, they're removed from the mailing list
- Access is restricted to committee members only

**Sending Emails:**
- Positions with "Can Send Emails" permission can send directly
- Emails can be personalized using database fields
- All committee members receive copies

## Email System

### Email Templates

#### Creating Templates

1. Navigate to **Email Templates**
2. Click **Create Template**
3. Fill in:
   - Template Name
   - Slug (unique identifier)
   - Subject Line
   - HTML Body
   - Plain Text Body (optional)
   - Template Type
   - Available Variables
4. Save

**Template Types:**
- Welcome Email
- Approval Notification
- Rejection Notification
- Renewal Reminder
- Expiry Notice
- Event Registration
- Custom

**Available Variables:**
Use these in your templates:
- `{{first_name}}` - Member's first name
- `{{last_name}}` - Member's last name
- `{{email}}` - Member's email
- `{{membership_type}}` - Membership type name
- `{{start_date}}` - Membership start date
- `{{end_date}}` - Membership end date
- `{{organization_name}}` - Organization name
- `{{organization_email}}` - Organization email

#### Editing Templates

1. Click on a template
2. Click **Edit**
3. Make changes
4. Preview the template
5. Save

#### Testing Templates

1. Open template
2. Click **Send Test**
3. Enter test email address
4. Send

### Email Campaigns

#### Creating Campaigns

1. Navigate to **Email Campaigns**
2. Click **Create Campaign**
3. Fill in:
   - Campaign Name
   - Select Template (or create custom)
   - Subject Line
   - Email Body
   - Schedule Date/Time (optional)
4. Save as Draft

#### Selecting Recipients

1. Open campaign
2. Click **Select Recipients**
3. Choose:
   - All Active Members
   - Specific Membership Types
   - Custom User List
   - Mailing List
4. Review recipient count
5. Confirm

#### Sending Campaigns

1. Open campaign
2. Review all details
3. Click **Send Now** or **Schedule**
4. Confirm sending

**Campaign Tracking:**
- Sent count
- Opened count
- Clicked count
- Bounced count
- Failed deliveries

#### Campaign Reports

1. Open sent campaign
2. View statistics:
   - Delivery rate
   - Open rate
   - Click rate
   - Bounce rate
3. Export recipient list with status

### Automated Workflows

#### Available Triggers

- **User Registered**: When a new user signs up
- **Membership Approved**: When membership is approved
- **Membership Rejected**: When membership is rejected
- **Membership Expiring**: X days before expiration
- **Membership Expired**: When membership expires
- **Event Registration**: When user registers for event
- **Payment Received**: When payment is completed

#### Creating Workflows

1. Navigate to **Settings** > **Workflows**
2. Click **Create Workflow**
3. Select trigger type
4. Configure trigger conditions
5. Add actions:
   - Send Email
   - Create Notification
   - Update Status
   - Assign to Committee
6. Set workflow as active
7. Save

#### Example Workflows

**Welcome Email Workflow:**
- Trigger: User Registered
- Action: Send welcome email template
- Delay: Immediate

**Renewal Reminder Workflow:**
- Trigger: Membership Expiring
- Condition: 30 days before expiration
- Action: Send renewal reminder email
- Repeat: Every 7 days until renewed

**Approval Notification:**
- Trigger: Membership Approved
- Actions:
  1. Send approval email
  2. Create welcome notification
  3. Add to members mailing list

## Document Management

### Uploading Documents

1. Navigate to **Documents**
2. Click **Upload Document**
3. Select file (max 10MB)
4. Fill in:
   - Title
   - Description
   - Category
   - Visibility (Public/Private)
5. Upload

**Supported File Types:**
- PDF
- Word Documents
- Excel Spreadsheets
- Images
- Text Files

### Organizing Documents

**Categories:**
- Create custom categories
- Assign documents to categories
- Filter by category

**Visibility Settings:**
- **Public**: All members can view
- **Private**: Only admins can view
- **Committee**: Only committee members can view

### Document Access Tracking

1. Open document details
2. View **Access Log**:
   - Who accessed
   - When accessed
   - Action taken (view/download)
   - IP address

### Managing Documents

**Edit Document:**
1. Click on document
2. Click **Edit**
3. Update details
4. Save

**Delete Document:**
1. Click on document
2. Click **Delete**
3. Confirm deletion

## Events Management

### Creating Events

1. Navigate to **Events**
2. Click **Create Event**
3. Fill in:
   - Event Title
   - Description
   - Location
   - Start Date/Time
   - End Date/Time
   - Max Attendees
   - Registration Deadline
   - Price (if applicable)
   - Public/Private
4. Save

### Managing Registrations

1. Open event
2. View **Registrations** tab
3. See list of registered users
4. Mark attendance
5. Export attendee list

### Event Communication

**Send Event Reminders:**
1. Open event
2. Click **Send Reminder**
3. Select recipients
4. Customize message
5. Send

**Post-Event Follow-up:**
1. Mark event as completed
2. Send thank you emails
3. Request feedback

## Organization Settings

### General Settings

1. Navigate to **Settings** > **Organization**
2. Update:
   - Organization Name
   - Email
   - Phone
   - Address
   - Timezone
   - Currency

### Branding

**Upload Logo:**
1. Go to **Settings** > **Branding**
2. Click **Upload Logo**
3. Select image file
4. Crop if needed
5. Save

**Color Scheme:**
1. Set Primary Color
2. Set Secondary Color
3. Preview changes
4. Apply

### Email Configuration

1. Go to **Settings** > **Email**
2. Configure SMTP:
   - SMTP Host
   - SMTP Port
   - Username
   - Password
   - From Address
   - From Name
3. Test connection
4. Save

## Feature Flags

### Managing Features

1. Navigate to **Settings** > **Features**
2. View all available features
3. Toggle features on/off:
   - Payments
   - Events
   - Forum
   - Resource Booking
   - Two-Factor Authentication

### Feature Settings

Each feature may have additional settings:

**Payments:**
- Payment Gateway
- Currency
- Tax Settings

**Events:**
- Default Registration Settings
- Reminder Schedule

**Forum:**
- Moderation Settings
- Category Management

## Reports & Analytics

### Dashboard Analytics

View key metrics:
- Member growth over time
- Revenue trends
- Membership type distribution
- Engagement metrics

### Membership Reports

**Available Reports:**
- Active Memberships
- Pending Applications
- Expiring Memberships
- Renewal Rate
- Membership Type Breakdown

**Generating Reports:**
1. Navigate to **Reports**
2. Select report type
3. Choose date range
4. Apply filters
5. Generate report
6. Export to CSV/PDF

### Financial Reports

- Total Revenue
- Revenue by Membership Type
- Payment Status
- Outstanding Payments

### Engagement Reports

- Login Activity
- Document Downloads
- Event Attendance
- Forum Activity

### Custom Reports

1. Go to **Reports** > **Custom**
2. Select data fields
3. Apply filters
4. Set grouping
5. Generate report
6. Save report template

## Best Practices

### Membership Approval

- Review applications within 24-48 hours
- Verify all required information
- Check for duplicate applications
- Communicate clearly with applicants

### Email Communication

- Use templates for consistency
- Personalize emails with variables
- Test emails before sending campaigns
- Monitor delivery and open rates
- Respect unsubscribe requests

### Data Management

- Regular backups
- Clean up old data periodically
- Maintain accurate member records
- Protect sensitive information

### User Management

- Use strong passwords
- Enable two-factor authentication
- Assign appropriate roles
- Review user access regularly
- Deactivate unused accounts

### Committee Management

- Keep committee rosters updated
- Review permissions regularly
- Maintain clear position descriptions
- Document committee procedures

## Troubleshooting

### Common Issues

**Members Can't Log In:**
- Verify account is active
- Check email is correct
- Reset password if needed
- Check for 2FA issues

**Emails Not Sending:**
- Verify SMTP settings
- Check email templates
- Review email logs
- Test SMTP connection

**Reports Not Generating:**
- Check date ranges
- Verify data exists
- Clear browser cache
- Try different browser

### Getting Help

- Check system logs
- Review documentation
- Contact support team
- Submit bug reports

## Security

### Best Practices

1. **Strong Passwords**: Require complex passwords
2. **Two-Factor Authentication**: Enable for all admins
3. **Regular Audits**: Review audit logs monthly
4. **Access Control**: Limit admin access
5. **Data Backup**: Automated daily backups
6. **SSL/HTTPS**: Always use encrypted connections
7. **Software Updates**: Keep system updated

### Audit Logs

1. Navigate to **Settings** > **Audit Log**
2. View all system actions:
   - User logins
   - Data changes
   - Permission changes
   - System configuration
3. Filter by:
   - User
   - Action type
   - Date range
4. Export logs for compliance

## Appendix

### Keyboard Shortcuts

- `Ctrl/Cmd + K`: Quick search
- `Ctrl/Cmd + S`: Save current form
- `Esc`: Close modal/dialog

### API Access

For advanced integrations, API documentation is available at:
`https://yourdomain.com/api/docs`

### Support Resources

- User Guide
- Video Tutorials
- FAQ
- Support Email
- Community Forum