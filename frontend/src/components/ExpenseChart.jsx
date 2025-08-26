import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Paper, Typography } from '@mui/material';
import CustomTooltip from './CustomTooltip'; // <-- Importe o novo componente

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1943'];

export default function ExpenseChart({ data }) {
  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" color="primary" gutterBottom>
        Gastos por Categoria
      </Typography>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={(value) => `R$${value}`} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="valor" name="Total Gasto" barSize={30}>
            {(data || []).map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
}