#!/bin/bash

# Script to generate all admin pages based on the EventsAdmin template

echo "Generating admin pages..."

# Create admin pages directory
mkdir -p frontend/src/pages/admin

# Define page configurations
declare -A pages=(
  ["Documents"]="documents:title,category,file_size,visibility"
  ["EmailTemplates"]="email-templates:name,subject,template_type,is_active"
  ["EmailCampaigns"]="email-campaigns:name,subject,status,recipient_count"
  ["Committees"]="committees:name,email,member_count,is_active"
  ["Forum"]="forum/categories:name,description,display_order,is_active"
  ["Resources"]="resources:name,resource_type,capacity,is_active"
  ["Surveys"]="surveys:title,start_date,end_date,is_active"
  ["MailingLists"]="mailing-lists:name,email,list_type,subscriber_count"
  ["Workflows"]="workflows:name,trigger_type,is_active"
  ["MembershipTypes"]="membership-types:name,price,duration_months,is_active"
)

# Generate each admin page
for page in "${!pages[@]}"; do
  IFS=':' read -r endpoint columns <<< "${pages[$page]}"
  
  echo "Creating ${page}Admin.js..."
  
  cat > "frontend/src/pages/admin/${page}Admin.js" << EOF
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

function ${page}Admin() {
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
      const response = await api.get('/${endpoint}');
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
        await api.put(\`/${endpoint}/\${selectedItem.id}\`, formData);
        showSnackbar('Updated successfully');
      } else {
        await api.post('/${endpoint}', formData);
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
      await api.delete(\`/${endpoint}/\${deleteId}\`);
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
      await Promise.all(ids.map((id) => api.delete(\`/${endpoint}/\${id}\`)));
      showSnackbar(\`\${ids.length} items deleted successfully\`);
      fetchData();
    } catch (error) {
      showSnackbar('Failed to delete some items', 'error');
    }
  };

  const handleDuplicate = async (item) => {
    const duplicateData = {
      ...item,
      name: \`\${item.name || item.title} (Copy)\`,
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
        .join('\\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = \`${endpoint}_\${new Date().toISOString().split('T')[0]}.csv\`;
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
        ${page} Management
      </Typography>

      <AdminDataTable
        title="${page}"
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
        title={selectedItem ? 'Edit ${page}' : 'Create ${page}'}
        fields={formFields}
        initialData={selectedItem}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
        title="Delete ${page}"
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

export default ${page}Admin;
EOF

done

echo "✅ All admin pages generated!"
echo ""
echo "Next steps:"
echo "1. Customize columns and form fields for each page"
echo "2. Update App.js with new routes"
echo "3. Update Layout.js with navigation items"
echo "4. Test each page"
echo "5. Deploy to production"