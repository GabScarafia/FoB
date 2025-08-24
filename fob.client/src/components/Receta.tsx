import React, { useState } from 'react';
// import { useComentariosService } from 'services/comentarioService'; este tengo q ver para la preview
import './Receta.css';

// Íconos de Material UI
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
//import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import StarIcon from '@mui/icons-material/Star';

import fotoPerfilLocal from '../assets/images/bicho-arabe.jpg';

import DrawerComentarios from '../components/DrawerComentarios';
import type { Comentario } from '../components/DrawerComentarios';
import type { Usuario } from '../pages/Feed';
import { useAuth } from '../context/AuthContext';
import { formatoTiempoRelativo } from '../utils/formateoDeTiempo';

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

interface PropsReceta {
    receta: {
        id: number;
        autor: Usuario;
        fechaCreacion: string;
        tipoContenido: string;
        dificultad: string;
        imagen: string;
        cantidadVotos: number;
        meGusta: boolean;
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
}

const Receta: React.FC<PropsReceta> = ({ receta, onDrawerToggle }) => {
    const [liked, setLiked] = useState(receta.meGusta);
    const [likesCount, setLikesCount] = useState(receta.cantidadVotos);
    const [saved, setSaved] = useState(receta.isSavedInitially || false);
    const [mostrarMas, setMostrarMas] = useState(false);
    const [modalPasosAbierto, setModalPasosAbierto] = useState(false);

    // Agregamos un nuevo estado para el contador de comentarios
    const [comentariosCount, setComentariosCount] = useState(receta.cantidadComentarios);

    // Se agrega el estado para manejar la lista completa de comentarios
    const [comentarios, setComentarios] = useState<Comentario[]>(receta.vistaPreviaComentarios || []);

    const { authData } = useAuth(); // Usamos el hook para el token

    // Estado para controlar el estado del drawer de comentarios
    const [drawerAbierto, setDrawerAbierto] = useState(false);

    const LIMITE_CARACTERES = 100;

    // Lógica para el modal de Pasos
    const handleOpenModalPasos = () => {
        setModalPasosAbierto(true);
    };

    const handleCloseModalPasos = () => {
        setModalPasosAbierto(false);
    };

    // Función para manejar la adición de un nuevo comentario al estado local
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
            const response = await fetch(`https://localhost:7084/Recetas/LikeOrDislike/${receta.id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authData?.token}`,
                    'Content-Type': 'application/json'
                }
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

    const handleSaveClick = () => {
        setSaved(prevSaved => !prevSaved);
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

    return (
        <div className="tarjeta-receta">
            {/* Encabezado del usuario */}
            <div className="encabezado-receta">
                <div className="info-autor">
                    <img src={fotoPerfilUrl} alt="Foto de Perfil" className="foto-perfil" />
                    <div>
                        <div className="nombre-autor">{receta.autor?.nombreUsuario}</div>
                        <div className="tiempo-publicacion">Publicado {fechaFormateada}</div>
                    </div>
                </div>
                <div className="meta-receta">
                    <span className="tipo-contenido">{receta.dificultad}</span>
                    <div className="estrellas-calificacion">
                        {renderizarEstrellas(receta.dificultad)}
                    </div>
                </div>
            </div>

            {/* Imagen de la receta */}
            <div className="contenedor-imagen-receta">
                <img src={urlReceta} alt="Receta" className="imagen-receta" />
            </div>

            {/* Interacciones (Me Gusta, Comentarios, Guardar) */}
            <div className="acciones-receta">
                <div className="acciones-izquierda">
                    {liked ? (
                        <FavoriteIcon className="icono-accion icono-me-gusta azul-relleno" onClick={handleLikeClick} />
                    ) : (
                        <FavoriteBorderIcon className="icono-accion icono-me-gusta azul-borde" onClick={handleLikeClick} />
                    )}
                    <span className="conteo-me-gusta">{likesCount}</span>
                    <ChatBubbleOutlineIcon
                        className="icono-accion icono-comentario azul-borde"
                        onClick={handleOpenDrawer}
                    />
                    <span className="conteo-comentarios">{comentariosCount}</span>

                    {/* Icono de reloj y tiempo de preparación */}
                    <AccessTimeIcon className="icono-accion icono-tiempo azul-relleno" />
                    <span className="conteo-tiempo">{formatearTiempo(receta.tiempoPreparacion)}</span>
                </div>
                <div className="acciones-derecha">
                    {saved ? (
                        <StarIcon className="icono-accion icono-guardar azul-relleno" onClick={handleSaveClick} />
                    ) : (
                        <StarBorderIcon className="icono-accion icono-guardar azul-borde" onClick={handleSaveClick} />
                    )}
                </div>
            </div>

            {/* Título y descripción */}
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

            {/* Sección de ingredientes y categorías */}
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
                                {index < receta.categorias.length - 1 ? '' : ''}
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

            {/* Vista previa de comentarios */}
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

            {/* Modal de Pasos  */}
            {modalPasosAbierto && (
                <div className="modal-overlay" onClick={handleCloseModalPasos}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Pasos de la Receta</h3>
                        <button className="boton-cerrar-modal" onClick={handleCloseModalPasos}>×</button>
                        <div className="lista-pasos">
                            {/* Se ordena la lista por el número de paso antes de renderizarla */}
                            {receta.pasos.sort((a, b) => a.numero - b.numero).map((paso, index) => (
                                <div key={index} className="paso-item">
                                    {/* Se usa paso.numero para la numeración y se le da un estilo */}
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

            {/* Drawer */}
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