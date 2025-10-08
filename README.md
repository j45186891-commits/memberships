# Membership Management System

A comprehensive, full-featured membership management application designed for organizations to efficiently manage members, committees, events, communications, and more.

## 🌟 Features

### Core Features

#### 1. **Membership Management**
- Custom signup forms with dynamic fields
- Flexible pricing and duration options for membership types
- Support for multiple linked membership types per member
- Adult, Junior, Family, Dog, and Life membership types
- Automatic approval workflows
- Renewal management with reminders
- Expiry tracking and notifications

#### 2. **User Management**
- Role-based access control (Member, Admin, Super Admin)
- User profiles with customizable fields
- Two-factor authentication (2FA)
- Password management and security
- User activity tracking
- Bulk user operations

#### 3. **Committee & Group Management**
- Create and manage committees
- Define positions with specific permissions
- Automatic mailing list synchronization
- Role-based access tied to positions
- Committee member management
- Position-based email sending capabilities

#### 4. **Communications**
- Email template library with variable support
- Email campaign management
- In-app notifications
- Automated workflows for:
  - Welcome emails on approval
  - Renewal reminders
  - Expiry notices
  - Event notifications
- Personalized email sending with database fields
- Campaign analytics (opens, clicks, bounces)

#### 5. **Document Management**
- Document library with upload/download
- Category organization
- Public/private visibility controls
- Download tracking
- Version control
- Access logging

#### 6. **Event Management**
- Create and manage events
- Event registration system
- Attendance tracking
- Maximum capacity management
- Registration deadlines
- Event reminders
- Payment integration for paid events

#### 7. **Analytics & Reporting**
- Advanced dashboard with charts and visualizations
- Custom report builder
- Export capabilities (CSV, PDF)
- Member analytics and statistics
- Revenue tracking
- Engagement metrics
- Growth trends

#### 8. **Organization Branding**
- Customizable logo
- Color scheme customization
- Organization information management
- Email branding
- Custom domain support

### Enhanced Features (30+ Additional)

#### 9. **Payment Integration**
- Stripe and PayPal support
- Membership payment processing
- Event payment handling
- Payment history tracking
- Automated receipts
- Refund management

#### 10. **Resource Booking System**
- Bookable resources (rooms, equipment, facilities)
- Availability calendar
- Booking approval workflow
- Conflict detection
- Booking history

#### 11. **Forum & Discussion Board**
- Category-based discussions
- Topic creation and replies
- Pinned and locked topics
- User mentions
- Moderation tools
- Search functionality

#### 12. **Survey & Feedback System**
- Create custom surveys
- Multiple question types
- Response collection
- Analytics and reporting
- Anonymous responses option

#### 13. **Volunteer Management**
- Volunteer opportunity posting
- Sign-up tracking
- Hour logging
- Volunteer recognition

#### 14. **Member Directory**
- Searchable member list
- Privacy controls
- Contact information
- Profile pictures
- Export capabilities

#### 15. **Advanced Search & Filtering**
- Global search
- Advanced filters
- Saved searches
- Quick filters
- Search history

#### 16. **Audit Logging**
- Complete activity tracking
- User action logs
- System change history
- Security audit trail
- Compliance reporting

#### 17. **Data Import/Export**
- CSV import for bulk operations
- Excel export
- PDF generation
- Backup and restore
- Data migration tools

#### 18. **Workflow Automation**
- Custom workflow builder
- Trigger-based actions
- Conditional logic
- Multi-step workflows
- Workflow templates

#### 19. **Mobile-Responsive Design**
- Progressive Web App (PWA) features
- Touch-optimized interface
- Mobile-friendly forms
- Responsive tables
- Mobile notifications

#### 20. **Multi-Language Support**
- Internationalization ready
- Language selection
- Translatable content
- RTL support

#### 21. **Custom Fields System**
- Add custom fields to any entity
- Multiple field types
- Validation rules
- Conditional visibility

#### 22. **Integration Webhooks**
- REST API
- Webhook endpoints
- Third-party integrations
- API documentation
- Rate limiting

#### 23. **Backup & Restore**
- Automated daily backups
- Manual backup triggers
- Point-in-time restore
- Backup verification

