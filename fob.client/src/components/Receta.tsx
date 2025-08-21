import React, { useState } from 'react';
import './Receta.css';

// Íconos de Material UI
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';

import fotoPerfilLocal from '../assets/images/bicho-arabe.jpg'; 

// Interfaz corregida para el usuario
interface Usuario {
    nombreUsuario: string;
    imagen: string; 
}

import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder'; // Guardar con borde
import BookmarkIcon from '@mui/icons-material/Bookmark'; // Guardar relleno

// Interfaz para la vista previa de comentarios
interface VistaPreviaComentario {
    autor: Usuario;
    texto: string;
    tiempo: string;
}

// Interfaz corregida para las props del componente Receta

import fotoPerfilLocal from '../assets/images/bicho-arabe.jpg';
import imagenRecetaLocal from '../assets/images/fanta.webp';
import DrawerComentarios from '../components/DrawerComentarios';
import type { Comentario } from './DrawerComentarios'; // Importa la interfaz de comentarios
import type { Usuario } from './DrawerComentarios'; // Importa la interfaz de usuario

// interfaz para las props del componente Receta
interface PropsReceta {
    receta: {
        id: number;
        autor: Usuario;
        tiempoPublicacion: string;
        tipoContenido: string;
        calificacion: number;
        imagen: string; // Corregido a 'string'
        cantidadVotos: number;
        meGusta: boolean;
        cantidadComentarios: number;
        titulo: string;
        descripcion: string;
        vistaPreviaComentarios?: Comentario[];
        isSavedInitially?: boolean;
    };
}

// Ya no necesitas esta función, tu backend ya hace el trabajo
// const arrayBufferToBase64 = (buffer: number[]) => {
//   let binary = '';
//   const bytes = new Uint8Array(buffer);
//   const len = bytes.byteLength;
//   for (let i = 0; i < len; i++) {
//     binary += String.fromCharCode(bytes[i]);
//   }
//   return window.btoa(binary);
// };

const Receta: React.FC<PropsReceta> = ({ receta }) => {
    const [liked, setLiked] = useState(receta.meGusta);
    const [likesCount, setLikesCount] = useState(receta.cantidadVotos);
    const [saved, setSaved] = useState(receta.isSavedInitially || false);
    const [mostrarMas, setMostrarMas] = useState(false);

    // Estado para controlar el estado del drawer de comentarios
    const [drawerAbierto, setDrawerAbierto] = useState(false);

    // Límite de caracteres para la descripción truncada
    const LIMITE_CARACTERES = 100;

    const renderizarEstrellas = (calificacion: number) => {
        const estrellas = [];
        for (let i = 0; i < 3; i++) {
            estrellas.push(
                <span key={i} className={`estrella ${i < calificacion ? 'rellena' : ''}`}>★</span>
            );
        }
        return estrellas;
    };

    const handleLikeClick = () => {
        if (liked) {
            setLiked(false);
            setLikesCount(prevCount => prevCount - 1);
        } else {
            setLiked(true);
            setLikesCount(prevCount => prevCount + 1);
        }
    };

    const handleSaveClick = () => {
        setSaved(prevSaved => !prevSaved);
    };

    const handleToggleDescripcion = () => {
        setMostrarMas(prevMostrarMas => !prevMostrarMas);
    };

    const descripcionMostrada = mostrarMas || receta.descripcion.length <= LIMITE_CARACTERES
        ? receta.descripcion
        : `${receta.descripcion.substring(0, LIMITE_CARACTERES)}...`;

    const debeMostrarBotonLeerMas = receta.descripcion.length > LIMITE_CARACTERES;

    // Construye la URL de la imagen de la receta desde la cadena Base64
    const urlReceta = receta.imagen
        ? `data:image/jpeg;base64,${receta.imagen}`
        : 'https://via.placeholder.com/600x400/FF5733/FFFFFF?text=Imagen+de+Receta';

    // Construye la URL de la foto de perfil desde la cadena Base64
    const fotoPerfilUrl = receta.autor?.imagen
        ? `data:image/jpeg;base64,${receta.autor.imagen}`
        : fotoPerfilLocal;

    return (
        <div className="tarjeta-receta">
            {/* Encabezado del usuario */}
            <div className="encabezado-receta">
                <div className="info-autor">
                    <img src={fotoPerfilUrl} alt="Foto de Perfil" className="foto-perfil" />
                    <div>
                        <div className="nombre-autor">{receta.usuario?.nombreUsuario}</div>
                        <div className="tiempo-publicacion">Publicado el {receta.tiempoPublicacion}</div>
                    </div>
                </div>
                <div className="meta-receta">
                    <span className="tipo-contenido">Media</span>
                    <div className="estrellas-calificacion">
                        {renderizarEstrellas(receta.calificacion)}
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

                    {/* Icono de comentario -> abre el Drawer */}
                    <ChatBubbleIcon
                    className="icono-accion icono-comentario azul-relleno"
                    onClick={() => setDrawerAbierto(true)}
                    />
                    <span className="conteo-comentarios">{receta.cantidadComentarios}</span>
                </div>
                <div className="acciones-derecha">
                    {saved ? (
                        <BookmarkIcon className="icono-accion icono-guardar azul-relleno" onClick={handleSaveClick} />
                    ) : (
                        <BookmarkBorderIcon className="icono-accion icono-guardar azul-borde" onClick={handleSaveClick} />
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

            {/* Vista previa de comentarios */}
            <div className="vista-previa-comentarios">
                {receta.vistaPreviaComentarios && receta.vistaPreviaComentarios.length > 0 ? (
                    receta.vistaPreviaComentarios.map((comentario, index) => (
                        <div key={index} className="item-comentario">
                            <ChatBubbleIcon className="icono-comentario-pequeno" />
                            <span className="autor-comentario">{comentario.usuario?.nombreUsuario}:</span> <span className="texto-comentario">{comentario.texto}</span> 
                            <span className="tiempo-comentario">
                                {comentario.hora instanceof Date ? comentario.hora.toLocaleString() : comentario.hora}
                            </span>
                        </div>
                    ))
                ) : (
                    <div className="sin-comentarios">Sé el primero en comentar...</div>
                )}
            </div>

            {/* Drawer */}
            <DrawerComentarios
                open={drawerAbierto}
                onClose={() => setDrawerAbierto(false)}
                comentarios={receta.vistaPreviaComentarios || []}
            />

        </div>
    );
};

export default Receta;