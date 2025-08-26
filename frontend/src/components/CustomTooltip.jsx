import React from 'react';
import { Paper, Typography, Box, Divider } from '@mui/material';
import { formatCurrency } from '../utils/formatters';

export default function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload; // Acessa os dados completos da barra

    return (
      <Paper sx={{ p: 1.5, minWidth: 200, maxWidth: 300 }}>
        <Typography variant="subtitle2" gutterBottom>{label}</Typography>
        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
          Total: {formatCurrency(data.valor)}
        </Typography>
        <Divider sx={{ my: 1 }} />
        <Box sx={{ maxHeight: 150, overflowY: 'auto' }}>
          {/* Mapeia a lista de gastos que agora está nos dados */}
          {(data.gastos || []).map((gasto, index) => (
            <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <Typography variant="body2" sx={{ maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {gasto.descricao}
              </Typography>
              <Typography variant="body2">{formatCurrency(gasto.valor)}</Typography>
            </Box>
          ))}
        </Box>
      </Paper>
    );
  }

  return null;
}