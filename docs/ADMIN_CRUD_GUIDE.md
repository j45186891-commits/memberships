# Admin Content Management Guide

## Overview

This guide documents the complete CRUD (Create, Read, Update, Delete) capabilities added for administrators and super administrators across all sections of the membership management application.

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [API Endpoints by Section](#api-endpoints-by-section)
3. [Usage Examples](#usage-examples)
4. [Frontend Integration](#frontend-integration)
5. [Security Considerations](#security-considerations)

---

## Authentication & Authorization

### Roles

The system supports three user roles:
- **member**: Regular members with limited access
- **admin**: Administrators with full CRUD access to most content
- **super_admin**: Super administrators with unrestricted access including deletion of critical data

### Authorization Middleware

All admin endpoints use the `authorize` middleware:

```javascript
const { authenticate, authorize } = require('../middleware/auth');

// Admin and Super Admin access
router.post('/', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  // Handler code
});

// Super Admin only
router.delete('/:id', authenticate, authorize('super_admin'), async (req, res) => {
  // Handler code
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
| POST | `/:id/custom-fields` | Admin, Super Admin | Add custom field |
| DELETE | `/:id/custom-fields/:field_id` | Admin, Super Admin | Delete custom field |

**Notes**:
- Cannot delete membership types that are in use
- Deactivate instead by setting `is_active: false`

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

**Notes**:
- Cannot delete events with existing registrations
- Cancel events by updating status instead

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

**Notes**:
- File upload uses multipart/form-data
- Deleting a document also removes the file from the filesystem

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

**Notes**:
- Templates support variable substitution
- Use for automated emails and campaigns

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

**Notes**:
- Cannot edit or delete campaigns that have been sent
- Campaigns are sent asynchronously

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
| POST | `/:id/positions` | Admin, Super Admin | Add position |
| PUT | `/:id/positions/:position_id` | Admin, Super Admin | Update position |
| DELETE | `/:id/positions/:position_id` | Admin, Super Admin | Delete position |
| POST | `/:id/members` | Admin, Super Admin | Add member |
| DELETE | `/:id/members/:member_id` | Admin, Super Admin | Remove member |

**Notes**:
- Cannot delete committees with active members
- Deleting a committee also removes associated mailing list

---

### 7. Forum

**Base URL**: `/api/forum`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/categories` | Authenticated | Get all categories |
| POST | `/categories` | Admin, Super Admin | Create category |
| PUT | `/categories/:id` | Admin, Super Admin | Update category |
| DELETE | `/categories/:id` | Admin, Super Admin | Delete category |
| GET | `/topics` | Authenticated | Get all topics |
| POST | `/topics` | Authenticated | Create topic |
| PUT | `/topics/:id` | Author or Admin | Update topic |
| DELETE | `/topics/:id` | Author or Admin | Delete topic |
| POST | `/topics/:id/replies` | Authenticated | Create reply |
| PUT | `/replies/:id` | Author or Admin | Update reply |
| DELETE | `/replies/:id` | Author or Admin | Delete reply |

**Notes**:
- Cannot delete categories with existing topics
- Admins can moderate all content
- Regular users can only edit/delete their own content

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
| POST | `/:id/bookings` | Authenticated | Create booking |

**Notes**:
- Cannot delete resources with active bookings
- Deactivate instead by setting `is_active: false`

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
| POST | `/:id/responses` | Authenticated | Submit response |

**Notes**:
- Cannot delete surveys with existing responses
- Deactivate instead by setting `is_active: false`

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
| POST | `/:id/subscribers` | Admin, Super Admin | Add subscriber |
| DELETE | `/:id/subscribers/:user_id` | Admin, Super Admin | Remove subscriber |

**Notes**:
- Auto-sync lists are automatically updated
- Deleting a list removes all subscribers

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

**Notes**:
- Workflows automate actions based on triggers
- Deleting a workflow removes all execution history

---

## Usage Examples

### Creating an Event

```javascript
// POST /api/events
const response = await fetch('/api/events', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    title: 'Annual General Meeting',
    description: 'Our yearly AGM for all members',
    location: 'Community Hall',
    start_date: '2025-06-15T10:00:00Z',
    end_date: '2025-06-15T14:00:00Z',
    max_attendees: 100,
    registration_deadline: '2025-06-10T23:59:59Z',
    price: 0,
    is_public: true
  })
});

const data = await response.json();
console.log('Event created:', data.event);
```

### Updating a Document

```javascript
// PUT /api/documents/:id
const response = await fetch(`/api/documents/${documentId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    title: 'Updated Document Title',
    description: 'New description',
    category: 'policies',
    visibility: 'public'
  })
});

const data = await response.json();
console.log('Document updated:', data.message);
```

### Deleting a Survey

```javascript
// DELETE /api/surveys/:id
const response = await fetch(`/api/surveys/${surveyId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
console.log('Survey deleted:', data.message);
```

### Creating a Forum Category

```javascript
// POST /api/forum/categories
const response = await fetch('/api/forum/categories', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'General Discussion',
    description: 'General topics and discussions',
    display_order: 0,
    is_active: true
  })
});

const data = await response.json();
console.log('Category created:', data.category);
```

---

## Frontend Integration

### React Component Example

```jsx
import React, { useState, useEffect } from 'react';
import { Button, Dialog, TextField } from '@mui/material';
import api from '../services/api';

function EventManagement() {
  const [events, setEvents] = useState([]);
  const [editDialog, setEditDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    const response = await api.get('/events');
    setEvents(response.data.events);
  };

  const handleEdit = (event) => {
    setSelectedEvent(event);
    setEditDialog(true);
  };

  const handleSave = async () => {
    await api.put(`/events/${selectedEvent.id}`, selectedEvent);
    setEditDialog(false);
    loadEvents();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      await api.delete(`/events/${id}`);
      loadEvents();
    }
  };

  return (
    <div>
      <h1>Event Management</h1>
      {events.map(event => (
        <div key={event.id}>
          <h3>{event.title}</h3>
          <Button onClick={() => handleEdit(event)}>Edit</Button>
          <Button onClick={() => handleDelete(event.id)}>Delete</Button>
        </div>
      ))}
      
      {/* Edit Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)}>
        {/* Form fields */}
        <Button onClick={handleSave}>Save</Button>
      </Dialog>
    </div>
  );
}

export default EventManagement;
```

---

## Security Considerations

### 1. Authorization Checks

All endpoints verify:
- User is authenticated (valid JWT token)
- User has required role (admin or super_admin)
- User belongs to the correct organization

### 2. Data Validation

- Input validation using express-validator
- SQL injection prevention through parameterized queries
- XSS protection through input sanitization

### 3. Audit Logging

All admin actions are logged:
- User ID
- Action type
- Entity type and ID
- Timestamp
- IP address

### 4. Deletion Safeguards

- Cannot delete items with dependencies
- Soft delete options available (deactivate)
- Confirmation required for destructive actions

### 5. Rate Limiting

- API rate limiting: 100 requests per 15 minutes
- Prevents abuse and DoS attacks

---

## Migration from Manual Database Editing

### Before (Manual Database Editing)

```sql
-- Had to connect to database via terminal
psql -U membership_user -d membership_db

-- Manually insert/update/delete records
INSERT INTO events (organization_id, title, description, ...)
VALUES ('...', 'Event Title', 'Description', ...);

UPDATE documents SET title = 'New Title' WHERE id = '...';

DELETE FROM surveys WHERE id = '...';
```

### After (API-Based Management)

```javascript
// Use the web interface or API calls
// No direct database access needed
// All actions logged and validated
// User-friendly interface
// Role-based access control
```

---

## Testing Checklist

### For Each Section:

- [ ] Create new item
- [ ] View all items
- [ ] View single item
- [ ] Update item
- [ ] Delete item (if no dependencies)
- [ ] Verify authorization (admin/super_admin only)
- [ ] Verify audit logging
- [ ] Test error handling
- [ ] Test validation

---

## Support

For issues or questions:
1. Check the API response for error messages
2. Review the audit log for action history
3. Verify user role and permissions
4. Consult the main documentation

---

**Last Updated**: 2025-10-08
**Version**: 1.0.0