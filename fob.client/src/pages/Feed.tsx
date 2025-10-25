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


interface DesafioDto {
    id: number;
    nombre: string;
    ingrediente: string;
    descripcion: string;
    fechaInicio: string;
    fechaFin: string;
}

interface RankingItemDto {
    posicion?: number; // Opcional, ya que el backend lo calcula, pero lo usaremos para el renderizado
    usuarioId: number;
    puntos: number;
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
    const [recetasFiltradas, setRecetasFiltradas] = useState<DatosReceta[]>([]);
    const [usuariosFiltrados, setUsuariosFiltrados] = useState<Usuario[]>([]);
    const [cargando, setCargando] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [mensaje, setMensaje] = useState<string | null>(null);
    const { authData } = useAuth();
    const token = authData?.token;
    const currentUserId = authData?.id;
    const navigate = useNavigate();

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [ingredienteDesafio, setIngredienteDesafio] = useState<string | undefined>(undefined);

    const [desafioIdActivo, setDesafioIdActivo] = useState<number | undefined>(undefined);

    // ESTADOS PARA EL RANKING
    const [currentRanking, setCurrentRanking] = useState<RankingItemDto[]>([]);
    const [modalRankingOpen, setModalRankingOpen] = useState(false);
    const [rankingCargando, setRankingCargando] = useState(false);


    // Función para abrir el diálogo de creación de receta
    const handleOpenCreateDialog = () => {
        setIsCreateDialogOpen(true);
    };
    // Función para cerrar el diálogo de creación de receta
    const handleCloseCreateDialog = () => {
        setIsCreateDialogOpen(false);
        // No es necesario resetear los estados aquí si se hace en onRecetaCreada
    };


    // ESTADOS PARA LA LÓGICA DE DESAFÍO
    const [desafioSemanal, setDesafioSemanal] = useState<DesafioSemanalDto | null>(null);
    const [modalDesafioOpen, setModalDesafioOpen] = useState(false);

    // Estados para el modal de confirmación de eliminación
    const [modalOpen, setModalOpen] = useState(false);
    const [recetaAEliminarId, setRecetaAEliminarId] = useState<number | null>(null);

    // =========================================================================
    // 1. LÓGICA DE RANKING SEMANAL ACTIVO
    // =========================================================================

    const fetchCurrentRanking = async () => {
        if (!token) return;
        setRankingCargando(true);
        try {
            //  Endpoint real para obtener el ranking ACTIVO
            const response = await fetch(`${BASE_URL}/Desafios/Ranking`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                // Si no hay desafío activo, devuelve lista vacía
                setCurrentRanking([]);
                return;
            }

            const data: RankingItemDto[] = await response.json();
            setCurrentRanking(data);
            setModalRankingOpen(true); // Abre el modal de ranking
            handleCloseDesafioModal(); // Cierra el modal principal del desafío
        } catch (err) {
            console.error("Error al obtener el ranking semanal:", err);
            setCurrentRanking([]);
        } finally {
            setRankingCargando(false);
        }
    };


    // EFECTO 1: Obtener el Desafío Semanal y mostrar el modal
    useEffect(() => {
        if (!token) return;

        const obtenerDesafio = async () => {
            try {
                // Endpoint simulado para obtener el desafío y el ranking anterior
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

                // Mostrar siempre el modal del desafío al abrir la app/feed
                setModalDesafioOpen(true);

            } catch (err) {
                console.error("Error al obtener el desafío semanal:", err);
            }
        };

        obtenerDesafio();

    }, [token]);

