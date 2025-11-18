import React, { useState, useEffect, useRef, useCallback } from 'react';
// import { useTendenciasService } from '../services/tendenciasService'; // <-- No lo usamos para poder paginar
import Receta from 'components/Receta';
import { useNavigate } from 'react-router-dom';

// Importaciones de Material-UI
import Dialog from '@mui/material/Dialog';
import Slide from '@mui/material/Slide';
import LogoAppBlanco from '../assets/images/logo-blanco.png';
import LogoAppAzul from '../assets/images/logo.png'; // <-- ¡LOGO AZUL AHORA USADO EN MODO CLARO!
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import ViewListIcon from '@mui/icons-material/ViewList';
import GridViewIcon from '@mui/icons-material/GridView';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import CircularProgress from '@mui/material/CircularProgress';
import type { Comentario } from 'components/DrawerComentarios';
import { Box } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { BASE_URL } from '../apiConfig';
import fotoPerfilLocal from '../assets/images/avatar.png'; // <-- IMPORT NECESARIO

import './Tendencias.css';

import type { RecetaType, Usuario } from '../types/Receta';
import { useTheme } from '@mui/material/styles';

// --- INICIO DE CÓDIGO NUEVO ---
// (Estas funciones helper están bien)
const getMediaTypeFromContentType = (contentType: string): 'image' | 'video' => {
    if (contentType && contentType.startsWith('video/')) {
        return 'video';
    }
    return 'image';
};

const getNormalizedUrl = (
    mediaStr: string | undefined | null,
    contentType: string,
    fallback: string
): string => {
    if (!mediaStr || mediaStr === '') return fallback;

    if (mediaStr.startsWith('http') || mediaStr.startsWith('data:')) {
        return mediaStr;
    }

    if (mediaStr.startsWith('/')) {
        return `${BASE_URL}${mediaStr}`;
    }

    return `data:${contentType};base64,${mediaStr}`;
}
// --- FIN DE LA CORRECCIÓN ---


