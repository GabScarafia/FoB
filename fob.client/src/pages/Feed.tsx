import React, { useCallback, useEffect, useState } from 'react';
import Receta from '../components/Receta';
import BarraBusqueda from '../components/ui/BarraBusqueda';
import { useAuth } from "../context/AuthContext";
import '../styles/Feed.css';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import NewspaperOutlinedIcon from '@mui/icons-material/NewspaperOutlined';
import SportsScoreIcon from '@mui/icons-material/SportsScore';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import KitchenIcon from '@mui/icons-material/Kitchen'
import EventNoteIcon from '@mui/icons-material/EventNote';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Modal, Box, Button, Typography, Divider, List, ListItem, ListItemIcon, ListItemText, CircularProgress, alpha } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LocalBarIcon from '@mui/icons-material/LocalBar';
import type { RecetaType as DatosReceta, Usuario } from '../types/Receta';
import CreateRecetaDialog from 'components/CreateRecetaDialog';
import { BASE_URL } from '../apiConfig';
import fotoPerfilLocal from '../assets/images/avatar.png';

// --- NUEVOS ESTADOS PARA PAGINACIÓN ---
const PAGE_SIZE = 5;

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

const Feed: React.FC<FeedProps> = ({ onDrawerToggle }) => {
    const [recetas, setRecetas] = useState<DatosReceta[]>([]); 
    // recetasFiltradas se usa SOLO para el dropdown de búsqueda rápida
    const [recetasFiltradas, setRecetasFiltradas] = useState<DatosReceta[]>([]); 
    const [usuariosFiltrados, setUsuariosFiltrados] = useState<Usuario[]>([]);
    const [cargando, setCargando] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [mensaje, setMensaje] = useState<string | null>(null);
    const { authData } = useAuth();
    const token = authData?.token;
    const currentUserId = authData?.id;
    const navigate = useNavigate();

    // --- ESTADOS PARA PAGINACIÓN ---
    const [page, setPage] = useState(1);
    const [cargandoMas, setCargandoMas] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    // === ESTADOS DE BÚSQUEDA ===
    const [searchTerm, setSearchTerm] = useState('');
    const [searchMessage, setSearchMessage] = useState<string | null>(null);
    const [isSearchActive, setIsSearchActive] = useState(false); 
    
    // === ESTADO: MODO RESULTADOS COMPLETOS ===
    const [mostrarResultadosCompletos, setMostrarResultadosCompletos] = useState(false);

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [ingredienteDesafio, setIngredienteDesafio] = useState<string | undefined>(undefined);
    const [desafioIdActivo, setDesafioIdActivo] = useState<number | undefined>(undefined);

    // ESTADOS PARA EL RANKING
    const [currentRanking, setCurrentRanking] = useState<RankingItemDto[]>([]);
    const [modalRankingOpen, setModalRankingOpen] = useState(false);
    const [rankingCargando, setRankingCargando] = useState(false);
    const [misPuntos, setMisPuntos] = useState<number | null>(null);
    const [rankingEmptyMessage, setRankingEmptyMessage] = useState<string | null>(null);

    // ESTADOS PARA LA LÓGICA DE DESAFÍO
    const [desafioSemanal, setDesafioSemanal] = useState<DesafioSemanalDto | null>(null);
    const [modalDesafioOpen, setModalDesafioOpen] = useState(false);

    // Estados para el modal de confirmación de eliminación
    const [modalOpen, setModalOpen] = useState(false);
    const [recetaAEliminarId, setRecetaAEliminarId] = useState<number | null>(null);
    
    interface BusquedaResponse {
        usuarios: Usuario[]; 
        recetas: DatosReceta[]; 
    }

    // =========================================================================
    // LÓGICA DE RANKING
    // =========================================================================
    // ... (Sin cambios en fetchCurrentRanking) ...
    const fetchCurrentRanking = async () => {
        if (!token) return;
        setRankingCargando(true);
        setRankingEmptyMessage(null);
        try {
            const response = await fetch(`${BASE_URL}/Desafios/Ranking`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    setRankingEmptyMessage('No hay desafío actual o participaciones.');
                } else {
                    setRankingEmptyMessage('No se pudo obtener el ranking en este momento.');
                }
                setCurrentRanking([]);
                setMisPuntos(null);
                setModalRankingOpen(true);
                return;
            }

            const data: RankingItemDto[] = await response.json();
            setCurrentRanking(data);
            setRankingEmptyMessage(null);
            setModalRankingOpen(true);

            try {
              const resp = await fetch(`${BASE_URL}/Desafios/participacion/mis-puntos`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
              });
              if (resp.ok) {
                const obj = await resp.json();
                setMisPuntos(obj?.puntos ?? 0);
              } else {
                setMisPuntos(null);
              }
            } catch (err) {
              console.error('Error fetching my points:', err);
              setMisPuntos(null);
            }
            handleCloseDesafioModal(); 
        } catch (err) {
            console.error("Error al obtener el ranking semanal:", err);
            setCurrentRanking([]);
            setRankingEmptyMessage('Error de red al obtener el ranking.');
            setModalRankingOpen(true);
        } finally {
            setRankingCargando(false);
        }
    }

    // EFECTO 1: Obtener el Desafío Semanal
    useEffect(() => {
        if (!token) return;

        const obtenerDesafio = async () => {
            try {
                const response = await fetch(`${BASE_URL}/Desafios/Actual`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) return;

                const data: DesafioSemanalDto = await response.json();
                setDesafioSemanal(data);

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

            } catch (err) {
                console.error("Error al obtener el desafío semanal:", err);
            }
        };

        obtenerDesafio();

    }, [token]);


    // =========================================================================
    // LÓGICA DE CARGA DE RECETAS (SCROLL INFINITO + BÚSQUEDA)
    // =========================================================================

    // MODIFICADO: Ahora acepta un término opcional para filtrar en el endpoint Feed
    const recargarRecetas = useCallback(async (isInitialLoad = false, terminoBusqueda: string = '') => {
        if (!token) {
            setCargando(false);
            return;
        }

        if (isInitialLoad) {
            setCargando(true);
            setPage(1);
            setHasMore(true);
            setMensaje(null); // Limpiar mensaje anterior
        } else {
            setCargandoMas(true);
        }

        const currentPage = isInitialLoad ? 1 : page;

        try {
            // Construcción dinámica de la URL
            let url = `${BASE_URL}/Recetas/Feed?pageNumber=${currentPage}&pageSize=${PAGE_SIZE}`;
            
            // Si hay término de búsqueda, lo agregamos a la URL
            if (terminoBusqueda && terminoBusqueda.trim() !== '') {
                url += `&Termino=${encodeURIComponent(terminoBusqueda.trim())}`;
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const recetasObtenidas: DatosReceta[] = data.recetas;

            if (isInitialLoad) {
                setMensaje(data.mensaje);
                setRecetas(recetasObtenidas);
            } else {
                setRecetas(prevRecetas => [...prevRecetas, ...recetasObtenidas]);
            }

            if (recetasObtenidas.length < PAGE_SIZE) {
                setHasMore(false);
            }

            setPage(currentPage + 1); 

        } catch (err) {
            setError("Error al cargar las recetas. Por favor, intente de nuevo más tarde.");
            console.error("Error al obtener recetas:", err);
            setHasMore(false);
        } finally {
            setCargando(false);
            setCargandoMas(false);
        }
    }, [token, page]);


    // EFECTO 2: Obtener las recetas al montar (Feed Normal)
    useEffect(() => {
        recargarRecetas(true);
    }, []);

    // EFECTO 3: Escuchar evento de recarga
    useEffect(() => {
        const handleRecetaCreadaEvent = () => {
            console.log('Evento "recetaCreada" recibido, recargando feed...');
            // Si estamos en búsqueda, recargamos la búsqueda, si no, el feed normal
            const term = mostrarResultadosCompletos ? searchTerm : '';
            recargarRecetas(true, term);
        };

        document.addEventListener('recetaCreada', handleRecetaCreadaEvent);
        return () => document.removeEventListener('recetaCreada', handleRecetaCreadaEvent);
    }, [recargarRecetas, mostrarResultadosCompletos, searchTerm]); 

    // EFECTO 4: DETECTOR DE SCROLL (MODIFICADO)
    useEffect(() => {
        const handleScroll = () => {
            // Solo ejecuta el scroll si NO estamos en búsqueda activa (dropdown)
            // PERO SÍ permite scroll si estamos en 'mostrarResultadosCompletos'
            if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 300 && 
                !cargandoMas && 
                hasMore && 
                !isSearchActive // Bloqueamos scroll si el dropdown está abierto
            ) {
                // Determinar qué término usar para la siguiente página
                const term = mostrarResultadosCompletos ? searchTerm : '';
                recargarRecetas(false, term);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
        
    }, [cargandoMas, hasMore, isSearchActive, recargarRecetas, mostrarResultadosCompletos, searchTerm]);


    // ... Lógica de eliminación ...
    const handleDeleteReceta = async (recetaId: number) => {
        if (!token) return;
        try {
            const response = await fetch(`${BASE_URL}/Recetas/${recetaId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.status === 204) {
                setRecetas(prevRecetas => prevRecetas.filter(receta => receta.id !== recetaId));
                setRecetasFiltradas(prevRecetas => prevRecetas.filter(receta => receta.id !== recetaId));
            } else {
                const errorData = await response.json();
                throw new Error(`Error al eliminar: ${JSON.stringify(errorData)}`);
            }
        } catch (error) {
            console.error('Error al eliminar la receta:', error);
        } finally {
            handleCloseModal();
        }
    }
    const handleOpenModal = async (recetaId: number) => { setRecetaAEliminarId(recetaId); setModalOpen(true); }
    const handleCloseModal = () => { setModalOpen(false); setRecetaAEliminarId(null); }
    const handleConfirmDelete = () => { if (recetaAEliminarId !== null) handleDeleteReceta(recetaAEliminarId); }


    // ... Manejadores de modales ...
    const handleOpenDesafioModal = () => { if (desafioSemanal) setModalDesafioOpen(true); }
    const handleCloseDesafioModal = async (markSeen = true) => {
        setModalDesafioOpen(false);
        if (markSeen && typeof markDesafioAsSeen === 'function') {
            try { await markDesafioAsSeen(); } catch (e) { console.error(e); }
        }
    }
    const handleCloseRankingModal = () => { setModalRankingOpen(false); setCurrentRanking([]); setRankingEmptyMessage(null); }
    const handleBackToDesafio = () => { setModalRankingOpen(false); setCurrentRanking([]); setModalDesafioOpen(true); }
    const handleCargarRecetaDesafio = () => {
        handleCloseDesafioModal(false);
        const ingrediente = desafioSemanal?.desafioActual?.ingredientes;
        const idDesafio = desafioSemanal?.desafioActual?.id;
        if (ingrediente) setIngredienteDesafio(ingrediente);
        if (idDesafio) setDesafioIdActivo(idDesafio);
        setIsCreateDialogOpen(true);
    }
    const handleCloseCreateDialog = () => { setIsCreateDialogOpen(false); }
    const handleRecetaCreada = () => {
        handleCloseCreateDialog();
        setIngredienteDesafio(undefined);
        setDesafioIdActivo(undefined);
        // Recargar según el contexto actual
        const term = mostrarResultadosCompletos ? searchTerm : '';
        recargarRecetas(true, term);
    }


    // =========================================================================
    // LÓGICA DE BÚSQUEDA RÁPIDA (DROPDOWN)
    // =========================================================================

    const manejarBusqueda = async (termino: string) => {
        setSearchTerm(termino);
        const terminoLimpio = termino.trim();

        if (!token) return;

        if (terminoLimpio === '') {
            setRecetasFiltradas([]); 
            setUsuariosFiltrados([]);
            setSearchMessage(null); 
            return;
        }

        if (terminoLimpio.length < 2) {
            setRecetasFiltradas([]);
            setUsuariosFiltrados([]);
            setSearchMessage("Escribe al menos 2 caracteres para buscar.");
            return;
        }

        setSearchMessage(null);

        try {
            const response = await fetch(`${BASE_URL}/Busqueda?termino=${terminoLimpio}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data: BusquedaResponse = await response.json();
                setUsuariosFiltrados(data.usuarios);
                setRecetasFiltradas(data.recetas as DatosReceta[]);

                if (data.usuarios.length === 0 && data.recetas.length === 0) {
                    setSearchMessage("No se encontraron resultados.");
                }
            } else {
                setUsuariosFiltrados([]);
                setRecetasFiltradas([]);
                setSearchMessage("No se encontraron resultados.");
            }
        } catch (error) {
            setUsuariosFiltrados([]);
            setRecetasFiltradas([]);
            console.error("Error de red al buscar:", error);
            setSearchMessage("Error al conectar con el servidor.");
        }
    };

    const manejarSeguirUsuario = async (followedId: number, isCurrentlyFollowing: boolean) => {
        if (!token) return;
        const method = isCurrentlyFollowing ? 'DELETE' : 'POST';
        try {
            const response = await fetch(`${BASE_URL}/Follow/${followedId}`, {
                method: method,
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            if (response.ok) {
                setUsuariosFiltrados(prevUsuarios =>
                    prevUsuarios.map(u => u.id === followedId ? { ...u, isFollowing: !isCurrentlyFollowing } : u)
                );
            }
        } catch (error) { console.error('Error de red al seguir/dejar de seguir:', error); }
    };

    const handleUsuarioClick = (userId: number) => {
        setIsSearchActive(false);
        setSearchTerm('');
        setUsuariosFiltrados([]);
        setRecetasFiltradas([]);
        navigate(`/perfil/${userId}`);
    };

    const handleRecetaClick = (receta: DatosReceta) => {
        if (!receta.autor?.id) {
            setIsSearchActive(false);
            setSearchTerm('');
            setUsuariosFiltrados([]);
            setRecetasFiltradas([]);
            return;
        }
        setIsSearchActive(false);
        setSearchTerm('');
        setUsuariosFiltrados([]);
        setRecetasFiltradas([]);
        navigate(`/perfil/${receta.autor.id}/publicaciones?receta=${receta.id}`);
    };
    
    // === FUNCIONES UI BÚSQUEDA ===
    const handleSearchFocus = () => { setIsSearchActive(true); };

    const handleSearchBackClick = () => {
        setIsSearchActive(false);
        setSearchTerm('');
        setSearchMessage(null);
        setUsuariosFiltrados([]);
        setRecetasFiltradas([]); 
    };

    // === LÓGICA "VER TODO" (MODIFICADA) ===
    const handleVerTodoResultados = () => {
        // 1. Cerramos dropdown
        setIsSearchActive(false);
        // 2. Activamos modo resultados
        setMostrarResultadosCompletos(true);
        // 3. Limpiamos la lista actual y cargamos desde el endpoint de Feed con el término
        setRecetas([]); // Limpiamos visualmente para que aparezca el loading
        recargarRecetas(true, searchTerm);
    };

    const handleVolverAlFeed = () => {
        setMostrarResultadosCompletos(false);
        setSearchTerm('');
        setRecetasFiltradas([]);
        setUsuariosFiltrados([]);
        // Recargamos el feed normal sin término
        setRecetas([]);
        recargarRecetas(true, '');
    };


    // Si carga inicial y no hay recetas
    if (cargando && recetas.length === 0 && !mostrarResultadosCompletos) {
        return <div className="feed-cargando">Cargando feed...</div>;
    }

    if (error && !mostrarResultadosCompletos) {
        return <div className="feed-error">{error}</div>;
    }

    // ... Helpers de Iconos ...
    const getMedalIcon = (index: number) => {
        switch (index) {
            case 0: return <EmojiEventsIcon sx={{ color: '#FFD700' }} />; 
            case 1: return <EmojiEventsIcon sx={{ color: '#C0C0C0' }} />; 
            case 2: return <EmojiEventsIcon sx={{ color: '#CD7F32' }} />; 
            default: return <SportsScoreIcon sx={{ color: '#666' }} />;
        }
    };

    // ... Helpers de Renderizado de Modal ...
    const renderRankingAnterior = () => {
        if (!desafioSemanal || desafioSemanal.rankingAnterior.length === 0) {
            return (
                <Typography variant="body2" sx={{ mt: 1, color: '#666', textAlign: 'center' }}>
                    Aún no hay datos de ranking de la semana pasada. ¡Sé el primero!
                </Typography>
            );
        }
        return (
            <List sx={{ p: 0 }}>
                {desafioSemanal.rankingAnterior.slice(0, 3).map((item, index) => (
                    <ListItem
                        key={item.usuarioId}
                        onClick={() => {
                            if (item.recetaId) {
                                handleCloseDesafioModal();
                                navigate(`/perfil/${item.usuarioId}/publicaciones?receta=${item.recetaId}`);
                            } else {
                                handleCloseDesafioModal();
                                navigate(`/perfil/${item.usuarioId}`);
                            }
                        }}
                        sx={(theme) => ({
                            p:1, mb:0.5, borderRadius: '6px', cursor: 'pointer',
                            bgcolor: index ===0 ? alpha(theme.palette.warning.main,0.1)
                            : index ===1 ? theme.palette.action.hover
                            : index ===2 ? alpha('#ff7e5f',0.1) 
                            : 'white',
                            borderLeft: `4px solid ${
                                index ===0 ? theme.palette.warning.main
                                : index ===1 ? theme.palette.grey[500]
                                : index ===2 ? '#ff7e5f'
                                : 'transparent'
                            }`,
                            boxShadow: '01px3px rgba(0,0,0,0.05)',
                            '&:hover': { transform: 'translateY(-2px)', boxShadow: '06px18px rgba(0,0,0,0.08)' }
                        })}
                    >
                        <ListItemIcon sx={{ minWidth:35 }}>
                            {getMedalIcon(index)}
                        </ListItemIcon>
                        <ListItemText
                            primary={`@${item.nombreUsuario}`}
                            secondary={`${item.puntos} Puntos`}
                            primaryTypographyProps={{ 
                                fontWeight: index <3 ? 'bold' : 'normal',
                                color: index ===0 ? 'warning.dark' : 'text.primary' 
                            }}
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
                "&::before": {
                    content: '""', position: "absolute", top: 0, left: 0, width: "100%", height: "8px",
                    background: "linear-gradient(90deg, #FF5722, #FF9800)",
                },
                animation: "fadeIn 0.6s ease-out",
                "@keyframes fadeIn": { from: { opacity: 0, transform: "translateY(10px)" }, to: { opacity: 1, transform: "translateY(0)" }, },
            }}>
                <Box sx={{
                    textAlign: "center", background: "linear-gradient(135deg, #ff7e5f 10%, #feb47b 90%)",
                    borderRadius: "12px", p: 2, mb: 3, color: "white", boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
                }}>
                    <Typography variant="h6" sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, fontWeight: 700, letterSpacing: "0.5px", }}>
                        <KitchenIcon sx={{ fontSize: 26 }} /> Ingrediente Clave
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: 1, textShadow: "0 2px 4px rgba(0,0,0,0.2)", }}>
                        “{desafio.ingredientes?.toUpperCase() ?? desafio.nombre}”
                    </Typography>
                </Box>
                <Typography variant="body1" sx={{ mb: 3, color: "text.secondary", textAlign: "justify", lineHeight: 1.6, }}>
                    {desafio.descripcion}
                </Typography>
                <Box sx={{
                    display: "flex", justifyContent: "center", alignItems: "center", gap: 1.2,
                    backgroundColor: "action.hover", borderRadius: 2, px: 2, py: 1.5, mb: 3,
                }}>
                    <EventNoteIcon color="primary" sx={{ fontSize: 26 }} />
                    <Typography variant="body1" sx={{ fontWeight: 600, fontSize: "1rem" }}>
                        Duración:&nbsp;
                        <span style={{ fontWeight: "500" }}> del {inicio} al {fin} </span>
                    </Typography>
                </Box>
                <Box sx={{
                    backgroundColor: (theme) => alpha(theme.palette.warning.main, 0.1),
                    borderLeft: (theme) => `4px solid ${theme.palette.warning.main}`,
                    borderRadius: 2, p: 2,
                }}>
                    <Typography variant="body2" sx={{ color: "warning.dark", fontWeight: 600, mb: 0.5, }}>
                        ⚠️ Importante:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Tu receta debe llevar la etiqueta <strong>Desafío</strong>
                    </Typography>
                </Box>
            </Box>
        );
    };

    const renderModalDesafio = () => {
        return (
            <Modal open={modalDesafioOpen} onClose={handleCloseDesafioModal} aria-labelledby="modal-desafio-titulo" closeAfterTransition>
                <Box sx={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    width: { xs: '90%', sm: 550 }, bgcolor: 'background.paper', borderRadius: 4, boxShadow: 24,
                    p: 4, outline: 'none', maxHeight: '90vh', overflowY: 'auto',
                    border: (theme) => `3px solid ${theme.palette.primary.main}`
                }}>
                    <Typography id="modal-desafio-titulo" variant="h4" component="h2" sx={{ mb: 1, fontWeight: 'bold', color: 'primary.main', textAlign: 'center' }}>
                        Desafío de Coctelería Semanal
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                    <Typography variant="subtitle1" sx={{ mt: 1, pb: 1, fontWeight: '700', color: 'text.primary' }}>
                        <EmojiEventsIcon sx={{ verticalAlign: 'bottom', mr: 0.5 }} /> Top 3 de la Semana Anterior
                    </Typography>
                    <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                        {renderRankingAnterior()}
                    </Box>
                    {desafioSemanal?.desafioActual && (
                        <Box sx={{ mt: 2, textAlign: 'center' }}>
                            <Button onClick={fetchCurrentRanking} variant="contained" color="primary" size="small"
                                sx={{ fontWeight: 'bold', textTransform: 'uppercase' }} disabled={rankingCargando}
                            >
                                {rankingCargando ? <CircularProgress size={20} color="inherit" /> : "VER RANKING ACTUAL"}
                            </Button>
                        </Box>
                    )}
                    <Typography variant="h5" sx={{
                        mt: 4, pb: 1, fontWeight: 800, textAlign: "center", textTransform: "uppercase",
                        letterSpacing: "0.8px", background: "linear-gradient(90deg, #FF5722, #FF9800)",
                        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 1,
                    }}>
                        <LocalBarIcon sx={{ color: "#FF7043", fontSize: 30, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))", }}/>
                        ¡A Mezclar! Desafío Actual
                    </Typography>
                    {renderDesafioActual()}
                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                        <Button onClick={handleCloseDesafioModal} variant="outlined" size="large"
                            sx={{ flexGrow: 1, borderRadius: '8px' }} color="inherit"
                        >
                            Ver Feed
                        </Button>
                        <Button onClick={handleCargarRecetaDesafio} variant="contained" size="large" color="primary"
                            sx={{
                                flexGrow: 1, bgcolor: '#FF5722', color: 'white', borderRadius: '8px',
                                '&:hover': { bgcolor: '#E64A19' },
                            }}
                            startIcon={<LocalBarIcon />}
                        >
                            Participar
                        </Button>
                    </Box>

                </Box>
            </Modal>
        );
    };

    const renderModalRanking = () => {
        const hasRanking = currentRanking.length > 0;
        const nombreDesafio = desafioSemanal?.desafioActual?.nombre || "Desafío Semanal";

        return (
            <Modal
                open={modalRankingOpen} onClose={handleCloseRankingModal} aria-labelledby="modal-ranking-titulo" closeAfterTransition
                sx={{ p: 0, m: 0, display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: { xs: 'flex-start', sm: 'center' }, backgroundColor: { xs: 'transparent', sm: 'rgba(0,0,0,0.5)' }, }}
                slotProps={{ backdrop: { sx: { backgroundColor: { xs: 'transparent', sm: 'rgba(0,0,0,0.5)' }, }, }, }}
            >
                <Box sx={(theme) => ({
                    position: { xs: 'fixed', sm: 'fixed' }, top: { xs: 0, sm: '50%' }, left: { xs: 0, sm: '50%' },
                    transform: { xs: 'none', sm: 'translate(-50%, -50%)' }, width: { xs: '100vw', sm: 400 }, height: { xs: '100vh', sm: 'auto' },
                    bgcolor: 'background.paper', borderRadius: { xs: 0, sm: '16px' }, boxShadow: 24, p: { xs: 2, sm: 4 },
                    outline: 'none', overflowY: 'auto', border: `3px solid ${theme.palette.warning.main}`,
                    background: theme.palette.background.paper, maxHeight: { xs: 'none', sm: '90vh' },
                })}>
                    <Typography id="modal-ranking-titulo" variant="h5" component="h2"
                        sx={{ mb: 1, fontWeight: 'bold', color: 'primary.main', textAlign: 'center' }}
                    >
                        🏆 Ranking Actual
                    </Typography>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary', textAlign: 'center', fontStyle: 'italic' }}>
                        {nombreDesafio}
                    </Typography>
                    {misPuntos !== null && (
                    <Typography variant="body2" sx={{ mb: 2, color: 'text.primary', textAlign: 'center', fontWeight: 700 }}>
                        Tus puntos: {misPuntos}
                    </Typography>
                    )}
                    <Divider sx={{ mb: 3 }} />

                    {!rankingCargando && !hasRanking && (
                        <Box sx={{ py: 6, textAlign: 'center' }}>
                            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
                                {rankingEmptyMessage ?? 'No hay desafío actual o no hay participaciones.'}
                            </Typography>
                        </Box>
                    )}

                    {hasRanking && (
                        <List sx={{ p: 0 }}>
                            {currentRanking.map((item, index) => (
                                <ListItem
                                    key={item.usuarioId}
                                    onClick={() => {
                                        if (item.recetaId) {
                                            handleCloseRankingModal();
                                            navigate(`/perfil/${item.usuarioId}/publicaciones?receta=${item.recetaId}`);
                                        } else {
                                            handleCloseRankingModal();
                                            navigate(`/perfil/${item.usuarioId}`);
                                        }
                                    }}
                                    sx={(theme) => ({
                                        p:1.5, mb:1, borderRadius: '8px', cursor: 'pointer',
                                        bgcolor: index <3 ? theme.palette.action.hover : 'background.paper',
                                        borderLeft: `5px solid ${index ===0 ? theme.palette.warning.main :
                                            index ===1 ? theme.palette.info.main :
                                                index ===2 ? theme.palette.error.main :
                                                    theme.palette.divider}`,
                                        boxShadow: '01px4px rgba(0,0,0,0.08)',
                                        '&:hover': { transform: 'translateY(-2px)', boxShadow: '06px18px rgba(0,0,0,0.08)' }
                                    })}
                                >
                                    <ListItemIcon sx={{ minWidth:40 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: index <3 ? 'primary.main' : 'text.primary' }}>
                                            {index +1}°
                                        </Typography>
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={`@${item.nombreUsuario}`}
                                        secondary={`${item.puntos} Puntos`}
                                        primaryTypographyProps={{ fontWeight: index <3 ? '900' : '600', color: 'text.primary' }}
                                    />
                                    {index <3 && getMedalIcon(index)}
                                </ListItem>
                            ))}
                        </List>
                    )}
                    <Box sx={{ mt: 4, textAlign: 'center' }}>
                        <Button
                            onClick={handleBackToDesafio} variant="contained" color="primary"
                            sx={(theme) => ({
                                ...(theme.palette.mode === 'dark' && {
                                    backgroundColor: '#90caf9', color: theme.palette.getContrastText('#90caf9'),
                                    '&:hover': { backgroundColor: '#79a5c6', }
                                }),
                            })}
                        >
                            Volver
                        </Button>
                    </Box>
                </Box>
            </Modal>
        );
    };
    
    return (
        <div className="feed-contenedor-principal">
            {/* Botón Flotante para el Desafío (Oculto si buscamos) */}
            {desafioSemanal && !isSearchActive && !mostrarResultadosCompletos && (
                <button
                    className="boton-desafio-flotante"
                    onClick={handleOpenDesafioModal}
                    style={{
                        position: 'fixed', bottom: '70px', right: '20px', zIndex: 1000,
                        backgroundColor: '#FF5722', color: 'white', border: 'none', borderRadius: '50%',
                        width: '56px', height: '56px', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', boxShadow: '0 4px 10px rgba(255, 87, 34, 0.6)',
                        cursor: 'pointer', transition: 'background-color 0.3s, transform 0.2s',
                        transform: modalDesafioOpen || modalRankingOpen ? 'scale(0)' : 'scale(1)'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#E64A19'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#FF5722'}
                >
                    <SportsScoreIcon style={{ fontSize: 30 }} />
                </button>
            )}

            {renderModalDesafio()}
            {renderModalRanking()}
            <CreateRecetaDialog
                open={isCreateDialogOpen}
                onClose={handleCloseCreateDialog}
                onRecetaCreada={handleRecetaCreada}
                ingrediente={ingredienteDesafio}
                desafioId={desafioIdActivo}
            />
            
         {/* === BARRA BÚSQUEDA O HEADER "VOLVER" === */}
            {!mostrarResultadosCompletos ? (
                <BarraBusqueda
                    searchTerm={searchTerm}
                    onSearchChange={manejarBusqueda}
                    onSearchSubmit={() => manejarBusqueda(searchTerm)}
                    isSearchActive={isSearchActive}
                    onFocus={handleSearchFocus}
                    onBackClick={handleSearchBackClick}
                />
            ) : (
                // === HEADER FIJO QUE REEMPLAZA AL APP BAR ===
                <Box sx={{ 
                    position: 'fixed',        // Se fija a la pantalla
                    top: 0,                   // Pegado al techo
                    left: 0,
                    width: '100%',            // Ocupa todo el ancho
                    zIndex: 9999,             // Z-Index alto para tapar el "Bienvenido Alessandro"
                    height: '64px',           // Altura estándar de una App Bar
                    p: 2, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    bgcolor: 'background.paper', // Color de fondo sólido (importante para tapar lo de atrás)
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: 3
                    // ELIMINADO: mt: 8  <-- Esto era lo que causaba el espacio gigante
                }}>
                    <Button 
                        variant="text" 
                        onClick={handleVolverAlFeed}
                        startIcon={<ArrowBackIcon />}
                        sx={{ fontWeight: 'bold', color: '#FF5722' }}
                    >
                        Volver
                    </Button>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mr: 2 }}>
                        Resultados para "{searchTerm}"
                    </Typography>
                </Box>
            )}
            
            
            {/* === CONTENIDO CONDICIONAL === */}
            <div className="feed-contenido">
                
             {/* ===================================
                    MODO RESULTADOS COMPLETOS (VER TODO)
                   =================================== */}
                {mostrarResultadosCompletos ? (
                    <div className="resultados-completos-lista" style={{ paddingTop: '20px' }}>
                        
                        {recetas.length === 0 && !cargando && (
                            <div className="no-resultados">No se encontraron recetas para esta búsqueda.</div>
                        )}

                        {/* USAMOS 'recetas' QUE AHORA CONTIENE EL FEED FILTRADO */}
                        {recetas.map(receta => {
                             const etiquetasFormateadas = (receta.etiquetas || []).map(cat => {
                                if (typeof cat === 'object' && cat !== null && 'nombre' in cat) {
                                    return cat.nombre;
                                }
                                return cat;
                            });
                            const finalEtiquetas = [...etiquetasFormateadas];
                            if (receta.desafioId && !finalEtiquetas.includes('DESAFIO')) {
                                finalEtiquetas.push('DESAFIO');
                            }
                            return (
                                <Receta
                                    key={receta.id}
                                    receta={{ ...receta, etiquetas: finalEtiquetas }}
                                    onDrawerToggle={onDrawerToggle}
                                    currentUserId={currentUserId ?? null}
                                    onDeleteReceta={handleOpenModal}
                                    onUsuarioClick={handleUsuarioClick}
                                />
                            );
                        })}
                        
                        {cargandoMas && (
                            <div style={{ textAlign: 'center', padding: '20px' }}>
                                <CircularProgress />
                            </div>
                        )}

                        {!hasMore && recetas.length > 0 && (
                            <div style={{ textAlign: 'center', padding: '4px', color: '#888' }}>
                                Fin de los resultados.
                            </div>
                        )}
                    </div>

                ) : (
                    // ===================================
                    // FEED NORMAL Y DROP DOWN BÚSQUEDA
                    // ===================================
                    <>
                        {!isSearchActive ? (
                            // 1. FEED NORMAL
                            <>
                                {recetas.length === 0 && mensaje && (
                                    <div className="mensaje-feed">
                                        {mensaje.includes('Sigue a gente') && (
                                            <PersonAddOutlinedIcon style={{ fontSize: 50, color: '#0b2553' }} />
                                        )}
                                        {mensaje.includes('No hay publicaciones') && (
                                            <NewspaperOutlinedIcon style={{ fontSize: 50, color: '#0b2553' }} />
                                        )}
                                        <p>{mensaje}</p>
                                    </div>
                                )}
                                {recetas.length === 0 && !mensaje && !cargando && !error && (
                                    <div className="no-resultados">No se encontraron recetas.</div>
                                )}

                                {recetas.map(receta => {
                                    const etiquetasFormateadas = (receta.etiquetas || []).map(cat => {
                                        if (typeof cat === 'object' && cat !== null && 'nombre' in cat) {
                                            return cat.nombre;
                                        }
                                        return cat;
                                    });
                                    const finalEtiquetas = [...etiquetasFormateadas];
                                    if (receta.desafioId && !finalEtiquetas.includes('DESAFIO')) {
                                        finalEtiquetas.push('DESAFIO');
                                    }
                                    return (
                                        <Receta
                                            key={receta.id}
                                            receta={{ ...receta, etiquetas: finalEtiquetas }}
                                            onDrawerToggle={onDrawerToggle}
                                            currentUserId={currentUserId ?? null}
                                            onDeleteReceta={handleOpenModal}
                                            onUsuarioClick={handleUsuarioClick}
                                            ocultarBotonSeguir={true}
                                        />
                                    );
                                })}

                                {cargandoMas && (
                                    <div style={{ textAlign: 'center', padding: '20px' }}>
                                        <CircularProgress />
                                    </div>
                                )}

                                {!hasMore && recetas.length > 0 && (
                                    <div style={{ textAlign: 'center', padding: '4px', color: '#888' }}>
                                        Fin de las recetas.
                                    </div>
                                )}
                            </>
                        ) : (
                            // 2. MODO BÚSQUEDA ACTIVA (DROP DOWN)
                            <div className="search-results-list">
                                
                                {usuariosFiltrados.length > 0 && (
                                    usuariosFiltrados.map(usuario => (
                                        <div
                                            key={usuario.id}
                                            className="resultado-usuario"
                                            onClick={() => handleUsuarioClick(usuario.id)}
                                        >
                                            {usuario.imagen ? (
                                                <img src={`data:image/jpeg;base64,${usuario.imagen}`} alt="avatar" className="avatar-busqueda" />
                                            ) : (
                                                <img src={`${fotoPerfilLocal}`} alt="avatar" className="avatar-busqueda" />
                                            )}
                                            <div className="usuario-info-busqueda">
                                                <span className="usuario-nombre">{usuario.nombreUsuario}</span>
                                                <span className="usuario-nombre-completo">{usuario.nombre} {usuario.apellido}</span>
                                            </div>
                                            {currentUserId !== usuario.id && (
                                                <button
                                                    className={`boton-seguir ${usuario.isFollowing ? 'siguiendo' : ''}`}
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        manejarSeguirUsuario(usuario.id, usuario.isFollowing || false);
                                                    }}
                                                >
                                                    {usuario.isFollowing ? 'Siguiendo' : 'Seguir'}
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}

                                {recetasFiltradas.length > 0 && (
                                    recetasFiltradas.map(receta => (
                                        <div
                                            key={receta.id}
                                            className="resultado-item" 
                                            onClick={() => handleRecetaClick(receta)}
                                        >
                                            <span className="usuario-nombre">{receta.titulo}</span>
                                            <span className="usuario-nombre-completo">por @{receta.autor?.nombreUsuario}</span>
                                        </div>
                                    ))
                                )}

                                {searchMessage && (
                                    <div className="no-resultados-mensaje">
                                        {searchMessage}
                                    </div>
                                )}
                                
                                {searchTerm.trim() === '' && !searchMessage && (
                                    <div className="no-resultados-mensaje">
                                        Busca usuarios o recetas.
                                    </div>
                                )}

                                {/* === BOTÓN VER TODO === */}
                                {(recetasFiltradas.length > 0) && (
                                    <div 
                                        className="ver-todo-btn"
                                        onClick={handleVerTodoResultados}
                                        style={{
                                            padding: '15px',
                                            textAlign: 'center',
                                            color: '#FF5722',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            borderTop: '1px solid #eee',
                                            marginTop: '5px'
                                        }}
                                    >
                                        Ver todas las recetas
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal de confirmación de eliminación */}
            <Modal open={modalOpen} onClose={handleCloseModal} aria-labelledby="modal-eliminar-receta">
                <Box sx={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    width: 400, bgcolor: 'background.paper', boxShadow: 24, p: 4, borderRadius: '8px'
                }}>
                    <Typography id="modal-eliminar-receta" className="modal-titulo" component="h2">
                        Confirmar eliminación
                    </Typography>
                    <Typography className="modal-descripcion" sx={{ mt: 2 }}>
                        ¿Estás seguro de que quieres eliminar esta receta? Esta acción no se puede deshacer.
                    </Typography>
                    <Box className="modal-acciones" sx={{ mt: 3 }}>
                        <Button onClick={handleCloseModal} variant="outlined" className="modal-btn-cancelar">
                            Cancelar
                        </Button>
                        <Button onClick={handleConfirmDelete} variant="contained" className="modal-btn-eliminar">
                            Eliminar
                        </Button>
                    </Box>
                </Box>
            </Modal>
        </div>
    );
};  

export default Feed;