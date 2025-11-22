﻿import React, { useState, useEffect } from 'react';
import { useSwipeable } from 'react-swipeable';
import { Paper, Box, Typography, Menu, MenuItem, ListItemIcon, IconButton, Button, Chip, alpha, ListItemText } from '@mui/material';
import './Receta.css';
import { useNavigate, useSearchParams } from 'react-router-dom';

// Íconos de Material UI
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import StarIcon from '@mui/icons-material/Star';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import ShareIcon from '@mui/icons-material/Share';
import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ThumbDownAltOutlinedIcon from '@mui/icons-material/ThumbDownAltOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import KitchenIcon from '@mui/icons-material/Kitchen'; // Icono opcional para ingrediente

import fotoPerfilLocal from '../assets/images/avatar.png';
import DrawerComentarios from '../components/DrawerComentarios';
import type { Comentario } from '../components/DrawerComentarios';
import type { Usuario } from '../types/Receta'
import { useAuth } from '../context/AuthContext';
import { formatoTiempoRelativo } from '../utils/formateoDeTiempo';
import { BASE_URL } from '../apiConfig';

// 1. Helper para determinar 'image' o 'video' desde el contentType
const getMediaTypeFromContentType = (contentType: string): 'image' | 'video' => {
    if (contentType && contentType.startsWith('video/')) {
        return 'video';
    }
    return 'image';
};

// 2. Helper para normalizar la URL
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

interface Ingrediente {
    id: number;
    nombre: string;
    cantidad: number;
    unidadDeMedida: string;
}

interface Utensilio {
    id: number;
    nombre: string;
}

interface Paso {
    titulo: string;
    descripcion: string;
    numero: number;
    imagenUrl?: string; 
    contentType: string;
}

interface CarruselItem {
    mediaUrl: string;
    mediaType: 'image' | 'video';
    pasoInfo?: Paso;
    isMainImage: boolean;
}

export interface PropsReceta {
    receta: {
        id: number;
        autor: Usuario;
        fechaCreacion: string;
        tipoContenido: string;
        dificultad: string;
        imagenUrl: string;
        contentType: string;
        cantidadVotos: number;
        meGusta: boolean;
        noMeGusta: boolean;
        esFavorito: boolean;
        seguido: boolean;
        cantidadComentarios: number;
        titulo: string;
        descripcion: string;
        vistaPreviaComentarios?: Comentario[];
        isSavedInitially?: boolean;
        tiempoPreparacion: string;
        ingredientes: Ingrediente[];
        etiquetas: string[];
        utensilios: string[];
        pasos: Paso[];
    };
    onDrawerToggle: (open: boolean) => void;
    currentUserId: number | null;
    onDeleteReceta: (recetaId: number) => Promise<void>;
    onUsuarioClick?: (userId: number) => void;
}