const Tendencias = () => {
    const theme = useTheme();
    const [tendencias, setTendencias] = useState<RecetaType[]>([]);
    const [recetaSeleccionada, setRecetaSeleccionada] = useState<RecetaType | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // const { obtenerTendencias } = useTendenciasService(); // <-- Reemplazado por fetch directo
    const [viewMode, setViewMode] = useState<'grid' | 'feed'>('grid');
    const { authData, clearAuthData } = useAuth();
    // const [seEjecutoUnaVez, setSeEjecutoUnaVez] = useState(false); // <-- Eliminado
    const navigate = useNavigate();

    const [openDialog, setOpenDialog] = useState(false);

    const mainRef = useRef<HTMLElement | null>(null);
    const originalMainPaddingTop = useRef<string | null>(null);

    // === NUEVOS ESTADOS DE PAGINACIÓN ===
    const [page, setPage] = useState(1);
    const [cargandoMas, setCargandoMas] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const PAGE_SIZE = 15; // <-- Tamaño de página 15

    // --- ESTADOS PARA EL HEADER DINÁMICO ---
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const lastScrollTop = useRef(0);


    // useEffect para la clase 'tendencias-page' (Sin cambios)
    useEffect(() => {
        const mainElement = document.querySelector('main');
        if (mainElement) {
            mainElement.classList.add('tendencias-page');
            mainRef.current = mainElement;
            // store original paddingTop to restore later
            if (originalMainPaddingTop.current === null) {
                originalMainPaddingTop.current = window.getComputedStyle(mainElement).paddingTop || null;
            }
        }

        return () => {
            if (mainRef.current) {
                mainRef.current.classList.remove('tendencias-page');
            }
            // restore original padding when unmounting
            if (mainRef.current && originalMainPaddingTop.current !== null) {
                mainRef.current.style.paddingTop = originalMainPaddingTop.current;
            }
        };
    }, []);

    // === LÓGICA DE CARGA DE DATOS MODIFICADA ===
    const cargarTendencias = useCallback(async (isInitialLoad = false) => {
        if (!authData?.token) {
            setCargando(false);
            return;
        }

        if (isInitialLoad) {
            setCargando(true);
            setPage(1);
            setHasMore(true);
        } else {
            // Ya estamos cargando más, no hacer nada
            if (cargandoMas) return;
            setCargandoMas(true);
        }

        const currentPage = isInitialLoad ? 1 : page;

        try {
            const response = await fetch(`${BASE_URL}/Recetas/Tendencias?pageNumber=${currentPage}&pageSize=${PAGE_SIZE}`, {
                headers: {
                    'Authorization': `Bearer ${authData.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    // Token inválido/expirado: limpiar auth y redirigir
                    try { clearAuthData(); } catch (e) { }
                    navigate('/iniciar-sesion');
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json(); // <-- El backend wrapper { Mensaje, Recetas }
            const recetasObtenidas: RecetaType[] = data.recetas;

            if (isInitialLoad) {
                setTendencias(recetasObtenidas);
                if (recetasObtenidas.length === 0) {
                    setError("No hay tendencias para mostrar.");
                }
            } else {
                setTendencias(prev => {
                    const recetasExistentesIds = new Set(prev.map(r => r.id));
                    const recetasNuevasUnicas = recetasObtenidas.filter(r => !recetasExistentesIds.has(r.id));
                    return [...prev, ...recetasNuevasUnicas];
                });
            }

            if (recetasObtenidas.length < PAGE_SIZE) {
                setHasMore(false);
            }

            setPage(currentPage + 1);

        } catch (err) {
            console.error("Error al cargar las tendencias:", err);
            if (isInitialLoad) {
                setError("No se pudieron cargar las tendencias.");
            }
            setHasMore(false);
        } finally {
            setCargando(false);
            setCargandoMas(false);
        }
    }, [authData?.token, page, cargandoMas, hasMore]); // Dependencias

    // useEffect para carga inicial (MODIFICADO)
    useEffect(() => {
        if (authData?.token) {
            cargarTendencias(true);
        }
    }, [authData?.token]); // Se dispara solo cuando el token está listo

    // --- LÓGICA DE SCROLL (REFACTORIZADA PARA ESTABILIDAD) ---
    useEffect(() => {
        const mainElement = mainRef.current;
        if (!mainElement || viewMode !== 'feed') {
            setIsHeaderVisible(true); // Asegura que el header esté visible en modo grid
            return;
        }

        const handleScroll = () => {
            const scrollTop = mainElement.scrollTop;

            // Lógica para ocultar/mostrar el header
            if (scrollTop > lastScrollTop.current && scrollTop > 80) { // Scroll hacia abajo y pasamos un umbral
                setIsHeaderVisible(false);
            } else if (scrollTop < lastScrollTop.current) { // Scroll hacia arriba
                setIsHeaderVisible(true);
            }
            lastScrollTop.current = scrollTop <= 0 ? 0 : scrollTop;
        };

        mainElement.addEventListener('scroll', handleScroll);
        return () => mainElement.removeEventListener('scroll', handleScroll);

    }, [viewMode]); // Se ejecuta solo cuando cambia el modo de vista.

    // --- LÓGICA DE SCROLL INFINITO (SEPARADA) ---
    useEffect(() => {
        const mainElement = mainRef.current;
        if (!mainElement || !hasMore || cargandoMas) return;

        const checkScroll = () => {
            if (mainElement.scrollTop + mainElement.clientHeight >= mainElement.scrollHeight - 300) {
                cargarTendencias(false);
            }
        };
        mainElement.addEventListener('scroll', checkScroll);
        return () => mainElement.removeEventListener('scroll', checkScroll);
    }, [cargandoMas, hasMore, cargarTendencias]); // Dependencias específicas para scroll infinito.

    // --- NUEVO: EFECTO PARA CONTROLAR EL HEADER PRINCIPAL ---
    useEffect(() => {
        if (viewMode === 'feed') {
            // Oculta el header principal (BarraBusqueda)
            window.dispatchEvent(new CustomEvent('setHeaderVisibility', { detail: false }));
            // Remove top padding on main so selector moves up into the freed space
            if (mainRef.current) {
                mainRef.current.style.paddingTop = '0px';
            }
        } else {
            // Muestra el header principal al volver a la vista de grid
            window.dispatchEvent(new CustomEvent('setHeaderVisibility', { detail: true }));
            // Restore original padding
            if (mainRef.current && originalMainPaddingTop.current !== null) {
                mainRef.current.style.paddingTop = originalMainPaddingTop.current;
            }
        }
        // La limpieza se hace más robusta: solo se dispara si el componente se desmonta
        // mientras estaba en modo 'feed'.
        return () => {
            if (viewMode === 'feed')
                window.dispatchEvent(new CustomEvent('setHeaderVisibility', { detail: true }));
            // ensure padding is restored
            if (mainRef.current && originalMainPaddingTop.current !== null) {
                mainRef.current.style.paddingTop = originalMainPaddingTop.current;
            }
        };
    }, [viewMode]);

    useEffect(() => {
        // Esta función revisa si el contenido llena la pantalla
        const checkForMore = () => {
            // Si no estamos cargando, y SÍ hay más páginas, Y la altura total
            // del documento es MENOR o IGUAL a la altura de la ventana...
            if (!cargando && !cargandoMas && hasMore && mainRef.current) {

                // Usamos el 'mainRef' (el contenedor con scroll)
                const contentHeight = mainRef.current.scrollHeight;
                const viewportHeight = mainRef.current.clientHeight;

                if (contentHeight <= viewportHeight) {
                    // ...entonces cargamos la siguiente página automáticamente.
                    console.log("No hay scroll, cargando más...");
                    cargarTendencias(false);
                }
            }
        };

        // Lo ejecutamos un instante después del renderizado para que el DOM se actualice
        const timer = setTimeout(checkForMore, 100);

        return () => clearTimeout(timer);

    }, [cargando, cargandoMas, hasMore, tendencias, cargarTendencias]);

    // ... (Manejadores de Dialog y Navegación - Sin cambios)
    const handleRecetaClick = (receta: RecetaType) => {
        setRecetaSeleccionada(receta);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setRecetaSeleccionada(null);
    };

    const handleUsuarioClick = (userId: number) => {
        navigate(`/perfil/${userId}`);
    };

    // --- FUNCIÓN PARA RENDERIZAR LA GALERÍA (MODIFICADA) ---
    const renderGaleriaTendencias = () => {
        // Ahora usa 'tendencias' que es la lista que se actualiza con el scroll
        if (tendencias.length === 0) {
            // No muestra nada si está cargando, el spinner principal se encarga
            if (cargando) return null;
            // Si no está cargando y no hay tendencias, muestra el mensaje
            return <div className="sin-recetas">No hay tendencias para mostrar.</div>;
        }

        return (
            <div className="grilla-tendencias">
                {tendencias.map((receta) => {

                    // --- INICIO DE LÓGICA CORREGIDA (Bug) ---
                    const mediaType = getMediaTypeFromContentType(receta.contentType);
                    // Pasamos 'fotoPerfilLocal' como fallback, por si 'imagenUrl' es nula
                    const mediaUrl = getNormalizedUrl(receta.imagenUrl, receta.contentType, fotoPerfilLocal);
                    // --- FIN DE LÓGICA CORREGIDA ---

                    // (Si la mediaUrl sigue siendo el fallback, se mostrará el avatar)

                    return (
                        <div
                            key={receta.id}
                            className="galeria-item"
                            onClick={() => handleRecetaClick(receta)}
                        >
                            {mediaType === 'video' && <VideoLibraryIcon className="video-watermark-icon" />}
                            {mediaType === 'image' ? (
                                <img
                                    src={mediaUrl}
                                    alt={receta.titulo ?? `Receta-${receta.id}`}
                                />
                            ) : (
                                <video
                                    src={mediaUrl}
                                    muted
                                    playsInline
                                    preload="metadata"
                                >
                                    Tu navegador no soporta videos.
                                </video>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };
    // FIN DE LA FUNCIÓN DE RENDERIZADO

    // --- NUEVA FUNCIÓN PARA RENDERIZAR EL FEED ---
    const renderFeedTendencias = () => {
        if (tendencias.length === 0) {
            if (cargando) return null;
            return <div className="sin-recetas">No hay tendencias para mostrar.</div>;
        }

        return (
            <div className="feed-tendencias">
                {tendencias.map(receta => (
                    <Receta
                        key={receta.id}
                        receta={{
                            ...receta,
                            noMeGusta: receta.noMeGusta ?? false,
                            esFavorito: receta.esFavorito ?? false,
                            seguido: receta.seguido ?? false,
                        }}
                        onDrawerToggle={() => { }}
                        currentUserId={authData?.id ?? null}
                        onDeleteReceta={async (recetaId) => {
                            // Al eliminar, lo quitamos de la lista y recargamos
                            setTendencias(prev => prev.filter(r => r.id !== recetaId));
                        }}
                        onUsuarioClick={handleUsuarioClick}
                    />
                ))}
            </div>
        );
    };

    const handleDeleteFromFeed = (recetaId: number) => {
        setTendencias(prev => prev.filter(r => r.id !== recetaId));
    };

    // MODIFICADO: Muestra spinner solo en carga inicial
    if (cargando && tendencias.length === 0) {
        return (
            <div className="cargando-tendencias">
                <CircularProgress color="primary" />
                <div>Cargando tendencias...</div>
            </div>
        );
    }

    // MODIFICADO: Muestra error solo si no hay tendencias
    if (error && tendencias.length === 0) {
        return <div className="error-container">{error}</div>;
    }

    return (
        <>
            <div className="tendencias-container">
                {/* --- HEADER BLANCO/AZUL: mostrar en modo FEED (igual que al abrir una publicacion) --- */}
                {viewMode === 'feed' && (
                    <Box className="header-contenedor-principal" sx={{ position: 'sticky', top: 0, zIndex: 1100 }}>
                        <Box className="header-input-seccion" sx={{ py: 1, color: theme.palette.mode === 'dark' ? 'white' : 'white' }}>
                            <Box
                                component="img"
                                // LÓGICA DE SELECCIÓN DE LOGO AQUÍ
                                src={theme.palette.mode === 'dark' ? LogoAppBlanco : LogoAppBlanco}
                                alt="Logo App" // Agregado alt text
                                sx={{ width: 40, height: 'auto', mr: 1 }}
                            />
                            <span className="tendencias-titulo">#Tendencias</span>
                        </Box>
                    </Box>
                )}

                {/* --- NUEVO: Selector de Vista --- */}
                <Box
                    className="tendencias-view-selector"
                    sx={{
                        position: 'sticky',
                        zIndex: 1050,
                        top: (viewMode === 'feed' && isHeaderVisible) ? '56px' : '0px', // Ajusta el 'top' para que quede debajo del header de feed
                        transition: 'top 0.3s ease-in-out',
                        display: 'flex',
                        justifyContent: 'center',
                        gap: 1,
                        py: 1,
                        bgcolor: theme.palette.mode === 'dark' ? theme.palette.background.default : '#fff',
                        borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#e0e0e0'}`,
                    }}
                >
                    <IconButton
                        onClick={() => setViewMode('grid')}
                        aria-label="grid"
                        sx={{
                            color: viewMode === 'grid' ? theme.palette.primary.main : theme.palette.text.secondary,
                            '&:hover': { backgroundColor: theme.palette.action.hover },
                        }}
                    >
                        <GridViewIcon />
                    </IconButton>
                    <IconButton
                        onClick={() => setViewMode('feed')}
                        aria-label="feed"
                        sx={{
                            color: viewMode === 'feed' ? theme.palette.primary.main : theme.palette.text.secondary,
                            '&:hover': { backgroundColor: theme.palette.action.hover },
                        }}
                    >
                        <ViewListIcon />
                    </IconButton>
                </Box>

                {/* --- Renderizado Condicional --- */}
                {viewMode === 'grid' ? renderGaleriaTendencias() : renderFeedTendencias()}

                {/* --- NUEVO: INDICADOR DE CARGA DE SCROLL --- */}
                {cargandoMas && (
                    <div className="cargando-tendencias" style={{ height: '100px', marginTop: '20px' }}>
                        <CircularProgress color="primary" />
                    </div>
                )}

                {/* --- NUEVO: MENSAJE DE FIN DE SCROLL --- */}
                {!hasMore && tendencias.length > 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#888', fontWeight: 'bold' }}>
                        Fin de las tendencias.
                    </div>
                )}
            </div>

            {/* ... (Tu Dialog y su contenido no cambian) ... */}
            <Dialog
                fullScreen
                open={openDialog}
                onClose={handleCloseDialog}
                slots={{ transition: Slide }}
                slotProps={{
                    transition: {
                        direction: 'up',
                    },
                    paper: {
                        sx: {
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            '& .receta-container': {
                                width: '100%',
                                maxWidth: 500,
                                margin: '0 auto',
                            },
                        },
                    },
                }}
            >

                <Box className="header-contenedor-principal" sx={{ top: '10px' }}>
                    <Box className="header-input-seccion" sx={{ py: 1, color: theme.palette.mode === 'dark' ? 'white' : '#white' }}>
                        <Box
                            component="img"
                            // LÓGICA DE SELECCIÓN DE LOGO AQUÍ
                            src={theme.palette.mode === 'dark' ? LogoAppBlanco : LogoAppBlanco}
                            alt="Logo App" // Agregado alt text
                            sx={{
                                width: 40,
                                height: 'auto',
                                mr: 1,
                            }}
                        />
                        <span className="tendencias-titulo">#Tendencias</span>
                    </Box>
                </Box>

                <Box
                    sx={{
                        flexGrow: 1,
                        overflowY: 'auto',
                        p: 0,
                        width: '100%', // Asegura que ocupe todo el ancho
                        backgroundColor: 'background.default',
                        mt: '20px', // Margen superior para separar del header
                    }}
                >
                    {recetaSeleccionada && (
                        // No necesitas 'receta-contenido', el 'Receta' ya está centrado por 'paper.sx'
                        <Receta
                            receta={{
                                ...recetaSeleccionada,
                                noMeGusta: recetaSeleccionada.noMeGusta ?? false,
                                esFavorito: recetaSeleccionada.esFavorito ?? false,
                                seguido: recetaSeleccionada.seguido ?? false,
                            }}
                            onDrawerToggle={() => { }}
                            currentUserId={authData?.id ?? null}
                            onDeleteReceta={async () => { }} // No se puede borrar desde tendencias
                            onUsuarioClick={handleUsuarioClick}
                        />
                    )}

                </Box>

                <Box sx={{
                    width: '100%',
                    height: 55,
                    background: 'linear-gradient(to right, #1f46b2, #1a2a6c, #002242)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                }}>
                    <IconButton
                        edge="start"
                        color="inherit"
                        onClick={handleCloseDialog}
                        aria-label="close"
                        sx={{ color: '#ffffffff' }}
                    >
                        <ArrowBackIcon />
                    </IconButton>

                    <WhatshotIcon sx={{ color: '#ffffffff' }} />

                    <IconButton color="inherit" aria-label="spacer" sx={{ visibility: 'hidden' }}>
                        <ArrowBackIcon />
                    </IconButton>
                </Box>
            </Dialog>
        </>
    );
};

export default Tendencias;