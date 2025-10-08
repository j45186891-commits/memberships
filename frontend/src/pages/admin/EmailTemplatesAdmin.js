import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Snackbar,
  Alert
} from '@mui/material';
import AdminDataTable from '../../components/admin/AdminDataTable';
import AdminFormDialog from '../../components/admin/AdminFormDialog';
import DeleteConfirmDialog from '../../components/admin/DeleteConfirmDialog';
import api from '../../services/api';

function EmailTemplatesAdmin() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Define columns based on the entity
  const columns = [
    // Add columns dynamically based on entity
    // This is a template - customize for each entity
  ];

  // Define form fields
  const formFields = [
    // Add form fields dynamically
    // This is a template - customize for each entity
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/email-templates');
      const key = Object.keys(response.data)[0];
      setData(response.data[key]);
    } catch (error) {
      showSnackbar('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedItem(null);
    setFormOpen(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setFormOpen(true);
  };

  const handleSave = async (formData) => {
    try {
      if (selectedItem) {
        await api.put(`/email-templates/${selectedItem.id}`, formData);
        showSnackbar('Updated successfully');
      } else {
        await api.post('/email-templates', formData);
        showSnackbar('Created successfully');
      }
      fetchData();
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
      await api.delete(`/email-templates/${deleteId}`);
      showSnackbar('Deleted successfully');
      fetchData();
    } catch (error) {
      showSnackbar(
        error.response?.data?.error?.message || 'Failed to delete',
        'error'
      );
    }
  };

  const handleBulkDelete = async (ids) => {
    try {
      await Promise.all(ids.map((id) => api.delete(`/email-templates/${id}`)));
      showSnackbar(`${ids.length} items deleted successfully`);
      fetchData();
    } catch (error) {
      showSnackbar('Failed to delete some items', 'error');
    }
  };

  const handleDuplicate = async (item) => {
    const duplicateData = {
      ...item,
      name: `${item.name || item.title} (Copy)`,
      id: undefined,
      created_at: undefined,
      updated_at: undefined
    };
    setSelectedItem(duplicateData);
    setFormOpen(true);
  };

  const handleExport = async (selectedIds) => {
    try {
      const dataToExport = selectedIds
        ? data.filter((item) => selectedIds.includes(item.id))
        : data;

      const csv = [
        columns.map(col => col.label),
        ...dataToExport.map((item) =>
          columns.map(col => item[col.field] || '')
        )
      ]
        .map((row) => row.join(','))
        .join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `email-templates_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      showSnackbar('Exported successfully');
    } catch (error) {
      showSnackbar('Failed to export', 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        EmailTemplates Management
      </Typography>

      <AdminDataTable
        title="EmailTemplates"
        columns={columns}
        data={data}
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
        title={selectedItem ? 'Edit EmailTemplates' : 'Create EmailTemplates'}
        fields={formFields}
        initialData={selectedItem}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
        title="Delete EmailTemplates"
        message="Are you sure you want to delete this item?"
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

export default EmailTemplatesAdmin;
