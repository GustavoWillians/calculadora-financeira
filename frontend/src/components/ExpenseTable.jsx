import React from 'react';
import { Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { formatCurrency } from '../utils/formatters';
import { format } from 'date-fns';

export default function ExpenseTable({ gastos, onEditGasto }) {
  return (
    <Paper sx={{ p: 2, boxShadow: 'none' }}>
      <Typography variant="h6" color="primary" gutterBottom>
        Histórico de Gastos
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell> {/* <-- RENOMEADO */}
              <TableCell>Categoria</TableCell>
              <TableCell>Pagamento</TableCell>
              <TableCell align="center">Parcela</TableCell>
              <TableCell align="right">Valor</TableCell>
              <TableCell>Responsável</TableCell>
              <TableCell>Data</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(gastos || []).map((gasto) => (
              <TableRow hover key={`${gasto.id}-${gasto.parcela_atual || 1}`}>
                <TableCell>{gasto.nome}</TableCell> {/* <-- USANDO O CAMPO 'nome' */}
                <TableCell>{gasto.categoria?.nome || 'Sem Categoria'}</TableCell>
                <TableCell>
                  {gasto.cartao ? `${gasto.cartao.nome}${gasto.cartao.is_active === false ? ' (Inativo)' : ''}` : 'Débito'}
                </TableCell>
                <TableCell align="center">
                  {gasto.is_parcelado ? (
                    <Chip label={`${gasto.parcela_atual}/${gasto.numero_parcelas}`} size="small" />
                  ) : ('-')}
                </TableCell>
                <TableCell align="right">{formatCurrency(gasto.valor)}</TableCell>
                <TableCell>{gasto.responsavel}</TableCell>
                <TableCell>{new Date(gasto.data).toLocaleDateString()}</TableCell>
                <TableCell align="center">
                  <IconButton size="small" onClick={() => onEditGasto(gasto)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}