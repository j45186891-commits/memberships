# Admin Content Management Guide

## Overview

This guide documents the enhanced admin and superadmin capabilities for managing content across all sections of the membership application. Admins and superadmins can now add, edit, and delete content through the API endpoints.

---

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [API Endpoints by Section](#api-endpoints-by-section)
3. [Frontend Integration](#frontend-integration)
4. [Security Considerations](#security-considerations)
5. [Migration Guide](#migration-guide)

---

## Authentication & Authorization

### Roles

The application supports three user roles:
- **member**: Regular users with limited access
- **admin**: Can manage most content and settings
- **super_admin**: Full access to all features including deletion of critical data

### Authorization Middleware

All admin endpoints use the `authorize` middleware:

```javascript
const { authenticate, authorize } = require('../middleware/auth');

// Admin and super_admin can access
router.post('/', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  // ...
});

// Only super_admin can access
router.delete('/:id', authenticate, authorize('super_admin'), async (req, res) => {
  // ...
});
```

---

## API Endpoints by Section

### 1. Membership Types

**Base URL**: `/api/membership-types`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | All | Get all membership types |
| GET | `/:id` | All | Get membership type by ID |
| POST | `/` | Admin, Super Admin | Create membership type |
| PUT | `/:id` | Admin, Super Admin | Update membership type |
| DELETE | `/:id` | Super Admin | Delete membership type |

**Create Example**:
```javascript
POST /api/membership-types
{
  "name": "Premium Membership",
  "slug": "premium",
  "description": "Full access membership",
  "price": 99.99,
  "duration_months": 12,
  "max_members": 1,
  "requires_approval": true,
  "is_active": true
}
```

**Update Example**:
```javascript
PUT /api/membership-types/:id
{
  "price": 89.99,
  "is_active": false
}
```

**Delete Restrictions**: Cannot delete membership types that are in use. Deactivate instead.

---

### 2. Events

**Base URL**: `/api/events`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Authenticated | Get all events |
| GET | `/:id` | Authenticated | Get event by ID |
| POST | `/` | Admin, Super Admin | Create event |
| PUT | `/:id` | Admin, Super Admin | Update event |
| DELETE | `/:id` | Admin, Super Admin | Delete event |
| POST | `/:id/register` | Authenticated | Register for event |

**Create Example**:
```javascript
POST /api/events
{
  "title": "Annual Gala",
  "description": "Join us for our annual gala event",
  "location": "Grand Hotel",
  "start_date": "2025-12-15T18:00:00Z",
  "end_date": "2025-12-15T23:00:00Z",
  "max_attendees": 200,
  "registration_deadline": "2025-12-10T23:59:59Z",
  "price": 50.00,
  "is_public": true
}
```

**Update Example**:
```javascript
PUT /api/events/:id
{
  "max_attendees": 250,
  "price": 45.00
}
```

**Delete Restrictions**: Cannot delete events with existing registrations. Cancel the event instead.

---

### 3. Documents

**Base URL**: `/api/documents`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Authenticated | Get all documents |
| GET | `/:id` | Authenticated | Get document by ID |
| POST | `/` | Admin, Super Admin | Upload document |
| PUT | `/:id` | Admin, Super Admin | Update document metadata |
| DELETE | `/:id` | Admin, Super Admin | Delete document |
| GET | `/:id/download` | Authenticated | Download document |

**Upload Example**:
```javascript
POST /api/documents
Content-Type: multipart/form-data

{
  "file": <file>,
  "title": "Annual Report 2024",
  "description": "Financial and operational report",
  "category": "Reports",
  "visibility": "public"
}
```

**Update Example**:
```javascript
PUT /api/documents/:id
{
  "title": "Annual Report 2024 (Updated)",
  "visibility": "private"
}
```

**Delete Behavior**: Deletes both database record and physical file.

---

### 4. Email Templates

**Base URL**: `/api/email-templates`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Admin, Super Admin | Get all templates |
| GET | `/:id` | Admin, Super Admin | Get template by ID |
| POST | `/` | Admin, Super Admin | Create template |
| PUT | `/:id` | Admin, Super Admin | Update template |
| DELETE | `/:id` | Super Admin | Delete template |

**Create Example**:
```javascript
POST /api/email-templates
{
  "name": "Welcome Email",
  "slug": "welcome-email",
  "subject": "Welcome to {{organization_name}}",
  "body_html": "<h1>Welcome {{first_name}}!</h1><p>Thank you for joining.</p>",
  "body_text": "Welcome {{first_name}}! Thank you for joining.",
  "template_type": "transactional",
  "variables": ["organization_name", "first_name"],
  "is_active": true
}
```

---

### 5. Email Campaigns

**Base URL**: `/api/email-campaigns`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Admin, Super Admin | Get all campaigns |
| GET | `/:id` | Admin, Super Admin | Get campaign by ID |
| POST | `/` | Admin, Super Admin | Create campaign |
| PUT | `/:id` | Admin, Super Admin | Update campaign |
| DELETE | `/:id` | Admin, Super Admin | Delete campaign |
| POST | `/:id/send` | Admin, Super Admin | Send campaign |

**Create Example**:
```javascript
POST /api/email-campaigns
{
  "name": "Monthly Newsletter",
  "template_id": "uuid-here",
  "subject": "Your Monthly Update",
  "body_html": "<h1>Newsletter</h1><p>Latest updates...</p>",
  "body_text": "Newsletter - Latest updates...",
  "scheduled_at": "2025-11-01T09:00:00Z"
}
```

**Delete Restrictions**: Cannot delete campaigns that have been sent or are being sent.

---

### 6. Committees

**Base URL**: `/api/committees`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Authenticated | Get all committees |
| GET | `/:id` | Authenticated | Get committee by ID |
| POST | `/` | Admin, Super Admin | Create committee |
| PUT | `/:id` | Admin, Super Admin | Update committee |
| DELETE | `/:id` | Admin, Super Admin | Delete committee |

**Create Example**:
```javascript
POST /api/committees
{
  "name": "Finance Committee",
  "description": "Oversees financial matters",
  "email": "finance@organization.com",
  "is_active": true
}
```

**Delete Restrictions**: Cannot delete committees with active members. Deactivate instead.

---

### 7. Forum Management

**Base URL**: `/api/forum`

#### Categories

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/categories` | Authenticated | Get all categories |
| POST | `/categories` | Admin, Super Admin | Create category |
| PUT | `/categories/:id` | Admin, Super Admin | Update category |
| DELETE | `/categories/:id` | Admin, Super Admin | Delete category |

**Create Category Example**:
```javascript
POST /api/forum/categories
{
  "name": "General Discussion",
  "description": "General topics and discussions",
  "display_order": 1,
  "is_active": true
}
```

#### Topics

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/topics` | Authenticated | Get all topics |
| POST | `/topics` | Authenticated | Create topic |
| PUT | `/topics/:id` | Author/Admin | Update topic |
| DELETE | `/topics/:id` | Author/Admin | Delete topic |

**Update Topic Example** (Admin only features):
```javascript
PUT /api/forum/topics/:id
{
  "is_pinned": true,
  "is_locked": false
}
```

#### Replies

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/topics/:id/replies` | Authenticated | Create reply |
| PUT | `/replies/:id` | Author/Admin | Update reply |
| DELETE | `/replies/:id` | Author/Admin | Delete reply |

---

### 8. Resources

**Base URL**: `/api/resources`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Authenticated | Get all resources |
| GET | `/:id` | Authenticated | Get resource by ID |
| POST | `/` | Admin, Super Admin | Create resource |
| PUT | `/:id` | Admin, Super Admin | Update resource |
| DELETE | `/:id` | Admin, Super Admin | Delete resource |

**Create Example**:
```javascript
POST /api/resources
{
  "name": "Conference Room A",
  "description": "Large conference room with AV equipment",
  "resource_type": "room",
  "capacity": 50,
  "settings": {
    "has_projector": true,
    "has_whiteboard": true
  }
}
```

**Delete Restrictions**: Cannot delete resources with active bookings. Deactivate instead.

---

### 9. Surveys

**Base URL**: `/api/surveys`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Authenticated | Get all surveys |
| GET | `/:id` | Authenticated | Get survey by ID |
| POST | `/` | Admin, Super Admin | Create survey |
| PUT | `/:id` | Admin, Super Admin | Update survey |
| DELETE | `/:id` | Admin, Super Admin | Delete survey |

**Create Example**:
```javascript
POST /api/surveys
{
  "title": "Member Satisfaction Survey",
  "description": "Help us improve our services",
  "questions": [
    {
      "id": 1,
      "type": "rating",
      "question": "How satisfied are you?",
      "required": true
    },
    {
      "id": 2,
      "type": "text",
      "question": "What can we improve?",
      "required": false
    }
  ],
  "start_date": "2025-11-01",
  "end_date": "2025-11-30"
}
```

**Delete Restrictions**: Cannot delete surveys with existing responses. Deactivate instead.

---

### 10. Mailing Lists

**Base URL**: `/api/mailing-lists`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Authenticated | Get all mailing lists |
| GET | `/:id` | Authenticated | Get mailing list by ID |
| POST | `/` | Admin, Super Admin | Create mailing list |
| PUT | `/:id` | Admin, Super Admin | Update mailing list |
| DELETE | `/:id` | Admin, Super Admin | Delete mailing list |

**Create Example**:
```javascript
POST /api/mailing-lists
{
  "name": "Newsletter Subscribers",
  "email": "newsletter@organization.com",
  "description": "Monthly newsletter recipients",
  "list_type": "manual",
  "auto_sync": false,
  "access_level": "public"
}
```

---

### 11. Workflows

**Base URL**: `/api/workflows`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Admin, Super Admin | Get all workflows |
| GET | `/:id` | Admin, Super Admin | Get workflow by ID |
| POST | `/` | Admin, Super Admin | Create workflow |
| PUT | `/:id` | Admin, Super Admin | Update workflow |
| DELETE | `/:id` | Admin, Super Admin | Delete workflow |

**Create Example**:
```javascript
POST /api/workflows
{
  "name": "New Member Welcome",
  "trigger_type": "membership_approved",
  "trigger_config": {
    "membership_type": "all"
  },
  "actions": [
    {
      "type": "send_email",
      "template_id": "welcome-email"
    },
    {
      "type": "add_to_mailing_list",
      "list_id": "newsletter-subscribers"
    }
  ],
  "is_active": true
}
```

---

## Frontend Integration

### Example React Component for Admin Data Table

```javascript
import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import api from '../services/api';

function AdminDataTable({ endpoint, columns, FormComponent }) {
  const [data, setData] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await api.get(endpoint);
      setData(response.data[Object.keys(response.data)[0]]);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleAdd = () => {
    setSelectedItem(null);
    setOpenDialog(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`${endpoint}/${id}`);
      fetchData();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting:', error);
      alert(error.response?.data?.error?.message || 'Failed to delete');
    }
  };

  const handleSave = async (formData) => {
    try {
      if (selectedItem) {
        await api.put(`${endpoint}/${selectedItem.id}`, formData);
      } else {
        await api.post(endpoint, formData);
      }
      fetchData();
      setOpenDialog(false);
    } catch (error) {
      console.error('Error saving:', error);
      alert(error.response?.data?.error?.message || 'Failed to save');
    }
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={<Add />}
        onClick={handleAdd}
        sx={{ mb: 2 }}
      >
        Add New
      </Button>

      <Table>
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell key={col.field}>{col.label}</TableCell>
            ))}
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              {columns.map((col) => (
                <TableCell key={col.field}>
                  {col.render ? col.render(item[col.field], item) : item[col.field]}
                </TableCell>
              ))}
              <TableCell>
                <IconButton onClick={() => handleEdit(item)}>
                  <Edit />
                </IconButton>
                <IconButton onClick={() => setDeleteConfirm(item)}>
                  <Delete />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Form Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedItem ? 'Edit' : 'Add New'}</DialogTitle>
        <DialogContent>
          <FormComponent
            initialData={selectedItem}
            onSave={handleSave}
            onCancel={() => setOpenDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this item? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button
            onClick={() => handleDelete(deleteConfirm.id)}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default AdminDataTable;
```

### Usage Example

```javascript
import AdminDataTable from '../components/AdminDataTable';
import EventForm from '../components/forms/EventForm';

function EventsPage() {
  const columns = [
    { field: 'title', label: 'Title' },
    { field: 'location', label: 'Location' },
    { 
      field: 'start_date', 
      label: 'Start Date',
      render: (value) => new Date(value).toLocaleDateString()
    },
    { field: 'max_attendees', label: 'Max Attendees' }
  ];

  return (
    <div>
      <h1>Events Management</h1>
      <AdminDataTable
        endpoint="/api/events"
        columns={columns}
        FormComponent={EventForm}
      />
    </div>
  );
}
```

---

## Security Considerations

### 1. Authorization Checks

All admin endpoints verify:
- User is authenticated (valid JWT token)
- User has required role (admin or super_admin)
- User belongs to the correct organization

### 2. Data Validation

- All inputs are validated using express-validator
- SQL injection prevention through parameterized queries
- XSS protection through input sanitization

### 3. Audit Logging

Critical operations are logged:
```javascript
await logAudit(db, {
  organization_id: req.user.organization_id,
  user_id: req.user.id,
  action: 'resource_deleted',
  entity_type: 'resource',
  entity_id: id,
  ip_address: req.ip
});
```

### 4. Soft Deletes vs Hard Deletes

- **Soft Delete**: Used for data with dependencies (deactivate instead)
- **Hard Delete**: Only for data without dependencies or when explicitly confirmed

### 5. Delete Restrictions

Many endpoints prevent deletion when:
- Items are in active use
- Items have dependent records
- Items have been sent/published

In these cases, deactivation is recommended instead.

---

## Migration Guide

### For Existing Installations

1. **Backup Database**:
   ```bash
   pg_dump -U membership_user membership_db > backup.sql
   ```

2. **Pull Latest Code**:
   ```bash
   git pull origin main
   ```

3. **Install Dependencies**:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

4. **Restart Services**:
   ```bash
   pm2 restart membership-backend
   pm2 restart membership-frontend
   ```

5. **Verify Endpoints**:
   Test each endpoint with your admin credentials to ensure proper functionality.

### Testing Checklist

- [ ] Can create new items in each section
- [ ] Can edit existing items
- [ ] Can delete items (with proper restrictions)
- [ ] Authorization works correctly (admin vs super_admin)
- [ ] Error messages are clear and helpful
- [ ] Audit logs are being created
- [ ] UI components render correctly
- [ ] Form validation works

---

## API Response Formats

### Success Response

```json
{
  "message": "Resource created successfully",
  "resource": {
    "id": "uuid-here",
    "name": "Resource Name",
    ...
  }
}
```

### Error Response

```json
{
  "error": {
    "message": "Cannot delete resource with active bookings"
  }
}
```

### Validation Error Response

```json
{
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

---

## Support

For issues or questions:
1. Check the error message for specific guidance
2. Review the audit logs for detailed operation history
3. Consult the main documentation in `/docs`
4. Contact the development team

---

## Changelog

### Version 2.0 (Current)
- Added full CRUD operations for all content sections
- Enhanced authorization for admin and super_admin roles
- Improved error handling and validation
- Added comprehensive audit logging
- Updated frontend components for admin management

### Version 1.0
- Initial release with basic admin capabilities
- Manual database editing required for most operations

---

**Last Updated**: 2025-10-08
**Version**: 2.0.0