import React from 'react';
import { Box, Typography } from '@mui/material';

export default function UserList() {
  return (
    <Box>
      <Typography variant="h4">Users</Typography>
      <Typography variant="body1" sx={{ mt: 2 }}>Manage system users.</Typography>
    </Box>
  );
}