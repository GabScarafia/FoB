import React, { useState, useEffect } from 'react';
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

import fotoPerfilLocal from '../assets/images/avatar.png';
import DrawerComentarios from '../components/DrawerComentarios';
import type { Comentario } from '../components/DrawerComentarios';
import type { Usuario } from '../types/Receta'
import { useAuth } from '../context/AuthContext';
import { formatoTiempoRelativo } from '../utils/formateoDeTiempo';
import { BASE_URL } from '../apiConfig';

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
    if (mediaStr.startsWith('http') || mediaStr.startsWith('data:')) return mediaStr;
    if (mediaStr.startsWith('/')) return `${BASE_URL}${mediaStr}`;
    return `data:${contentType};base64,${mediaStr}`;
}

// --- INTERFACES ---

interface Ingrediente { id: number; nombre: string; cantidad: number; unidadDeMedida: string; }
interface Utensilio { id: number; nombre: string; }
interface Paso { titulo: string; descripcion: string; numero: number; imagenUrl?: string; contentType: string; }

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
        desafioId?: number; // Opcional, si viene del backend
    };
    onDrawerToggle: (open: boolean) => void;
    currentUserId: number | null;
    onDeleteReceta: (recetaId: number) => Promise<void>;
    onUsuarioClick?: (userId: number) => void;
    ocultarBotonSeguir?: boolean; // Nueva propiedad del Remoto
}

