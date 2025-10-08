import React from 'react';
import { Box, Typography } from '@mui/material';

export default function UserProfile() {
  return (
    <Box>
      <Typography variant="h4">My Profile</Typography>
      <Typography variant="body1" sx={{ mt: 2 }}>View and edit your profile.</Typography>
    </Box>
  );
}