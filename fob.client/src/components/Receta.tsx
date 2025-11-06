import React, { useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import { Paper, Box, Typography, Menu, MenuItem, ListItemIcon, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions, Chip } from '@mui/material';
import './Receta.css';
import { useNavigate } from 'react-router-dom';

// Íconos de Material UI
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import StarIcon from '@mui/icons-material/Star';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ListItemText from '@mui/material/MenuItem';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';


import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';

import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ThumbDownAltOutlinedIcon from '@mui/icons-material/ThumbDownAltOutlined';

import fotoPerfilLocal from '../assets/images/avatar.png';

import DrawerComentarios from '../components/DrawerComentarios';
import type { Comentario } from '../components/DrawerComentarios';
import type { Usuario } from '../types/Receta'
import { useAuth } from '../context/AuthContext';
import { formatoTiempoRelativo } from '../utils/formateoDeTiempo';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { BASE_URL } from '../apiConfig';

interface Ingrediente {
    id: number;
    nombre: string;
    cantidad: number;
    unidadDeMedida: string;
}

// --- INTERFAZ ACTUALIZADA (como la pasaste) ---
interface Paso {
    titulo: string;
    descripcion: string;
    numero: number;
    imagen?: string; 
    contentType: string; // Campo clave
}

// Interfaz para un elemento del carrusel
interface CarruselItem {
    mediaUrl: string; // La URL de la imagen O video
    mediaType: 'image' | 'video'; // El tipo de medio
    pasoInfo?: Paso;   // Información del paso (si es un slide de paso)
    isMainImage: boolean; // Indica si es el slide principal de la receta
}

// --- INTERFAZ ACTUALIZADA (como la pasaste) ---
export interface PropsReceta {
    receta: {
        id: number;
        autor: Usuario;
        fechaCreacion: string;
        tipoContenido: string;
        dificultad: string;
        imagen: string; // URL o Base64 crudo
        contentType: string; // Campo clave (ej. "image/jpeg", "video/mp4")
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
        pasos: Paso[]; // Array de la interfaz Paso actualizada
    };
    onDrawerToggle: (open: boolean) => void;
    currentUserId: number | null;
    onDeleteReceta: (recetaId: number) => Promise<void>;
    onUsuarioClick?: (userId: number) => void;
}


const Receta: React.FC<PropsReceta> = ({ receta, onDrawerToggle, currentUserId, onDeleteReceta, onUsuarioClick }) => {
    const navigate = useNavigate();

    if (!receta) {
        console.error("Error: el objeto receta es nulo o indefinido.");
        return <div>Error: La receta no se pudo cargar.</div>;
    }

    // ... (El resto de tus estados: disliked, favorite, liked, etc. no cambian)
    const [disliked, setDisliked] = useState(receta.noMeGusta);
    const [favorite, setFavorito] = useState(receta.esFavorito);
    const [liked, setLiked] = useState(receta.meGusta);
    const [likesCount, setLikesCount] = useState(receta.cantidadVotos);
    const [saved, setSaved] = useState(receta.isSavedInitially || false);
    const [mostrarMas, setMostrarMas] = useState(false);
    const [isFollowing, setIsFollowing] = useState(receta.seguido);
    const [comentariosCount, setComentariosCount] = useState(receta.cantidadComentarios);
    const [comentarios, setComentarios] = useState<Comentario[]>(receta.vistaPreviaComentarios || []);
    const { authData } = useAuth();
    const [drawerAbierto, setDrawerAbierto] = useState(false);
    const LIMITE_CARACTERES = 100;
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const openMenu = Boolean(anchorEl);
    const [isProcessingLike, setIsProcessingLike] = useState(false);


    // ... (El resto de tus manejadores: handleClickMenu, handleCloseMenu, etc. no cambian)
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

    const handleFollowClick = async (usuarioId: number) => {
        if (!authData?.token) {
            alert("Debes iniciar sesión para seguir a un usuario.");
            return;
        }

        const apiUrl = `${BASE_URL}/Follow/${usuarioId}`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authData.token}`,
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error: ${response.status} - ${errorText}`);
            }

            setIsFollowing(prev => !prev);

        } catch (error) {
            console.error("Fallo al ejecutar la acción de seguir:", error);
            alert("Ocurrió un error. Intenta de nuevo.");
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
                } else {
                    setDisliked(true);
                }
                if (liked) {
                    setLiked(false);
                    setLikesCount(prevCount => prevCount - 1);
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

    const descripcionMostrada = mostrarMas || receta.descripcion.length <= LIMITE_CARACTERES
        ? receta.descripcion
        : `${receta.descripcion.substring(0, LIMITE_CARACTERES)}...`;

    const debeMostrarBotonLeerMas = receta.descripcion.length > LIMITE_CARACTERES;

    const fotoPerfilUrl = receta.autor?.imagen
        ? `data:image/jpeg;base64,${receta.autor.imagen}`
        : fotoPerfilLocal;

    const formatearTiempo = (tiempo: string): string => {
        const partes = tiempo.split(':').map(part => parseInt(part, 10));
        const horas = partes[0];
        const minutos = partes[1];
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

    // --- LÓGICA DEL CARRUSEL MODIFICADA (Usa contentType) ---

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
    // Esto es crucial si 'imagen' es solo el string base64 crudo.
    const getNormalizedUrl = (
        mediaStr: string | undefined | null, 
        contentType: string, // <-- Parámetro clave
        fallback: string
    ): string => {
        if (!mediaStr || mediaStr === '') return fallback;
        
        // Si ya es un Data URL (video o imagen) o una URL http, está lista.
        if (mediaStr.startsWith('data:') || mediaStr.startsWith('http')) {
            return mediaStr;
        }
        
        // Si es el fallback (fotoPerfilLocal), está lista.
        if (mediaStr === fallback) return fallback;

        // NUEVA LÓGICA:
        // Si es base64 crudo, construye el Data URI usando el contentType.
        // Ej: 'data:video/mp4;base64,SGF...
        // Ej: 'data:image/jpeg;base64,SGF...
        return `data:${contentType};base64,${mediaStr}`;
    }

    // 3. Obtener la media principal (Portada)
    const tipoMediaPrincipal = getMediaTypeFromContentType(receta.contentType);
    const mediaPrincipalUrl = getNormalizedUrl(
        receta.imagen, 
        receta.contentType, 
        fotoPerfilLocal
    );

    // 4. Crear la matriz de elementos del carrusel (CarruselItem[])
    const carruselItems: CarruselItem[] = [];

    // **Añadir el slide de la Media Principal (Portada)**
    if (mediaPrincipalUrl) {
        carruselItems.push({
            mediaUrl: mediaPrincipalUrl,
            mediaType: tipoMediaPrincipal,
            isMainImage: true
        });
    }

    // **Añadir un slide para CADA PASO**
    receta.pasos.forEach(paso => {
        let mediaPasoUrl = mediaPrincipalUrl; // Fallback: usa la media principal
        let mediaPasoType = tipoMediaPrincipal; // Fallback: usa el tipo principal

        // Si el paso TIENE una imagen/video, usa la del paso
        // Nos aseguramos que el paso tenga su propio 'imagen' y 'contentType'
        if (paso.imagen && paso.imagen !== '' && paso.contentType) {
            mediaPasoType = getMediaTypeFromContentType(paso.contentType);
            mediaPasoUrl = getNormalizedUrl(
                paso.imagen, 
                paso.contentType, 
                fotoPerfilLocal // Fallback por si acaso
            );
        } else if (paso.imagen && paso.imagen !== '' && !paso.contentType) {
             // Fallback si el paso tiene imagen pero no contentType (usará el de la receta)
             console.warn("Paso tiene imagen pero no contentType. Usando el de la receta.");
             mediaPasoType = getMediaTypeFromContentType(receta.contentType);
             mediaPasoUrl = getNormalizedUrl(
                paso.imagen, 
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

    // --- FIN DE LA LÓGICA MODIFICADA ---


    const [indiceImagen, setIndiceImagen] = useState(0);

    // Swipe handlers
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

    const itemActual = carruselItems[indiceImagen];

    const debeMostrarBotonSeguir = !isFollowing && !esRecetaPropia;

    return (
        <Paper elevation={2} sx={{
            maxWidth: '500px',
            mx: 'auto',
            mb: 3,
            overflow: 'hidden',
            bgcolor: 'background.paper'
        }}>
            <Box className="encabezado-receta" sx={{ p: 2 }}>
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
                            >
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

            {/* --- BLOQUE DE RENDERIZADO (Este no cambió) --- */}
            {/* Imagen/Video principal del carrusel con swipe */}
            {/* La lógica aquí sigue funcionando porque depende de itemActual.mediaType */}
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
            {/* --- FIN DEL BLOQUE DE RENDERIZADO --- */}


            {/* Navegación y puntitos debajo de la imagen */}
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

            {/* Info del paso si corresponde (Sólo se muestra si NO es la imagen principal) */}
            {itemActual && !itemActual.isMainImage && itemActual.pasoInfo && (
                <div className="info-paso-carrusel" style={{ marginBottom: 12, textAlign: 'center' }}>
                    <Typography variant="body2"><strong>Paso {itemActual.pasoInfo.numero}:</strong> {itemActual.pasoInfo.titulo}</Typography>
                    <Typography variant="caption">{itemActual.pasoInfo.descripcion}</Typography>
                </div>
            )}

            {/* ... (El resto del JSX: acciones, descripción, ingredientes, etc. no cambia) ... */}
            <Box className="acciones-receta" sx={{ px: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box className="acciones-izquierda" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <IconButton onClick={handleLikeClick} size="small" disabled={isProcessingLike}>
                        {liked ? (
                            <ThumbUpIcon sx={{ color: 'primary.main' }} />
                        ) : (
                            <ThumbUpAltOutlinedIcon />
                        )}
                    </IconButton>
                    <span className="conteo-me-gusta">{likesCount}</span>

                    <IconButton onClick={handleDisLikeClick} size="small">
                        {disliked ? (
                            <ThumbDownIcon sx={{ color: 'primary.main' }} />
                        ) : (
                            <ThumbDownAltOutlinedIcon />
                        )}
                    </IconButton>

                    <IconButton onClick={handleOpenDrawer} size="small">
                        <ChatBubbleOutlineIcon />
                    </IconButton>
                    <span className="conteo-comentarios">{comentariosCount}</span>

                    <AccessTimeIcon sx={{ color: 'text.secondary', ml: 1 }} />
                    <span className="conteo-tiempo">{formatearTiempo(receta.tiempoPreparacion)}</span>
                </Box>
                <div className="acciones-derecha">
                    <IconButton onClick={handleFavoritoClick} size="small">
                        {favorite ? (
                            <StarIcon sx={{ color: 'primary.main' }} />
                        ) : (
                            <StarBorderIcon />
                        )}
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
                {receta.ingredientes && receta.ingredientes.length > 0 && (
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
                {receta.etiquetas && receta.etiquetas.length > 0 && (
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
                                            '&:hover': {
                                                opacity: 0.9
                                            }
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
            />
        </Paper>
    );
};

export default Receta;