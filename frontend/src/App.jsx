import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, CssBaseline, Toolbar } from '@mui/material';

import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Metas from './pages/Metas';
import Faturas from './pages/Faturas';
import EditExpenseModal from './components/EditExpenseModal';
import { 
  getCategorias, getCartoes, updateGasto, getGastos, getGastosParcelados, 
  getFatura, getMetas, createMeta, addContribuicaoToMeta, deleteMeta, deleteContribuicao 
} from './services/api';

export default function App() {
  // --- ESTADO CENTRALIZADO ---
  const [gastosDoMes, setGastosDoMes] = useState([]);
  const [comprasParceladas, setComprasParceladas] = useState([]);
  const [gastosFatura, setGastosFatura] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cartoes, setCartoes] = useState([]);
  const [metas, setMetas] = useState([]); // <-- NOVO ESTADO PARA METAS
  const [currentDate, setCurrentDate] = useState(new Date());
  const [cartaoSelecionadoId, setCartaoSelecionadoId] = useState('');
  
  const [gastoParaEditar, setGastoParaEditar] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      const ano = currentDate.getFullYear();
      const mes = currentDate.getMonth() + 1;
      
      const [catRes, carRes, gasRes, parRes, metRes] = await Promise.all([
        getCategorias(), getCartoes(), getGastos({ ano, mes }),
        getGastosParcelados({ ano, mes }), getMetas()
      ]);

      setCategorias(catRes.data);
      setCartoes(carRes.data);
      setGastosDoMes(gasRes.data);
      setComprasParceladas(parRes.data);
      setMetas(metRes.data); // <-- ATUALIZA O ESTADO DE METAS

      const firstCardId = carRes.data.length > 0 ? carRes.data[0].id : '';
      if (firstCardId && !cartaoSelecionadoId) {
        setCartaoSelecionadoId(firstCardId);
      }
      
      if (cartaoSelecionadoId || firstCardId) {
        const faturaRes = await getFatura(cartaoSelecionadoId || firstCardId, { ano, mes });
        setGastosFatura(faturaRes.data);
      }

    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentDate, cartaoSelecionadoId]);

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
      fetchData(); // ATUALIZA TUDO!
    } catch (error) {
      console.error("Falha ao atualizar gasto:", error);
      alert("Não foi possível atualizar o gasto.");
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
      gastosDoMes={gastosDoMes}
      comprasParceladas={comprasParceladas}
      categorias={categorias}
      cartoes={cartoes}
      currentDate={currentDate}
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
      cartoes={cartoes}
      fetchData={fetchData}
      gastosFatura={gastosFatura}
      currentDate={currentDate}
      setCurrentDate={setCurrentDate}
      cartaoSelecionadoId={cartaoSelecionadoId}
      setCartaoSelecionadoId={setCartaoSelecionadoId}
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
          categorias={categorias}
          cartoes={cartoes}
        />
      )}
    </Box>
  );
}