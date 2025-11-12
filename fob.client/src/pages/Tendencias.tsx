import React, { useState, useEffect, useRef, useCallback } from 'react'; // <-- AÑADIDO useCallback
// import { useTendenciasService } from '../services/tendenciasService'; // <-- No lo usamos para poder paginar
import Receta from 'components/Receta';
import { useNavigate } from 'react-router-dom'; 

// Importaciones de Material-UI
import Dialog from '@mui/material/Dialog';
import Slide from '@mui/material/Slide';
import LogoApp from '../assets/images/logo-blanco.png';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import CircularProgress from '@mui/material/CircularProgress';
import type { Comentario } from 'components/DrawerComentarios';
import { Box } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { BASE_URL } from '../apiConfig';
import fotoPerfilLocal from '../assets/images/avatar.png'; // <-- IMPORT NECESARIO

import './Tendencias.css'; 

import type { RecetaType, Usuario } from '../types/Receta';

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
    const [tendencias, setTendencias] = useState<RecetaType[]>([]);
    const [recetaSeleccionada, setRecetaSeleccionada] = useState<RecetaType | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // const { obtenerTendencias } = useTendenciasService(); // <-- Reemplazado por fetch directo
    const { authData } = useAuth(); 
    // const [seEjecutoUnaVez, setSeEjecutoUnaVez] = useState(false); // <-- Eliminado
    const navigate = useNavigate();
    
    const [openDialog, setOpenDialog] = useState(false);
    
    const mainRef = useRef<HTMLElement | null>(null);

    // === NUEVOS ESTADOS DE PAGINACIÓN ===
    const [page, setPage] = useState(1);
    const [cargandoMas, setCargandoMas] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const PAGE_SIZE = 15; // <-- Tamaño de página 15

    // useEffect para la clase 'tendencias-page' (Sin cambios)
    useEffect(() => {
        const mainElement = document.querySelector('main');
        if (mainElement) {
            mainElement.classList.add('tendencias-page');
            mainRef.current = mainElement;
        }

        return () => {
            if (mainRef.current) {
                mainRef.current.classList.remove('tendencias-page');
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
                setTendencias(prev => [...prev, ...recetasObtenidas]);
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
        if(authData?.token) {
             cargarTendencias(true);
        }
    }, [authData?.token]); // Se dispara solo cuando el token está listo

    // useEffect para scroll infinito (NUEVO)
   useEffect(() => {
        const mainElement = mainRef.current; // Capturamos el elemento 'main'

        const handleScroll = () => {
            if (!mainElement) return; // Si no hay 'main', no hagas nada

            // (mainElement.scrollTop + mainElement.clientHeight >= mainElement.scrollHeight - 300)
            if (mainElement.scrollTop + mainElement.clientHeight >= mainElement.scrollHeight - 300 && 
                !cargandoMas && 
                hasMore
            ) {
                cargarTendencias(false); // Carga la siguiente página
            }
        };

        // Escuchamos el scroll DENTRO del elemento 'main'
        mainElement?.addEventListener('scroll', handleScroll);
        return () => mainElement?.removeEventListener('scroll', handleScroll);
        
    }, [cargandoMas, hasMore, cargarTendencias]);

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
                {renderGaleriaTendencias()}
                
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

                <Box className="header-contenedor-principal ">
                    <Box className="header-input-seccion ">
                        <Box
                            component="img"
                            src={LogoApp}
                            sx={{
                                width: 50,
                                height: 'auto',
                                mr: 1, 
                            }}
                        />
                        <span>#Tendencias</span> 
                    </Box>
                </Box>

                <Box
                    sx={{
                        flexGrow: 1, 
                        overflowY: 'auto', 
                        p: 0, 
                        width: '100%', // Asegura que ocupe todo el ancho
                        backgroundColor: 'background.default', 
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
                            onDrawerToggle={() => {}}
                            currentUserId={authData?.id ?? null}
                            onDeleteReceta={async () => {}} // No se puede borrar desde tendencias
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
                    
                    <WhatshotIcon sx={{ color: '#ffffffff' }}/> 
                    
                    <IconButton color="inherit" aria-label="spacer" sx={{ visibility: 'hidden' }}>
                        <ArrowBackIcon />
                    </IconButton>
                </Box>
            </Dialog>
        </>
    );
};

export default Tendencias;