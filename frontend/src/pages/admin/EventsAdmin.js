import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Alert,
  Snackbar,
  Chip
} from '@mui/material';
import AdminDataTable from '../../components/admin/AdminDataTable';
import AdminFormDialog from '../../components/admin/AdminFormDialog';
import DeleteConfirmDialog from '../../components/admin/DeleteConfirmDialog';
import api from '../../services/api';

function EventsAdmin() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const columns = [
    { field: 'title', label: 'Title' },
    { field: 'location', label: 'Location' },
    {
      field: 'start_date',
      label: 'Start Date',
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      field: 'max_attendees',
      label: 'Capacity',
      render: (value) => value || 'Unlimited'
    },
    {
      field: 'price',
      label: 'Price',
      render: (value) => `$${parseFloat(value || 0).toFixed(2)}`
    },
    {
      field: 'is_public',
      label: 'Visibility',
      render: (value) => (
        <Chip
          label={value ? 'Public' : 'Private'}
          color={value ? 'success' : 'default'}
          size="small"
        />
      )
    }
  ];

  const formFields = [
    {
      name: 'title',
      label: 'Event Title',
      type: 'text',
      required: true,
      fullWidth: true
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      rows: 4,
      fullWidth: true
    },
    {
      name: 'location',
      label: 'Location',
      type: 'text',
      required: true
    },
    {
      name: 'start_date',
      label: 'Start Date & Time',
      type: 'datetime',
      required: true
    },
    {
      name: 'end_date',
      label: 'End Date & Time',
      type: 'datetime',
      required: true
    },
    {
      name: 'max_attendees',
      label: 'Maximum Attendees',
      type: 'number',
      helperText: 'Leave empty for unlimited'
    },
    {
      name: 'registration_deadline',
      label: 'Registration Deadline',
      type: 'datetime'
    },
    {
      name: 'price',
      label: 'Price',
      type: 'number',
      defaultValue: 0
    },
    {
      name: 'is_public',
      label: 'Public Event',
      type: 'switch',
      defaultValue: true
    }
  ];

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/events');
      setEvents(response.data.events);
    } catch (error) {
      showSnackbar('Failed to load events', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedEvent(null);
    setFormOpen(true);
  };

  const handleEdit = (event) => {
    setSelectedEvent(event);
    setFormOpen(true);
  };

  const handleSave = async (formData) => {
    try {
      if (selectedEvent) {
        await api.put(`/events/${selectedEvent.id}`, formData);
        showSnackbar('Event updated successfully');
      } else {
        await api.post('/events', formData);
        showSnackbar('Event created successfully');
      }
      fetchEvents();
      setFormOpen(false);
    } catch (error) {
      throw error;
    }
  };

  const handleDelete = (id) => {
    setDeleteId(id);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/events/${deleteId}`);
      showSnackbar('Event deleted successfully');
      fetchEvents();
    } catch (error) {
      showSnackbar(
        error.response?.data?.error?.message || 'Failed to delete event',
        'error'
      );
    }
  };

  const handleBulkDelete = async (ids) => {
    try {
      await Promise.all(ids.map((id) => api.delete(`/events/${id}`)));
      showSnackbar(`${ids.length} events deleted successfully`);
      fetchEvents();
    } catch (error) {
      showSnackbar('Failed to delete some events', 'error');
    }
  };

  const handleDuplicate = async (event) => {
    const duplicateData = {
      ...event,
      title: `${event.title} (Copy)`,
      id: undefined,
      created_at: undefined,
      updated_at: undefined
    };
    setSelectedEvent(duplicateData);
    setFormOpen(true);
  };

  const handleExport = async (selectedIds) => {
    try {
      const dataToExport = selectedIds
        ? events.filter((e) => selectedIds.includes(e.id))
        : events;

      const csv = [
        ['Title', 'Location', 'Start Date', 'End Date', 'Max Attendees', 'Price', 'Public'],
        ...dataToExport.map((e) => [
          e.title,
          e.location,
          e.start_date,
          e.end_date,
          e.max_attendees || 'Unlimited',
          e.price,
          e.is_public ? 'Yes' : 'No'
        ])
      ]
        .map((row) => row.join(','))
        .join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `events_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      showSnackbar('Events exported successfully');
    } catch (error) {
      showSnackbar('Failed to export events', 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Events Management
      </Typography>

      <AdminDataTable
        title="Events"
        columns={columns}
        data={events}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBulkDelete={handleBulkDelete}
        onDuplicate={handleDuplicate}
        onExport={handleExport}
        loading={loading}
        duplicatable
      />

      <AdminFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        title={selectedEvent ? 'Edit Event' : 'Create Event'}
        fields={formFields}
        initialData={selectedEvent}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Event"
        message="Are you sure you want to delete this event?"
        warning="Events with registrations cannot be deleted. Cancel the event instead."
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default EventsAdmin;