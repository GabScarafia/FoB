import React, { useState, useEffect, useRef } from 'react';
import { useTendenciasService } from '../services/tendenciasService';
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
import './Tendencias.css'; 

import type { RecetaType, Usuario } from '../types/Receta';

// --- INICIO DE CÓDIGO NUEVO ---
// 1. Helper para determinar 'image' o 'video' desde el contentType
const getMediaTypeFromContentType = (contentType: string): 'image' | 'video' => {
    // Si el contentType existe y empieza con "video/", es un video.
    if (contentType && contentType.startsWith('video/')) {
        return 'video';
    }
    // En cualquier otro caso (ej. "image/jpeg", "image/png", o nulo), es imagen.
    return 'image';
};

// 2. Helper para normalizar la URL (AHORA RECIBE contentType)
const getNormalizedUrl = (
    mediaStr: string | undefined | null, 
    contentType: string, 
): string => {
    // Si no hay media, retornamos un string vacío.
    if (!mediaStr || mediaStr === '') return ''; 
    
    // Si ya es un Data URL (video o imagen) o una URL http, está lista.
    if (mediaStr.startsWith('data:') || mediaStr.startsWith('http')) {
        return mediaStr;
    }
    
    // Si es base64 crudo, construye el Data URI usando el contentType.
    return `data:${contentType};base64,${mediaStr}`;
}
// --- FIN DE CÓDIGO NUEVO ---


const Tendencias = () => {
    const [tendencias, setTendencias] = useState<RecetaType[]>([]);
    const [recetaSeleccionada, setRecetaSeleccionada] = useState<RecetaType | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { obtenerTendencias } = useTendenciasService();
    const { authData } = useAuth(); 
    const [seEjecutoUnaVez, setSeEjecutoUnaVez] = useState(false);
    const navigate = useNavigate();
    
    const [openDialog, setOpenDialog] = useState(false);
    
    const mainRef = useRef<HTMLElement | null>(null);

    // ... (Tu useEffect para la clase 'tendencias-page' no cambia)
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

    // ... (Tu useEffect para fetchTendencias no cambia)
    useEffect(() => {
        const fetchTendencias = async () => {
            if (!authData?.token || seEjecutoUnaVez) {
                if (!authData?.token) {
                    setCargando(false);
                }
                return;
            }
            try {
                setCargando(true);
                const data = await obtenerTendencias();
                setTendencias(Array.isArray(data) ? data : []);
                setError(null);
            } catch (err) {
                console.error("Error al cargar las tendencias:", err);
                setError("No se pudieron cargar las tendencias.");
                setTendencias([]);
            } finally {
                setCargando(false);
                setSeEjecutoUnaVez(true);
            }
        };
        fetchTendencias();
    }, [obtenerTendencias, authData, seEjecutoUnaVez]);

    // ... (Tus manejadores handleRecetaClick, handleCloseDialog, handleUsuarioClick no cambian)
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
        if (!tendencias || tendencias.length === 0) {
            return <div className="sin-recetas">No hay tendencias para mostrar.</div>;
        }

        return (
            <div className="grilla-tendencias">
                {tendencias.map((receta) => {
                    
                    // --- INICIO DE LÓGICA MODIFICADA ---
                    // Aplicamos los helpers a cada receta de la grilla
                    const mediaType = getMediaTypeFromContentType(receta.contentType);
                    const mediaUrl = getNormalizedUrl(receta.imagen, receta.contentType);

                    // Si por alguna razón no hay URL, mostramos un fallback
                    if (!mediaUrl) {
                        return (
                            <div key={receta.id} className="galeria-item galeria-item-fallback">
                                <span>Error</span>
                            </div>
                        )
                    }

                    return (
                        <div 
                            key={receta.id} 
                            className="galeria-item" 
                            onClick={() => handleRecetaClick(receta)}
                        >
                            {/* Renderizado condicional: <img /> o <video /> */}
                            {mediaType === 'image' ? (
                                <img
                                    src={mediaUrl}
                                    alt={receta.titulo ?? `Receta-${receta.id}`}
                                />
                            ) : (
                                <video
                                    src={mediaUrl}
                                    // alt no es un prop válido para video, pero lo dejamos por si React lo maneja
                                    muted
                                    playsInline
                                    preload="metadata" // <-- Clave para cargar solo el 1er frame
                                    // Omitimos 'controls', 'autoPlay' y 'loop'
                                >
                                    Tu navegador no soporta videos.
                                </video>
                            )}
                        </div>
                    );
                    // --- FIN DE LÓGICA MODIFICADA ---
                })}
            </div>
        );
    };
    // FIN DE LA FUNCIÓN DE RENDERIZADO

    // ... (El resto de tu componente: cargando, error, return, Dialog... no cambia)
    if (cargando) {
        return (
            <div className="cargando-tendencias">
                <CircularProgress color="primary" />
                <div>Cargando tendencias...</div>
            </div>
        );
    }

    if (error) {
        return <div className="error-container">{error}</div>;
    }

    return (
        <>
            <div className="tendencias-container">
                {renderGaleriaTendencias()}
            </div>

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
                        backgroundColor: 'background.default', 
                    }}
                >
                    {recetaSeleccionada && (
                    <div className="receta-contenido">
                        <Receta
                        receta={{
                            ...recetaSeleccionada,
                            noMeGusta: recetaSeleccionada.noMeGusta ?? false,
                            esFavorito: recetaSeleccionada.esFavorito ?? false,
                            seguido: recetaSeleccionada.seguido ?? false,
                        }}
                        onDrawerToggle={() => {}}
                        currentUserId={authData?.id ?? null}
                        onDeleteReceta={async () => {}}
                        onUsuarioClick={handleUsuarioClick}
                        />
                    </div>
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