const Receta: React.FC<PropsReceta> = ({ receta, onDrawerToggle, currentUserId, onDeleteReceta, onUsuarioClick, ocultarBotonSeguir }) => {
    const navigate = useNavigate();
    const haProcesadoApertura = React.useRef(false);
    const [searchParams] = useSearchParams();

    if (!receta) {
        return <div>Error: La receta no se pudo cargar.</div>;
    }

    // --- ESTADOS ---
    const [disliked, setDisliked] = useState(receta.noMeGusta);
    const [favorite, setFavorito] = useState(receta.esFavorito);
    const [liked, setLiked] = useState(receta.meGusta);
    const [likesCount, setLikesCount] = useState(receta.cantidadVotos);
    const [mostrarMas, setMostrarMas] = useState(false);
    const [comentariosCount, setComentariosCount] = useState(receta.cantidadComentarios);
    const [comentarios, setComentarios] = useState<Comentario[]>(receta.vistaPreviaComentarios || []);

    // Estado del botón seguir (Del remoto)
    const [isFollowing, setIsFollowing] = useState(receta.seguido);

    const { authData } = useAuth();
    const [drawerAbierto, setDrawerAbierto] = useState(false);
    const LIMITE_CARACTERES = 100;
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const openMenu = Boolean(anchorEl);
    const [isProcessingLike, setIsProcessingLike] = useState(false);

    const esRecetaPropia = currentUserId === receta.autor.id;

    // Abrir drawer si viene por URL
    useEffect(() => {
        const recetaIdParam = searchParams.get('receta');
        const comentarioIdParam = searchParams.get('comentario');
        if (recetaIdParam && comentarioIdParam && Number(receta.id) === Number(recetaIdParam) && !haProcesadoApertura.current) {
            setDrawerAbierto(true);
            onDrawerToggle(true);
            haProcesadoApertura.current = true;
        }
    }, [receta.id, onDrawerToggle, searchParams]);

    // --- HANDLERS DE MENU ---
    const handleClickMenu = (event: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(event.currentTarget);
    const handleCloseMenu = () => setAnchorEl(null);
    const handleDeleteClick = async () => { handleCloseMenu(); onDeleteReceta(receta.id); };
    const handleEditClick = () => { handleCloseMenu(); navigate(`/receta/editar/${receta.id}`); };

    // --- LÓGICA BOTÓN SEGUIR (Del remoto) ---
    const handleFollowClick = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Evita que el click se propague al contenedor del autor
        if (!authData?.token || esRecetaPropia) return;

        const method = isFollowing ? 'DELETE' : 'POST';
        const previousIsFollowing = isFollowing;

        // Actualización optimista de la UI
        setIsFollowing(!previousIsFollowing);

        try {
            const response = await fetch(`${BASE_URL}/Follow/${receta.autor.id}`, {
                method: method,
                headers: { 'Authorization': `Bearer ${authData.token}` }
            });

            if (!response.ok) {
                // Si falla, revertimos el cambio en la UI
                setIsFollowing(previousIsFollowing);
                console.error('Error al intentar seguir/dejar de seguir');
                alert('Ocurrió un error al procesar la solicitud.');
            }
        } catch (error) {
            // Revertimos también si hay un error de red
            setIsFollowing(previousIsFollowing);
            console.error('Error de red al seguir/dejar de seguir:', error);
            alert('Error de conexión. Inténtalo de nuevo.');
        }
    };

    // --- INTERACCIONES ---
    const handleComentarioAgregado = (nuevoComentario: Comentario) => {
        setComentarios([...comentarios, nuevoComentario]);
        setComentariosCount(prevCount => prevCount + 1);
    };

    const handleLikeClick = async () => {
        if (isProcessingLike) return;
        setIsProcessingLike(true);
        try {
            const response = await fetch(`${BASE_URL}/Recetas/Interaccion`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authData?.token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ idReceta: receta.id, tipo: 0, accion: Number(liked) })
            });

            if (response.ok) {
                if (liked) {
                    setLiked(false);
                    setLikesCount(prev => prev - 1);
                } else {
                    setLiked(true);
                    setLikesCount(prev => prev + 1);
                    if (disliked) setDisliked(false);
                }
            } else {
                console.error("Error al dar like");
            }
        } catch (error) {
            console.error("Error de red al dar like:", error);
        } finally {
            setIsProcessingLike(false);
        }
    };

    const handleDisLikeClick = async () => {
        try {
            const response = await fetch(`${BASE_URL}/Recetas/Interaccion`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authData?.token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ idReceta: receta.id, tipo: 1, accion: Number(disliked) })
            });
            if (response.ok) {
                if (disliked) {
                    setDisliked(false);
                } else {
                    setDisliked(true);
                    if (liked) {
                        setLiked(false);
                        setLikesCount(prev => prev - 1);
                    }
                }
            }
        } catch (error) { console.error("Error dislike", error); }
    };

    const handleFavoritoClick = async () => {
        try {
            const response = await fetch(`${BASE_URL}/Recetas/Interaccion`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authData?.token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ idReceta: receta.id, tipo: 2, accion: Number(favorite) })
            });
            if (response.ok) setFavorito(!favorite);
        } catch (error) { console.error("Error favorito", error); }
    };

    const handleShareRecetaClick = async () => {
        const recetaUrl = `${window.location.origin}/perfil/${receta.autor.id}/publicaciones?receta=${receta.id}`;
        const shareText = `¡Mira la receta "${receta.titulo}" de @${receta.autor.nombreUsuario} en F.o.B!`;
        if (navigator.share) {
            try { await navigator.share({ title: `Receta: ${receta.titulo}`, text: shareText, url: recetaUrl }); }
            catch (error) { console.log('Error share', error); }
        } else {
            await navigator.clipboard.writeText(recetaUrl);
            alert('¡Enlace copiado!');
        }
    };

    // --- UTILIDADES RENDER ---
    const renderizarEstrellas = (dificultad: string) => {
        const num = dificultad === 'Facil' ? 1 : dificultad === 'Medio' ? 2 : dificultad === 'Dificil' ? 3 : dificultad === 'Experto' ? 4 : 0;
        return Array(num).fill(0).map((_, i) => <span key={i} className="estrella rellena">★</span>);
    };

    const formatearTiempo = (tiempo: string): string => {
        if (!tiempo) return 'N/A';
        const partes = tiempo.split(':').map(p => parseInt(p, 10));
        const h = partes[0] || 0;
        const m = partes[1] || 0;
        if (h === 0 && m === 0) return 'Menos de 1 min';
        return `${h > 0 ? h + ' h ' : ''}${m > 0 ? m + ' min' : ''}`;
    };

    // --- LÓGICA DE VISUALIZACIÓN ---
    const handleToggleDescripcion = () => setMostrarMas(!mostrarMas);
    const handleOpenDrawer = () => { setDrawerAbierto(true); onDrawerToggle(true); };
    const handleCloseDrawer = () => { setDrawerAbierto(false); onDrawerToggle(false); };

    const descripcionSegura = receta.descripcion || '';
    const descripcionMostrada = mostrarMas || descripcionSegura.length <= LIMITE_CARACTERES
        ? descripcionSegura
        : `${descripcionSegura.substring(0, LIMITE_CARACTERES)}...`;
    const debeMostrarBotonLeerMas = descripcionSegura.length > LIMITE_CARACTERES;

    const fotoPerfilUrl = getNormalizedUrl(receta.autor?.imagenUrl, 'image/jpeg', fotoPerfilLocal);
    const fechaFormateada = formatoTiempoRelativo(receta.fechaCreacion);

    const handleUsuarioClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onUsuarioClick ? onUsuarioClick(receta.autor.id) : navigate(`/perfil/${receta.autor.id}`);
    };

    // --- LÓGICA DEL CARRUSEL (IMÁGENES Y VIDEOS) ---
    const tipoMediaPrincipal = getMediaTypeFromContentType(receta.contentType);
    const mediaPrincipalUrl = getNormalizedUrl(receta.imagenUrl, receta.contentType, fotoPerfilLocal);
    const carruselItems: CarruselItem[] = [];
    const pasosSeguros = receta.pasos || [];

    // 1. Slide Principal
    if (mediaPrincipalUrl && (mediaPrincipalUrl !== fotoPerfilLocal || pasosSeguros.length === 0)) {
        carruselItems.push({ mediaUrl: mediaPrincipalUrl, mediaType: tipoMediaPrincipal, isMainImage: true });
    }

    // 2. Slides de Pasos
    pasosSeguros.forEach(paso => {
        let mediaPasoUrl = mediaPrincipalUrl;
        let mediaPasoType = tipoMediaPrincipal;
        if (paso.imagenUrl && paso.imagenUrl !== '') {
            mediaPasoType = getMediaTypeFromContentType(paso.contentType || 'image/jpeg');
            mediaPasoUrl = getNormalizedUrl(paso.imagenUrl, paso.contentType || 'image/jpeg', fotoPerfilLocal);
        }
        carruselItems.push({ mediaUrl: mediaPasoUrl, mediaType: mediaPasoType, pasoInfo: paso, isMainImage: false });
    });

    if (carruselItems.length === 0) {
        carruselItems.push({ mediaUrl: fotoPerfilLocal, mediaType: 'image', isMainImage: true });
    }

    const [indiceImagen, setIndiceImagen] = useState(0);
    const swipeHandlers = useSwipeable({
        onSwipedLeft: () => setIndiceImagen(p => p < carruselItems.length - 1 ? p + 1 : p),
        onSwipedRight: () => setIndiceImagen(p => p > 0 ? p - 1 : p),
        trackMouse: true,
    });
    const handlePrevImagen = () => setIndiceImagen(p => p > 0 ? p - 1 : p);
    const handleNextImagen = () => setIndiceImagen(p => p < carruselItems.length - 1 ? p + 1 : p);

    const itemActual = carruselItems[indiceImagen] || carruselItems[0];


    // ==================================================
    // RENDER
    // ==================================================
    return (
        <Paper
            sx={(theme) => ({
                // IMPORTANTE: Ajustes para evitar scroll horizontal y centrar en movil
                width: '100%',
                maxWidth: '500px',
                mx: 'auto',
                my: 3,
                overflow: 'hidden',
                borderRadius: '16px',
                transition: 'background 0.3s, border 0.3s, box-shadow 0.3s',
                ...(theme.palette.mode === 'light' ?
                    { bgcolor: 'background.paper', border: `1px solid ${theme.palette.divider}`, boxShadow: theme.shadows[3] } :
                    { background: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.15)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' })
            })}
        >
            {/* 1. ENCABEZADO (CON LÓGICA REMOTA DEL BOTÓN SEGUIR) */}
            <Box className="encabezado-receta" sx={{ p: 2, borderBottom: (theme) => `1px solid ${theme.palette.mode === 'light' ? theme.palette.divider : 'rgba(255, 255, 255, 0.15)'}` }}>
                <div className="info-autor" onClick={handleUsuarioClick} style={{ cursor: 'pointer', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src={fotoPerfilUrl} alt="Foto de Perfil" className="foto-perfil" />
                        <div>
                            <div className="nombre-autor">{receta.autor?.nombreUsuario}</div>
                            <div className="tiempo-publicacion">Publicado {fechaFormateada}</div>
                        </div>
                    </div>
                </div>

                {/* Contenedor para la parte derecha: botón seguir, meta y menú */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {/* LÓGICA BOTÓN SEGUIR */}
                    {isFollowing === false && !esRecetaPropia && !ocultarBotonSeguir && (
                        <Button
                            variant="contained"
                            size="large"
                            onClick={handleFollowClick}
                            sx={{
                                textTransform: 'none',
                                fontSize: '0.75rem',
                                px: 1.5,
                                bottom: '3px',
                                background: 'linear-gradient(to right, #1f46b2, #1a2a6c, #002242)',
                                color: 'white',
                                '&:hover': {
                                    opacity: 0.9
                                }
                            }}
                        >
                            Seguir
                        </Button>
                    )}

                    <div className="meta-receta-y-menu">
                        <div className="meta-receta">
                            <span className="tipo-contenido">{receta.dificultad}</span>
                            <div className="estrellas-calificacion">{renderizarEstrellas(receta.dificultad)}</div>
                        </div>
                        {esRecetaPropia && (
                            <>
                                <IconButton onClick={handleClickMenu} sx={{ color: 'text.secondary', p: 0.5, ml: 1 }}> <MoreVertIcon /> </IconButton>
                                <Menu anchorEl={anchorEl} open={openMenu} onClose={handleCloseMenu} disableScrollLock={true}>
                                    <MenuItem onClick={handleEditClick}> <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon> <ListItemText>Editar</ListItemText> </MenuItem>
                                    <MenuItem onClick={handleDeleteClick} sx={{ color: 'red' }}> <ListItemIcon><DeleteOutlineIcon fontSize="small" sx={{ color: 'red' }} /></ListItemIcon> <ListItemText>Eliminar</ListItemText> </MenuItem>
                                </Menu>
                            </>
                        )}
                    </div>
                </Box>
            </Box>

            {/* 2. CARRUSEL (MEDIA) - USANDO TU CONFIGURACIÓN LOCAL (CONTAIN PARA FOTOS) */}
            <div className="carrusel-imagen" {...swipeHandlers}>
                {itemActual && itemActual.mediaType === 'image' && (
                    <img
                        src={itemActual.mediaUrl}
                        alt={itemActual.isMainImage ? "Receta principal" : `Paso ${itemActual.pasoInfo?.numero}`}
                        className="imagen-receta"
                        draggable={false}
                        // CONFIGURACIÓN LOCAL: Contain para imágenes
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain'
                        }}
                    />
                )}
                {itemActual && itemActual.mediaType === 'video' && (
                    <video
                        src={itemActual.mediaUrl}
                        className="imagen-receta"
                        controls
                        muted
                        loop
                        playsInline
                        controlsList="nodownload"
                        draggable={false}
                        // CONFIGURACIÓN LOCAL: El cover de video lo maneja el CSS o el estilo inline aquí si lo tenías
                        style={{
                            width: '100%',
                            height: '100%',
                            // objectFit: 'cover', <--- BORRADO COMO PEDISTE EN LOCAL
                            backgroundColor: 'black'
                        }}
                    >
                        Tu navegador no soporta el tag de video.
                    </video>
                )}
            </div>

            {/* 3. NAVEGACIÓN CARRUSEL (PUNTITOS) */}
            <div className="carrusel-navegacion" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, margin: '12px 0' }}>
                <IconButton onClick={handlePrevImagen} disabled={indiceImagen === 0} color="primary"> <ArrowBackIcon /> </IconButton>
                <div className="carrusel-puntos" style={{ display: 'flex', gap: 6 }}>
                    {carruselItems.map((_, idx) => (
                        <Box key={idx} component="span" sx={{ fontSize: 18, color: idx === indiceImagen ? 'primary.main' : 'text.disabled' }}>●</Box>
                    ))}
                </div>
                <IconButton onClick={handleNextImagen} disabled={indiceImagen === carruselItems.length - 1} color="primary"> <ArrowForwardIcon /> </IconButton>
            </div>

            {/* 4. INFO DEL PASO (SI APLICA) */}
            {itemActual && !itemActual.isMainImage && itemActual.pasoInfo && (
                <div className="info-paso-carrusel" style={{ marginBottom: 12, textAlign: 'center' }}>
                    <Typography variant="body2"><strong>Paso {itemActual.pasoInfo.numero}:</strong> {itemActual.pasoInfo.titulo}</Typography>
                    <Typography variant="caption">{itemActual.pasoInfo.descripcion}</Typography>
                </div>
            )}

            {/* 5. BARRA DE ACCIONES */}
            <Box className="acciones-receta" sx={{ px: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: (theme) => `1px solid ${theme.palette.mode === 'light' ? theme.palette.divider : 'rgba(255, 255, 255, 0.15)'}` }}>
                <Box className="acciones-izquierda" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <IconButton onClick={handleLikeClick} size="small" disabled={isProcessingLike}> {liked ? <ThumbUpIcon sx={{ color: 'primary.main' }} /> : <ThumbUpAltOutlinedIcon />} </IconButton>
                    <span className="conteo-me-gusta">{likesCount}</span>

                    <IconButton onClick={handleDisLikeClick} size="small"> {disliked ? <ThumbDownIcon sx={{ color: 'primary.main' }} /> : <ThumbDownAltOutlinedIcon />} </IconButton>

                    <IconButton onClick={handleOpenDrawer} size="small"> <ChatBubbleOutlineIcon /> </IconButton>
                    <span className="conteo-comentarios">{comentariosCount}</span>

                    <AccessTimeIcon sx={{ color: 'text.secondary', ml: 1 }} />
                    <span className="conteo-tiempo">{formatearTiempo(receta.tiempoPreparacion)}</span>
                </Box>
                <div className="acciones-derecha">
                    <IconButton onClick={handleShareRecetaClick} size="small" sx={{ position: 'relative', top: '0.5px' }}> <ShareIcon /> </IconButton>
                    <IconButton onClick={handleFavoritoClick} size="small"> {favorite ? <StarIcon sx={{ color: 'primary.main' }} /> : <StarBorderIcon />} </IconButton>
                </div>
            </Box>

            {/* 6. TÍTULO Y DESCRIPCIÓN */}
            <Box sx={{ px: 2, mt: 1 }}> <Typography variant="h6" component="h3" fontWeight="bold">{receta.titulo}</Typography> </Box>
            <Box sx={{ px: 2, mt: 1 }}>
                <Typography variant="body2">{descripcionMostrada}</Typography>
                {debeMostrarBotonLeerMas && (<Button size="small" variant="text" onClick={handleToggleDescripcion} sx={{ p: 0, mt: 1 }}> {mostrarMas ? 'Leer menos' : 'Leer más'} </Button>)}
            </Box>

            {/* 7. DETALLES (Ingredientes, Utensilios, Etiquetas) */}
            <Box className="informacion-adicional" sx={{ px: 2, pb: 2 }}>
                {receta.ingredientes?.length > 0 && (
                    <Box className="ingredientes-receta" sx={{ mt: 1 }}>
                        <Typography component="span" variant="body2" fontWeight="bold">Ingredientes: </Typography>
                        <Typography component="span" variant="body2"> {receta.ingredientes.map((ing, i) => <span key={ing.id}>{`${ing.nombre} ${ing.cantidad} ${ing.unidadDeMedida}${i < receta.ingredientes.length - 1 ? ', ' : ''}`}</span>)} </Typography>
                    </Box>
                )}
                {receta.utensilios?.length > 0 && (
                    <Box className="utensilios-receta" sx={{ mt: 1 }}>
                        <Typography component="span" variant="body2" fontWeight="bold">Utensilios: </Typography>
                        <Typography component="span" variant="body2"> {receta.utensilios.join(', ')} </Typography>
                    </Box>
                )}
                {receta.etiquetas?.length > 0 && (
                    <Box className="etiquetas-receta" sx={{ mt: 1, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                        <Typography variant="body2" fontWeight="bold" sx={{ mr: 0.5 }}>Etiquetas:</Typography>
                        {receta.etiquetas.map((etiqueta, index) => (
                            <Chip key={index} label={etiqueta} size="small" variant="outlined"
                                sx={{
                                    color: 'text.primary',
                                    borderColor: 'divider',
                                    ...(etiqueta === 'Desafio' || etiqueta === 'DESAFIO' ? { background: 'linear-gradient(to right, #FF7B00, #FFD700)', color: 'white', fontWeight: 'bold', border: 'none' } : {})
                                }}
                            />
                        ))}
                    </Box>
                )}
            </Box>

            {/* 8. COMENTARIOS */}
            <div className="vista-previa-comentarios">
                {comentarios && comentarios.length > 0 ? (
                    comentarios.slice(0, 3).map((comentario, index) => (
                        <div key={comentario.id || index} className="item-comentario">
                            <ChatBubbleOutlineIcon className="icono-comentario-pequeno" />
                            <span className="autor-comentario">{comentario.usuario?.nombreUsuario}:</span> <span className="texto-comentario">{comentario.texto}</span>
                            <span className="tiempo-comentario"> • {formatoTiempoRelativo(comentario.fecha)} </span>
                        </div>
                    ))
                ) : (<div className="sin-comentarios">Sé el primero en comentar...</div>)}
            </div>

            <DrawerComentarios open={drawerAbierto} onClose={handleCloseDrawer} idReceta={receta.id} onComentarioAgregado={handleComentarioAgregado} comentarioIdDestacado={searchParams.get('comentario')} />
        </Paper>
    );
};

export default Receta;