import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Select, MenuItem, FormControl, InputLabel, Grid, Paper, IconButton, List, ListItem, ListItemText, Divider } from '@mui/material';
import { useSnackbar } from 'notistack';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import BlockIcon from '@mui/icons-material/Block';
import RestoreIcon from '@mui/icons-material/Restore';
import { createCartao, deactivateCartao, reactivateCartao, getFatura } from '../services/api';
import ExpenseTable from '../components/ExpenseTable';
import { formatCurrency } from '../utils/formatters';

export default function Faturas({ 
  onEditGasto, allCards, fetchData, gastosFatura, currentDate, 
  setCurrentDate, cartaoSelecionadoId, setCartaoSelecionadoId 
}) {
  const { enqueueSnackbar } = useSnackbar();
  const [responsavelFiltro, setResponsavelFiltro] = useState('Todos');
  const [open, setOpen] = useState(false);
  const [nomeCartao, setNomeCartao] = useState('');
  const [diaFechamento, setDiaFechamento] = useState('');

  // Deriva as duas listas a partir da prop 'allCards'
  const activeCards = useMemo(() => (allCards || []).filter(c => c.is_active), [allCards]);
  const inactiveCards = useMemo(() => (allCards || []).filter(c => !c.is_active), [allCards]);

  // Efeito para setar o primeiro cartão ativo como padrão
  useEffect(() => {
    if (activeCards.length > 0 && !activeCards.find(c => c.id === cartaoSelecionadoId)) {
      setCartaoSelecionadoId(activeCards[0].id);
    } else if (activeCards.length === 0) {
      setCartaoSelecionadoId('');
    }
  }, [activeCards, cartaoSelecionadoId, setCartaoSelecionadoId]);
  
  const cartaoSelecionado = useMemo(() => (activeCards || []).find(c => c.id === cartaoSelecionadoId), [activeCards, cartaoSelecionadoId]);
  
  const responsaveisUnicos = useMemo(() => {
    const nomes = new Set((gastosFatura || []).map(g => g.responsavel));
    return ['Todos', ...Array.from(nomes)];
  }, [gastosFatura]);

  const gastosFiltrados = useMemo(() => {
    if (responsavelFiltro === 'Todos') return gastosFatura;
    return (gastosFatura || []).filter(g => g.responsavel === responsavelFiltro);
  }, [gastosFatura, responsavelFiltro]);

  const handleCreateCartao = async () => {
    if (!nomeCartao || !diaFechamento) return enqueueSnackbar('Preencha todos os campos.', { variant: 'warning' });
    try {
      await createCartao({ nome: nomeCartao, dia_fechamento: parseInt(diaFechamento) });
      fetchData(); // Chama a função do App.jsx para recarregar todos os dados
      setNomeCartao('');
      setDiaFechamento('');
      enqueueSnackbar('Cartão adicionado com sucesso!', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Erro ao adicionar cartão.', { variant: 'error' });
    }
  };

  const handleDeactivateCartao = async (id) => {
    if (window.confirm("Tem certeza que deseja desativar este cartão? Ele não aparecerá mais para novos gastos, mas seu histórico será mantido.")) {
      try {
        await deactivateCartao(id);
        fetchData();
        enqueueSnackbar('Cartão desativado.', { variant: 'info' });
      } catch (error) {
        enqueueSnackbar('Erro ao desativar cartão.', { variant: 'error' });
      }
    }
  };

  const handleReactivateCartao = async (id) => {
    try {
      await reactivateCartao(id);
      fetchData();
      enqueueSnackbar('Cartão reativado com sucesso!', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Erro ao reativar cartão.', { variant: 'error' });
    }
  };
  
  const handlePreviousMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const displayMonth = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase());
  
  const totalFatura = useMemo(() => (gastosFiltrados || []).reduce((sum, g) => sum + g.valor, 0), [gastosFiltrados]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">Faturas de Cartão</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>Gerenciar Cartões</Button>
      </Box>

      <Paper sx={{p: 2}}>
        <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Cartão</InputLabel>
              <Select value={cartaoSelecionadoId} label="Cartão" onChange={(e) => setCartaoSelecionadoId(e.target.value)}>
                {(activeCards || []).map((c) => <MenuItem key={c.id} value={c.id}>{c.nome}</MenuItem>)}
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
                        Fechamento da fatura: <strong>Dia {cartaoSelecionado.dia_fechamento} de cada mês</strong>
                    </Typography>
                )}
            </Grid>
        </Grid>

        <Typography variant="h5" sx={{mb: 2}}>Total da Fatura: {formatCurrency(totalFatura)}</Typography>
        <ExpenseTable gastos={gastosFiltrados} onEditGasto={onEditGasto} />
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Gerenciar Cartões de Crédito</DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>Cartões Ativos</Typography>
          <List dense sx={{ maxHeight: 150, overflow: 'auto' }}>
            {(activeCards || []).map(cartao => (
              <ListItem key={cartao.id} secondaryAction={
                <IconButton edge="end" title="Desativar Cartão" onClick={() => handleDeactivateCartao(cartao.id)}>
                  <BlockIcon />
                </IconButton>
              }>
                <ListItemText primary={cartao.nome} secondary={`Dia do Fechamento: ${cartao.dia_fechamento}`} />
              </ListItem>
            ))}
          </List>

          {inactiveCards.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>Cartões Inativos</Typography>
              <List dense sx={{ maxHeight: 150, overflow: 'auto' }}>
                {inactiveCards.map(cartao => (
                  <ListItem key={cartao.id} secondaryAction={
                    <IconButton edge="end" title="Reativar Cartão" onClick={() => handleReactivateCartao(cartao.id)}>
                      <RestoreIcon />
                    </IconButton>
                  }>
                    <ListItemText primary={cartao.nome} secondary={`Dia do Fechamento: ${cartao.dia_fechamento}`} />
                  </ListItem>
                ))}
              </List>
            </>
          )}

          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" gutterBottom>Adicionar Novo Cartão</Typography>
          <TextField autoFocus margin="dense" label="Nome do Cartão (ex: Nubank)" type="text" fullWidth variant="standard" value={nomeCartao} onChange={(e) => setNomeCartao(e.target.value)} />
          <TextField margin="dense" label="Dia do Fechamento da Fatura" type="number" fullWidth variant="standard" value={diaFechamento} onChange={(e) => setDiaFechamento(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Fechar</Button>
          <Button onClick={handleCreateCartao} variant="contained">Adicionar Cartão</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}