    // useCallback para la función de obtener recetas, para poder reutilizarla
    const recargarRecetas = useCallback(async () => {
        if (!token) {
            setCargando(false);
            return;
        }
        setCargando(true);
        try {
            const response = await fetch(`${BASE_URL}/Recetas/Feed?pageSize=1`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setMensaje(data.mensaje);
            const recetasObtenidas: DatosReceta[] = data.recetas;

            setRecetas(recetasObtenidas);
            setRecetasFiltradas(recetasObtenidas);
        } catch (err) {
            setError("Error al cargar las recetas. Por favor, intente de nuevo más tarde.");
            console.error("Error al obtener recetas:", err);
        } finally {
            setCargando(false);
        }
    }, [token]);

    // EFECTO 2: Obtener las recetas al montar el componente
    useEffect(() => {
        recargarRecetas();
    }, [recargarRecetas]);

    // EFECTO 3: Escuchar el evento personalizado para recargar el feed.
    useEffect(() => {
        const handleRecetaCreadaEvent = () => {
            console.log('Evento "recetaCreada" recibido, recargando feed...');
            recargarRecetas();
        };

        document.addEventListener('recetaCreada', handleRecetaCreadaEvent);

        // Limpieza: es importante remover el listener cuando el componente se desmonte.
        return () => document.removeEventListener('recetaCreada', handleRecetaCreadaEvent);
    }, [recargarRecetas]); // La dependencia asegura que siempre usemos la última versión de recargarRecetas.

    // Lógica de eliminación
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
                setRecetas(prevRecetas => prevRecetas.filter(receta => receta.id !== recetaId));
                setRecetasFiltradas(prevRecetas => prevRecetas.filter(receta => receta.id !== recetaId));
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

    // Manejadores del modal de eliminación
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

    // Manejadores del modal de Desafío (Actualización para ranking)
    const handleOpenDesafioModal = () => {
        if (desafioSemanal) {
            setModalDesafioOpen(true);
        }
    };

    const handleCloseDesafioModal = () => {
        setModalDesafioOpen(false);
    };

    // Manejadores del modal de Ranking
    const handleCloseRankingModal = () => {
        setModalRankingOpen(false);
        setCurrentRanking([]); // Limpiar ranking al cerrar
    };


    // Lógica para el botón Participar Ahora
    const handleCargarRecetaDesafio = () => {
        handleCloseDesafioModal();
        const ingrediente = desafioSemanal?.desafioActual?.ingrediente;
        const idDesafio = desafioSemanal?.desafioActual?.id;

        if (ingrediente) {
            setIngredienteDesafio(ingrediente);
        }
        if (idDesafio) {
            setDesafioIdActivo(idDesafio);
        }

        setIsCreateDialogOpen(true);
    };

    // Función que se llamará cuando una receta se cree exitosamente
    const handleRecetaCreada = () => {
        // Esta función ahora solo se usa para el flujo del Desafío.
        handleCloseCreateDialog(); // Cierra el diálogo
        setIngredienteDesafio(undefined); // Limpia el estado del desafío
        setDesafioIdActivo(undefined);
        // La recarga del feed se manejará por el evento global.
    };


    const manejarBusqueda = async (termino: string) => {
        if (!token) {
            console.error("No hay token de autenticación para la búsqueda.");
            return;
        }

        if (termino.trim() === '') {
            setRecetasFiltradas(recetas);
            setUsuariosFiltrados([]);
            return;
        }

        const resultadosRecetas = recetas.filter(receta =>
            receta.descripcion.toLowerCase().includes(termino.toLowerCase()) ||
            receta.autor?.nombreUsuario.toLowerCase().includes(termino.toLowerCase()) ||
            receta.titulo.toLowerCase().includes(termino.toLowerCase())
        );
        setRecetasFiltradas(resultadosRecetas);

        try {
            const response = await fetch(`${BASE_URL}/Busqueda/usuarios?termino=${termino}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                let usuariosObtenidos: Usuario[] = await response.json();
                setUsuariosFiltrados(usuariosObtenidos);
            } else {
                try {
                    const errorData = await response.json();
                    console.error("Error al buscar usuarios:", errorData.message);
                } catch {
                    const errorText = await response.text();
                    console.error("Error al buscar usuarios:", errorText);
                }
                setUsuariosFiltrados([]);
            }
        } catch (error) {
            setUsuariosFiltrados([]);
            console.error("Error de red al buscar usuarios:", error);
        }
    };

    const manejarSeguirUsuario = async (followedId: number, isCurrentlyFollowing: boolean) => {
        if (!token) {
            console.error("No hay token de autenticación.");
            return;
        }

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
                try {
                    const successData = await response.json();
                    console.log(successData.message);
                } catch {
                    console.log(`Usuario ${isCurrentlyFollowing ? 'dejado de seguir' : 'seguido'} exitosamente.`);
                }
                setUsuariosFiltrados(prevUsuarios =>
                    prevUsuarios.map(u =>
                        u.id === followedId ? { ...u, isFollowing: !isCurrentlyFollowing } : u
                    )
                );
            } else {
                try {
                    const errorData = await response.json();
                    console.error(`Error al ${isCurrentlyFollowing ? 'dejar de seguir' : 'seguir'} al usuario:`, errorData.message);
                } catch {
                    const errorText = await response.text();
                    console.error(`Error al ${isCurrentlyFollowing ? 'dejar de seguir' : 'seguir'} al usuario:`, errorText);
                }
            }
        } catch (error) {
            console.error('Error de red al seguir/dejar de seguir:', error);
        }
    };

    const handleUsuarioClick = (userId: number) => {
        navigate(`/perfil/${userId}`);
    };

    if (cargando) {
        return <div className="feed-cargando">Cargando feed...</div>;
    }

    if (error) {
        return <div className="feed-error">{error}</div>;
    }

    // ----------------------------------------------------------------------
    // Funciones de renderizado para el Modal de Desafío y Ranking
    // ----------------------------------------------------------------------

    const getMedalIcon = (index: number) => {
        switch (index) {
            case 0:
                return <EmojiEventsIcon sx={{ color: '#FFD700' }} />; // Oro
            case 1:
                return <EmojiEventsIcon sx={{ color: '#C0C0C0' }} />; // Plata
            case 2:
                return <EmojiEventsIcon sx={{ color: '#CD7F32' }} />; // Bronce
            default:
                return <SportsScoreIcon sx={{ color: '#666' }} />;
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
                        sx={{
                            p: 1,
                            mb: 0.5,
                            borderRadius: '6px',
                            bgcolor: index === 0 ? '#fff8e1' : index === 1 ? '#f5f5f5' : index === 2 ? '#fbe9e7' : 'white',
                            borderLeft: `4px solid ${index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32'}`,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 35 }}>
                            {getMedalIcon(index)}
                        </ListItemIcon>
                        <ListItemText
                            primary={`@${item.nombreUsuario}`}
                            secondary={`${item.puntos} Puntos`}
                            primaryTypographyProps={{ fontWeight: index < 3 ? 'bold' : 'normal', color: index === 0 ? '#b79100' : 'text.primary' }}
                        />
                    </ListItem>
                ))}
            </List>
        );
    };