const Receta: React.FC<PropsReceta> = ({ receta, onDrawerToggle, currentUserId, onDeleteReceta, onUsuarioClick }) => {
    const navigate = useNavigate();
    const haProcesadoApertura = React.useRef(false);
    const [searchParams] = useSearchParams();

    if (!receta) {
        console.error("Error: el objeto receta es nulo o indefinido.");
        return <div>Error: La receta no se pudo cargar.</div>;
    }

    const [disliked, setDisliked] = useState(receta.noMeGusta);
    const [favorite, setFavorito] = useState(receta.esFavorito);
    const [liked, setLiked] = useState(receta.meGusta);
    const [likesCount, setLikesCount] = useState(receta.cantidadVotos);
    const [mostrarMas, setMostrarMas] = useState(false);
    const [isFollowing, setIsFollowing] = useState(receta.seguido);
    const [comentariosCount, setComentariosCount] = useState(receta.cantidadComentarios);
    // Inicialización segura de comentarios
    const [comentarios, setComentarios] = useState<Comentario[]>(receta.vistaPreviaComentarios || []);
    const { authData } = useAuth();
    const [drawerAbierto, setDrawerAbierto] = useState(false);
    const LIMITE_CARACTERES = 100;
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const openMenu = Boolean(anchorEl);
    const [isProcessingLike, setIsProcessingLike] = useState(false);

    useEffect(() => {
        const recetaIdParam = searchParams.get('receta');
        const comentarioIdParam = searchParams.get('comentario');
        if (recetaIdParam && comentarioIdParam && Number(receta.id) === Number(recetaIdParam) && !haProcesadoApertura.current) {
            setDrawerAbierto(true);
            onDrawerToggle(true);
            haProcesadoApertura.current = true;
        }
    }, [receta.id, onDrawerToggle, searchParams]);

    const handleClickMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
    };

    const handleDeleteClick = async () => {
        handleCloseMenu();
        onDeleteReceta(receta.id);
    };

    const handleEditClick = () => {
        handleCloseMenu();
        navigate(`/receta/editar/${receta.id}`);
    };

    const handleComentarioAgregado = (nuevoComentario: Comentario) => {
        setComentarios([...comentarios, nuevoComentario]);
        setComentariosCount(prevCount => prevCount + 1);
    };

    const renderizarEstrellas = (dificultad: string) => {
        const numEstrellas = dificultad === 'Facil' ? 1 : dificultad === 'Medio' ? 2 : dificultad === 'Dificil' ? 3 : dificultad === 'Experto' ? 4 : 0;
        const estrellas = [];
        for (let i = 0; i < numEstrellas; i++) {
            estrellas.push(<span key={i} className="estrella rellena">★</span>);
        }
        return estrellas;
    };

    const handleLikeClick = async () => {
        if (isProcessingLike) return;
        setIsProcessingLike(true);
        try {
            const response = await fetch(`${BASE_URL}/Recetas/Interaccion`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authData?.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    idReceta: receta.id,
                    tipo: 0,
                    accion: Number(liked)
                })
            });

            if (response.ok) {
                if (liked) {
                    setLiked(false);
                    setLikesCount(prevCount => prevCount - 1);
                } else {
                    setLiked(true);
                    setLikesCount(prevCount => prevCount + 1);
                    if (disliked) setDisliked(false); // Si doy like, quito el dislike
                }
                if (disliked) {
                    setDisliked(false);
                }
            } else {
                const errorData = await response.json();
                console.error("Error al dar like:", errorData.message);
                alert("Ocurrió un error. Intenta de nuevo.");
            }
        } catch (error) {
            console.error("Error de red al dar like:", error);
            alert("Ocurrió un error de conexión. Intenta de nuevo.");
        } finally {
            setIsProcessingLike(false);
        }
    };

    const handleDisLikeClick = async () => {
        try {
            const response = await fetch(`${BASE_URL}/Recetas/Interaccion`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authData?.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    idReceta: receta.id,
                    tipo: 1,
                    accion: Number(disliked)
                })
            });

            if (response.ok) {
                if (disliked) {
                    setDisliked(false);
                } else { // El usuario está dando dislike
                    setDisliked(true);
                    if (liked) { // Si antes había un like
                        setLiked(false);
                        setLikesCount(prevCount => prevCount - 1); // Se resta 1 al contador
                    }
                }
            } else {
                const errorData = await response.json();
                console.error("Error al dar dislike:", errorData.message);
                alert("Ocurrió un error. Intenta de nuevo.");
            }
        } catch (error) {
            console.error("Error de red al dar dislike:", error);
            alert("Ocurrió un error de conexión. Intenta de nuevo.");
        }
    };

    const handleFavoritoClick = async () => {
        try {
            const response = await fetch(`${BASE_URL}/Recetas/Interaccion`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authData?.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    idReceta: receta.id,
                    tipo: 2,
                    accion: Number(favorite)
                })
            });

            if (response.ok) {
                if (favorite) {
                    setFavorito(false);
                } else {
                    setFavorito(true);
                }
            } else {
                const errorData = await response.json();
                console.error("Error al dar favorito:", errorData.message);
                alert("Ocurrió un error. Intenta de nuevo.");
            }
        } catch (error) {
            console.error("Error de red al dar favorito:", error);
            alert("Ocurrió un error de conexión. Intenta de nuevo.");
        }
    };

    const handleShareRecetaClick = async () => {
        if (!receta) return;
        const recetaUrl = `${window.location.origin}/perfil/${receta.autor.id}/publicaciones?receta=${receta.id}`;
        const shareText = `¡Mira la receta "${receta.titulo}" de @${receta.autor.nombreUsuario} en F.o.B!`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Receta: ${receta.titulo}`,
                    text: shareText,
                    url: recetaUrl,
                });
            } catch (error) {
                if (error instanceof Error && error.name !== 'AbortError') {
                    console.error('Error al usar la API de compartir:', error);
                }
            }
        } else {
            await navigator.clipboard.writeText(recetaUrl);
            alert('¡Enlace de la receta copiado al portapapeles!');
        }
    };

    const handleToggleDescripcion = () => {
        setMostrarMas(prevMostrarMas => !prevMostrarMas);
    };

    const handleOpenDrawer = () => {
        setDrawerAbierto(true);
        onDrawerToggle(true);
    };

    const handleCloseDrawer = () => {
        setDrawerAbierto(false);
        onDrawerToggle(false);
    };

    // --- CORRECCIÓN: Manejo seguro de la descripción ---
    const descripcionSegura = receta.descripcion || ''; 
    const descripcionMostrada = mostrarMas || descripcionSegura.length <= LIMITE_CARACTERES
        ? descripcionSegura
        : `${descripcionSegura.substring(0, LIMITE_CARACTERES)}...`;

    const debeMostrarBotonLeerMas = descripcionSegura.length > LIMITE_CARACTERES;
    // --- FIN CORRECCIÓN ---

    const fotoPerfilUrl = getNormalizedUrl(
        receta.autor?.imagenUrl,
        'image/jpeg', 
        fotoPerfilLocal
    );

    const formatearTiempo = (tiempo: string): string => {
        if (!tiempo) return 'N/A'; 
        const partes = tiempo.split(':').map(part => parseInt(part, 10));
        const horas = partes[0] || 0;
        const minutos = partes[1] || 0;
        const resultado: string[] = [];

        if (horas > 0) {
            resultado.push(`${horas} hora${horas > 1 ? 's' : ''}`);
        }
        if (minutos > 0) {
            resultado.push(`${minutos} minuto${minutos > 1 ? 's' : ''}`);
        }

        if (resultado.length === 0) {
            return 'Menos de 1 minuto';
        }

        return resultado.join(' ');
    };

    const fechaFormateada = formatoTiempoRelativo(receta.fechaCreacion);
    const esRecetaPropia = currentUserId === receta.autor.id;

    const handleUsuarioClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onUsuarioClick) {
            onUsuarioClick(receta.autor.id);
        } else {
            navigate(`/perfil/${receta.autor.id}`);
        }
    };

    // --- LÓGICA DEL CARRUSEL (Protegida contra Pasos nulos) ---
    const tipoMediaPrincipal = getMediaTypeFromContentType(receta.contentType);
    const mediaPrincipalUrl = getNormalizedUrl(
        receta.imagenUrl,
        receta.contentType,
        fotoPerfilLocal
    );

    const carruselItems: CarruselItem[] = [];
    
    // CORRECCIÓN: Asegurar que 'receta.pasos' no sea null
    const pasosSeguros = receta.pasos || []; 

    // **Añadir el slide de la Media Principal (Portada)**
    if (mediaPrincipalUrl && (mediaPrincipalUrl !== fotoPerfilLocal || pasosSeguros.length === 0)) {
        carruselItems.push({
            mediaUrl: mediaPrincipalUrl,
            mediaType: tipoMediaPrincipal,
            isMainImage: true
        });
    }

    // **Añadir un slide para CADA PASO**
    pasosSeguros.forEach(paso => {
        let mediaPasoUrl = mediaPrincipalUrl; 
        let mediaPasoType = tipoMediaPrincipal; 

        if (paso.imagenUrl && paso.imagenUrl !== '' && paso.contentType) { 
            mediaPasoType = getMediaTypeFromContentType(paso.contentType);
            mediaPasoUrl = getNormalizedUrl(
                paso.imagenUrl, 
                paso.contentType,
                fotoPerfilLocal
            );
        } else if (paso.imagenUrl && paso.imagenUrl !== '' && !paso.contentType) { 
            console.warn("Paso tiene imagen pero no contentType. Usando el de la receta.");
            mediaPasoType = getMediaTypeFromContentType(receta.contentType);
            mediaPasoUrl = getNormalizedUrl(
                paso.imagenUrl, 
                receta.contentType,
                fotoPerfilLocal
            );
        }

        carruselItems.push({
            mediaUrl: mediaPasoUrl,
            mediaType: mediaPasoType,
            pasoInfo: paso,
            isMainImage: false,
        });
    });

    if (carruselItems.length === 0) {
        carruselItems.push({
            mediaUrl: fotoPerfilLocal,
            mediaType: 'image',
            isMainImage: true
        });
    }

    const [indiceImagen, setIndiceImagen] = useState(0);

    const swipeHandlers = useSwipeable({
        onSwipedLeft: () => handleNextImagen(),
        onSwipedRight: () => handlePrevImagen(),
        trackMouse: true,
    });

    const handlePrevImagen = () => {
        setIndiceImagen(prev => prev > 0 ? prev - 1 : prev);
    };
    const handleNextImagen = () => {
        setIndiceImagen(prev => prev < carruselItems.length - 1 ? prev + 1 : prev);
    };

    const itemActual = carruselItems[indiceImagen] || carruselItems[0];


    return (
        <Paper
            sx={(theme) => ({
                maxWidth: '500px',
                mx: 'auto',
                mb: 3,
                overflow: 'hidden',
                borderRadius: '16px',
                transition: 'background 0.3s, border 0.3s, box-shadow 0.3s',
                ...(theme.palette.mode === 'light' ?
                    {
                        bgcolor: 'background.paper',
                        border: `1px solid ${theme.palette.divider}`,
                        boxShadow: theme.shadows[3],
                    } : {
                        background: 'rgba(255, 255, 255, 0.08)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    })
            })}
        >
            <Box className="encabezado-receta" sx={{
                p: 2,
                borderBottom: (theme) => `1px solid ${theme.palette.mode === 'light' ? theme.palette.divider : 'rgba(255, 255, 255, 0.15)'}`
            }}>
                <div className="info-autor" onClick={handleUsuarioClick} style={{ cursor: 'pointer' }}>
                    <img src={fotoPerfilUrl} alt="Foto de Perfil" className="foto-perfil" />
                    <div>
                        <div className="nombre-autor">{receta.autor?.nombreUsuario}</div>
                        <div className="tiempo-publicacion">Publicado {fechaFormateada}</div>
                    </div>
                </div>
                <div className="meta-receta-y-menu">
                    <div className="meta-receta">
                        <span className="tipo-contenido">{receta.dificultad}</span>
                        <div className="estrellas-calificacion">
                            {renderizarEstrellas(receta.dificultad)}
                        </div>
                    </div>
                    {esRecetaPropia && (
                        <>
                            <IconButton
                                aria-label="más opciones"
                                id="basic-button"
                                aria-controls={openMenu ? 'basic-menu' : undefined}
                                aria-haspopup="true"
                                aria-expanded={openMenu ? 'true' : undefined}
                                onClick={handleClickMenu}
                                sx={{ color: 'text.secondary', p: 0.5, ml: 1 }}
                            >
                                <MoreVertIcon />
                            </IconButton>
                            <Menu
                                id="basic-menu"
                                anchorEl={anchorEl}
                                open={openMenu}
                                onClose={handleCloseMenu}
                                MenuListProps={{
                                    'aria-labelledby': 'basic-button',
                                }}
                                disableScrollLock={true}
                            >
                                <MenuItem onClick={handleEditClick}>
                                    <ListItemIcon>
                                        <EditIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText>Editar</ListItemText>
                                </MenuItem>
                                <MenuItem onClick={handleDeleteClick} sx={{ color: 'red' }}>
                                    <ListItemIcon>
                                        <DeleteOutlineIcon fontSize="small" sx={{ color: 'red' }} />
                                    </ListItemIcon>
                                    <ListItemText>Eliminar</ListItemText>
                                </MenuItem>
                            </Menu>
                        </>
                    )}
                </div>
            </Box>

            {/* --- BLOQUE DE RENDERIZADO --- */}
            <div className="carrusel-imagen" {...swipeHandlers}>
                {itemActual && itemActual.mediaType === 'image' && (
                    <img
                        src={itemActual.mediaUrl}
                        alt={itemActual.isMainImage ? "Receta principal" : `Paso ${itemActual.pasoInfo?.numero}`}
                        className="imagen-receta"
                        draggable={false}
                    />
                )}
                {itemActual && itemActual.mediaType === 'video' && (
                    <video
                        src={itemActual.mediaUrl}
                        className="imagen-receta"
                        controls
                        autoPlay
                        muted
                        controlsList="nodownload"
                        loop
                        playsInline
                        draggable={false}
                    >
                        Tu navegador no soporta el tag de video.
                    </video>
                )}
            </div>

            <div className="carrusel-navegacion" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, margin: '12px 0' }}>
                <IconButton onClick={handlePrevImagen} disabled={indiceImagen === 0} color="primary">
                    <ArrowBackIcon />
                </IconButton>
                <div className="carrusel-puntos" style={{ display: 'flex', gap: 6 }}>
                    {carruselItems.map((_, idx) => (
                        <Box
                            key={idx}
                            component="span"
                            sx={{
                                fontSize: 18,
                                color: idx === indiceImagen ? 'primary.main' : 'text.disabled'
                            }}
                        >●</Box>
                    ))}
                </div>
                <IconButton onClick={handleNextImagen} disabled={indiceImagen === carruselItems.length - 1} color="primary">
                    <ArrowForwardIcon />
                </IconButton>
            </div>

            {itemActual && !itemActual.isMainImage && itemActual.pasoInfo && (
                <div className="info-paso-carrusel" style={{ marginBottom: 12, textAlign: 'center' }}>
                    <Typography variant="body2"><strong>Paso {itemActual.pasoInfo.numero}:</strong> {itemActual.pasoInfo.titulo}</Typography>
                    <Typography variant="caption">{itemActual.pasoInfo.descripcion}</Typography>
                </div>
            )}

            <Box className="acciones-receta" sx={{
                px: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: (theme) => `1px solid ${theme.palette.mode === 'light' ? theme.palette.divider : 'rgba(255, 255, 255, 0.15)'}`
            }}>
                <Box className="acciones-izquierda" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <IconButton onClick={handleLikeClick} size="small" disabled={isProcessingLike}>
                        {liked ? <ThumbUpIcon sx={{ color: 'primary.main' }} /> : <ThumbUpAltOutlinedIcon />}
                    </IconButton>
                    <span className="conteo-me-gusta">{likesCount}</span>

                    <IconButton onClick={handleDisLikeClick} size="small">
                        {disliked ? <ThumbDownIcon sx={{ color: 'primary.main' }} /> : <ThumbDownAltOutlinedIcon />}
                    </IconButton>

                    <IconButton onClick={handleOpenDrawer} size="small">
                        <ChatBubbleOutlineIcon />
                    </IconButton>
                    <span className="conteo-comentarios">{comentariosCount}</span>

                    <AccessTimeIcon sx={{ color: 'text.secondary', ml: 1 }} />
                    <span className="conteo-tiempo">{formatearTiempo(receta.tiempoPreparacion)}</span>
                </Box>
                <div className="acciones-derecha">
                    <IconButton onClick={handleShareRecetaClick} size="small" sx={{ position: 'relative', top: '0.5px' }}>
                        <ShareIcon />
                    </IconButton>
                    <IconButton onClick={handleFavoritoClick} size="small">
                        {favorite ? <StarIcon sx={{ color: 'primary.main' }} /> : <StarBorderIcon />}
                    </IconButton>
                </div>
            </Box>

            <Box sx={{ px: 2, mt: 1 }}>
                <Typography variant="h6" component="h3" fontWeight="bold">{receta.titulo}</Typography>
            </Box>

            <Box sx={{ px: 2, mt: 1 }}>
                <Typography variant="body2">{descripcionMostrada}</Typography>
                {debeMostrarBotonLeerMas && (
                    <Button size="small" variant="text" onClick={handleToggleDescripcion} sx={{ p: 0, mt: 1 }}>
                        {mostrarMas ? 'Leer menos' : 'Leer más'}
                    </Button>
                )}
            </Box>

            <Box className="informacion-adicional" sx={{ px: 2, pb: 2 }}>
                {/* CORRECCIÓN: Uso de ?.length y mapeo seguro para ingredientes */}
                {receta.ingredientes?.length > 0 && (
                    <Box className="ingredientes-receta" sx={{ mt: 1 }}>
                        <Typography component="span" variant="body2" fontWeight="bold">Ingredientes: </Typography>
                        <Typography component="span" variant="body2">
                            {receta.ingredientes.map((ingrediente, index) => (
                                <span key={ingrediente.id}>
                                    {`${ingrediente.nombre} ${ingrediente.cantidad} ${ingrediente.unidadDeMedida}${index < receta.ingredientes.length - 1 ? ', ' : ''}`}
                                </span>
                            ))}
                        </Typography>
                    </Box>
                )}
                {/* CORRECCIÓN: Uso de ?.length y mapeo seguro para utensilios */}
                {receta.utensilios?.length > 0 && (
                    <Box className="utensilios-receta" sx={{ mt: 1 }}>
                        <Typography component="span" variant="body2" fontWeight="bold">
                            Utensilios:{' '}
                        </Typography>
                        <Typography component="span" variant="body2">
                            {receta.utensilios.join(', ')}
                        </Typography>
                    </Box>
                )}
                {/* CORRECCIÓN: Uso de ?.length y mapeo seguro para etiquetas */}
                {receta.etiquetas?.length > 0 && (
                    <Box className="etiquetas-receta" sx={{ mt: 1, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                        <Typography variant="body2" fontWeight="bold" sx={{ mr: 0.5 }}>Etiquetas:</Typography>
                        {receta.etiquetas
                            .sort((a, b) => {
                                const aEsDesafio = a.toLowerCase() === 'desafio';
                                const bEsDesafio = b.toLowerCase() === 'desafio';
                                if (aEsDesafio) return -1;
                                if (bEsDesafio) return 1;
                                return 0;
                            }).map((etiqueta, index) => (
                                <Chip
                                    key={index}
                                    label={etiqueta}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                        color: 'text.primary',
                                        borderColor: 'divider',
                                        ...(etiqueta === 'Desafio' && {
                                            background: 'linear-gradient(to right, #FF7B00, #FFD700)',
                                            color: 'white',
                                            fontWeight: 'bold',
                                            '&:hover': { opacity: 0.9 }
                                        }),
                                    }}
                                />
                            ))}
                    </Box>
                )}
            </Box>

            <div className="vista-previa-comentarios">
                {comentarios && comentarios.length > 0 ? (
                    comentarios.slice(0, 3).map((comentario, index) => (
                        <div key={comentario.id || index} className="item-comentario">
                            <ChatBubbleOutlineIcon className="icono-comentario-pequeno" />
                            <span className="autor-comentario">{comentario.usuario?.nombreUsuario}:</span> <span className="texto-comentario">{comentario.texto}</span>
                            <span className="tiempo-comentario">
                                • {formatoTiempoRelativo(comentario.fecha)}
                            </span>
                        </div>
                    ))
                ) : (
                    <div className="sin-comentarios">Sé el primero en comentar...</div>
                )}
            </div>

            <DrawerComentarios
                open={drawerAbierto}
                onClose={handleCloseDrawer}
                idReceta={receta.id}
                onComentarioAgregado={handleComentarioAgregado}
                comentarioIdDestacado={searchParams.get('comentario')}
            />
        </Paper>
    );
};

export default Receta;