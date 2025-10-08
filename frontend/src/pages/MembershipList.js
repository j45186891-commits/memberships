import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, Chip } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { membershipsAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function MembershipList() {
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadMemberships();
  }, []);

  const loadMemberships = async () => {
    try {
      const response = await membershipsAPI.getAll();
      setMemberships(response.data.memberships);
    } catch (error) {
      console.error('Failed to load memberships:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { field: 'first_name', headerName: 'First Name', width: 150 },
    { field: 'last_name', headerName: 'Last Name', width: 150 },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'membership_type_name', headerName: 'Type', width: 150 },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={
            params.value === 'active' ? 'success' :
            params.value === 'pending' ? 'warning' : 'default'
          }
          size="small"
        />
      ),
    },
    { field: 'start_date', headerName: 'Start Date', width: 120 },
    { field: 'end_date', headerName: 'End Date', width: 120 },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Memberships</Typography>
      </Box>
      
      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={memberships}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          loading={loading}
          onRowClick={(params) => navigate(`/memberships/${params.id}`)}
          sx={{ cursor: 'pointer' }}
        />
      </Paper>
    </Box>
  );
}