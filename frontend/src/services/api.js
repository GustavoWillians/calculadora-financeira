import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000',
});

// --- Funções de Categoria ---
export const getCategorias = () => api.get('/categorias/');
export const createCategoria = (nome) => api.post('/categorias/', { nome });
export const deleteCategoria = (id) => api.delete(`/categorias/${id}`);

// --- Funções de Gasto ---
export const getGastos = (params) => api.get('/gastos/', { params });
export const createGasto = (gasto) => api.post('/gastos/', gasto);
export const updateGasto = (id, gastoData) => api.put(`/gastos/${id}`, gastoData);
export const deleteGasto = (id) => api.delete(`/gastos/${id}`);

// --- Funções de Meta ---
export const getMetas = () => api.get('/metas/');
export const createMeta = (meta) => api.post('/metas/', meta);
export const addContribuicaoToMeta = (metaId, contribuicao) => api.post(`/metas/${metaId}/contribuicoes/`, contribuicao);
export const deleteMeta = (id) => api.delete(`/metas/${id}`);
export const deleteContribuicao = (id) => api.delete(`/contribuicoes/${id}`);

// --- Funções de Cartão de Crédito ---
export const getCartoes = (params) => api.get('/cartoes/', { params });
export const createCartao = (cartao) => api.post('/cartoes/', cartao);
export const deactivateCartao = (id) => api.delete(`/cartoes/${id}`);
export const reactivateCartao = (id) => api.post(`/cartoes/${id}/reactivate`);

// --- Funções de Fatura ---
export const getFatura = (cartaoId, params) => api.get(`/faturas/${cartaoId}`, { params });

export default api;