    const renderDesafioActual = () => {
        if (!desafioSemanal) return null;
        const desafio = desafioSemanal.desafioActual;

        // Formatea fechas
        const inicio = new Date(desafio.fechaInicio).toLocaleDateString();
        const fin = new Date(desafio.fechaFin).toLocaleDateString();

        return (
            <Box
                sx={{
                    mt: 4,
                    p: { xs: 2, sm: 4 },
                    borderRadius: 4,
                    bgcolor: 'background.default',
                    boxShadow: 3, // Usamos el sistema de sombras de MUI
                    position: "relative",
                    overflow: "hidden",
                    "&::before": {
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "8px",
                        background: "linear-gradient(90deg, #FF5722, #FF9800)",
                    },
                    animation: "fadeIn 0.6s ease-out",
                    "@keyframes fadeIn": {
                        from: { opacity: 0, transform: "translateY(10px)" },
                        to: { opacity: 1, transform: "translateY(0)" },
                    },
                }}
            >
                {/* Ingrediente Clave */}
                <Box
                    sx={{
                        textAlign: "center",
                        background:
                            "linear-gradient(135deg, #ff7e5f 10%, #feb47b 90%)",
                        borderRadius: "12px",
                        p: 2,
                        mb: 3,
                        color: "white",
                        boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
                    }}
                >
                    <Typography
                        variant="h6"
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 1,
                            fontWeight: 700,
                            letterSpacing: "0.5px",
                        }}
                    >
                        <KitchenIcon sx={{ fontSize: 26 }} />
                        Ingrediente Clave
                    </Typography>
                    <Typography
                        variant="h4"
                        sx={{
                            fontWeight: 900,
                            letterSpacing: 1,
                            textShadow: "0 2px 4px rgba(0,0,0,0.2)",
                        }}
                    >
                        “{desafio.ingrediente?.toUpperCase() ?? desafio.nombre}”
                    </Typography>
                </Box>

