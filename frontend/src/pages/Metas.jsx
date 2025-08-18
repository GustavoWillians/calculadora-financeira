import React, { useState, useMemo } from 'react';
import { Box, Grid, Typography, Card, CardContent, LinearProgress, Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle, Divider, List, ListItem, ListItemText, Accordion, AccordionSummary, AccordionDetails, IconButton, CardActions } from '@mui/material';
import { useSnackbar } from 'notistack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import { createMeta, deleteMeta, addContribuicaoToMeta, deleteContribuicao } from '../services/api';
import { formatCurrency } from '../utils/formatters';

const getTodayString = () => new Date().toISOString().split('T')[0];

const MetaCard = ({ meta, onContribuir, onDelete, onDeleteContribuicao }) => {
    const progresso = meta.valor_objetivo > 0 ? (meta.valor_atual / meta.valor_objetivo) * 100 : 0;
    const contribuicoesAgrupadas = useMemo(() => {
        return (meta.contribuicoes || []).reduce((acc, c) => {
            if (!acc[c.responsavel]) {
                acc[c.responsavel] = { total: 0, contribuicoes: [] };
            }
            acc[c.responsavel].total += c.valor;
            acc[c.responsavel].contribuicoes.push(c);
            return acc;
        }, {});
    }, [meta.contribuicoes]);

    return (
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6">{meta.nome}</Typography>
                <Typography color="text.secondary" variant="body2">
                    Objetivo até: {new Date(meta.data_objetivo).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                </Typography>
                <Typography variant="h5" sx={{ my: 1 }}>
                    {formatCurrency(meta.valor_atual)} / {formatCurrency(meta.valor_objetivo)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ width: '100%', mr: 1 }}><LinearProgress variant="determinate" value={progresso > 100 ? 100 : progresso} /></Box>
                    <Box sx={{ minWidth: 35 }}><Typography variant="body2" color="text.secondary">{`${Math.round(progresso)}%`}</Typography></Box>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Contribuições:</Typography>
                {Object.entries(contribuicoesAgrupadas).map(([responsavel, dados]) => (
                    <Accordion key={responsavel} sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography sx={{ flexGrow: 1 }}>{responsavel}</Typography><Typography sx={{ fontWeight: 'bold' }}>{formatCurrency(dados.total)}</Typography></AccordionSummary>
                        <AccordionDetails sx={{ p: 0 }}>
                            <List dense>
                                {(dados.contribuicoes || []).map(c => (
                                    <ListItem key={c.id} disableGutters secondaryAction={<IconButton edge="end" onClick={() => onDeleteContribuicao(c.id)}><DeleteIcon fontSize="small" /></IconButton>}>
                                        <ListItemText primary={formatCurrency(c.valor)} secondary={new Date(c.data_contribuicao).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} />
                                    </ListItem>
                                ))}
                            </List>
                        </AccordionDetails>
                    </Accordion>
                ))}
                {(meta.contribuicoes || []).length === 0 && <Typography variant="body2" color="text.secondary">Nenhuma contribuição ainda.</Typography>}
            </CardContent>
            <CardActions>
                <Button size="small" onClick={() => onContribuir(meta.id)}>Contribuir</Button>
                <Button size="small" color="error" onClick={() => onDelete(meta.id)}>Excluir Meta</Button>
            </CardActions>
        </Card>
    );
};

