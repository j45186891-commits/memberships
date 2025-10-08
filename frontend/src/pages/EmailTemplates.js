import React from 'react';
import { Box, Typography } from '@mui/material';

export default function EmailTemplates() {
  return (
    <Box>
      <Typography variant="h4">Email Templates</Typography>
      <Typography variant="body1" sx={{ mt: 2 }}>Manage email templates.</Typography>
    </Box>
  );
}