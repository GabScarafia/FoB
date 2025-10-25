﻿import React, { useState } from 'react';
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

interface Paso {
    titulo: string;
    descripcion: string;
    numero: number;
    imagen?: string; // Agregado para tipar la imagen en el paso
}

export interface PropsReceta {
    receta: {
        id: number;
        autor: Usuario;
        fechaCreacion: string;
        tipoContenido: string;
        dificultad: string;
        imagen: string;
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
        pasos: Paso[];
    };
    onDrawerToggle: (open: boolean) => void;
    // Nueva prop para el ID del usuario actual
    currentUserId: number | null;
    // Nueva prop para la función de eliminar receta
    onDeleteReceta: (recetaId: number) => Promise<void>;
    onUsuarioClick?: (userId: number) => void;
}

const Receta: React.FC<PropsReceta> = ({ receta, onDrawerToggle, currentUserId, onDeleteReceta, onUsuarioClick }) => {
    const navigate = useNavigate();

    if (!receta) {
        console.error("Error: el objeto receta es nulo o indefinido.");
        return <div>Error: La receta no se pudo cargar.</div>;
    }


    const [disliked, setDisliked] = useState(receta.noMeGusta);
    const [favorite, setFavorito] = useState(receta.esFavorito);
    const [liked, setLiked] = useState(receta.meGusta);
    const [likesCount, setLikesCount] = useState(receta.cantidadVotos);
    const [saved, setSaved] = useState(receta.isSavedInitially || false);
    const [mostrarMas, setMostrarMas] = useState(false);
    const [modalPasosAbierto, setModalPasosAbierto] = useState(false);
    // Estado para la lógica de Seguir/Siguiendo, inicializado con la prop
    const [isFollowing, setIsFollowing] = useState(receta.seguido);


    const [comentariosCount, setComentariosCount] = useState(receta.cantidadComentarios);
    const [comentarios, setComentarios] = useState<Comentario[]>(receta.vistaPreviaComentarios || []);

    const { authData } = useAuth();

    const [drawerAbierto, setDrawerAbierto] = useState(false);

    const LIMITE_CARACTERES = 100;

    // Estado y manejadores para el menú de opciones 
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const openMenu = Boolean(anchorEl);

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

    const handleOpenModalPasos = () => {
        setModalPasosAbierto(true);
    };

    const handleCloseModalPasos = () => {
        setModalPasosAbierto(false);
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
    
    const [isProcessingLike, setIsProcessingLike] = useState(false);

    const handleLikeClick = async () => {
        if (isProcessingLike) return; // Evita múltiples clics rápidos
        setIsProcessingLike(true);
        try {
            const response = await fetch(`${BASE_URL}/Recetas/Interaccion`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authData?.token}`,
                    'Content-Type': 'application/json'
                },
                body:JSON.stringify({
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
                // Si das Like, eliminas Dislike
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
        }
    };
    
    // Función de seguimiento
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

            // Si la respuesta es OK, actualiza el estado de seguimiento (toggle)
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
                body:JSON.stringify({
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
                // Si das Dislike, eliminas Like y bajas el contador de Likes
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
                body:JSON.stringify({
                    idReceta: receta.id,
                    tipo: 2,
                    accion: (favorite)
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

    // Determina si la receta es del usuario actual
    const esRecetaPropia = currentUserId === receta.autor.id;

    const handleUsuarioClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onUsuarioClick) {
            onUsuarioClick(receta.autor.id);
        } else {
            navigate(`/perfil/${receta.autor.id}`);
        }
    };

    // Carrusel de imágenes (receta principal + imágenes de pasos)
    const pasosConImagen = receta.pasos.filter(p => p.imagen && p.imagen !== '');
    const imagenesCarrusel = [
        receta.imagen ? `data:image/jpeg;base64,${receta.imagen}` : null,
        ...pasosConImagen.map(p => {
            if (p.imagen?.startsWith('data:image')) return p.imagen;
            return `data:image/jpeg;base64,${p.imagen}`;
        })
    ].filter(Boolean) as string[];
    
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
        setIndiceImagen(prev => prev < imagenesCarrusel.length - 1 ? prev + 1 : prev);
    };

    // Condición de renderizado del botón Seguir:
    // Muestra el botón 'Seguir' solo si:
    // 1. El autor de la receta NO está siendo seguido (`!isFollowing`).
    // 2. La receta NO es del usuario actual (`!esRecetaPropia`).
    const debeMostrarBotonSeguir = !isFollowing && !esRecetaPropia;
    //console.log(receta);
    //console.log("Receta seguido:", receta.seguido, "isFollowing estado:", isFollowing, "debeMostrarBotonSeguir:", debeMostrarBotonSeguir);

    return (
        <Paper elevation={2} sx={{ 
            maxWidth: '500px', 
            mx: 'auto', 
            mb: 3, 
            overflow: 'hidden',
            bgcolor: 'background.paper' // Usa el color de fondo del tema
        }}>
            <Box className="encabezado-receta" sx={{ p: 2 }}>
                <div className="info-autor" onClick={handleUsuarioClick} style={{cursor: 'pointer'}}>
                    <img src={fotoPerfilUrl} alt="Foto de Perfil" className="foto-perfil" />
                    <div>
                        <div className="nombre-autor">{receta.autor?.nombreUsuario}</div>
                        <div className="tiempo-publicacion">Publicado {fechaFormateada}</div>
                    </div>
                </div>
                {/* Contenedor para la dificultad y el menú de opciones */}
                <div className="meta-receta-y-menu">
                    <div className="meta-receta">
                        <span className="tipo-contenido">{receta.dificultad}</span>
                        <div className="estrellas-calificacion">
                            {renderizarEstrellas(receta.dificultad)}
                        </div>
                    </div>
                    {/* Menú de opciones visible solo para recetas propias */}
                    {esRecetaPropia && (
                        <>
                            <IconButton
                                aria-label="más opciones"
                                id="basic-button"
                                aria-controls={openMenu ? 'basic-menu' : undefined}
                                aria-haspopup="true"
                                aria-expanded={openMenu ? 'true' : undefined}
                                onClick={handleClickMenu}
                                sx={{ color: 'text.secondary', p: 0.5, ml: 1 }} // Usa color del tema
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

            {/* Imagen principal del carrusel con swipe */}
            <div className="carrusel-imagen" {...swipeHandlers}>
                <img 
                    src={imagenesCarrusel[indiceImagen]} 
                    alt={`Receta paso ${indiceImagen}`} 
                    className="imagen-receta" 
                    draggable={false} 
                />
            </div>

            {/* Navegación y puntitos debajo de la imagen */}
            <div className="carrusel-navegacion" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, margin: '12px 0' }}>
                <IconButton onClick={handlePrevImagen} disabled={indiceImagen === 0} color="primary">
                    <ArrowBackIcon />
                </IconButton>
                <div className="carrusel-puntos" style={{ display: 'flex', gap: 6 }}>
                    {imagenesCarrusel.map((_, idx) => (
                        <Box 
                            key={idx} 
                            component="span" 
                            sx={{ 
                                fontSize: 18, 
                                color: idx === indiceImagen ? 'primary.main' : 'text.disabled' // Colores del tema
                            }}
                        >●</Box>
                    ))}
                </div>
                <IconButton onClick={handleNextImagen} disabled={indiceImagen === imagenesCarrusel.length - 1} color="primary">
                    <ArrowForwardIcon />
                </IconButton>
            </div>

            {/* Info del paso si corresponde */}
            {indiceImagen > 0 && pasosConImagen[indiceImagen - 1] && (
                <div className="info-paso-carrusel" style={{ marginBottom: 12, textAlign: 'center' }}>
                    <Typography variant="body2"><strong>Paso {pasosConImagen[indiceImagen - 1].numero}:</strong> {pasosConImagen[indiceImagen - 1].titulo}</Typography>
                    <Typography variant="caption">{pasosConImagen[indiceImagen - 1].descripcion}</Typography>
                </div>
            )}

            <Box className="acciones-receta" sx={{ px: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box className="acciones-izquierda" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <IconButton onClick={handleLikeClick} size="small">
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
                        {receta.etiquetas.map((etiqueta, index) => (
                            <Chip
                                key={index}
                                label={etiqueta}
                                size="small"
                                variant="outlined" // El variant 'outlined' se ve genial en ambos temas
                            />
                        ))}
                    </Box>
                )}
                {receta.pasos && receta.pasos.length > 0 && (
                    <div className="pasos-receta">
                        <Button variant="contained" onClick={handleOpenModalPasos} sx={{ mt: 2, mb: 0.5 }}>
                            Ver Pasos
                        </Button>
                    </div>
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

            <Dialog open={modalPasosAbierto} onClose={handleCloseModalPasos} scroll="paper" fullWidth maxWidth="sm">
                <DialogTitle>Pasos de la Receta</DialogTitle>
                <DialogContent dividers>
                    <Box component="div" className="lista-pasos">
                        {receta.pasos.sort((a, b) => a.numero - b.numero).map((paso, index) => (
                            <div key={index} className="paso-item">
                                <Typography variant="h6" component="h4" className="paso-numero-titulo">
                                    {paso.numero}- {paso.titulo}
                                </Typography>
                                <Typography variant="body2" className="paso-descripcion">
                                    {paso.descripcion}
                                </Typography>
                            </div>
                        ))}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseModalPasos}>Cerrar</Button>
                </DialogActions>
            </Dialog>

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