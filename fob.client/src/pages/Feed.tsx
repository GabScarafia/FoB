import React, { useCallback, useEffect, useState } from 'react';
import Receta from '../components/Receta';
import BarraBusqueda from '../components/ui/BarraBusqueda';
import { useAuth } from "../context/AuthContext";
import '../styles/Feed.css';

// Iconos
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import NewspaperOutlinedIcon from '@mui/icons-material/NewspaperOutlined';
import SportsScoreIcon from '@mui/icons-material/SportsScore';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import KitchenIcon from '@mui/icons-material/Kitchen'
import EventNoteIcon from '@mui/icons-material/EventNote';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocalBarIcon from '@mui/icons-material/LocalBar';

// Material UI
import { Modal, Box, Button, Typography, Divider, List, ListItem, ListItemIcon, ListItemText, CircularProgress, alpha } from '@mui/material';
import { useNavigate } from 'react-router-dom';

// Tipos y Componentes
import type { RecetaType as DatosReceta, Usuario } from '../types/Receta';
import CreateRecetaDialog from 'components/CreateRecetaDialog';
import { BASE_URL } from '../apiConfig';
import fotoPerfilLocal from '../assets/images/avatar.png';

// --- CONFIGURACIÓN ---
const PAGE_SIZE = 5;

// --- INTERFACES ---
interface DesafioDto {
    id: number;
    nombre: string;
    ingredientes: string;
    descripcion: string;
    fechaInicio: string;
    fechaFin: string;
}

interface RankingItemDto {
    posicion?: number; 
    usuarioId: number;
    puntos: number;
    nombreUsuario?: string;
    recetaId?: number;
}

interface DesafioSemanalDto {
    desafioActual: DesafioDto;
    rankingAnterior: RankingItemDto[];
}

interface FeedProps {
    onDrawerToggle: (isOpen: boolean) => void;
}

interface BusquedaResponse {
    usuarios: Usuario[]; 
    recetas: DatosReceta[]; 
}

