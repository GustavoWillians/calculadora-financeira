import React, { useEffect } from 'react';
import { 
  Paper, Typography, TextField, Button, Select, MenuItem, InputLabel, 
  FormControl, Grid, Switch, FormControlLabel, Box, IconButton 
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

export default function Forms({
  // Props para Categoria
  novaCategoria, setNovaCategoria, handleCategoriaSubmit,
  categorias, handleCategoriaDelete,
  // Props para Gasto
  descricao, setDescricao, valor, setValor, responsavel, setResponsavel,
  categoriaId, setCategoriaId, handleGastoSubmit,
  dataGasto, setDataGasto,
  cartaoId, setCartaoId, cartoes,
  isParcelado, setIsParcelado, numParcelas, setNumParcelas, valorParcela, setValorParcela
}) {

  useEffect(() => {
    if (isParcelado) {
      const num = parseInt(numParcelas, 10);
      const val = parseFloat(valorParcela);
      if (num > 0 && val > 0) {
        setValor((num * val).toFixed(2));
      } else {
        setValor('');
      }
    }
  }, [isParcelado, numParcelas, valorParcela, setValor]);

  useEffect(() => {
    if (cartaoId === 'debito') {
      setIsParcelado(false);
    }
  }, [cartaoId, setIsParcelado]);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        {/* SEÇÃO DE ADICIONAR CATEGORIA DE VOLTA AO SIMPLES */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Adicionar Nova Categoria</Typography>
          <form onSubmit={handleCategoriaSubmit}>
            <TextField 
              label="Nome da Categoria" 
              variant="outlined" 
              fullWidth 
              value={novaCategoria} 
              onChange={(e) => setNovaCategoria(e.target.value)} 
              sx={{ mb: 2 }} 
            />
            <Button type="submit" variant="contained" fullWidth>Criar</Button>
          </form>
        </Paper>
      </Grid>
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Registrar Gasto</Typography>
          <form onSubmit={handleGastoSubmit}>
            <TextField label="Descrição" variant="outlined" fullWidth value={descricao} onChange={(e) => setDescricao(e.target.value)} sx={{ mb: 2 }} />
            <TextField label="Valor Total" type="number" variant="outlined" fullWidth value={valor} onChange={(e) => setValor(e.target.value)} sx={{ mb: 2 }} disabled={isParcelado} />
            <TextField label="Responsável" variant="outlined" fullWidth value={responsavel} onChange={(e) => setResponsavel(e.target.value)} placeholder="Eu" sx={{ mb: 2 }} />
            
            {/* --- AQUI ESTÁ A MUDANÇA PRINCIPAL --- */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Categoria</InputLabel>
              <Select value={categoriaId} label="Categoria" onChange={(e) => setCategoriaId(e.target.value)}>
                {(categorias || []).map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <span>{cat.nome}</span>
                      <IconButton 
                        edge="end" 
                        aria-label="delete" 
                        onClick={(e) => {
                          e.stopPropagation(); // Impede que o menu feche ao clicar
                          handleCategoriaDelete(cat.id);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Pagamento</InputLabel>
              <Select value={cartaoId} label="Pagamento" onChange={(e) => setCartaoId(e.target.value)}>
                <MenuItem value="debito">Débito / Dinheiro</MenuItem>
                {(cartoes || []).map((cartao) => (<MenuItem key={cartao.id} value={cartao.id}>{cartao.nome}</MenuItem>))}
              </Select>
            </FormControl>
            {cartaoId !== 'debito' && (
              <Box sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                <FormControlLabel control={<Switch checked={isParcelado} onChange={(e) => setIsParcelado(e.target.checked)} />} label="Compra Parcelada?" />
                {isParcelado && (
                  <Grid container spacing={2} sx={{ mt: 0 }}>
                    <Grid item xs={6}><TextField label="Nº de Parcelas" type="number" fullWidth value={numParcelas} onChange={(e) => setNumParcelas(e.target.value)} /></Grid>
                    <Grid item xs={6}><TextField label="Valor da Parcela" type="number" fullWidth value={valorParcela} onChange={(e) => setValorParcela(e.target.value)} /></Grid>
                  </Grid>
                )}
              </Box>
            )}
            <TextField label="Data do Gasto" type="date" fullWidth variant="outlined" value={dataGasto} onChange={(e) => setDataGasto(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ mb: 2 }} />
            <Button type="submit" variant="contained" color="primary" fullWidth>Adicionar</Button>
          </form>
        </Paper>
      </Grid>
    </Grid>
  );
}