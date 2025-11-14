import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Receta from '../components/Receta';
import BarraBusqueda from '../components/ui/BarraBusqueda';
import { useAuth } from "../context/AuthContext";
import '../styles/Feed.css';
import type { Comentario } from 'components/DrawerComentarios';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import NewspaperOutlinedIcon from '@mui/icons-material/NewspaperOutlined';
import SportsScoreIcon from '@mui/icons-material/SportsScore';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import KitchenIcon from '@mui/icons-material/Kitchen'
import EventNoteIcon from '@mui/icons-material/EventNote';
import { Modal, Box, Button, Typography, Divider, List, ListItem, ListItemIcon, ListItemText, CircularProgress, alpha, ThemeProvider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LocalBarIcon from '@mui/icons-material/LocalBar';
import type { RecetaType as DatosReceta, Usuario } from '../types/Receta';
import CreateRecetaDialog from 'components/CreateRecetaDialog';
import { BASE_URL } from '../apiConfig';
import { getTheme } from '../theme';
import fotoPerfilLocal from '../assets/images/avatar.png';

// --- NUEVOS ESTADOS PARA PAGINACIÓN ---
const PAGE_SIZE = 5; // <-- DEFINIMOS EL TAMAÑO DE PÁGINA

interface DesafioDto {
    id: number;
    nombre: string;
    ingrediente: string;
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
    const [recetas, setRecetas] = useState<DatosReceta[]>([]); // <-- Recetas del Feed
    const [recetasFiltradas, setRecetasFiltradas] = useState<DatosReceta[]>([]); // <-- Recetas de BÚSQUEDA
    const [usuariosFiltrados, setUsuariosFiltrados] = useState<Usuario[]>([]);
    const [cargando, setCargando] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [mensaje, setMensaje] = useState<string | null>(null);
    const { authData } = useAuth();
    const token = authData?.token;
    const currentUserId = authData?.id;
    const navigate = useNavigate();

    // --- NUEVOS ESTADOS PARA PAGINACIÓN ---
    const [page, setPage] = useState(1);
    const [cargandoMas, setCargandoMas] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    // === ESTADOS DE BÚSQUEDA ===
    const [searchTerm, setSearchTerm] = useState('');
    const [searchMessage, setSearchMessage] = useState<string | null>(null);
    const [isSearchActive, setIsSearchActive] = useState(false); 
    // ===========================

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [ingredienteDesafio, setIngredienteDesafio] = useState<string | undefined>(undefined);

    const [desafioIdActivo, setDesafioIdActivo] = useState<number | undefined>(undefined);

    // ESTADOS PARA EL RANKING
    const [currentRanking, setCurrentRanking] = useState<RankingItemDto[]>([]);
    const [modalRankingOpen, setModalRankingOpen] = useState(false);
    const [rankingCargando, setRankingCargando] = useState(false);

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
    // LÓGICA DE RANKING (Sin cambios)
    // =========================================================================

    const fetchCurrentRanking = async () => {
        if (!token) return;
        setRankingCargando(true);
        try {
            const response = await fetch(`${BASE_URL}/Desafios/Ranking`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                setCurrentRanking([]);
                return;
            }

            const data: RankingItemDto[] = await response.json();
            setCurrentRanking(data);
            setModalRankingOpen(true); 
            handleCloseDesafioModal(); 
        } catch (err) {
            console.error("Error al obtener el ranking semanal:", err);
            setCurrentRanking([]);
        } finally {
            setRankingCargando(false);
        }
    };


    // EFECTO 1: Obtener el Desafío Semanal (Sin cambios)
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

                if (!response.ok) {
                    return;
                }

                const data: DesafioSemanalDto = await response.json();
                setDesafioSemanal(data);
                
                // mostrar modal una vez sola
                const desafioId = data?.desafioActual?.id;
                if (desafioId) {
                    const userKey = currentUserId ? `${currentUserId}` : 'anon';
                    const localKey = `desafio_seen_${desafioId}_${userKey}`;
                    const alreadySeen = localStorage.getItem(localKey);
                    if (!alreadySeen) {

                        setModalDesafioOpen(true);
                        try { localStorage.setItem(localKey, '1'); } catch {}
                    }
                }
            } catch (err) {
                console.error("Error al obtener el desafío semanal:", err);
            }
        };

        obtenerDesafio();

    }, [token]);


    // =========================================================================
    // LÓGICA DE CARGA DE RECETAS (MODIFICADA PARA SCROLL INFINITO)
    // =========================================================================

    // useCallback para la función de obtener recetas
    const recargarRecetas = useCallback(async (isInitialLoad = false) => {
        if (!token) {
            setCargando(false);
            return;
        }

        // Si es la carga inicial, mostramos el spinner grande
        if (isInitialLoad) {
            setCargando(true);
            setPage(1); // Resetea la página
            setHasMore(true); // Resetea si hay más
        } else {
            // Si no es carga inicial (es scroll), mostramos spinner pequeño
            setCargandoMas(true);
        }

        const currentPage = isInitialLoad ? 1 : page; // Usa la página 1 si es carga inicial

        try {
            // Pide la página y tamaño correctos
            const response = await fetch(`${BASE_URL}/Recetas/Feed?pageNumber=${currentPage}&pageSize=${PAGE_SIZE}`, {
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
                setMensaje(data.mensaje); // Solo setea el mensaje en la carga inicial
                setRecetas(recetasObtenidas); // Reemplaza las recetas
            } else {
                // AÑADE las nuevas recetas a las existentes
                setRecetas(prevRecetas => [...prevRecetas, ...recetasObtenidas]);
            }

            // Si el backend devuelve menos recetas que las pedidas (o 0), ya no hay más.
            if (recetasObtenidas.length < PAGE_SIZE) {
                setHasMore(false);
            }

            // Actualiza el número de página para la *siguiente* llamada
            setPage(currentPage + 1); 

        } catch (err) {
            setError("Error al cargar las recetas. Por favor, intente de nuevo más tarde.");
            console.error("Error al obtener recetas:", err);
            setHasMore(false); // Detiene intentos futuros si hay error
        } finally {
            setCargando(false); // Oculta spinner grande
            setCargandoMas(false); // Oculta spinner pequeño
        }
    }, [token, page]); // 'page' es ahora una dependencia clave


    // EFECTO 2: Obtener las recetas al montar (MODIFICADO)
    useEffect(() => {
        // Llama a la función con 'true' para indicar que es la carga inicial
        recargarRecetas(true);
    }, []); // <-- Se ejecuta SOLO al montar

    // EFECTO 3: Escuchar evento de recarga (MODIFICADO)
    useEffect(() => {
        const handleRecetaCreadaEvent = () => {
            console.log('Evento "recetaCreada" recibido, recargando feed...');
            recargarRecetas(true); // Recarga todo desde la página 1
        };

        document.addEventListener('recetaCreada', handleRecetaCreadaEvent);
        return () => document.removeEventListener('recetaCreada', handleRecetaCreadaEvent);
    }, [recargarRecetas]); 

    // --- NUEVO EFECTO 4: DETECTOR DE SCROLL ---
    useEffect(() => {
        const handleScroll = () => {
            // Si el usuario está a 300px del fondo Y no estamos cargando Y hay más por cargar Y no estamos en búsqueda
            if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 300 && 
                !cargandoMas && 
                hasMore && 
                !isSearchActive
            ) {
                recargarRecetas(false); // Carga la siguiente página (no es carga inicial)
            }
        };

        window.addEventListener('scroll', handleScroll);
        // Limpiamos el listener al desmontar
        return () => window.removeEventListener('scroll', handleScroll);
        
    }, [cargandoMas, hasMore, isSearchActive, recargarRecetas]); // Depende de estos estados


    // ... (Lógica de eliminación: handleDeleteReceta, handleOpenModal, handleCloseModal, handleConfirmDelete) ...
    const handleDeleteReceta = async (recetaId: number) => {
        if (!token) {
            console.error("No hay token de autenticación para eliminar la receta.");
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/Recetas/${recetaId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.status === 204) {
                // MODIFICADO: Ahora solo borra de 'recetas'
                setRecetas(prevRecetas => prevRecetas.filter(receta => receta.id !== recetaId));
                // setRecetasFiltradas(prevRecetas => prevRecetas.filter(receta => receta.id !== recetaId)); // (Se mantiene por si borra desde la búsqueda)
                console.log(`Receta con ID ${recetaId} eliminada exitosamente.`);
            } else {
                const errorData = await response.json();
                throw new Error(`Error al eliminar la receta: ${response.statusText} - ${JSON.stringify(errorData)}`);
            }
        } catch (error) {
            console.error('Error al eliminar la receta:', error);
            console.error('Error al eliminar la receta. Por favor, inténtelo de nuevo.');
        } finally {
            handleCloseModal();
        }
    };
    const handleOpenModal = async (recetaId: number) => {
        setRecetaAEliminarId(recetaId);
        setModalOpen(true);
    };
    const handleCloseModal = () => {
        setModalOpen(false);
        setRecetaAEliminarId(null);
    };
    const handleConfirmDelete = () => {
        if (recetaAEliminarId !== null) {
            handleDeleteReceta(recetaAEliminarId);
        }
    };


    // ... (Manejadores de modales de desafío y creación - Sin cambios) ...
    const handleOpenCreateDialog = () => {
        setIsCreateDialogOpen(true);
    };
    const handleCloseCreateDialog = () => {
        setIsCreateDialogOpen(false);
    };
    const handleOpenDesafioModal = () => {
        if (desafioSemanal) {
            setModalDesafioOpen(true);
        }
    };
    const handleCloseDesafioModal = () => {
        setModalDesafioOpen(false);
    };
    const handleCloseRankingModal = () => {
        setModalRankingOpen(false);
        setCurrentRanking([]); 
    };
    const handleBackToDesafio = () => {
        // Close ranking modal and reopen desafio modal
        setModalRankingOpen(false);
        setCurrentRanking([]);
        setModalDesafioOpen(true);
    };
    const handleCargarRecetaDesafio = () => {
        handleCloseDesafioModal();
        const ingrediente = desafioSemanal?.desafioActual?.ingrediente;
        const idDesafio = desafioSemanal?.desafioActual?.id;
        if (ingrediente) setIngredienteDesafio(ingrediente);
        if (idDesafio) setDesafioIdActivo(idDesafio);
        setIsCreateDialogOpen(true);
    };
    const handleRecetaCreada = () => {
        handleCloseCreateDialog(); 
        setIngredienteDesafio(undefined); 
        setDesafioIdActivo(undefined);
    };


    // =========================================================================
    // LÓGICA DE BÚSQUEDA (Sin cambios)
    // =========================================================================

    const manejarBusqueda = async (termino: string) => {
        setSearchTerm(termino);
        const terminoLimpio = termino.trim();

        if (!token) {
            console.error("No hay token de autenticación.");
            return;
        }

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
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                setUsuariosFiltrados(prevUsuarios =>
                    prevUsuarios.map(u =>
                        u.id === followedId ? { ...u, isFollowing: !isCurrentlyFollowing } : u
                    )
                );
            } else {
                console.error(`Error al ${isCurrentlyFollowing ? 'dejar de seguir' : 'seguir'} al usuario.`);
            }
        } catch (error) {
            console.error('Error de red al seguir/dejar de seguir:', error);
        }
    };

    // Al hacer clic en un resultado, salimos del modo búsqueda
    const handleUsuarioClick = (userId: number) => {
        setIsSearchActive(false);
        setSearchTerm('');
        setUsuariosFiltrados([]);
        setRecetasFiltradas([]); // Limpia resultados
        navigate(`/perfil/${userId}`);
    };

    const handleRecetaClick = (receta: DatosReceta) => {
        if (!receta.autor?.id) {
            console.error("No se puede navegar a la receta, falta el ID del autor:", receta);
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
    
    // === NUEVAS FUNCIONES PARA CONTROLAR MODO BÚSQUEDA ===
    const handleSearchFocus = () => {
        setIsSearchActive(true);
        // setRecetasFiltradas([]); // Ya no es necesario, el render lo maneja
    };

    const handleSearchBackClick = () => {
        setIsSearchActive(false);
        setSearchTerm('');
        setSearchMessage(null);
        setUsuariosFiltrados([]);
        setRecetasFiltradas([]); // Limpia resultados
        // No es necesario restaurar el feed, el estado 'recetas' nunca se tocó
    };
    // ====================================================


    // MODIFICADO: Muestra el spinner grande solo si está cargando Y no hay recetas
    if (cargando && recetas.length === 0) {
        return <div className="feed-cargando">Cargando feed...</div>;
    }

    if (error) {
        return <div className="feed-error">{error}</div>;
    }

    // ... (El resto de tus funciones 'renderModal' no cambian) ...
    // ...
    const getMedalIcon = (index: number) => {
        switch (index) {
            case 0: return <EmojiEventsIcon sx={{ color: '#FFD700' }} />; // Oro
            case 1: return <EmojiEventsIcon sx={{ color: '#C0C0C0' }} />; // Plata
            case 2: return <EmojiEventsIcon sx={{ color: '#CD7F32' }} />; // Bronce
            default: return <SportsScoreIcon sx={{ color: '#666' }} />;
        }
    };

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
                            // Si hay recetaId, navega a la receta; si no, solo a el perfil del usuario
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
                        “{desafio.ingrediente?.toUpperCase() ?? desafio.nombre}”
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
                        Tu receta debe llevar la etiqueta <strong>Desafío</strong> y solo puedes participar con una receta por semana.
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
                    <Typography variant="subtitle2" sx={{ mb: 3, color: 'text.secondary', textAlign: 'center', fontStyle: 'italic' }}>
                        {nombreDesafio}
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                    {hasRanking && (
                        <List sx={{ p: 0 }}>
                            {currentRanking.map((item, index) => (
                                <ListItem
                                    key={item.usuarioId}
                                    onClick={() => {
                                        // Si hay recetaId, navega a la receta; si no, solo a el perfil del usuario
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
            {/* Botón Flotante para el Desafío */}
            {desafioSemanal && !isSearchActive && ( // <-- Oculto si se está buscando
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
            
            {/* === BARRA BÚSQUEDA MODIFICADA === */}
            <BarraBusqueda
                searchTerm={searchTerm}
                onSearchChange={manejarBusqueda}
                onSearchSubmit={() => manejarBusqueda(searchTerm)}
                
                // --- NUEVAS PROPS ---
                isSearchActive={isSearchActive}
                onFocus={handleSearchFocus}
                onBackClick={handleSearchBackClick}
            />
            
            {/* === CONTENIDO CONDICIONAL (MODIFICADO) === */}
            <div className="feed-contenido">
                {!isSearchActive ? (
                    // ===================================
                    // 1. MODO FEED NORMAL
                    // AHORA RENDERIZA DESDE 'recetas'
                    // ===================================
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

                        {/* Mapea las recetas del estado 'recetas' */}
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

                        {/* --- NUEVO: INDICADOR DE CARGA DE SCROLL --- */}
                        {cargandoMas && (
                            <div style={{ textAlign: 'center', padding: '20px' }}>
                                <CircularProgress />
                            </div>
                        )}

                        {/* --- NUEVO: MENSAJE DE FIN DE FEED --- */}
                        {!hasMore && recetas.length > 0 && (
                            <div style={{ textAlign: 'center', padding: '4px', color: '#888' }}>
                                Fin de las recetas.
                            </div>
                        )}
                    </>
                ) : (
                    // ==========================================
                    // 2. MODO BÚSQUEDA ACTIVA (Usa 'recetasFiltradas')
                    // (Sin cambios)
                    // ==========================================
                    <div className="search-results-list">
                        
                        {/* --- Sección de Usuarios --- */}
                        {usuariosFiltrados.length > 0 && (
                            usuariosFiltrados.map(usuario => (
                                <div
                                    key={usuario.id}
                                    className="resultado-usuario"
                                    onClick={() => handleUsuarioClick(usuario.id)}
                                >
                                    {usuario.imagenUrl ? (
                                        <img src={`data:image/jpeg;base64,${usuario.imagenUrl}`} alt="avatar" className="avatar-busqueda" />
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

                        {/* --- Sección de Recetas --- */}
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

                        {/* --- Mensaje de estado de búsqueda --- */}
                        {searchMessage && (
                            <div className="no-resultados-mensaje">
                                {searchMessage}
                            </div>
                        )}
                        
                        {/* Mensaje de bienvenida si está vacío */}
                        {searchTerm.trim() === '' && !searchMessage && (
                            <div className="no-resultados-mensaje">
                                Busca usuarios o recetas.
                            </div>
                        )}
                    </div>
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