const Feed: React.FC<FeedProps> = ({ onDrawerToggle }) => {
    // === ESTADOS PRINCIPALES ===
    const [recetas, setRecetas] = useState<DatosReceta[]>([]); 
    const [recetasFiltradas, setRecetasFiltradas] = useState<DatosReceta[]>([]); 
    const [usuariosFiltrados, setUsuariosFiltrados] = useState<Usuario[]>([]);
    const [cargando, setCargando] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [mensaje, setMensaje] = useState<string | null>(null);
    
    const { authData } = useAuth();
    const token = authData?.token;
    const currentUserId = authData?.id;
    const navigate = useNavigate();

    // === PAGINACIÓN ===
    const [page, setPage] = useState(1);
    const [cargandoMas, setCargandoMas] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    // === BÚSQUEDA ===
    const [searchTerm, setSearchTerm] = useState('');
    const [searchMessage, setSearchMessage] = useState<string | null>(null);
    const [isSearchActive, setIsSearchActive] = useState(false); 
    const [mostrarResultadosCompletos, setMostrarResultadosCompletos] = useState(false);

    // === DESAFÍO Y RANKING ===
    const [desafioSemanal, setDesafioSemanal] = useState<DesafioSemanalDto | null>(null);
    const [modalDesafioOpen, setModalDesafioOpen] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [ingredienteDesafio, setIngredienteDesafio] = useState<string | undefined>(undefined);
    const [desafioIdActivo, setDesafioIdActivo] = useState<number | undefined>(undefined);

    const [currentRanking, setCurrentRanking] = useState<RankingItemDto[]>([]);
    const [modalRankingOpen, setModalRankingOpen] = useState(false);
    const [rankingCargando, setRankingCargando] = useState(false);
    const [misPuntos, setMisPuntos] = useState<number | null>(null);
    const [rankingEmptyMessage, setRankingEmptyMessage] = useState<string | null>(null);

    // === ELIMINACIÓN ===
    const [modalOpen, setModalOpen] = useState(false);
    const [recetaAEliminarId, setRecetaAEliminarId] = useState<number | null>(null);
    
    // =========================================================================
    // LÓGICA DE RANKING Y DESAFÍOS
    // =========================================================================

    const fetchCurrentRanking = async () => {
        if (!token) return;
        setRankingCargando(true);
        setRankingEmptyMessage(null);
        try {
            const response = await fetch(`${BASE_URL}/Desafios/Ranking`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                if (response.status === 404) setRankingEmptyMessage('No hay desafío actual o participaciones.');
                else setRankingEmptyMessage('No se pudo obtener el ranking en este momento.');
                setCurrentRanking([]); setMisPuntos(null); setModalRankingOpen(true); return;
            }

            const data: RankingItemDto[] = await response.json();
            setCurrentRanking(data);
            setRankingEmptyMessage(null);
            setModalRankingOpen(true);

            try {
              const resp = await fetch(`${BASE_URL}/Desafios/participacion/mis-puntos`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
              });
              if (resp.ok) { const obj = await resp.json(); setMisPuntos(obj?.puntos ?? 0); } 
              else { setMisPuntos(null); }
            } catch (err) { console.error('Error fetching points:', err); setMisPuntos(null); }
            
            handleCloseDesafioModal(false); // Cerramos el modal de desafío sin marcar visto
        } catch (err) {
            console.error("Error ranking:", err);
            setCurrentRanking([]);
            setRankingEmptyMessage('Error de red al obtener el ranking.');
            setModalRankingOpen(true);
        } finally {
            setRankingCargando(false);
        }
    }

    useEffect(() => {
        if (!token) return;
        const obtenerDesafio = async () => {
            try {
                const response = await fetch(`${BASE_URL}/Desafios/Actual`, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                });
                if (!response.ok) return;

                const data: DesafioSemanalDto = await response.json();
                setDesafioSemanal(data);

                // Verificar si ya participó para mostrar o no el modal automáticamente
                try {
                  const resp = await fetch(`${BASE_URL}/Desafios/participacion/esta`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                  });
                  let mostrar = true;
                  if (resp.ok) {
                    const obj = await resp.json();
                    if (obj && obj.participada === true) mostrar = false;
                  }
                  if (mostrar) setModalDesafioOpen(true);
                } catch (err) {
                  setModalDesafioOpen(true);
                }
            } catch (err) { console.error("Error desafío:", err); }
        };
        obtenerDesafio();
    }, [token]);

    // =========================================================================
    // LÓGICA DE CARGA DE RECETAS (FEED Y BÚSQUEDA)
    // =========================================================================

    const recargarRecetas = useCallback(async (isInitialLoad = false, terminoBusqueda: string = '') => {
        if (!token) { setCargando(false); return; }

        if (isInitialLoad) {
            setCargando(true);
            setPage(1);
            setHasMore(true);
            setMensaje(null);
        } else {
            setCargandoMas(true);
        }

        const currentPage = isInitialLoad ? 1 : page;

        try {
            let url = `${BASE_URL}/Recetas/Feed?pageNumber=${currentPage}&pageSize=${PAGE_SIZE}`;
            if (terminoBusqueda && terminoBusqueda.trim() !== '') {
                url += `&Termino=${encodeURIComponent(terminoBusqueda.trim())}`;
            }

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();
            const recetasObtenidas: DatosReceta[] = data.recetas;

            if (isInitialLoad) {
                setMensaje(data.mensaje);
                setRecetas(recetasObtenidas);
            } else {
                setRecetas(prevRecetas => [...prevRecetas, ...recetasObtenidas]);
            }

            if (recetasObtenidas.length < PAGE_SIZE) setHasMore(false);
            setPage(currentPage + 1); 

        } catch (err) {
            setError("Error al cargar las recetas. Por favor, intente de nuevo más tarde.");
            console.error("Error recetas:", err);
            setHasMore(false);
        } finally {
            setCargando(false);
            setCargandoMas(false);
        }
    }, [token, page]);

    // Carga inicial
    useEffect(() => { recargarRecetas(true); }, []);

    // Escuchar evento de nueva receta
    useEffect(() => {
        const handleRecetaCreadaEvent = () => {
            console.log('Receta creada, actualizando feed...');
            const term = mostrarResultadosCompletos ? searchTerm : '';
            recargarRecetas(true, term);
        };
        document.addEventListener('recetaCreada', handleRecetaCreadaEvent);
        return () => document.removeEventListener('recetaCreada', handleRecetaCreadaEvent);
    }, [recargarRecetas, mostrarResultadosCompletos, searchTerm]); 

    // Infinite Scroll
    useEffect(() => {
        const handleScroll = () => {
            if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 300 && 
                !cargandoMas && hasMore && !isSearchActive
            ) {
                const term = mostrarResultadosCompletos ? searchTerm : '';
                recargarRecetas(false, term);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [cargandoMas, hasMore, isSearchActive, recargarRecetas, mostrarResultadosCompletos, searchTerm]);

    // =========================================================================
    // ACCIONES DE RECETA (DELETE, ETC)
    // =========================================================================

    const handleDeleteReceta = async (recetaId: number) => {
        if (!token) return;
        try {
            const response = await fetch(`${BASE_URL}/Recetas/${recetaId}`, {
                method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.status === 204) {
                setRecetas(prev => prev.filter(r => r.id !== recetaId));
                setRecetasFiltradas(prev => prev.filter(r => r.id !== recetaId));
            }
        } catch (error) { console.error(error); } finally { handleCloseModal(); }
    }
    const handleOpenModal = async (recetaId: number) => { setRecetaAEliminarId(recetaId); setModalOpen(true); }
    const handleCloseModal = () => { setModalOpen(false); setRecetaAEliminarId(null); }
    const handleConfirmDelete = () => { if (recetaAEliminarId !== null) handleDeleteReceta(recetaAEliminarId); }

    // =========================================================================
    // MANEJADORES DE MODALES Y DIÁLOGOS
    // =========================================================================

    const handleOpenDesafioModal = () => { if (desafioSemanal) setModalDesafioOpen(true); }
    const handleCloseDesafioModal = async (markSeen = true) => {
        setModalDesafioOpen(false);
        // Aquí podrías llamar a una API para marcar como visto si fuera necesario
    }
    const handleCloseRankingModal = () => { setModalRankingOpen(false); setCurrentRanking([]); setRankingEmptyMessage(null); }
    const handleBackToDesafio = () => { setModalRankingOpen(false); setCurrentRanking([]); setModalDesafioOpen(true); }
    
    const handleCargarRecetaDesafio = () => {
        handleCloseDesafioModal(false);
        setIngredienteDesafio(desafioSemanal?.desafioActual?.ingredientes);
        setDesafioIdActivo(desafioSemanal?.desafioActual?.id);
        setIsCreateDialogOpen(true);
    }
    const handleCloseCreateDialog = () => { setIsCreateDialogOpen(false); }
    const handleRecetaCreada = () => {
        handleCloseCreateDialog();
        setIngredienteDesafio(undefined);
        setDesafioIdActivo(undefined);
        const term = mostrarResultadosCompletos ? searchTerm : '';
        recargarRecetas(true, term);
    }

    // =========================================================================
    // BÚSQUEDA DROPDOWN
    // =========================================================================

    const manejarBusqueda = async (termino: string) => {
        setSearchTerm(termino);
        const terminoLimpio = termino.trim();
        if (!token) return;

        if (terminoLimpio === '') {
            setRecetasFiltradas([]); setUsuariosFiltrados([]); setSearchMessage(null); return;
        }
        if (terminoLimpio.length < 2) {
            setRecetasFiltradas([]); setUsuariosFiltrados([]); setSearchMessage("Escribe al menos 2 caracteres."); return;
        }
        setSearchMessage(null);

        try {
            const response = await fetch(`${BASE_URL}/Busqueda?termino=${terminoLimpio}`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            if (response.ok) {
                const data: BusquedaResponse = await response.json();
                setUsuariosFiltrados(data.usuarios);
                setRecetasFiltradas(data.recetas as DatosReceta[]);
                if (data.usuarios.length === 0 && data.recetas.length === 0) setSearchMessage("No se encontraron resultados.");
            } else {
                setUsuariosFiltrados([]); setRecetasFiltradas([]); setSearchMessage("No se encontraron resultados.");
            }
        } catch (error) {
            setUsuariosFiltrados([]); setRecetasFiltradas([]); setSearchMessage("Error al conectar.");
        }
    };

    const manejarSeguirUsuario = async (followedId: number, isCurrentlyFollowing: boolean) => {
        if (!token) return;
        const method = isCurrentlyFollowing ? 'DELETE' : 'POST';
        try {
            const response = await fetch(`${BASE_URL}/Follow/${followedId}`, {
                method: method, headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            if (response.ok) {
                setUsuariosFiltrados(prev => prev.map(u => u.id === followedId ? { ...u, isFollowing: !isCurrentlyFollowing } : u));
            }
        } catch (error) { console.error(error); }
    };

    // Navegación desde búsqueda
    const handleUsuarioClick = (userId: number) => {
        setIsSearchActive(false); setSearchTerm(''); setUsuariosFiltrados([]); setRecetasFiltradas([]);
        navigate(`/perfil/${userId}`);
    };
    const handleRecetaClick = (receta: DatosReceta) => {
        if (!receta.autor?.id) return;
        setIsSearchActive(false); setSearchTerm(''); setUsuariosFiltrados([]); setRecetasFiltradas([]);
        navigate(`/perfil/${receta.autor.id}/publicaciones?receta=${receta.id}`);
    };

    // UI Búsqueda
    const handleSearchFocus = () => { setIsSearchActive(true); };
    const handleSearchBackClick = () => {
        setIsSearchActive(false); setSearchTerm(''); setSearchMessage(null);
        setUsuariosFiltrados([]); setRecetasFiltradas([]);
    };
    const handleVerTodoResultados = () => {
        setIsSearchActive(false);
        setMostrarResultadosCompletos(true);
        
        // --- AGREGAR ESTO: Ocultar header global ---
        window.dispatchEvent(new CustomEvent('toggleGlobalHeader', { detail: false }));
        
        setRecetas([]); 
        recargarRecetas(true, searchTerm);
    };

    const handleVolverAlFeed = () => {
        setMostrarResultadosCompletos(false);
        
        // --- AGREGAR ESTO: Mostrar header global de nuevo ---
        window.dispatchEvent(new CustomEvent('toggleGlobalHeader', { detail: true }));
        
        setSearchTerm('');
        setRecetasFiltradas([]);
        setUsuariosFiltrados([]);
        setRecetas([]);
        recargarRecetas(true, '');
    };

    // --- AGREGAR ESTE USEEFFECT DE SEGURIDAD ---
    // Si el usuario sale del feed o recarga, nos aseguramos que el header vuelva
    useEffect(() => {
        return () => {
            window.dispatchEvent(new CustomEvent('toggleGlobalHeader', { detail: true }));
        };
    }, []);

    // =========================================================================
    // HELPERS DE RENDERIZADO (RANKING/DESAFIO)
    // =========================================================================
    
    const getMedalIcon = (index: number) => {
        switch (index) {
            case 0: return <EmojiEventsIcon sx={{ color: '#FFD700' }} />; 
            case 1: return <EmojiEventsIcon sx={{ color: '#C0C0C0' }} />; 
            case 2: return <EmojiEventsIcon sx={{ color: '#CD7F32' }} />; 
            default: return <SportsScoreIcon sx={{ color: '#666' }} />;
        }
    };

    const renderRankingAnterior = () => {
        if (!desafioSemanal || desafioSemanal.rankingAnterior.length === 0) {
            return <Typography variant="body2" sx={{ mt: 1, color: '#666', textAlign: 'center' }}>Aún no hay datos de ranking de la semana pasada.</Typography>;
        }
        return (
            <List sx={{ p: 0 }}>
                {desafioSemanal.rankingAnterior.slice(0, 3).map((item, index) => (
                    <ListItem
                        key={item.usuarioId}
                        onClick={() => {
                             handleCloseDesafioModal();
                             if (item.recetaId) navigate(`/perfil/${item.usuarioId}/publicaciones?receta=${item.recetaId}`);
                             else navigate(`/perfil/${item.usuarioId}`);
                        }}
                        sx={(theme) => ({
                            p:1, mb:0.5, borderRadius: '6px', cursor: 'pointer',
                            bgcolor: index === 0 ? alpha(theme.palette.warning.main,0.1) : index === 1 ? theme.palette.action.hover : index === 2 ? alpha('#ff7e5f',0.1) : 'white',
                            borderLeft: `4px solid ${index === 0 ? theme.palette.warning.main : index === 1 ? theme.palette.grey[500] : index === 2 ? '#ff7e5f' : 'transparent'}`,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                        })}
                    >
                        <ListItemIcon sx={{ minWidth:35 }}>{getMedalIcon(index)}</ListItemIcon>
                        <ListItemText
                            primary={`@${item.nombreUsuario}`}
                            secondary={`${item.puntos} Puntos`}
                            primaryTypographyProps={{ fontWeight: index < 3 ? 'bold' : 'normal' }}
                        />
                    </ListItem>
                ))}
            </List>
        );
    };

    const renderDesafioActual = () => {
        if (!desafioSemanal) return null;
        const desafio = desafioSemanal.desafioActual;
        const inicio = new Date(desafio.fechaInicio).toLocaleDateString();
        const fin = new Date(desafio.fechaFin).toLocaleDateString();

        return (
            <Box sx={{
                mt: 4, p: { xs: 2, sm: 4 }, borderRadius: 4, bgcolor: 'background.default', boxShadow: 3,
                position: "relative", overflow: "hidden",
                "&::before": { content: '""', position: "absolute", top: 0, left: 0, width: "100%", height: "8px", background: "linear-gradient(90deg, #FF5722, #FF9800)" }
            }}>
                <Box sx={{ textAlign: "center", background: "linear-gradient(135deg, #ff7e5f 10%, #feb47b 90%)", borderRadius: "12px", p: 2, mb: 3, color: "white", boxShadow: "0 4px 10px rgba(0,0,0,0.15)" }}>
                    <Typography variant="h6" sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, fontWeight: 700 }}>
                        <KitchenIcon sx={{ fontSize: 26 }} /> Ingrediente Clave
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: 1, textShadow: "0 2px 4px rgba(0,0,0,0.2)" }}>
                        “{desafio.ingredientes?.toUpperCase() ?? desafio.nombre}”
                    </Typography>
                </Box>
                <Typography variant="body1" sx={{ mb: 3, color: "text.secondary", textAlign: "justify", lineHeight: 1.6 }}>{desafio.descripcion}</Typography>
                <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 1.2, backgroundColor: "action.hover", borderRadius: 2, px: 2, py: 1.5, mb: 3 }}>
                    <EventNoteIcon color="primary" sx={{ fontSize: 26 }} />
                    <Typography variant="body1" sx={{ fontWeight: 600, fontSize: "1rem" }}>
                        Duración:&nbsp;<span style={{ fontWeight: "500" }}> del {inicio} al {fin} </span>
                    </Typography>
                </Box>
                <Box sx={{ backgroundColor: (theme) => alpha(theme.palette.warning.main, 0.1), borderLeft: (theme) => `4px solid ${theme.palette.warning.main}`, borderRadius: 2, p: 2 }}>
                    <Typography variant="body2" sx={{ color: "warning.dark", fontWeight: 600, mb: 0.5 }}>⚠️ Importante:</Typography>
                    <Typography variant="body2" color="text.secondary">Tu receta debe llevar la etiqueta <strong>Desafío</strong></Typography>
                </Box>
            </Box>
        );
    };

    const renderModalDesafio = () => (
        <Modal open={modalDesafioOpen} onClose={handleCloseDesafioModal} aria-labelledby="modal-desafio-titulo" closeAfterTransition>
            <Box sx={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: { xs: '90%', sm: 550 }, bgcolor: 'background.paper', borderRadius: 4, boxShadow: 24,
                p: 4, outline: 'none', maxHeight: '90vh', overflowY: 'auto', border: (theme) => `3px solid ${theme.palette.primary.main}`
            }}>
                <Typography id="modal-desafio-titulo" variant="h4" component="h2" sx={{ mb: 1, fontWeight: 'bold', color: 'primary.main', textAlign: 'center' }}>
                    Desafío de Coctelería Semanal
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Typography variant="subtitle1" sx={{ mt: 1, pb: 1, fontWeight: '700', color: 'text.primary' }}>
                    <EmojiEventsIcon sx={{ verticalAlign: 'bottom', mr: 0.5 }} /> Top 3 de la Semana Anterior
                </Typography>
                <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>{renderRankingAnterior()}</Box>
                
                {desafioSemanal?.desafioActual && (
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                        <Button onClick={fetchCurrentRanking} variant="contained" color="primary" size="small" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }} disabled={rankingCargando}>
                            {rankingCargando ? <CircularProgress size={20} color="inherit" /> : "VER RANKING ACTUAL"}
                        </Button>
                    </Box>
                )}

                <Typography variant="h5" sx={{ mt: 4, pb: 1, fontWeight: 800, textAlign: "center", textTransform: "uppercase", background: "linear-gradient(90deg, #FF5722, #FF9800)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
                    <LocalBarIcon sx={{ color: "#FF7043", fontSize: 30 }}/> ¡A Mezclar! Desafío Actual
                </Typography>
                {renderDesafioActual()}
                
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                    <Button onClick={handleCloseDesafioModal} variant="outlined" size="large" sx={{ flexGrow: 1, borderRadius: '8px' }} color="inherit">Ver Feed</Button>
                    <Button onClick={handleCargarRecetaDesafio} variant="contained" size="large" color="primary" sx={{ flexGrow: 1, bgcolor: '#FF5722', color: 'white', borderRadius: '8px' }} startIcon={<LocalBarIcon />}>Participar</Button>
                </Box>
            </Box>
        </Modal>
    );

    const renderModalRanking = () => (
        <Modal open={modalRankingOpen} onClose={handleCloseRankingModal} aria-labelledby="modal-ranking-titulo" closeAfterTransition sx={{ p: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box sx={{ width: { xs: '95%', sm: 400 }, bgcolor: 'background.paper', borderRadius: '16px', boxShadow: 24, p: 4, outline: 'none', maxHeight: '90vh', overflowY: 'auto', border: (t) => `3px solid ${t.palette.warning.main}` }}>
                <Typography id="modal-ranking-titulo" variant="h5" sx={{ mb: 1, fontWeight: 'bold', color: 'primary.main', textAlign: 'center' }}>🏆 Ranking Actual</Typography>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary', textAlign: 'center', fontStyle: 'italic' }}>{desafioSemanal?.desafioActual?.nombre || "Desafío Semanal"}</Typography>
                {misPuntos !== null && <Typography variant="body2" sx={{ mb: 2, textAlign: 'center', fontWeight: 700 }}>Tus puntos: {misPuntos}</Typography>}
                <Divider sx={{ mb: 3 }} />

                {!rankingCargando && currentRanking.length === 0 && (
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                        <Typography variant="body1" sx={{ color: 'text.secondary' }}>{rankingEmptyMessage ?? 'No hay datos.'}</Typography>
                    </Box>
                )}

                {currentRanking.length > 0 && (
                    <List sx={{ p: 0 }}>
                        {currentRanking.map((item, index) => (
                            <ListItem key={item.usuarioId} onClick={() => { handleCloseRankingModal(); if(item.recetaId) navigate(`/perfil/${item.usuarioId}/publicaciones?receta=${item.recetaId}`); else navigate(`/perfil/${item.usuarioId}`); }} sx={(t) => ({ p:1.5, mb:1, borderRadius: '8px', cursor: 'pointer', bgcolor: index <3 ? t.palette.action.hover : 'background.paper', borderLeft: `5px solid ${index===0?t.palette.warning.main:index===1?t.palette.info.main:index===2?t.palette.error.main:t.palette.divider}`, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' })}>
                                <ListItemIcon sx={{ minWidth:40 }}><Typography variant="h6" sx={{ fontWeight: 'bold', color: index <3 ? 'primary.main' : 'text.primary' }}>{index +1}°</Typography></ListItemIcon>
                                <ListItemText primary={`@${item.nombreUsuario}`} secondary={`${item.puntos} Puntos`} primaryTypographyProps={{ fontWeight: index <3 ? '900' : '600' }} />
                                {index <3 && getMedalIcon(index)}
                            </ListItem>
                        ))}
                    </List>
                )}
                <Box sx={{ mt: 4, textAlign: 'center' }}>
                    <Button onClick={handleBackToDesafio} variant="contained" color="primary">Volver</Button>
                </Box>
            </Box>
        </Modal>
    );

    // =========================================================================
    // RENDER PRINCIPAL
    // =========================================================================

    return (
        // Contenedor Principal con overflow-x: hidden para evitar scroll horizontal
        <div className="feed-contenedor-principal">
            
            {/* Botón Flotante Desafío */}
            {desafioSemanal && !isSearchActive && !mostrarResultadosCompletos && (
                <button
                    className="boton-desafio-flotante"
                    onClick={handleOpenDesafioModal}
                    style={{
                        position: 'fixed', bottom: '80px', right: '20px', zIndex: 1000,
                        backgroundColor: '#FF5722', color: 'white', border: 'none', borderRadius: '50%',
                        width: '56px', height: '56px', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', boxShadow: '0 4px 10px rgba(255, 87, 34, 0.6)', cursor: 'pointer'
                    }}
                >
                    <SportsScoreIcon style={{ fontSize: 30 }} />
                </button>
            )}

            {/* Modales */}
            {renderModalDesafio()}
            {renderModalRanking()}
            <CreateRecetaDialog
                open={isCreateDialogOpen}
                onClose={handleCloseCreateDialog}
                onRecetaCreada={handleRecetaCreada}
                ingrediente={ingredienteDesafio}
                desafioId={desafioIdActivo}
            />
            <Modal open={modalOpen} onClose={handleCloseModal}>
                <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 300, bgcolor: 'background.paper', boxShadow: 24, p: 4, borderRadius: 2 }}>
                    <Typography variant="h6">Confirmar eliminación</Typography>
                    <Box sx={{ mt: 2, display:'flex', justifyContent:'flex-end', gap:1 }}>
                        <Button onClick={handleCloseModal}>Cancelar</Button>
                        <Button variant="contained" color="error" onClick={handleConfirmDelete}>Eliminar</Button>
                    </Box>
                </Box>
            </Modal>

            {/* Barra de Búsqueda o Header "Volver" */}
            {!mostrarResultadosCompletos ? (
                <div style={{ padding: '0 16px' }}>
                    <BarraBusqueda
                        searchTerm={searchTerm}
                        onSearchChange={manejarBusqueda}
                        onSearchSubmit={() => manejarBusqueda(searchTerm)}
                        isSearchActive={isSearchActive}
                        onFocus={handleSearchFocus}
                        onBackClick={handleSearchBackClick}
                    />
                </div>
            ) : (
                // Header Fijo "Volver"
                <Box sx={{ 
                    position: 'fixed', 
                    top: 0, 
                    left: 0, 
                    width: '100%', 
                    zIndex: 1200, // <--- CAMBIAR ESTO (antes era 999)
                    height: '64px', 
                    px: 2, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    bgcolor: 'background.paper', 
                    borderBottom: '1px solid rgba(0,0,0,0.1)', 
                    boxShadow: 1
                }}>
                    <Button 
                        variant="text" 
                        onClick={handleVolverAlFeed} 
                        startIcon={<ArrowBackIcon />} 
                        sx={{ fontWeight: 'bold', color: '#FF5722' }}
                    >
                        Volver
                    </Button>
                    <Typography 
                        variant="subtitle1" 
                        sx={{ 
                            fontWeight: 'bold', 
                            mr: 1, 
                            overflow:'hidden', 
                            textOverflow:'ellipsis', 
                            whiteSpace:'nowrap',
                            color: 'text.primary' // Asegura color visible
                        }}
                    >
                        "{searchTerm}"
                    </Typography>
                </Box>
            )}
            
            {/* Contenido Principal */}
            <div className="feed-contenido">
                {mostrarResultadosCompletos && <Box sx={{ height: '70px' }} />} {/* Espaciador para header fijo */}

                {mostrarResultadosCompletos ? (
                    // === MODO RESULTADOS COMPLETOS ===
                    <div className="resultados-completos-lista">
                        {recetas.length === 0 && !cargando && <div className="no-resultados">No se encontraron recetas.</div>}
                        {recetas.map(receta => {
                             const finalEtiquetas = (receta.etiquetas || []).map(c => typeof c === 'object' && c && 'nombre' in c ? c.nombre : c);
                             if (receta.desafioId && !finalEtiquetas.includes('DESAFIO')) finalEtiquetas.push('DESAFIO');
                             return (
                                <Receta
                                    key={receta.id}
                                    receta={{ ...receta, etiquetas: finalEtiquetas as string[] }}
                                    onDrawerToggle={onDrawerToggle}
                                    currentUserId={currentUserId ?? null}
                                    onDeleteReceta={handleOpenModal}
                                    onUsuarioClick={handleUsuarioClick}
                                />
                             );
                        })}
                        {cargandoMas && <Box sx={{ display:'flex', justifyContent:'center', p:2 }}><CircularProgress /></Box>}
                    </div>
                ) : (
                    // === MODO NORMAL / DROPDOWN ===
                    <>
                        {!isSearchActive ? (
                            // FEED DE RECETAS NORMAL
                            <div>
                                {recetas.length === 0 && mensaje && (
                                    <div className="mensaje-feed">
                                        {mensaje.includes('Sigue a gente') && <PersonAddOutlinedIcon style={{ fontSize: 50, color: '#0b2553' }} />}
                                        {mensaje.includes('No hay publicaciones') && <NewspaperOutlinedIcon style={{ fontSize: 50, color: '#0b2553' }} />}
                                        <p>{mensaje}</p>
                                    </div>
                                )}
                                {recetas.length === 0 && !mensaje && !cargando && !error && <div className="no-resultados">No hay publicaciones.</div>}
                                {error && <div className="feed-error">{error}</div>}
                                
                                {recetas.map(receta => {
                                     const finalEtiquetas = (receta.etiquetas || []).map(c => typeof c === 'object' && c && 'nombre' in c ? c.nombre : c);
                                     if (receta.desafioId && !finalEtiquetas.includes('DESAFIO')) finalEtiquetas.push('DESAFIO');
                                     return (
                                        <Receta
                                            key={receta.id}
                                            receta={{ ...receta, etiquetas: finalEtiquetas as string[] }}
                                            onDrawerToggle={onDrawerToggle}
                                            currentUserId={currentUserId ?? null}
                                            onDeleteReceta={handleOpenModal}
                                            onUsuarioClick={handleUsuarioClick}
                                            ocultarBotonSeguir={true}
                                        />
                                     );
                                })}
                                {cargandoMas && <Box sx={{ display:'flex', justifyContent:'center', p:2 }}><CircularProgress /></Box>}
                            </div>
                        ) : (
                            // DROPDOWN DE BÚSQUEDA
                            <div className="search-results-list">
                                {usuariosFiltrados.map(u => (
                                    <div key={u.id} className="resultado-usuario" onClick={() => handleUsuarioClick(u.id)}>
                                        {u.imagen ? <img src={`data:image/jpeg;base64,${u.imagen}`} alt="avatar" className="avatar-busqueda" /> : <img src={`${fotoPerfilLocal}`} alt="avatar" className="avatar-busqueda" />}
                                        <div className="usuario-info-busqueda">
                                            <span className="usuario-nombre">{u.nombreUsuario}</span>
                                            <span className="usuario-nombre-completo">{u.nombre} {u.apellido}</span>
                                        </div>
                                        {currentUserId !== u.id && (
                                            <button className={`boton-seguir ${u.isFollowing ? 'siguiendo' : ''}`} onClick={e => { e.stopPropagation(); manejarSeguirUsuario(u.id, u.isFollowing || false); }}>
                                                {u.isFollowing ? 'Siguiendo' : 'Seguir'}
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {recetasFiltradas.map(r => (
                                    <div key={r.id} className="resultado-item" onClick={() => handleRecetaClick(r)}>
                                        <span className="usuario-nombre">{r.titulo}</span>
                                        <span className="usuario-nombre-completo" style={{marginLeft:8}}>por @{r.autor?.nombreUsuario}</span>
                                    </div>
                                ))}
                                {searchMessage && <div className="no-resultados">{searchMessage}</div>}
                                {recetasFiltradas.length > 0 && <div className="ver-todo-btn" onClick={handleVerTodoResultados}>Ver todas las recetas</div>}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Feed;