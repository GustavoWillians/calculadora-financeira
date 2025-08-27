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
              <TableCell>Nome</TableCell>
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
              const dataFim = addMonths(dataInicio, gasto.numero_parcelas - 1);

              return (
                <TableRow hover key={`${gasto.id}-${gasto.parcela_atual || 1}`}>
                  <TableCell>{gasto.nome}</TableCell>
                  {/* LÓGICA ADICIONADA para mostrar o status do cartão */}
                  <TableCell>
                    {gasto.cartao ? `${gasto.cartao.nome}${gasto.cartao.is_active === false ? ' (Inativo)' : ''}` : 'Débito'}
                  </TableCell>
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