#### 24. **Member Engagement Scoring**
- Activity tracking
- Engagement metrics
- Participation scoring
- Recognition system

#### 25. **Renewal Automation**
- Automatic renewal reminders
- Payment link generation
- Grace period management
- Lapsed member recovery

#### 26. **Feature Flags**
- Enable/disable features
- Feature-specific settings
- Gradual rollout support
- A/B testing capability

#### 27. **Mailing List Management**
- Multiple mailing lists
- Auto-sync with committees
- Subscriber management
- List segmentation
- Unsubscribe handling

#### 28. **Notification Center**
- Centralized notifications
- Multiple notification types
- Read/unread tracking
- Notification preferences
- Email digest options

#### 29. **Advanced Permissions**
- Granular permission system
- Custom permission sets
- Permission inheritance
- Role templates

#### 30. **Compliance Tools**
- GDPR compliance features
- Data export for users
- Right to be forgotten
- Consent management
- Privacy policy acceptance

## 🚀 Quick Start

### Prerequisites

- Ubuntu 20.04+ or Debian 11+
- Node.js 20.x
- PostgreSQL 12+
- Nginx
- Domain name with DNS configured

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd membership-app
   ```

2. **Run deployment script**
   ```bash
   cd deployment
   sudo chmod +x deploy.sh
   sudo ./deploy.sh
   ```

3. **Follow the prompts**
   - Enter your domain name
   - Provide admin email
   - Set database password
   - Configure SMTP settings

4. **Access your application**
   - Navigate to https://yourdomain.com
   - Login with provided admin credentials
   - Change default password immediately

For detailed installation instructions, see [Deployment Guide](docs/DEPLOYMENT_GUIDE.md).

## 📚 Documentation

- **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** - Complete deployment instructions
- **[Administrator Guide](docs/ADMIN_GUIDE.md)** - Admin features and management
- **[User Guide](docs/USER_GUIDE.md)** - End-user documentation
- **[API Documentation](docs/API_DOCUMENTATION.md)** - REST API reference

## 🏗️ Architecture

### Technology Stack

**Backend:**
- Node.js 20.x with Express.js
- PostgreSQL database
- JWT authentication
- Nodemailer for emails
- Multer for file uploads
- Node-cron for scheduled tasks

**Frontend:**
- React 18
- Material-UI (MUI)
- React Router
- Axios for API calls
- Chart.js for visualizations
- Formik for forms

**Infrastructure:**
- Nginx reverse proxy
- PM2 process manager
- Certbot for SSL
- Docker support (optional)

### System Architecture

```
┌─────────────────┐
│   Web Browser   │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│     Nginx       │
│  (Reverse Proxy)│
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌──────────┐
│ React  │ │ Express  │
│Frontend│ │ Backend  │
└────────┘ └─────┬────┘
              │
              ▼
         ┌──────────┐
         │PostgreSQL│
         │ Database │
         └──────────┘
```

## 🔧 Configuration

### Environment Variables

Key configuration options:

```env
# Server
NODE_ENV=production
PORT=5000
API_URL=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=membership_db
DB_USER=membership_user
DB_PASSWORD=your_password

# Authentication
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Features
ENABLE_PAYMENTS=true
ENABLE_EVENTS=true
ENABLE_FORUM=true
ENABLE_2FA=true
```

## 🔐 Security

- JWT-based authentication
- Bcrypt password hashing
- Two-factor authentication support
- Rate limiting on API endpoints
- SQL injection prevention
- XSS protection
- CSRF protection
- Helmet.js security headers
- SSL/HTTPS enforcement
- Audit logging

## 📊 Database Schema

The system uses PostgreSQL with the following main tables:

- `organizations` - Organization details
- `users` - User accounts
- `memberships` - Membership records
- `membership_types` - Membership type definitions
- `committees` - Committee information
- `committee_members` - Committee membership
- `email_templates` - Email templates
- `email_campaigns` - Email campaigns
- `documents` - Document library
- `events` - Event management
- `payments` - Payment records
- `audit_log` - System audit trail

See [database/schema.sql](database/schema.sql) for complete schema.

## 🛠️ Development

### Local Development Setup

1. **Install dependencies**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Setup database**
   ```bash
   createdb membership_db
   psql membership_db < database/schema.sql
   ```

3. **Configure environment**
   ```bash
   cp backend/.env.example backend/.env
   # Edit .env with your settings
   ```

4. **Start development servers**
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev

   # Terminal 2 - Frontend
   cd frontend && npm start
   ```