export default function Metas({ metas, fetchData }) {
    const { enqueueSnackbar } = useSnackbar();
    const [openMeta, setOpenMeta] = useState(false);
    const [openContribuicao, setOpenContribuicao] = useState(false);
    const [metaSelecionadaId, setMetaSelecionadaId] = useState(null);
    const [nomeMeta, setNomeMeta] = useState('');
    const [valorObjetivo, setValorObjetivo] = useState('');
    const [dataObjetivo, setDataObjetivo] = useState(getTodayString());
    const [valorContribuicao, setValorContribuicao] = useState('');
    const [responsavelContribuicao, setResponsavelContribuicao] = useState('');
    const [dataContribuicao, setDataContribuicao] = useState(getTodayString());

    const handleCreateMeta = async () => {
        try {
            await createMeta({ nome: nomeMeta, valor_objetivo: parseFloat(valorObjetivo), data_objetivo: dataObjetivo });
            fetchData();
            setNomeMeta(''); setValorObjetivo(''); setDataObjetivo(getTodayString());
            setOpenMeta(false);
            enqueueSnackbar('Meta criada com sucesso!', { variant: 'success' });
        } catch (error) {
            enqueueSnackbar('Erro ao criar meta.', { variant: 'error' });
        }
    };

    const handleDeleteMeta = async (id) => {
        if (window.confirm("Tem certeza que deseja excluir esta meta?")) {
            try {
                await deleteMeta(id);
                fetchData();
                enqueueSnackbar('Meta excluída com sucesso.', { variant: 'info' });
            } catch (error) {
                enqueueSnackbar('Erro ao excluir meta.', { variant: 'error' });
            }
        }
    };

    const handleAddContribuicao = async () => {
        try {
            await addContribuicaoToMeta(metaSelecionadaId, {
                valor: parseFloat(valorContribuicao),
                responsavel: responsavelContribuicao,
                data_contribuicao: dataContribuicao,
            });
            fetchData();
            setValorContribuicao(''); setResponsavelContribuicao('');
            setOpenContribuicao(false);
            enqueueSnackbar('Contribuição adicionada!', { variant: 'success' });
        } catch (error) {
            enqueueSnackbar('Erro ao adicionar contribuição.', { variant: 'error' });
        }
    };

    const handleDeleteContribuicao = async (contribuicaoId) => {
        if (window.confirm("Excluir esta contribuição?")) {
            try {
                await deleteContribuicao(contribuicaoId);
                fetchData();
                enqueueSnackbar('Contribuição excluída.', { variant: 'info' });
            } catch (error) {
                enqueueSnackbar('Erro ao excluir contribuição.', { variant: 'error' });
            }
        }
    }

    const openContribuicaoModal = (metaId) => {
        setDataContribuicao(getTodayString());
        setMetaSelecionadaId(metaId);
        setOpenContribuicao(true);
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4">Minhas Metas</Typography>
                <Button variant="contained" onClick={() => setOpenMeta(true)}>Nova Meta</Button>
            </Box>
            <Grid container spacing={3}>
                {(metas || []).map(meta => (
                    <Grid item xs={12} md={6} lg={4} key={meta.id}>
                        <MetaCard meta={meta} onContribuir={openContribuicaoModal} onDelete={handleDeleteMeta} onDeleteContribuicao={handleDeleteContribuicao} />
                    </Grid>
                ))}
            </Grid>
            <Dialog open={openMeta} onClose={() => setOpenMeta(false)}>
                <DialogTitle>Criar Nova Meta</DialogTitle>
                <DialogContent>
                    <TextField autoFocus margin="dense" label="Nome da Meta" type="text" fullWidth variant="standard" value={nomeMeta} onChange={(e) => setNomeMeta(e.target.value)} />
                    <TextField margin="dense" label="Valor Objetivo (R$)" type="number" fullWidth variant="standard" value={valorObjetivo} onChange={(e) => setValorObjetivo(e.target.value)} />
                    <TextField margin="dense" label="Data Objetivo" type="date" fullWidth variant="standard" value={dataObjetivo} onChange={(e) => setDataObjetivo(e.target.value)} InputLabelProps={{ shrink: true }} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenMeta(false)}>Cancelar</Button>
                    <Button onClick={handleCreateMeta}>Criar</Button>
                </DialogActions>
            </Dialog>
            <Dialog open={openContribuicao} onClose={() => setOpenContribuicao(false)}>
                <DialogTitle>Adicionar Contribuição</DialogTitle>
                <DialogContent>
                    <TextField autoFocus margin="dense" label="Valor (R$)" type="number" fullWidth variant="standard" value={valorContribuicao} onChange={(e) => setValorContribuicao(e.target.value)} />
                    <TextField margin="dense" label="Contribuinte" type="text" fullWidth variant="standard" value={responsavelContribuicao} onChange={(e) => setResponsavelContribuicao(e.target.value)} />
                    <TextField margin="dense" label="Data da Contribuição" type="date" fullWidth variant="standard" value={dataContribuicao} onChange={(e) => setDataContribuicao(e.target.value)} InputLabelProps={{ shrink: true }} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenContribuicao(false)}>Cancelar</Button>
                    <Button onClick={handleAddContribuicao}>Adicionar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}