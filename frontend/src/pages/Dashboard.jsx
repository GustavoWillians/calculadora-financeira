import React, { useState, useMemo } from 'react';
import { Box, Grid, Typography, FormControl, InputLabel, Select, MenuItem, Paper, IconButton, Tabs, Tab } from '@mui/material';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import FunctionsIcon from '@mui/icons-material/Functions';

import KpiCard from '../components/KpiCard';
import ExpenseChart from '../components/ExpenseChart';
import ExpenseTable from '../components/ExpenseTable';
import InstallmentTable from '../components/InstallmentTable';
import Forms from '../components/Forms';
import { createCategoria, createGasto } from '../services/api';
import { formatCurrency } from '../utils/formatters';

const getTodayString = () => new Date().toISOString().split('T')[0];

const processarDadosGrafico = (gastos) => {
    if (!Array.isArray(gastos) || gastos.length === 0) return [];
    const gastosPorCategoria = gastos.reduce((acc, gasto) => {
        const nomeCategoria = gasto.categoria?.nome || 'Sem Categoria';
        if (!acc[nomeCategoria]) acc[nomeCategoria] = 0;
        acc[nomeCategoria] += gasto.valor;
        return acc;
    }, {});
    return Object.keys(gastosPorCategoria).map(nome => ({
        name: nome,
        valor: parseFloat(gastosPorCategoria[nome].toFixed(2)),
    }));
};

export default function Dashboard({ 
  onEditGasto, gastosDoMes, comprasParceladas, categorias, cartoes, currentDate, setCurrentDate, fetchData 
}) {
    // A maioria dos estados foi movida para App.jsx
    // Apenas os estados dos formulários permanecem aqui
    const [descricao, setDescricao] = useState('');
    const [valor, setValor] = useState('');
    const [responsavel, setResponsavel] = useState('');
    const [categoriaId, setCategoriaId] = useState('');
    const [novaCategoria, setNovaCategoria] = useState('');
    const [dataGasto, setDataGasto] = useState(getTodayString());
    const [cartaoId, setCartaoId] = useState('debito');
    const [isParcelado, setIsParcelado] = useState(false);
    const [numParcelas, setNumParcelas] = useState(2);
    const [valorParcela, setValorParcela] = useState('');

    const [responsavelFiltro, setResponsavelFiltro] = useState('Todos');
    const [tabValue, setTabValue] = useState(0);

    const responsaveisUnicos = useMemo(() => {
        const nomes = new Set((gastosDoMes || []).map(g => g.responsavel));
        return ['Todos', ...Array.from(nomes)];
    }, [gastosDoMes]);

    const gastosFiltrados = useMemo(() => {
        if (responsavelFiltro === 'Todos') return gastosDoMes;
        return (gastosDoMes || []).filter(g => g.responsavel === responsavelFiltro);
    }, [gastosDoMes, responsavelFiltro]);
    
    const dadosGrafico = useMemo(() => processarDadosGrafico(gastosFiltrados), [gastosFiltrados]);

    const { gastoTotal, numTransacoes, gastoMedio } = useMemo(() => {
        const total = (gastosFiltrados || []).reduce((sum, gasto) => sum + gasto.valor, 0);
        const count = (gastosFiltrados || []).length;
        return { gastoTotal: total, numTransacoes: count, gastoMedio: count > 0 ? (total / count) : 0 };
    }, [gastosFiltrados]);

    const handleGastoSubmit = async (e) => {
        e.preventDefault();
        const novoGasto = { 
            descricao, valor: parseFloat(valor), responsavel: responsavel || 'Eu', 
            categoria_id: parseInt(categoriaId), data: dataGasto,
            cartao_id: cartaoId === 'debito' ? null : parseInt(cartaoId),
            is_parcelado: isParcelado,
            numero_parcelas: isParcelado ? parseInt(numParcelas, 10) : 1,
            valor_parcela: isParcelado ? parseFloat(valorParcela) : null,
        };
        try {
            await createGasto(novoGasto);
            setDescricao(''); setValor(''); setResponsavel(''); setDataGasto(getTodayString()); 
            setCartaoId('debito'); setIsParcelado(false); setNumParcelas(2); setValorParcela('');
            fetchData(); // Chama a função recebida por props
        } catch (error) { console.error("Erro ao criar gasto:", error); }
    };
    
    const handleCategoriaSubmit = async (e) => {
        e.preventDefault();
        await createCategoria(novaCategoria);
        setNovaCategoria('');
        fetchData(); // Chama a função recebida por props
    };
    
    const handlePreviousMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const displayMonth = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase());

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <IconButton onClick={handlePreviousMonth}><ArrowBackIosIcon /></IconButton>
                <Typography variant="h4" sx={{ mx: 2, width: '250px', textAlign: 'center' }}>{displayMonth}</Typography>
                <IconButton onClick={handleNextMonth}><ArrowForwardIosIcon /></IconButton>
            </Box>
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}><KpiCard title="Gasto Total do Mês" value={formatCurrency(gastoTotal)} icon={<AttachMoneyIcon />} color="error.main" /></Grid>
                <Grid item xs={12} sm={4}><KpiCard title="Nº de Transações" value={numTransacoes} icon={<ReceiptLongIcon />} color="info.main" /></Grid>
                <Grid item xs={12} sm={4}><KpiCard title="Gasto Médio" value={formatCurrency(gastoMedio)} icon={<FunctionsIcon />} color="warning.main" /></Grid>
            </Grid>
            <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Análise de Gastos</Typography>
                    <FormControl sx={{ minWidth: 200 }} size="small">
                        <InputLabel>Filtrar por Responsável</InputLabel>
                        <Select value={responsavelFiltro} label="Filtrar por Responsável" onChange={(e) => setResponsavelFiltro(e.target.value)}>
                            {responsaveisUnicos.map(nome => (<MenuItem key={nome} value={nome}>{nome}</MenuItem>))}
                        </Select>
                    </FormControl>
                </Box>
                <ExpenseChart data={dadosGrafico} />
            </Paper>
            <Grid container spacing={3}>
                <Grid item lg={4} xs={12}>
                    <Forms
                        novaCategoria={novaCategoria} setNovaCategoria={setNovaCategoria} handleCategoriaSubmit={handleCategoriaSubmit}
                        descricao={descricao} setDescricao={setDescricao} valor={valor} setValor={setValor}
                        responsavel={responsavel} setResponsavel={setResponsavel} categoriaId={categoriaId} setCategoriaId={setCategoriaId}
                        categorias={categorias} handleGastoSubmit={handleGastoSubmit}
                        dataGasto={dataGasto} setDataGasto={setDataGasto}
                        cartaoId={cartaoId} setCartaoId={setCartaoId} cartoes={cartoes}
                        isParcelado={isParcelado} setIsParcelado={setIsParcelado}
                        numParcelas={numParcelas} setNumParcelas={setNumParcelas}
                        valorParcela={valorParcela} setValorParcela={setValorParcela}
                    />
                </Grid>
                <Grid item lg={8} xs={12}>
                    <Paper>
                        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                            <Tab label="Histórico do Mês" />
                            <Tab label="Parcelas Ativas no Mês" />
                        </Tabs>
                        <Box sx={{p: 2}}>
                            {tabValue === 0 && <ExpenseTable gastos={gastosFiltrados} onEditGasto={onEditGasto} />}
                            {tabValue === 1 && <InstallmentTable gastos={comprasParceladas} />}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}