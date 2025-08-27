import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, CssBaseline, Toolbar } from '@mui/material';
import { useSnackbar } from 'notistack';

import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Metas from './pages/Metas';
import Faturas from './pages/Faturas';
import EditExpenseModal from './components/EditExpenseModal';
import {
  getCategorias, getCartoes, updateGasto, deleteGasto, getGastos,
  getFatura, getMetas
} from './services/api';

export default function App() {
  const { enqueueSnackbar } = useSnackbar();

  const [gastosDoMes, setGastosDoMes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [allCards, setAllCards] = useState([]);
  const [activeCards, setActiveCards] = useState([]);
  const [metas, setMetas] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  const [gastoParaEditar, setGastoParaEditar] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      const ano = currentDate.getFullYear();
      const mes = currentDate.getMonth() + 1;

      // Busca os dados base que não dependem de outros
      const [catRes, carRes, metRes] = await Promise.all([
        getCategorias(),
        getCartoes({ include_inactive: true }),
        getMetas(),
      ]);

      const todosOsCartoes = carRes.data;
      const cartoesAtivos = todosOsCartoes.filter(c => c.is_active);
      setCategorias(catRes.data);
      setAllCards(todosOsCartoes);
      setActiveCards(cartoesAtivos);
      setMetas(metRes.data);

      // --- LÓGICA DE BUSCA UNIFICADA ---
      const debitosPromise = getGastos({ ano, mes, tipo_pagamento: 'debito' });
      const faturasPromises = todosOsCartoes.map(cartao => getFatura(cartao.id, { ano, mes }));
      
      const [debitosRes, ...faturasRes] = await Promise.all([debitosPromise, ...faturasPromises]);
      
      const gastosDeFaturas = faturasRes.flatMap(res => res.data.gastos);
      const gastosConsolidados = [...debitosRes.data, ...gastosDeFaturas];
      gastosConsolidados.sort((a, b) => new Date(b.data) - new Date(a.data));
      
      setGastosDoMes(gastosConsolidados);

    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      enqueueSnackbar('Erro ao carregar os dados do servidor.', { variant: 'error' });
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  const handleOpenEditModal = (gasto) => {
    setGastoParaEditar(gasto);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setGastoParaEditar(null);
  };

  const handleSaveGasto = async (gastoId, updatedData) => {
    try {
      await updateGasto(gastoId, updatedData);
      handleCloseEditModal();
      fetchData();
      enqueueSnackbar('Gasto atualizado com sucesso!', { variant: 'success' });
    } catch (error) {
      console.error("Falha ao atualizar gasto:", error);
      enqueueSnackbar('Não foi possível atualizar o gasto.', { variant: 'error' });
    }
  };

  const handleDeleteGasto = async (gastoId) => {
    if (window.confirm("Tem certeza que deseja excluir este gasto?")) {
      try {
        await deleteGasto(gastoId);
        handleCloseEditModal();
        fetchData();
        enqueueSnackbar('Gasto excluído com sucesso!', { variant: 'info' });
      } catch (error) {
        console.error("Falha ao excluir gasto:", error);
        enqueueSnackbar('Não foi possível excluir o gasto.', { variant: 'error' });
      }
    }
  };

  return (
    <Box sx={{ display: 'flex', bgcolor: '#f4f6f8', minHeight: '100vh' }}>
      <CssBaseline />
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - 240px)` } }}>
        <Toolbar />
        <Routes>
          <Route
            path="/"
            element={
              <Dashboard
                onEditGasto={handleOpenEditModal}
                dadosCompartilhados={{
                  gastosDoMes,
                  categorias,
                  cartoes: allCards,
                  currentDate
                }}
                setCurrentDate={setCurrentDate}
                fetchData={fetchData}
              />
            }
          />
          <Route path="/metas" element={<Metas metas={metas} fetchData={fetchData} />} />
          <Route
            path="/faturas"
            element={
              <Faturas
                onEditGasto={handleOpenEditModal}
                allCards={allCards}
                fetchData={fetchData}
                isEditModalOpen={isEditModalOpen}
              />
            }
          />
        </Routes>
      </Box>

      {gastoParaEditar && (
        <EditExpenseModal
          open={isEditModalOpen}
          onClose={handleCloseEditModal}
          gasto={gastoParaEditar}
          onSave={handleSaveGasto}
          onDelete={handleDeleteGasto}
          categorias={categorias}
          cartoes={activeCards}
        />
      )}
    </Box>
  );
}