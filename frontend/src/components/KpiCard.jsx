import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

export default function KpiCard({ title, value, icon, color = 'text.secondary' }) {
  return (
    <Card sx={{ display: 'flex', alignItems: 'center', p: 1 }}>
      <Box sx={{ p: 1.5, color: color, bgcolor: `${color}.lighter`, borderRadius: '50%' }}>
        {icon}
      </Box>
      <Box sx={{ flexGrow: 1, ml: 2 }}>
        <Typography color="text.secondary" >
          {title}
        </Typography>
        <Typography variant="h5" component="div">
          {value}
        </Typography>
      </Box>
    </Card>
  );
}