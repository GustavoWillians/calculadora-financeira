import React from 'react';
import { Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';
import { formatCurrency } from '../utils/formatters';
import { addMonths, format } from 'date-fns';

export default function InstallmentTable({ gastos }) {
  return (
    <Paper sx={{ p: 2, boxShadow: 'none' }}>
      <Typography variant="h6" color="primary" gutterBottom>
        Itens Parcelados Ativos no Mês
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Descrição</TableCell>
              <TableCell>Cartão</TableCell>
              <TableCell align="center">Parcela</TableCell>
              <TableCell align="right">Valor da Parcela</TableCell>
              <TableCell>Data da Compra</TableCell>
              <TableCell>Última Parcela</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(gastos || []).map((gasto) => {
              const dataInicio = new Date(gasto.data);
              // Calcula a data da última parcela a partir da data da COMPRA original
              const dataFim = addMonths(dataInicio, gasto.numero_parcelas - 1);

              return (
                <TableRow hover key={gasto.id}>
                  <TableCell>{gasto.descricao}</TableCell>
                  <TableCell>{gasto.cartao?.nome || 'N/A'}</TableCell>
                  {/* Exibindo a parcela atual */}
                  <TableCell align="center">
                    <Chip label={`${gasto.parcela_atual}/${gasto.numero_parcelas}`} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="right">{formatCurrency(gasto.valor_parcela)}</TableCell>
                  <TableCell>{format(dataInicio, 'dd/MM/yyyy')}</TableCell>
                  <TableCell>{format(dataFim, 'dd/MM/yyyy')}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}