import React, { useState } from 'react';
import './Receta.css';

// íconos de Material UI
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'; // Corazón sin rellenar
import FavoriteIcon from '@mui/icons-material/Favorite'; // Corazón relleno

import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'; // Comentario con borde
import ChatBubbleIcon from '@mui/icons-material/ChatBubble'; // Comentario relleno


import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder'; // Guardar con borde
import BookmarkIcon from '@mui/icons-material/Bookmark'; // Guardar relleno


import fotoPerfilLocal from '../assets/images/bicho-arabe.jpg';
import imagenRecetaLocal from '../assets/images/fanta.webp';
import DrawerComentarios from '../components/DrawerComentarios';
import type { Comentario } from './DrawerComentarios'; // Importa la interfaz de comentarios
import type { Usuario } from './DrawerComentarios'; // Importa la interfaz de usuario

// interfaz para las props del componente Receta
interface PropsReceta {
    receta: {
        id: number;
        usuario: Usuario;
        tiempoPublicacion: string;
        tipoContenido: string;
        calificacion: number; // 1-3 estrellas
        urlImagen: string;
        cantidadVotos: number;
        meGusta: boolean;
        cantidadComentarios: number;
        titulo: string;
        descripcion: string;
        vistaPreviaComentarios?: Comentario[];
        isSavedInitially?: boolean;
    };
}

const Receta: React.FC<PropsReceta> = ({ receta }) => {
    // Estado local para controlar si la receta ha sido marcada como "Me gusta"
    const [liked, setLiked] = useState(receta.meGusta); // Inicialmente no le ha dado like

    // Estado local para el conteo de likes, inicializado con el valor de la prop
    const [likesCount, setLikesCount] = useState(receta.cantidadVotos);

    // Estado local para controlar si la receta ha sido guardada
    const [saved, setSaved] = useState(receta.isSavedInitially || false);

    // Estado para controlar si la descripción completa está expandida
    const [mostrarMas, setMostrarMas] = useState(false);

    // Estado para controlar el estado del drawer de comentarios
    const [drawerAbierto, setDrawerAbierto] = useState(false);

    // Límite de caracteres para la descripción truncada
    const LIMITE_CARACTERES = 100;

    // Función auxiliar para renderizar estrellas
    const renderizarEstrellas = (calificacion: number) => {
        const estrellas = [];
        for (let i = 0; i < 3; i++) {
            estrellas.push(
                <span key={i} className={`estrella ${i < calificacion ? 'rellena' : ''}`}>★</span>
            );
        }
        return estrellas;
    };

    // Función para manejar el clic en el botón de "Me gusta"
    const handleLikeClick = () => {
        if (liked) {
            setLiked(false);
            setLikesCount(prevCount => prevCount - 1);
        } else {
            setLiked(true);
            setLikesCount(prevCount => prevCount + 1);
        }
    };

    // Función para manejar el clic en el botón de "Guardar"
    const handleSaveClick = () => {
        setSaved(prevSaved => !prevSaved);
    };

    // NUEVA FUNCIÓN: Para manejar el clic en "Leer más"
    const handleToggleDescripcion = () => {
        setMostrarMas(prevMostrarMas => !prevMostrarMas);
    };

    // Determinar qué parte de la descripción mostrar
    const descripcionMostrada = mostrarMas || receta.descripcion.length <= LIMITE_CARACTERES
        ? receta.descripcion
        : `${receta.descripcion.substring(0, LIMITE_CARACTERES)}...`;

    // Determinar si el botón "Leer más" debe aparecer
    const debeMostrarBotonLeerMas = receta.descripcion.length > LIMITE_CARACTERES;


    return (
        <div className="tarjeta-receta">
            {/* Encabezado del usuario */}
            <div className="encabezado-receta">
                <div className="info-autor">
                    <img src={fotoPerfilLocal} alt="Foto de Perfil" className="foto-perfil" />
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
                <img src={imagenRecetaLocal} alt="Receta" className="imagen-receta" />
            </div>

            {/* Interacciones (Me Gusta, Comentarios, Guardar) */}
            <div className="acciones-receta">
                <div className="acciones-izquierda">
                    {/* El icono de corazón cambia según el estado 'liked' */}
                    {liked ? (
                        <FavoriteIcon className="icono-accion icono-me-gusta azul-relleno" onClick={handleLikeClick} />
                    ) : (
                        <FavoriteBorderIcon className="icono-accion icono-me-gusta azul-borde" onClick={handleLikeClick} />
                    )}
                    <span className="conteo-me-gusta">{likesCount}</span> {/* Mostramos el conteo actualizado */}

                    {/* Icono de comentario -> abre el Drawer */}
                    <ChatBubbleIcon
                    className="icono-accion icono-comentario azul-relleno"
                    onClick={() => setDrawerAbierto(true)}
                    />
                    <span className="conteo-comentarios">{receta.cantidadComentarios}</span>
                </div>
                <div className="acciones-derecha">
                    {/* El icono de guardar cambia según el estado 'saved' */}
                    {saved ? (
                        <BookmarkIcon className="icono-accion icono-guardar azul-relleno" onClick={handleSaveClick} />
                    ) : (
                        <BookmarkBorderIcon className="icono-accion icono-guardar azul-borde" onClick={handleSaveClick} />
                    )}
                </div>
            </div>

            {/* Título de la receta */}
            <div className="titulo-receta">
                <h3>{receta.titulo}</h3>
            </div>

            {/* Descripción de la receta */}
            <div className="descripcion-receta">
                <p>{descripcionMostrada}</p>
                {debeMostrarBotonLeerMas && (
                    <button onClick={handleToggleDescripcion} className="boton-leer-mas">
                        {mostrarMas ? 'Leer menos' : 'Leer más'}
                    </button>
                )}
            </div>

            {/* Vista previa de comentarios (aca iria el componente de Comentarios) */}
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