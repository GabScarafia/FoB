import React, { useState, useEffect, useRef, useCallback } from 'react';
import Receta from 'components/Receta';
import { useNavigate } from 'react-router-dom';

import IconButton from '@mui/material/IconButton';
import ViewListIcon from '@mui/icons-material/ViewList';
import GridViewIcon from '@mui/icons-material/GridView';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import CircularProgress from '@mui/material/CircularProgress';
import { Box } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { BASE_URL } from '../apiConfig';
import fotoPerfilLocal from '../assets/images/avatar.png';
import LogoAppBlanco from '../assets/images/logo-blanco.png';

import './Tendencias.css';

import type { RecetaType } from '../types/Receta';
import { useTheme } from '@mui/material/styles';

// --- HELPERS ---
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

const Tendencias = () => {
    const theme = useTheme();
    const [tendencias, setTendencias] = useState<RecetaType[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'feed'>('grid');
    const { authData, clearAuthData } = useAuth();
    const navigate = useNavigate();

    const mainRef = useRef<HTMLElement | null>(null);
    const originalMainPaddingTop = useRef<string | null>(null);

    // === ESTADOS DE PAGINACIÓN ===
    const [page, setPage] = useState(1);
    const [cargandoMas, setCargandoMas] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const PAGE_SIZE = 15;
    const [scrollToRecetaId, setScrollToRecetaId] = useState<number | null>(null);

    // --- ESTADOS PARA EL HEADER DINÁMICO ---
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const lastScrollTop = useRef(0);

    // === INTERSECTION OBSERVER (SCROLL INFINITO MEJORADO) ===
    const observer = useRef<IntersectionObserver | null>(null);

    const lastRecetaElementRef = useCallback((node: HTMLDivElement) => {
        if (cargando || cargandoMas) return; // Si está cargando, no observar nada aún
        
        if (observer.current) observer.current.disconnect(); // Desconectar el anterior

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                // Si el último elemento es visible y hay más, cargamos
                cargarTendencias(false);
            }
        });

        if (node) observer.current.observe(node);
    }, [cargando, cargandoMas, hasMore]); // Quitamos cargarTendencias de deps directas para evitar loops si no es memoized, aunque idealmente lo está abajo.

    // useEffect para manipular estilos del main container
    useEffect(() => {
        const mainElement = document.querySelector('main');
        if (mainElement) {
            mainElement.classList.add('tendencias-page');
            mainRef.current = mainElement;
            if (originalMainPaddingTop.current === null) {
                originalMainPaddingTop.current = window.getComputedStyle(mainElement).paddingTop || null;
            }
        }

        return () => {
            if (mainRef.current) {
                mainRef.current.classList.remove('tendencias-page');
                if (originalMainPaddingTop.current !== null) {
                    mainRef.current.style.paddingTop = originalMainPaddingTop.current;
                }
            }
        };
    }, []);

    // === LÓGICA DE CARGA DE DATOS ===
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
                    try { clearAuthData(); } catch (e) { }
                    navigate('/iniciar-sesion');
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
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
    }, [authData?.token, page, cargandoMas, hasMore]); // Dependencias corregidas

    // Carga inicial
    useEffect(() => {
        if (authData?.token) {
            cargarTendencias(true);
        }
    }, [authData?.token]);


    // --- LÓGICA DE VISIBILIDAD DEL HEADER (NO AFECTA CARGA DE DATOS) ---
    useEffect(() => {
        const mainElement = mainRef.current;
        // Solo aplicamos lógica de ocultar header en modo FEED
        if (!mainElement || viewMode !== 'feed') {
            setIsHeaderVisible(true);
            return;
        }

        const handleScroll = () => {
            const scrollTop = mainElement.scrollTop;
            if (scrollTop > lastScrollTop.current && scrollTop > 80) {
                setIsHeaderVisible(false);
            } else if (scrollTop < lastScrollTop.current) {
                setIsHeaderVisible(true);
            }
            lastScrollTop.current = scrollTop <= 0 ? 0 : scrollTop;
        };

        mainElement.addEventListener('scroll', handleScroll);
        return () => mainElement.removeEventListener('scroll', handleScroll);

    }, [viewMode]);

    // --- GESTIÓN DE LAYOUT HEADER PRINCIPAL ---
    useEffect(() => {
        if (viewMode === 'feed') {
            window.dispatchEvent(new CustomEvent('setHeaderVisibility', { detail: false }));
            if (mainRef.current) {
                mainRef.current.style.paddingTop = '0px';
            }
        } else {
            window.dispatchEvent(new CustomEvent('setHeaderVisibility', { detail: true }));
            if (mainRef.current && originalMainPaddingTop.current !== null) {
                mainRef.current.style.paddingTop = originalMainPaddingTop.current;
            }
        }
        return () => {
            if (viewMode === 'feed')
                window.dispatchEvent(new CustomEvent('setHeaderVisibility', { detail: true }));
            if (mainRef.current && originalMainPaddingTop.current !== null) {
                mainRef.current.style.paddingTop = originalMainPaddingTop.current;
            }
        };
    }, [viewMode]);

    // Scroll automático a un item específico al cambiar a modo feed
    useEffect(() => {
        if (viewMode === 'feed' && scrollToRecetaId && mainRef.current) {
            // Damos un pequeño timeout para asegurar que el render terminó
            setTimeout(() => {
                const element = document.getElementById(`tendencia-${scrollToRecetaId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setScrollToRecetaId(null);
                }
            }, 100);
        }
    }, [viewMode, scrollToRecetaId]);

    const handleRecetaClick = (receta: RecetaType) => {
        if (viewMode === 'feed') return;
        setScrollToRecetaId(receta.id);
        setViewMode('feed');
    };

    const handleUsuarioClick = (userId: number) => {
        navigate(`/perfil/${userId}`);
    };

    const handleDeleteFromFeed = (recetaId: number) => {
        setTendencias(prev => prev.filter(r => r.id !== recetaId));
    };


    // --- RENDER GALERÍA (GRID) ---
    const renderGaleriaTendencias = () => {
        if (tendencias.length === 0) {
            if (cargando) return null;
            return <div className="sin-recetas">No hay tendencias para mostrar.</div>;
        }

        return (
            <div className="grilla-tendencias">
                {tendencias.map((receta, index) => {
                    const mediaType = getMediaTypeFromContentType(receta.contentType);
                    const mediaUrl = getNormalizedUrl(receta.imagenUrl, receta.contentType, fotoPerfilLocal);
                    
                    // Verificar si es el último elemento para adjuntar la ref del observer
                    const isLastElement = index === tendencias.length - 1;

                    return (
                        <div
                            key={receta.id}
                            ref={isLastElement ? lastRecetaElementRef : null}
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

    // --- RENDER FEED (LISTA) ---
    const renderFeedTendencias = () => {
        if (tendencias.length === 0) {
            if (cargando) return null;
            return <div className="sin-recetas">No hay tendencias para mostrar.</div>;
        }

        return (
            <div className="feed-tendencias">
                {tendencias.map((receta, index) => {
                    // Verificar si es el último elemento para adjuntar la ref del observer
                    const isLastElement = index === tendencias.length - 1;

                    return (
                        <div 
                            id={`tendencia-${receta.id}`} 
                            key={receta.id}
                            ref={isLastElement ? lastRecetaElementRef : null}
                        >
                            <Receta
                                receta={{
                                    ...receta,
                                    noMeGusta: receta.noMeGusta ?? false,
                                    esFavorito: receta.esFavorito ?? false,
                                    seguido: receta.seguido ?? false,
                                }}
                                onDrawerToggle={() => { }}
                                currentUserId={authData?.id ?? null}
                                onDeleteReceta={handleDeleteFromFeed}
                                onUsuarioClick={handleUsuarioClick}
                            />
                        </div>
                    );
                })}
            </div>
        );
    };


    // --- RENDER PRINCIPAL ---

    // Spinner carga inicial pantalla completa (dentro del componente)
    if (cargando && tendencias.length === 0) {
        return (
            <div className="cargando-tendencias">
                <CircularProgress color="primary" />
                <div>Cargando tendencias...</div>
            </div>
        );
    }

    if (error && tendencias.length === 0) {
        return <div className="error-container">{error}</div>;
    }

    return (
        <>
            <div className="tendencias-container">
                {/* --- HEADER FLOTANTE (SOLO EN FEED) --- */}
                {viewMode === 'feed' && (
                    <Box className="header-contenedor-principal" sx={{ position: 'sticky', top: 0, zIndex: 1100 }}>
                        <Box className="header-input-seccion" sx={{ py: 1, color: 'white' }}>
                            <Box
                                component="img"
                                src={LogoAppBlanco}
                                alt="Logo App"
                                sx={{ width: 40, height: 'auto', mr: 1 }}
                            />
                            <span className="tendencias-titulo">#Tendencias</span>
                        </Box>
                    </Box>
                )}

                {/* --- SELECTOR DE VISTA --- */}
                <Box
                    className="tendencias-view-selector"
                    sx={{
                        position: 'sticky',
                        zIndex: 1050,
                        top: (viewMode === 'feed' && isHeaderVisible) ? '56px' : '0px',
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

                {/* --- CONTENIDO --- */}
                {viewMode === 'grid' ? renderGaleriaTendencias() : renderFeedTendencias()}

                {/* --- INDICADOR DE CARGA INFERIOR (PAGINACIÓN) --- */}
                {cargandoMas && (
                    <div className="cargando-tendencias" style={{ height: '100px', marginTop: '20px' }}>
                        <CircularProgress color="primary" />
                    </div>
                )}

                {/* --- MENSAJE FINAL --- */}
                {!hasMore && tendencias.length > 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#888', fontWeight: 'bold' }}>
                        Fin de las tendencias.
                    </div>
                )}
            </div>
        </>
    );
};

export default Tendencias;