### Running Tests

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

## 🚢 Deployment

### Production Deployment

Use the automated deployment script:

```bash
sudo ./deployment/deploy.sh
```

### Manual Deployment

See [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) for manual deployment steps.

### Docker Deployment

```bash
docker-compose up -d
```

## 📈 Monitoring

### Application Monitoring

- PM2 monitoring: `pm2 monit`
- Application logs: `pm2 logs membership-backend`
- Nginx logs: `/var/log/nginx/`

### Database Monitoring

```bash
# Check database size
psql -U membership_user -d membership_db -c "SELECT pg_size_pretty(pg_database_size('membership_db'));"

# Active connections
psql -U membership_user -d membership_db -c "SELECT count(*) FROM pg_stat_activity;"
```

## 🔄 Backup & Restore

### Automated Backups

Backups run daily at 2 AM:
- Database backup: `/var/backups/membership/db_*.sql.gz`
- Uploads backup: `/var/backups/membership/uploads_*.tar.gz`

### Manual Backup

```bash
/usr/local/bin/backup-membership.sh
```

### Restore from Backup

```bash
# Restore database
gunzip < backup.sql.gz | psql -U membership_user membership_db

# Restore uploads
tar -xzf uploads_backup.tar.gz -C /opt/membership-app/backend/
```

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with Node.js and React
- UI components from Material-UI
- Icons from Material Icons
- Email service via Nodemailer

## 📞 Support

For support and questions:

- **Documentation**: Check the docs folder
- **Issues**: Submit via GitHub Issues
- **Email**: support@yourorganization.com

## 🗺️ Roadmap

### Upcoming Features

- [ ] Mobile native apps (iOS/Android)
- [ ] Advanced analytics dashboard
- [ ] AI-powered member insights
- [ ] Social media integration
- [ ] Video conferencing integration
- [ ] Advanced reporting tools
- [ ] Multi-organization support
- [ ] Marketplace for extensions

## 📊 System Requirements

### Minimum Requirements
- 2GB RAM
- 2 CPU cores
- 20GB storage
- Ubuntu 20.04+ or Debian 11+

### Recommended Requirements
- 4GB RAM
- 4 CPU cores
- 50GB storage
- Ubuntu 22.04 LTS

## 🔍 Troubleshooting

Common issues and solutions:

**Application won't start:**
- Check PM2 logs: `pm2 logs`
- Verify database connection
- Check environment variables

**Database connection errors:**
- Verify PostgreSQL is running
- Check credentials in .env
- Test connection: `psql -U membership_user -d membership_db`

**Email not sending:**
- Verify SMTP settings
- Check firewall rules
- Test SMTP connection

See [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) for more troubleshooting tips.

## 📅 Version History

### Version 1.0.0 (Current)
- Initial release
- Core membership management
- Email system
- Committee management
- Event management
- Document library
- Forum
- Analytics dashboard
- 30+ enhanced features

## 🎯 Use Cases

This system is perfect for:

- Professional associations
- Sports clubs
- Community organizations
- Non-profit organizations
- Alumni associations
- Trade unions
- Hobby clubs
- Religious organizations
- Homeowner associations

## 💡 Key Benefits

- **All-in-One Solution**: Everything you need in one platform
- **Easy to Deploy**: Automated deployment script
- **Secure**: Built with security best practices
- **Scalable**: Handles growing membership
- **Customizable**: Flexible configuration options
- **Mobile-Friendly**: Works on all devices
- **Well-Documented**: Comprehensive guides
- **Open Source**: MIT licensed

## 🌐 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📱 Mobile Support

- Responsive design
- Touch-optimized interface
- Mobile-friendly forms
- PWA capabilities
- Offline support (coming soon)

---

**Built with ❤️ by NinjaTech AI**

For more information, visit our [documentation](docs/) or contact support.# memberships
# memberships
# memberships
