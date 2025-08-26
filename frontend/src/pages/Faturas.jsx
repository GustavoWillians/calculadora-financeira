import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Select, MenuItem, FormControl, InputLabel, Grid, Paper, IconButton, List, ListItem, ListItemText, Divider } from '@mui/material';
import { useSnackbar } from 'notistack';
import { format } from 'date-fns';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import BlockIcon from '@mui/icons-material/Block';
import RestoreIcon from '@mui/icons-material/Restore';
import { createCartao, deactivateCartao, reactivateCartao, getFatura } from '../services/api';
import ExpenseTable from '../components/ExpenseTable';
import { formatCurrency } from '../utils/formatters';

export default function Faturas({ onEditGasto, allCards, fetchData }) {
  const { enqueueSnackbar } = useSnackbar();
  
  const [gastosFatura, setGastosFatura] = useState([]);
  const [periodoFatura, setPeriodoFatura] = useState(null);
  const [cartaoSelecionadoId, setCartaoSelecionadoId] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [responsavelFiltro, setResponsavelFiltro] = useState('Todos');
  const [open, setOpen] = useState(false);
  const [nomeCartao, setNomeCartao] = useState('');
  const [diaFechamento, setDiaFechamento] = useState('');

  const activeCards = useMemo(() => (allCards || []).filter(c => c.is_active), [allCards]);
  const inactiveCards = useMemo(() => (allCards || []).filter(c => !c.is_active), [allCards]);

  useEffect(() => {
    // Tenta selecionar o primeiro cartão ativo, se houver. Senão, o primeiro de todos.
    if (activeCards.length > 0 && !cartaoSelecionadoId) {
      setCartaoSelecionadoId(activeCards[0].id);
    } else if (allCards.length > 0 && !cartaoSelecionadoId) {
      setCartaoSelecionadoId(allCards[0].id);
    }
  }, [allCards, activeCards, cartaoSelecionadoId]);

  useEffect(() => {
    const fetchFaturaData = async () => {
      if (!cartaoSelecionadoId) {
        setGastosFatura([]);
        setPeriodoFatura(null);
        return;
      };
      
      const ano = currentDate.getFullYear();
      const mes = currentDate.getMonth() + 1;
      
      try {
        const res = await getFatura(cartaoSelecionadoId, { ano, mes });
        setGastosFatura(res.data.gastos);
        setPeriodoFatura({
          inicio: res.data.periodo_inicio,
          fim: res.data.periodo_fim
        });
      } catch (error) {
        console.error("Erro ao buscar fatura:", error);
        setGastosFatura([]);
        setPeriodoFatura(null);
      }
    };
    fetchFaturaData();
  }, [cartaoSelecionadoId, currentDate]);
  
  const cartaoSelecionado = useMemo(() => (allCards || []).find(c => c.id === cartaoSelecionadoId), [allCards, cartaoSelecionadoId]);
  
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
      fetchData();
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
  
  // Função auxiliar para corrigir o fuso horário apenas para exibição
  const formatLocalDate = (dateString) => {
    if (!dateString) return '';
    // Adiciona o tempo para evitar que o JS converta para o dia anterior
    const date = new Date(`${dateString}T00:00:00`);
    return format(date, 'dd/MM/yyyy');
  }

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
              <Select value={cartaoSelecionadoId || ''} label="Cartão" onChange={(e) => setCartaoSelecionadoId(e.target.value)}>
                {/* AQUI ESTÁ A MUDANÇA: Mapeando TODOS os cartões */}
                {(allCards || []).map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.nome} {!c.is_active && '(Inativo)'}
                  </MenuItem>
                ))}
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
                    <Box>
                        {/* CAMPO DE VOLTA, USANDO OS DADOS VINDOS DA API */}
                        {periodoFatura && (
                          <Typography variant="body2" color="text.secondary">
                              Período de Compras: <strong>{formatLocalDate(periodoFatura.inicio)} - {formatLocalDate(periodoFatura.fim)}</strong>
                          </Typography>
                        )}
                        <Typography variant="body1" color="text.secondary">
                            Fechamento da fatura: <strong>Dia {cartaoSelecionado.dia_fechamento}</strong>
                        </Typography>
                    </Box>
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
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleCreateCartao} variant="contained">Adicionar Cartão</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}