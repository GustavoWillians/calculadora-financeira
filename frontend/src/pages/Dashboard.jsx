import React, { useState, useEffect, useMemo } from 'react';
import { Box, Grid, Typography, FormControl, InputLabel, Select, MenuItem, Paper, IconButton, Tabs, Tab } from '@mui/material';
import { useSnackbar } from 'notistack';
import { addMonths, subMonths, startOfMonth, endOfMonth, startOfDay, endOfDay, format } from 'date-fns';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import FunctionsIcon from '@mui/icons-material/Functions';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PaymentsIcon from '@mui/icons-material/Payments';

import KpiCard from '../components/KpiCard';
import ExpenseChart from '../components/ExpenseChart';
import ExpenseTable from '../components/ExpenseTable';
import InstallmentTable from '../components/InstallmentTable';
import Forms from '../components/Forms';
import { getCategorias, createCategoria, deleteCategoria, getGastos, createGasto, getCartoes, updateGasto, deleteGasto } from '../services/api';
import { formatCurrency } from '../utils/formatters';

const getTodayString = () => new Date().toISOString().split('T')[0];

const processarDadosGrafico = (gastos) => {
    if (!Array.isArray(gastos) || gastos.length === 0) return [];
    const gastosPorCategoria = gastos.reduce((acc, gasto) => {
        const nomeCategoria = gasto.categoria?.nome || 'Sem Categoria';
        if (!acc[nomeCategoria]) {
            acc[nomeCategoria] = { total: 0, gastos: [] };
        }
        acc[nomeCategoria].total += gasto.valor;
        acc[nomeCategoria].gastos.push({ descricao: gasto.nome, valor: gasto.valor }); // <-- USANDO O CAMPO 'nome'
        return acc;
    }, {});
    return Object.keys(gastosPorCategoria).map(nome => ({
        name: nome,
        valor: parseFloat(gastosPorCategoria[nome].total.toFixed(2)),
        gastos: gastosPorCategoria[nome].gastos,
    }));
};