                {/* Descripción */}
                <Typography
                    variant="body1"
                    sx={{
                        mb: 3,
                        color: "text.secondary",
                        textAlign: "justify",
                        lineHeight: 1.6,
                    }}
                >
                    {desafio.descripcion}
                </Typography>

                {/* Fechas destacadas */}
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 1.2,
                        backgroundColor: "action.hover",
                        borderRadius: 2,
                        px: 2,
                        py: 1.5,
                        mb: 3,
                    }}
                >
                    <EventNoteIcon color="primary" sx={{ fontSize: 26 }} />
                    <Typography
                        variant="body1"
                        sx={{
                            fontWeight: 600,
                            fontSize: "1rem"
                        }}
                    >
                        Duración:&nbsp;
                        <span style={{ fontWeight: "500" }}>
                            del {inicio} al {fin}
                        </span>
                    </Typography>
                </Box>

                {/* Reglas */}
                <Box
                    sx={{
                        backgroundColor: (theme) => alpha(theme.palette.warning.main, 0.1),
                        borderLeft: (theme) => `4px solid ${theme.palette.warning.main}`,
                        borderRadius: 2,
                        p: 2,
                    }}
                >
                    <Typography
                        variant="body2"
                        sx={{
                            color: "warning.dark",
                            fontWeight: 600,
                            mb: 0.5,
                        }}
                    >
                        ⚠️ Importante:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Tu receta debe llevar la etiqueta{" "}
                        <strong>Desafío</strong> y solo puedes participar con una
                        receta por semana.
                    </Typography>
                </Box>
            </Box>
        );
    };




    const renderModalDesafio = () => {
        return (
            <Modal
                open={modalDesafioOpen}
                onClose={handleCloseDesafioModal}
                aria-labelledby="modal-desafio-titulo"
                closeAfterTransition
            >
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: { xs: '90%', sm: 550 },
                    bgcolor: 'background.paper',
                    borderRadius: 4,
                    boxShadow: 24,
                    p: 4,
                    outline: 'none',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    border: (theme) => `3px solid ${theme.palette.primary.main}`
                }}>
                    <Typography id="modal-desafio-titulo" variant="h4" component="h2" sx={{ mb: 1, fontWeight: 'bold', color: 'primary.main', textAlign: 'center' }}>
                        Desafío de Coctelería Semanal
                    </Typography>
                    <Divider sx={{ mb: 3 }} />

                    {/* Top 3 de la Semana Pasada */}
                    <Typography variant="subtitle1" sx={{ mt: 1, pb: 1, fontWeight: '700', color: 'text.primary' }}>
                        <EmojiEventsIcon sx={{ verticalAlign: 'bottom', mr: 0.5 }} /> Top 3 de la Semana Anterior
                    </Typography>
                    {/* Usamos un color de fondo sutil del tema */}
                    <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                        {renderRankingAnterior()}
                    </Box>
                    {/* Botón para ver el ranking completo */}
                    {desafioSemanal?.desafioActual && (
                        <Box sx={{ mt: 2, textAlign: 'center' }}>
                            <Button
                                onClick={fetchCurrentRanking}
                                variant="contained"
                                color="primary"
                                size="small"
                                sx={{
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase'
                                }}
                                disabled={rankingCargando}
                            >
                                {rankingCargando ? <CircularProgress size={20} color="inherit" /> : "VER RANKING ACTUAL"}
                            </Button>
                        </Box>
                    )}


                    <Typography
                        variant="h5"
                        sx={{
                            mt: 4,
                            pb: 1,
                            fontWeight: 800,
                            textAlign: "center",
                            textTransform: "uppercase",
                            letterSpacing: "0.8px",
                            background: "linear-gradient(90deg, #FF5722, #FF9800)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 1,
                        }}
                    >
                        <LocalBarIcon
                            sx={{
                                color: "#FF7043",
                                fontSize: 30,
                                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
                            }}
                        />
                        ¡A Mezclar! Desafío Actual
                    </Typography>
                    {renderDesafioActual()}

                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                        <Button
                            onClick={handleCloseDesafioModal}
                            variant="outlined"
                            size="large"
                            sx={{
                                flexGrow: 1,                                
                                borderRadius: '8px'
                            }}
                            color="inherit" // Usa el color de texto por defecto del tema
                        >
                            Ver Feed
                        </Button>
                        <Button
                            onClick={handleCargarRecetaDesafio}
                            variant="contained"
                            size="large"
                            color="primary"
                            sx={{
                                flexGrow: 1,
                                bgcolor: '#FF5722', // Mantenemos el color naranja
                                color: 'white', // Forzamos el texto a ser blanco para asegurar contraste
                                borderRadius: '8px',
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

    // =========================================================================
    // MODAL DE RANKING SEMANAL
    // =========================================================================

    const renderModalRanking = () => {
        const hasRanking = currentRanking.length > 0;
        const nombreDesafio = desafioSemanal?.desafioActual?.nombre || "Desafío Semanal";

        return (
            <Modal
                open={modalRankingOpen}
                onClose={handleCloseRankingModal}
                aria-labelledby="modal-ranking-titulo"
                closeAfterTransition
                sx={{
                    p: 0,
                    m: 0,
                    display: 'flex',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    justifyContent: { xs: 'flex-start', sm: 'center' },
                    backgroundColor: { xs: 'transparent', sm: 'rgba(0,0,0,0.5)' },
                }}
                slotProps={{
                    backdrop: {
                    sx: {
                        backgroundColor: { xs: 'transparent', sm: 'rgba(0,0,0,0.5)' },
                    },
                    },
                }}
                >
                <Box
                    sx={(theme) => ({
                        position: { xs: 'fixed', sm: 'fixed' },
                        top: { xs: 0, sm: '50%' },
                        left: { xs: 0, sm: '50%' },
                        transform: { xs: 'none', sm: 'translate(-50%, -50%)' },
                        width: { xs: '100vw', sm: 400 },
                        height: { xs: '100vh', sm: 'auto' },
                        bgcolor: 'background.paper',
                        borderRadius: { xs: 0, sm: '16px' },
                        boxShadow: 24,
                        p: { xs: 2, sm: 4 },
                        outline: 'none',
                        overflowY: 'auto',
                        border: `3px solid ${theme.palette.warning.main}`,
                        background: theme.palette.background.paper,
                        maxHeight: { xs: 'none', sm: '90vh' },
                    })}
                >
                    <Typography id="modal-ranking-titulo" variant="h5" component="h2"
                        sx={{
                            mb: 1,
                            fontWeight: 'bold',
                            color: 'primary.main',
                            textAlign: 'center'
                        }}
                    >
                        🏆 Ranking Actual
                    </Typography>
                    <Typography variant="subtitle2"
                        sx={{
                            mb: 3,
                            color: 'text.secondary',
                            textAlign: 'center',
                            fontStyle: 'italic'
                        }}
                    >
                        {nombreDesafio}
                    </Typography>
                    <Divider sx={{ mb: 3 }} />


                    {hasRanking && (
                        <List sx={{ p: 0 }}>
                            {currentRanking.map((item, index) => (
                                <ListItem
                                    key={item.usuarioId}
                                    // Usamos una función para acceder al tema en estilos dinámicos de la lista
                                    sx={(theme) => ({
                                        p: 1.5,
                                        mb: 1,
                                        borderRadius: '8px',
                                        bgcolor: index < 3 ? theme.palette.action.hover : 'background.paper',
                                        borderLeft: `5px solid ${index === 0 ? theme.palette.warning.main :
                                                index === 1 ? theme.palette.info.main :
                                                    index === 2 ? theme.palette.error.main :
                                                        theme.palette.divider}`,
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                                    })}
                                >
                                    <ListItemIcon sx={{ minWidth: 40 }}>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                fontWeight: 'bold',
                                                color: index < 3 ? 'primary.main' : 'text.primary'
                                            }}>
                                            {index + 1}°
                                        </Typography>
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={`@${item.nombreUsuario}`}
                                        secondary={`${item.puntos} Puntos`}
                                        primaryTypographyProps={{ fontWeight: index < 3 ? '900' : '600', color: 'text.primary' }}
                                    />
                                    {index < 3 && getMedalIcon(index)}
                                </ListItem>
                            ))}
                        </List>
                    )}

                    <Box sx={{ mt: 4, textAlign: 'center' }}>
                        <Button
                            onClick={handleCloseRankingModal}
                            variant="contained"
                            color="primary"
                            sx={(theme) => ({
                               
                                ...(theme.palette.mode === 'dark' && {
                                    backgroundColor: '#90caf9',
                                    
                                    color: theme.palette.getContrastText('#90caf9'),
                              
                                    '&:hover': {

                                        backgroundColor: '#79a5c6',
                                    }
                                }),
                            })}
                        >
                            Cerrar Ranking
                        </Button>
                    </Box>
                </Box>
            </Modal>
        );
    };
    
    // const storedMode = (localStorage.getItem("themeMode") as "light" | "dark") || "light";
    // const [mode, setMode] = useState<"light" | "dark">(storedMode);
    // const theme = useMemo(() => getTheme(mode), [mode]);
    return (
        <div className="feed-contenedor-principal">
            {/* Botón Flotante para el Desafío */}
            {desafioSemanal && (
                <button
                    className="boton-desafio-flotante"
                    onClick={handleOpenDesafioModal}
                    style={{
                        position: 'fixed',
                        bottom: '70px',
                        right: '20px',
                        zIndex: 1000,
                        backgroundColor: '#FF5722',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '56px',
                        height: '56px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 10px rgba(255, 87, 34, 0.6)',
                        cursor: 'pointer',
                        transition: 'background-color 0.3s, transform 0.2s',
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
                // Pasar el ingrediente para que el componente lo use
                onRecetaCreada={handleRecetaCreada}
                ingrediente={ingredienteDesafio}
                desafioId={desafioIdActivo}
            />
            <BarraBusqueda
                onSearch={manejarBusqueda}
                usuarios={usuariosFiltrados}
                onFollow={manejarSeguirUsuario}
                currentUserId={currentUserId ?? null}
                onUsuarioClick={handleUsuarioClick}
            />
            <div className="feed-contenido">
                {recetasFiltradas.length === 0 && usuariosFiltrados.length === 0 && mensaje && (
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
                {recetasFiltradas.length === 0 && usuariosFiltrados.length === 0 && !mensaje && !cargando && !error && (
                    <div className="no-resultados">No se encontraron recetas ni usuarios que coincidan con la búsqueda.</div>
                )}

                {recetasFiltradas.map(receta => {
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
                            receta={{
                                ...receta,
                                etiquetas: finalEtiquetas
                            }}
                            onDrawerToggle={onDrawerToggle}
                            currentUserId={currentUserId ?? null}
                            onDeleteReceta={handleOpenModal}
                            onUsuarioClick={handleUsuarioClick}
                        />
                    );
                })}
            </div>

            {/* Modal de confirmación de eliminación */}
            
                <Modal
                    open={modalOpen}
                    onClose={handleCloseModal}
                    aria-labelledby="modal-eliminar-receta"
                >
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
