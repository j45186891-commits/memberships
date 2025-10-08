import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Paper, Grid, Button, Chip } from '@mui/material';
import { membershipsAPI } from '../services/api';

export default function MembershipDetail() {
  const { id } = useParams();
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMembership();
  }, [id]);

  const loadMembership = async () => {
    try {
      const response = await membershipsAPI.getById(id);
      setMembership(response.data.membership);
    } catch (error) {
      console.error('Failed to load membership:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Typography>Loading...</Typography>;
  if (!membership) return <Typography>Membership not found</Typography>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Membership Details
      </Typography>
      
      <Paper sx={{ p: 3, mt: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">Name</Typography>
            <Typography variant="body1">{membership.first_name} {membership.last_name}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">Email</Typography>
            <Typography variant="body1">{membership.email}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">Membership Type</Typography>
            <Typography variant="body1">{membership.membership_type_name}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">Status</Typography>
            <Chip label={membership.status} color={membership.status === 'active' ? 'success' : 'default'} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">Start Date</Typography>
            <Typography variant="body1">{membership.start_date || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">End Date</Typography>
            <Typography variant="body1">{membership.end_date || 'N/A'}</Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}