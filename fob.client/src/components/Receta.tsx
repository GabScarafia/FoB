import React, { useState } from 'react';
import { useSwipeable } from 'react-swipeable';
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
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/MenuItem';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import IconButton from '@mui/material/IconButton';

import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';

import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ThumbDownAltOutlinedIcon from '@mui/icons-material/ThumbDownAltOutlined';

import fotoPerfilLocal from '../assets/images/avatar.png';

import DrawerComentarios from '../components/DrawerComentarios';
import type { Comentario } from '../components/DrawerComentarios';
import type { Usuario } from '../pages/Feed';
import { useAuth } from '../context/AuthContext';
import { formatoTiempoRelativo } from '../utils/formateoDeTiempo';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

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
        categorias: string[];
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

    console.log("Receta recibida:", receta);

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

    const handleLikeClick = async () => {
        try {

            const response = await fetch(`https://localhost:7084/Recetas/Interaccion`, {
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
            } else {
                const errorData = await response.json();
                console.error("Error al dar like/dislike:", errorData.message);
                alert("Ocurrió un error. Intenta de nuevo.");
            }
        } catch (error) {
            console.error("Error de red al dar like/dislike:", error);
            alert("Ocurrió un error de conexión. Intenta de nuevo.");
        }
    };

    const handleFollowClick = async (usuarioId: number, isCurrentlyFollowing: boolean) => {
        // await onFollow(usuarioId, isCurrentlyFollowing);
        // setUsuariosLocal(prevUsuarios =>
        //     prevUsuarios.map(u =>
        //         u.id === usuarioId ? { ...u, isFollowing: !isCurrentlyFollowing } : u
        //     )
        // );
    };
    
    const handleDisLikeClick = async () => {
        try {

            const response = await fetch(`https://localhost:7084/Recetas/Interaccion`, {
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
           
            const response = await fetch(`https://localhost:7084/Recetas/Interaccion`, {
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

    const urlReceta = receta.imagen
        ? `data:image/jpeg;base64,${receta.imagen}`
        : 'https://via.placeholder.com/600x400/FF5733/FFFFFF?text=Imagen+de+Receta';

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
    const imagenesCarrusel = [
        receta.imagen ? `data:image/jpeg;base64,${receta.imagen}` : null,
        ...receta.pasos
            .filter((p: any) => p.imagen && p.imagen !== '')
            .map((p: any) => {
                
                if (p.imagen.startsWith('data:image')) return p.imagen;
                return `data:image/jpeg;base64,${p.imagen}`;
            })
    ].filter(Boolean);
    const pasosConImagen = receta.pasos.filter((p: any) => p.imagen && p.imagen !== '');
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

    return (
        <div className="tarjeta-receta">
            <div className="encabezado-receta">
                <div className="info-autor" onClick={handleUsuarioClick} style={{cursor: 'pointer'}}>
                    <img src={fotoPerfilUrl} alt="Foto de Perfil" className="foto-perfil" />
                    <div>
                        <div className="nombre-autor">{receta.autor?.nombreUsuario}</div>
                        <div className="tiempo-publicacion">Publicado {fechaFormateada}</div>
                    </div>
                </div>
                {/* Contenedor para la dificultad y el menú de opciones */}
                <div className="meta-receta-y-menu">
                    { !receta.seguido && (
                        <button
                            className={`boton-seguir ${ receta.seguido ? 'siguiendo' : ''}`}
                            tabIndex={0}
                            onClick={e => {
                                e.stopPropagation();
                                handleFollowClick(receta.autor.id,  receta.seguido || false);
                            }}
                        >
                            { receta.seguido ? 'Siguiendo' : 'Seguir'}
                        </button>
                    )}
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
                                sx={{ color: '#0b2553', p: 0.5, ml: 1 }}
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
            </div>

            {/* Imagen principal del carrusel con swipe */}
            <div className="carrusel-imagen" {...swipeHandlers}>
                <img src={imagenesCarrusel[indiceImagen]} alt={`Receta paso ${indiceImagen}`} className="imagen-receta" draggable={false} />
            </div>

            {/* Navegación y puntitos debajo de la imagen */}
            <div className="carrusel-navegacion" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, margin: '12px 0' }}>
                <IconButton onClick={handlePrevImagen} disabled={indiceImagen === 0}>
                    <ArrowBackIcon />
                </IconButton>
                <div className="carrusel-puntos" style={{ display: 'flex', gap: 6 }}>
                    {imagenesCarrusel.map((_, idx) => (
                        <span key={idx} className={idx === indiceImagen ? 'punto activo' : 'punto'} style={{ fontSize: 18, color: idx === indiceImagen ? '#1f43aa' : '#bbb' }}>●</span>
                    ))}
                </div>
                <IconButton onClick={handleNextImagen} disabled={indiceImagen === imagenesCarrusel.length - 1}>
                    <ArrowForwardIcon />
                </IconButton>
            </div>

            {/* Info del paso si corresponde */}
            {indiceImagen > 0 && pasosConImagen[indiceImagen - 1] && (
                <div className="info-paso-carrusel" style={{ marginBottom: 12, textAlign: 'center' }}>
                    <strong>Paso {pasosConImagen[indiceImagen - 1].numero}:</strong> {pasosConImagen[indiceImagen - 1].titulo}
                    <div>{pasosConImagen[indiceImagen - 1].descripcion}</div>
                </div>
            )}

            <div className="acciones-receta">
                <div className="acciones-izquierda">
                    {liked ? (
                        <ThumbUpIcon className="icono-accion icono-me-gusta azul-relleno" onClick={handleLikeClick} />
                    ) : (
                        <ThumbUpAltOutlinedIcon className="icono-accion icono-me-gusta azul-borde" onClick={handleLikeClick} />
                    )}
                    <span className="conteo-me-gusta">{likesCount}</span>
                    {disliked ? (
                        <ThumbDownIcon className="icono-accion icono-me-gusta azul-relleno" onClick={handleDisLikeClick} />
                    ) : (
                        <ThumbDownAltOutlinedIcon className="icono-accion icono-me-gusta azul-borde" onClick={handleDisLikeClick} />
                    )}
                    <ChatBubbleOutlineIcon
                        className="icono-accion icono-comentario azul-borde"
                        onClick={handleOpenDrawer}
                    />
                    <span className="conteo-comentarios">{comentariosCount}</span>

                    <AccessTimeIcon className="icono-accion icono-tiempo azul-relleno" />
                    <span className="conteo-tiempo">{formatearTiempo(receta.tiempoPreparacion)}</span>
                </div>
                <div className="acciones-derecha">
                    {favorite ? (
                        <StarIcon className="icono-accion icono-guardar azul-relleno" onClick={handleFavoritoClick} />
                    ) : (
                        <StarBorderIcon className="icono-accion icono-guardar azul-borde" onClick={handleFavoritoClick} />
                    )}
                </div>
            </div>

            <div className="titulo-receta">
                <h3>{receta.titulo}</h3>
            </div>

            <div className="descripcion-receta">
                <p>{descripcionMostrada}</p>
                {debeMostrarBotonLeerMas && (
                    <button onClick={handleToggleDescripcion} className="boton-leer-mas">
                        {mostrarMas ? 'Leer menos' : 'Leer más'}
                    </button>
                )}
            </div>

            <div className="informacion-adicional">
                {receta.ingredientes && receta.ingredientes.length > 0 && (
                    <div className="ingredientes-receta">
                        <strong>Ingredientes:</strong>
                        {receta.ingredientes.map((ingrediente, index) => (
                            <span key={ingrediente.id} className="tag-ingrediente">
                                {ingrediente.nombre} {ingrediente.cantidad} {ingrediente.unidadDeMedida}
                                {index < receta.ingredientes.length - 1 ? ', ' : ''}
                            </span>
                        ))}
                    </div>
                )}
                {receta.categorias && receta.categorias.length > 0 && (
                    <div className="categorias-receta">
                        <strong>Categoría:</strong>
                        {receta.categorias.map((categoria, index) => (
                            <span key={index} className="tag-categoria">
                                {categoria}
                                {index < receta.categorias.length - 1 ? ', ' : ''}
                            </span>
                        ))}
                    </div>
                )}
                {receta.pasos && receta.pasos.length > 0 && (
                    <div className="pasos-receta">
                        <button className="boton-pasos" onClick={handleOpenModalPasos}>
                            <strong>Ver Pasos</strong>
                        </button>
                    </div>
                )}
            </div>

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

            {modalPasosAbierto && (
                <div className="modal-overlay" onClick={handleCloseModalPasos}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Pasos de la Receta</h3>
                        <button className="boton-cerrar-modal" onClick={handleCloseModalPasos}>×</button>
                        <div className="lista-pasos">
                            {receta.pasos.sort((a, b) => a.numero - b.numero).map((paso, index) => (
                                <div key={index} className="paso-item">
                                    <div className="paso-titulo-contenedor">
                                        <h4 className="paso-numero-titulo">
                                            {paso.numero}- {paso.titulo}
                                        </h4>
                                    </div>
                                    <p className="paso-descripcion">{paso.descripcion}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <DrawerComentarios
                open={drawerAbierto}
                onClose={handleCloseDrawer}
                idReceta={receta.id}
                onComentarioAgregado={handleComentarioAgregado}
            />
        </div>
    );
};

export default Receta;