export default function Dashboard({ onEditGasto, dadosCompartilhados, setCurrentDate, fetchData }) {
    const { gastosRecentes, gastosDoMes, comprasParceladas, categorias, cartoes, currentDate } = dadosCompartilhados;
    const { enqueueSnackbar } = useSnackbar();

    const [nome, setNome] = useState(''); // <-- RENOMEADO
    const [anotacao, setAnotacao] = useState(''); // <-- NOVO CAMPO
    const [valor, setValor] = useState('');
    const [responsavel, setResponsavel] = useState('');
    const [categoriaId, setCategoriaId] = useState('');
    const [novaCategoria, setNovaCategoria] = useState('');
    const [dataGasto, setDataGasto] = useState(getTodayString());
    const [cartaoId, setCartaoId] = useState('debito');
    const [isParcelado, setIsParcelado] = useState(false);
    const [numParcelas, setNumParcelas] = useState(2);
    const [valorParcela, setValorParcela] = useState('');
    const [tabValue, setTabValue] = useState(0);
    const [kpiCardFilter, setKpiCardFilter] = useState('todos');
    const [chartSourceFilter, setChartSourceFilter] = useState('todos');
    const [chartCardFilter, setChartCardFilter] = useState('todos');
    const [responsavelFiltro, setResponsavelFiltro] = useState('Todos');
    
    const responsaveisUnicos = useMemo(() => {
        const nomes = new Set((gastosDoMes || []).map(g => g.responsavel));
        return ['Todos', ...Array.from(nomes)];
    }, [gastosDoMes]);

    const gastosFiltrados = useMemo(() => {
        if (responsavelFiltro === 'Todos') return gastosDoMes;
        return (gastosDoMes || []).filter(g => g.responsavel === responsavelFiltro);
    }, [gastosDoMes, responsavelFiltro]);

    const parcelasAtivasNoMes = useMemo(() => {
        return (gastosDoMes || []).filter(g => g.is_parcelado);
    }, [gastosDoMes]);

    const dadosGrafico = useMemo(() => {
        const gastosDebito = (gastosDoMes || []).filter(g => !g.cartao);
        const gastosCartao = (gastosDoMes || []).filter(g => g.cartao);
        
        let dadosIniciais = [];
        if (chartSourceFilter === 'todos') {
            dadosIniciais = gastosDoMes;
        } else if (chartSourceFilter === 'debito') {
            dadosIniciais = gastosDebito;
        } else if (chartSourceFilter === 'cartao') {
            if (chartCardFilter === 'todos') {
                dadosIniciais = gastosCartao;
            } else {
                dadosIniciais = gastosCartao.filter(g => g.cartao.id === chartCardFilter);
            }
        }
        const dadosFiltradosPorResponsavel = responsavelFiltro === 'Todos'
            ? dadosIniciais
            : (dadosIniciais || []).filter(g => g.responsavel === responsavelFiltro);
        return processarDadosGrafico(dadosFiltradosPorResponsavel);
    }, [gastosDoMes, chartSourceFilter, chartCardFilter, responsavelFiltro]);

    const { gastoTotal, totalCartoesFiltrado, totalDebito } = useMemo(() => {
        const gastosCartao = (gastosDoMes || []).filter(g => g.cartao);
        const gastosDebito = (gastosDoMes || []).filter(g => !g.cartao);
        const totalDebito = gastosDebito.reduce((sum, g) => sum + g.valor, 0);
        
        const cartoesParaSomar = kpiCardFilter === 'todos' 
            ? gastosCartao 
            : gastosCartao.filter(g => g.cartao.id === kpiCardFilter);
        const totalCartoesFiltrado = cartoesParaSomar.reduce((sum, g) => sum + g.valor, 0);
        
        const gastoTotalGeral = totalDebito + gastosCartao.reduce((sum, g) => sum + g.valor, 0);
        
        return { gastoTotal: gastoTotalGeral, totalCartoesFiltrado, totalDebito };
    }, [gastosDoMes, kpiCardFilter]);
    
    const numTransacoes = useMemo(() => gastosFiltrados.length, [gastosFiltrados]);
    const gastoMedio = useMemo(() => numTransacoes > 0 ? (gastoTotal / numTransacoes) : 0, [gastoTotal, numTransacoes]);

    const proximaFaturaInfo = useMemo(() => {
        if (kpiCardFilter === 'todos' || !cartoes.length || !gastosRecentes) {
            return null;
        }
        const cartao = cartoes.find(c => c.id === kpiCardFilter);
        if (!cartao) return null;

        const dataReferencia = currentDate; 
        let dataFechamento = new Date(dataReferencia.getFullYear(), dataReferencia.getMonth(), cartao.dia_fechamento);
        if (dataReferencia.getDate() > cartao.dia_fechamento) {
            dataFechamento = addMonths(dataFechamento, 1);
        }
        
        const dataFechamentoAnterior = subMonths(dataFechamento, 1);
        const inicioPeriodo = new Date(dataFechamentoAnterior.getFullYear(), dataFechamentoAnterior.getMonth(), dataFechamentoAnterior.getDate() + 1);
        const fimPeriodo = dataFechamento;

        const gastosDaFatura = gastosRecentes.filter(g => {
            if (g.cartao?.id !== cartao.id) return false;
            const dataGasto = new Date(g.data);
            return dataGasto >= startOfDay(inicioPeriodo) && dataGasto <= endOfDay(fimPeriodo);
        });

        const total = gastosDaFatura.reduce((sum, g) => {
             const valorASomar = g.is_parcelado ? (g.valor_parcela || 0) : g.valor;
            return sum + valorASomar;
        }, 0);

        return {
            total: formatCurrency(total),
            label: `Total p/ fatura (fecha em ${format(dataFechamento, 'dd/MM')})`
        };
    }, [kpiCardFilter, cartoes, gastosRecentes, currentDate]);

    const handleGastoSubmit = async (e) => {
        e.preventDefault();
        if (!nome || !valor || !categoriaId || !dataGasto) { // <-- USANDO 'nome'
            return enqueueSnackbar("Por favor, preencha todos os campos obrigatórios.", { variant: 'warning' });
        }
        const novoGasto = { 
            nome, // <-- USANDO 'nome'
            anotacao, // <-- NOVO CAMPO
            valor: parseFloat(valor), responsavel: responsavel || 'Eu', 
            categoria_id: parseInt(categoriaId), data: dataGasto,
            cartao_id: cartaoId === 'debito' ? null : parseInt(cartaoId),
            is_parcelado: isParcelado,
            numero_parcelas: isParcelado ? parseInt(numParcelas, 10) : 1,
            valor_parcela: isParcelado ? parseFloat(valorParcela) : null,
        };
        try {
            await createGasto(novoGasto);
            setNome(''); setAnotacao(''); setValor(''); setResponsavel(''); setDataGasto(getTodayString()); 
            setCartaoId('debito'); setIsParcelado(false); setNumParcelas(2); setValorParcela('');
            fetchData();
            enqueueSnackbar('Gasto registrado com sucesso!', { variant: 'success' });
        } catch (error) { 
            console.error("Erro ao criar gasto:", error);
            enqueueSnackbar('Falha ao registrar gasto.', { variant: 'error' });
        }
    };
    
    const handleCategoriaSubmit = async (e) => {
        e.preventDefault();
        if (!novaCategoria) return enqueueSnackbar("Digite o nome da categoria.", { variant: 'warning' });
        try {
            await createCategoria(novaCategoria);
            setNovaCategoria('');
            fetchData();
            enqueueSnackbar('Categoria criada com sucesso!', { variant: 'success' });
        } catch (error) { 
            console.error("Erro ao criar categoria:", error);
            enqueueSnackbar('Falha ao criar categoria. Talvez o nome já exista?', { variant: 'error' });
        }
    };

    const handleCategoriaDelete = async (categoriaId) => {
        if (window.confirm("Tem certeza que deseja remover esta categoria?")) {
          try {
            const response = await deleteCategoria(categoriaId);
            enqueueSnackbar(response.data.message, { 
              variant: response.data.status === 'soft_deleted' ? 'warning' : 'success' 
            });
            fetchData();
          } catch (error) {
            console.error("Erro ao remover categoria:", error);
            enqueueSnackbar('Falha ao remover categoria.', { variant: 'error' });
          }
        }
    };
    
    const handlePreviousMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const displayMonth = currentDate ? currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase()) : '';

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <IconButton onClick={handlePreviousMonth}><ArrowBackIosIcon /></IconButton>
                <Typography variant="h4" sx={{ mx: 2, width: '250px', textAlign: 'center' }}>{displayMonth}</Typography>
                <IconButton onClick={handleNextMonth}><ArrowForwardIosIcon /></IconButton>
            </Box>
            
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}><KpiCard title="Gasto Total do Mês" value={formatCurrency(gastoTotal)} icon={<AttachMoneyIcon />} color="primary.main" /></Grid>
                <Grid item xs={12} md={4}>
                    <KpiCard 
                        title="Total em Cartões no Mês" 
                        value={formatCurrency(totalCartoesFiltrado)} 
                        icon={<CreditCardIcon />} 
                        color="error.main"
                        title2={proximaFaturaInfo?.label}
                        value2={proximaFaturaInfo?.total}
                    >
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                            <Select value={kpiCardFilter} onChange={(e) => setKpiCardFilter(e.target.value)} sx={{ fontSize: '0.8rem' }}>
                                <MenuItem value="todos">Todos</MenuItem>
                                {(cartoes || []).map(c => <MenuItem key={c.id} value={c.id}>{c.nome} {!c.is_active && '(Inativo)'}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </KpiCard>
                </Grid>
                <Grid item xs={12} md={4}><KpiCard title="Total em Débito no Mês" value={formatCurrency(totalDebito)} icon={<PaymentsIcon />} color="success.main" /></Grid>
            </Grid>

            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                    <Grid item><Typography variant="h6">Análise de Gastos</Typography></Grid>
                    <Grid item>
                        <FormControl size="small" sx={{ minWidth: 180 }}>
                            <InputLabel>Fonte</InputLabel>
                            <Select value={chartSourceFilter} label="Fonte" onChange={(e) => setChartSourceFilter(e.target.value)}>
                                <MenuItem value="todos">Visão Geral</MenuItem>
                                <MenuItem value="cartao">Apenas Cartões</MenuItem>
                                <MenuItem value="debito">Apenas Débito</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    {chartSourceFilter === 'cartao' && (
                        <Grid item>
                            <FormControl size="small" sx={{ minWidth: 180 }}>
                                <InputLabel>Cartão</InputLabel>
                                <Select value={chartCardFilter} label="Cartão" onChange={(e) => setChartCardFilter(e.target.value)}>
                                    <MenuItem value="todos">Todos os Cartões</MenuItem>
                                    {(cartoes || []).map(c => <MenuItem key={c.id} value={c.id}>{c.nome} {!c.is_active && '(Inativo)'}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                    )}
                    <Grid item>
                        <FormControl size="small" sx={{ minWidth: 180 }}>
                            <InputLabel>Responsável</InputLabel>
                            <Select value={responsavelFiltro} label="Responsável" onChange={(e) => setResponsavelFiltro(e.target.value)}>
                                {responsaveisUnicos.map(nome => (<MenuItem key={nome} value={nome}>{nome}</MenuItem>))}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
                <ExpenseChart data={dadosGrafico} />
            </Paper>
            
            <Grid container spacing={3}>
                <Grid item lg={4} xs={12}>
                    <Forms
                        novaCategoria={novaCategoria} setNovaCategoria={setNovaCategoria} handleCategoriaSubmit={handleCategoriaSubmit}
                        categorias={categorias} handleCategoriaDelete={handleCategoriaDelete}
                        nome={nome} setNome={setNome} valor={valor} setValor={setValor}
                        responsavel={responsavel} setResponsavel={setResponsavel} anotacao={anotacao} setAnotacao={setAnotacao}
                        categoriaId={categoriaId} setCategoriaId={setCategoriaId} handleGastoSubmit={handleGastoSubmit}
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
                            {tabValue === 1 && <InstallmentTable gastos={parcelasAtivasNoMes} />}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}