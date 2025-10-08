import React from 'react';
import { Box, Typography } from '@mui/material';

export default function Settings() {
  return (
    <Box>
      <Typography variant="h4">Settings</Typography>
      <Typography variant="body1" sx={{ mt: 2 }}>Configure system settings.</Typography>
    </Box>
  );
}