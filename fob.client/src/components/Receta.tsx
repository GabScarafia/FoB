import React, { useState } from 'react';
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
import type { Comentario } from './DrawerComentarios';
import type { Usuario } from '../pages/Feed';

interface Ingrediente {
    id: number;
    nombre: string;
    cantidad: number;
    unidadDeMedida: string;
}

interface PropsReceta {
    receta: {
        id: number;
        autor: Usuario;
        fechaCreacion: string;
        tipoContenido: string;
        calificacion: number;
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
    };
}

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

    // Función para formatear el tiempo
    const formatearTiempo = (tiempo: string): string => {
        const partes = tiempo.split(':').map(part => parseInt(part, 10));
        const horas = partes[0];
        const minutos = partes[1];
        const segundos = partes[2];
        const resultado: string[] = [];

        if (horas > 0) {
            resultado.push(`${horas} hora${horas > 1 ? 's' : ''}`);
        }
        if (minutos > 0) {
            resultado.push(`${minutos} minuto${minutos > 1 ? 's' : ''}`);
        }
        if (segundos > 0) {
            resultado.push(`${segundos} segundo${segundos > 1 ? 's' : ''}`);
        }

        if (resultado.length === 0) {
            return 'Menos de 1 minuto';
        }

        return resultado.join(' ');
    };

    // Función para formatear la fecha de creación y la hora
    const formatearFecha = (fechaString: string): string => {
        const fecha = new Date(fechaString);
        const opciones = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true // opción para el formato AM/PM
        };
        // Formatear la fecha a un formato legible
        return fecha.toLocaleDateString('es-ES', opciones as any);
    };

    // Almacena el tiempo formateado en una variable para usarlo en el JSX
    const tiempoFormateado = formatearTiempo(receta.tiempoPreparacion);
    // Formatea la fecha de creación para su visualización
    const fechaFormateada = formatearFecha(receta.fechaCreacion);

    return (
        <div className="tarjeta-receta">
            {/* Encabezado del usuario */}
            <div className="encabezado-receta">
                <div className="info-autor">
                    <img src={fotoPerfilUrl} alt="Foto de Perfil" className="foto-perfil" />
                    <div>
                        <div className="nombre-autor">{receta.autor?.nombreUsuario}</div>
                        <div className="tiempo-publicacion">Publicado el {fechaFormateada}</div>
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
                    <ChatBubbleOutlineIcon
                        className="icono-accion icono-comentario azul-borde"
                        onClick={() => setDrawerAbierto(true)}
                    />
                    <span className="conteo-comentarios">{receta.cantidadComentarios}</span>

                    {/* Icono de reloj y tiempo de preparación */}
                    <AccessTimeIcon className="icono-accion icono-tiempo azul-relleno" />
                    <span className="conteo-tiempo">{tiempoFormateado}</span>
                </div>
                <div className="acciones-derecha">
                    {saved ? (
                        // Si está guardado, muestra la estrella rellena
                        <StarIcon className="icono-accion icono-guardar azul-relleno" onClick={handleSaveClick} />
                    ) : (
                        // Si no está guardado, muestra la estrella sin relleno
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
                                {index < receta.categorias.length - 1 ? ', ' : ''}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Vista previa de comentarios */}
            <div className="vista-previa-comentarios">
                {receta.vistaPreviaComentarios && receta.vistaPreviaComentarios.length > 0 ? (
                    receta.vistaPreviaComentarios.map((comentario, index) => (
                        // Se utiliza el 'id' del comentario si está disponible, sino se usa el índice
                        <div key={comentario.id || index} className="item-comentario">
                            <ChatBubbleOutlineIcon className="icono-comentario-pequeno" />
                            <span className="autor-comentario">{comentario.autor?.nombreUsuario}:</span> <span className="texto-comentario">{comentario.texto}</span>
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