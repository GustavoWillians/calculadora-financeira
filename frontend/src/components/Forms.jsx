import React, { useEffect } from 'react';
import { Box, Paper, Typography, TextField, Button, Select, MenuItem, InputLabel, FormControl, Grid, Switch, FormControlLabel } from "@mui/material";

export default function Forms({
  novaCategoria, setNovaCategoria, handleCategoriaSubmit,
  descricao, setDescricao, valor, setValor, responsavel, setResponsavel,
  categoriaId, setCategoriaId, categorias, handleGastoSubmit,
  dataGasto, setDataGasto,
  cartaoId, setCartaoId, cartoes,
  // Novas props para parcelas
  isParcelado, setIsParcelado, numParcelas, setNumParcelas, valorParcela, setValorParcela
}) {

  // Efeito para calcular o valor total quando as parcelas mudam
  useEffect(() => {
    if (isParcelado) {
      const num = parseInt(numParcelas, 10);
      const val = parseFloat(valorParcela);
      if (num > 0 && val > 0) {
        setValor((num * val).toFixed(2));
      }
    }
  }, [isParcelado, numParcelas, valorParcela, setValor]);

  // Efeito para resetar parcelas se o pagamento for Débito
  useEffect(() => {
    if (cartaoId === 'debito') {
      setIsParcelado(false);
    }
  }, [cartaoId, setIsParcelado]);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Adicionar Categoria</Typography>
          <form onSubmit={handleCategoriaSubmit}>
            <TextField label="Nome da Categoria" fullWidth value={novaCategoria} onChange={(e) => setNovaCategoria(e.target.value)} sx={{ mb: 2 }} />
            <Button type="submit" variant="contained" fullWidth>Criar</Button>
          </form>
        </Paper>
      </Grid>
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Registrar Gasto</Typography>
          <form onSubmit={handleGastoSubmit}>
            <TextField label="Descrição" fullWidth value={descricao} onChange={(e) => setDescricao(e.target.value)} sx={{ mb: 2 }} />
            
            {/* Campo de valor total agora é desabilitado se for parcelado */}
            <TextField label="Valor Total" type="number" fullWidth value={valor} onChange={(e) => setValor(e.target.value)} sx={{ mb: 2 }} disabled={isParcelado} />
            
            <TextField label="Responsável" fullWidth value={responsavel} onChange={(e) => setResponsavel(e.target.value)} placeholder="Eu" sx={{ mb: 2 }} />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Categoria</InputLabel>
              <Select value={categoriaId} label="Categoria" onChange={(e) => setCategoriaId(e.target.value)}>
                {(categorias || []).map((cat) => (<MenuItem key={cat.id} value={cat.id}>{cat.nome}</MenuItem>))}
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Pagamento</InputLabel>
              <Select value={cartaoId} label="Pagamento" onChange={(e) => setCartaoId(e.target.value)}>
                <MenuItem value="debito">Débito / Dinheiro</MenuItem>
                {(cartoes || []).map((cartao) => (<MenuItem key={cartao.id} value={cartao.id}>{cartao.nome}</MenuItem>))}
              </Select>
            </FormControl>

            {/* Campos de Parcela (só aparecem se um cartão for selecionado) */}
            {cartaoId !== 'debito' && (
              <Box>
                <FormControlLabel control={<Switch checked={isParcelado} onChange={(e) => setIsParcelado(e.target.checked)} />} label="Compra Parcelada?" />
                {isParcelado && (
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={6}>
                      <TextField label="Nº de Parcelas" type="number" fullWidth value={numParcelas} onChange={(e) => setNumParcelas(e.target.value)} />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField label="Valor da Parcela" type="number" fullWidth value={valorParcela} onChange={(e) => setValorParcela(e.target.value)} />
                    </Grid>
                  </Grid>
                )}
              </Box>
            )}

            <TextField label="Data do Gasto" type="date" fullWidth value={dataGasto} onChange={(e) => setDataGasto(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ my: 2 }} />
            <Button type="submit" variant="contained" color="primary" fullWidth>Adicionar</Button>
          </form>
        </Paper>
      </Grid>
    </Grid>
  );
}