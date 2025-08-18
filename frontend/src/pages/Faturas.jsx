import React, { useState, useMemo } from 'react';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Select, MenuItem, FormControl, InputLabel, Grid, Paper, IconButton } from '@mui/material';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { createCartao } from '../services/api';
import ExpenseTable from '../components/ExpenseTable';
import { formatCurrency } from '../utils/formatters';

export default function Faturas({ onEditGasto, cartoes, fetchData, gastosFatura, currentDate, setCurrentDate, cartaoSelecionadoId, setCartaoSelecionadoId }) {
  const [responsavelFiltro, setResponsavelFiltro] = useState('Todos');
  const [open, setOpen] = useState(false);
  const [nomeCartao, setNomeCartao] = useState('');
  const [diaFechamento, setDiaFechamento] = useState('');
  
  const cartaoSelecionado = useMemo(() => (cartoes || []).find(c => c.id === cartaoSelecionadoId), [cartoes, cartaoSelecionadoId]);
  
  const responsaveisUnicos = useMemo(() => {
    const nomes = new Set((gastosFatura || []).map(g => g.responsavel));
    return ['Todos', ...Array.from(nomes)];
  }, [gastosFatura]);

  const gastosFiltrados = useMemo(() => {
    if (responsavelFiltro === 'Todos') return gastosFatura;
    return (gastosFatura || []).filter(g => g.responsavel === responsavelFiltro);
  }, [gastosFatura, responsavelFiltro]);

  const handleCreateCartao = async () => {
    if (!nomeCartao || !diaFechamento) return;
    await createCartao({ nome: nomeCartao, dia_fechamento: parseInt(diaFechamento) });
    fetchData(); // Chama a função do App.jsx para recarregar tudo
    setOpen(false);
    setNomeCartao('');
    setDiaFechamento('');
  };
  
  const handlePreviousMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const displayMonth = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase());
  
  const totalFatura = useMemo(() => (gastosFiltrados || []).reduce((sum, g) => sum + g.valor, 0), [gastosFiltrados]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">Faturas de Cartão</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>Adicionar Cartão</Button>
      </Box>

      <Paper sx={{p: 2}}>
        <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Cartão</InputLabel>
              <Select value={cartaoSelecionadoId} label="Cartão" onChange={(e) => setCartaoSelecionadoId(e.target.value)}>
                {(cartoes || []).map((c) => <MenuItem key={c.id} value={c.id}>{c.nome}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={8} sx={{display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
            <IconButton onClick={handlePreviousMonth}><ArrowBackIosIcon /></IconButton>
            <Typography variant="h6" sx={{ mx: 2, minWidth: '220px', textAlign: 'center' }}>Fatura de {displayMonth}</Typography>
            <IconButton onClick={handleNextMonth}><ArrowForwardIosIcon /></IconButton>
          </Grid>
        </Grid>
        
        <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                    <InputLabel>Filtrar por Responsável</InputLabel>
                    <Select value={responsavelFiltro} label="Filtrar por Responsável" onChange={(e) => setResponsavelFiltro(e.target.value)}>
                        {responsaveisUnicos.map(nome => (<MenuItem key={nome} value={nome}>{nome}</MenuItem>))}
                    </Select>
                </FormControl>
            </Grid>
            <Grid item xs={12} md={8}>
                {cartaoSelecionado && (
                    <Typography variant="body1" color="text.secondary">
                        Dia do fechamento da fatura: <strong>Dia {cartaoSelecionado.dia_fechamento}</strong>
                    </Typography>
                )}
            </Grid>
        </Grid>

        <Typography variant="h5" sx={{mb: 2}}>Total da Fatura: {formatCurrency(totalFatura)}</Typography>
        <ExpenseTable gastos={gastosFiltrados} onEditGasto={onEditGasto} />
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Adicionar Novo Cartão</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" label="Nome do Cartão (ex: Nubank)" type="text" fullWidth variant="standard" value={nomeCartao} onChange={(e) => setNomeCartao(e.target.value)} />
          <TextField margin="dense" label="Dia do Fechamento da Fatura" type="number" fullWidth variant="standard" value={diaFechamento} onChange={(e) => setDiaFechamento(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleCreateCartao}>Adicionar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}