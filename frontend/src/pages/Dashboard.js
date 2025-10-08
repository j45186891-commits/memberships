import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
} from '@mui/material';
import {
  People as PeopleIcon,
  CardMembership as MembershipIcon,
  TrendingUp as TrendingUpIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { organizationAPI, analyticsAPI } from '../services/api';

export default function Dashboard() {
  const [statistics, setStatistics] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      if (user.role === 'admin' || user.role === 'super_admin') {
        const [statsRes, analyticsRes] = await Promise.all([
          organizationAPI.getStatistics(),
          analyticsAPI.getDashboard(),
        ]);
        setStatistics(statsRes.data.statistics);
        setAnalytics(analyticsRes.data.analytics);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const StatCard = ({ title, value, icon, color }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4">
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              backgroundColor: color,
              borderRadius: '50%',
              width: 56,
              height: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (user.role === 'member') {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Welcome, {user.first_name}!
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          This is your member dashboard. Use the navigation menu to access different features.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      {statistics && (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Members"
              value={statistics.total_members}
              icon={<PeopleIcon sx={{ color: 'white' }} />}
              color="#1976d2"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Active Memberships"
              value={statistics.active_memberships}
              icon={<MembershipIcon sx={{ color: 'white' }} />}
              color="#2e7d32"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Pending Applications"
              value={statistics.pending_memberships}
              icon={<TrendingUpIcon sx={{ color: 'white' }} />}
              color="#ed6c02"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Upcoming Events"
              value={statistics.upcoming_events}
              icon={<EventIcon sx={{ color: 'white' }} />}
              color="#9c27b0"
            />
          </Grid>
        </Grid>
      )}

      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {statistics?.recent_activity || 0} actions in the last 7 days
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Expiring Soon
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {statistics?.expiring_soon || 0} memberships expiring in the next 30 days
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}