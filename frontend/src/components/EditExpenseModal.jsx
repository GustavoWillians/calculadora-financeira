import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl, InputLabel, Select, MenuItem, Box, Grid, FormControlLabel, Switch } from '@mui/material';

const getFormattedDate = (date) => new Date(date).toISOString().split('T')[0];

export default function EditExpenseModal({ open, onClose, gasto, onSave, categorias, cartoes }) {
  // Estados internos para controlar os campos do formulário
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [dataGasto, setDataGasto] = useState('');
  const [cartaoId, setCartaoId] = useState('debito');
  const [isParcelado, setIsParcelado] = useState(false);
  const [numParcelas, setNumParcelas] = useState(1);
  const [valorParcela, setValorParcela] = useState('');

  // Efeito para popular o formulário quando um gasto for selecionado para edição
  useEffect(() => {
    if (gasto) {
      setDescricao(gasto.descricao || '');
      setValor(gasto.valor || '');
      setResponsavel(gasto.responsavel || '');
      setCategoriaId(gasto.categoria?.id || '');
      setDataGasto(gasto.data ? getFormattedDate(gasto.data) : '');
      setCartaoId(gasto.cartao?.id || 'debito');
      setIsParcelado(gasto.is_parcelado || false);
      setNumParcelas(gasto.numero_parcelas || 1);
      setValorParcela(gasto.valor_parcela || '');
    }
  }, [gasto]);

  // Efeito para calcular o valor total (igual ao do Forms.jsx)
  useEffect(() => {
    if (isParcelado) {
      const num = parseInt(numParcelas, 10);
      const val = parseFloat(valorParcela);
      if (num > 0 && val > 0) {
        setValor((num * val).toFixed(2));
      }
    }
  }, [isParcelado, numParcelas, valorParcela]);

  const handleSave = () => {
    const updatedGasto = {
      descricao,
      valor: parseFloat(valor),
      responsavel,
      categoria_id: parseInt(categoriaId),
      data: dataGasto,
      cartao_id: cartaoId === 'debito' ? null : parseInt(cartaoId),
      is_parcelado: isParcelado,
      numero_parcelas: isParcelado ? parseInt(numParcelas, 10) : 1,
      valor_parcela: isParcelado ? parseFloat(valorParcela) : null,
    };
    onSave(gasto.id, updatedGasto);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Editar Gasto</DialogTitle>
      <DialogContent>
        <TextField autoFocus margin="dense" label="Descrição" fullWidth value={descricao} onChange={(e) => setDescricao(e.target.value)} />
        <TextField margin="dense" label="Valor Total" type="number" fullWidth value={valor} onChange={(e) => setValor(e.target.value)} disabled={isParcelado} />
        <TextField margin="dense" label="Responsável" fullWidth value={responsavel} onChange={(e) => setResponsavel(e.target.value)} />
        <FormControl fullWidth margin="dense">
          <InputLabel>Categoria</InputLabel>
          <Select value={categoriaId} label="Categoria" onChange={(e) => setCategoriaId(e.target.value)}>
            {(categorias || []).map((cat) => (<MenuItem key={cat.id} value={cat.id}>{cat.nome}</MenuItem>))}
          </Select>
        </FormControl>
        <FormControl fullWidth margin="dense">
          <InputLabel>Pagamento</InputLabel>
          <Select value={cartaoId} label="Pagamento" onChange={(e) => setCartaoId(e.target.value)}>
            <MenuItem value="debito">Débito / Dinheiro</MenuItem>
            {(cartoes || []).map((cartao) => (<MenuItem key={cartao.id} value={cartao.id}>{cartao.nome}</MenuItem>))}
          </Select>
        </FormControl>
        {cartaoId !== 'debito' && (
          <Box mt={2}>
            <FormControlLabel control={<Switch checked={isParcelado} onChange={(e) => setIsParcelado(e.target.checked)} />} label="Compra Parcelada?" />
            {isParcelado && (
              <Grid container spacing={2} sx={{ mt: 0 }}>
                <Grid item xs={6}><TextField label="Nº de Parcelas" type="number" fullWidth value={numParcelas} onChange={(e) => setNumParcelas(e.target.value)} /></Grid>
                <Grid item xs={6}><TextField label="Valor da Parcela" type="number" fullWidth value={valorParcela} onChange={(e) => setValorParcela(e.target.value)} /></Grid>
              </Grid>
            )}
          </Box>
        )}
        <TextField margin="dense" label="Data do Gasto" type="date" fullWidth value={dataGasto} onChange={(e) => setDataGasto(e.target.value)} InputLabelProps={{ shrink: true }} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained">Salvar</Button>
      </DialogActions>
    </Dialog>
  );
}