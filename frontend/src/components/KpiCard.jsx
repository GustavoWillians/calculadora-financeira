import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import PropTypes from 'prop-types';

export default function KpiCard({ title, value, icon, color = 'text.secondary', children, title2, value2 }) {
  return (
    <Card>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ p: 1.5, color: '#fff', bgcolor: color, borderRadius: 2, mr: 2, display: 'flex', alignItems: 'center' }}>
              {icon}
            </Box>
            <Box>
              <Typography color="text.secondary" variant="body2">{title}</Typography>
              <Typography variant="h5" component="div">{value}</Typography>
            </Box>
          </Box>
          {children && <Box>{children}</Box>}
        </Box>
        {title2 && value2 && (
          <Box mt={2} pl={1}>
            <Typography color="text.secondary" variant="caption" sx={{display: 'block'}}>{title2}</Typography>
            <Typography variant="h6" component="div">{value2}</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

KpiCard.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    icon: PropTypes.element.isRequired,
    color: PropTypes.string,
    children: PropTypes.node,
    title2: PropTypes.string,
    value2: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};