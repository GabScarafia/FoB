import React, { useState, useEffect } from 'react';
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
    };
    onDrawerToggle: (open: boolean) => void; // Función opcional para abrir el drawer desde el componente padre
}

const Receta: React.FC<PropsReceta> = ({ receta, onDrawerToggle }) => {
    const [liked, setLiked] = useState(receta.meGusta);
    const [likesCount, setLikesCount] = useState(receta.cantidadVotos);
    const [saved, setSaved] = useState(receta.isSavedInitially || false);
    const [mostrarMas, setMostrarMas] = useState(false);

    // Agregamos un nuevo estado para el contador de comentarios
    const [comentariosCount, setComentariosCount] = useState(receta.cantidadComentarios);
    
    // Función para manejar la adición de un nuevo comentario al estado local
    const handleComentarioAgregado = (nuevoComentario: Comentario) => {
        // Actualizamos el estado de los comentarios
        setComentarios([...comentarios, nuevoComentario]);
        // ¡Y también el contador!
        setComentariosCount(prevCount => prevCount + 1);
    };

    const { authData } = useAuth(); // Usamos el hook para el token

    // Se agrega el estado para manejar la lista completa de comentarios
    const [comentarios, setComentarios] = useState<Comentario[]>(receta.vistaPreviaComentarios || []);

    // Estado para controlar el estado del drawer de comentarios
    const [drawerAbierto, setDrawerAbierto] = useState(false);

    // Límite de caracteres para la descripción truncada
    const LIMITE_CARACTERES = 100;

    const renderizarEstrellas = (dificultad: string) => {
        const estrellas = [];
        if(dificultad === 'Facil'){
            for (let i = 0; i < 1; i++) {
                estrellas.push(
                    <span key={i} className={`estrella ${i < 1 ? 'rellena' : ''}`}>★</span>
                );

            }
        }
        if(dificultad === 'Medio'){
            for (let i = 0; i < 2; i++) {
                estrellas.push(
                    <span key={i} className={`estrella ${i < 2 ? 'rellena' : ''}`}>★</span>
                );

            }
        }
        if(dificultad === 'Dificil'){
            for (let i = 0; i < 3 ; i++) {
                estrellas.push(
                    <span key={i} className={`estrella ${i < 3? 'rellena' : ''}`}>★</span>
                );

            }
        }
        if(dificultad === 'Experto'){
            for (let i = 0; i < 4; i++) {
                estrellas.push(
                    <span key={i} className={`estrella ${i < 4 ? 'rellena' : ''}`}>★</span>
                );

            }
        }
        return estrellas;
    };

    const handleLikeClick = async () => {
    // Usamos el estado actual para determinar la acción (like o dislike)
    try {
        const response = await fetch(`https://localhost:7084/Recetas/LikeOrDislike/${receta.id}`, {
            method: 'POST', // Usamos POST para esta acción
            headers: {
                'Authorization': `Bearer ${authData?.token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            // La llamada a la API fue exitosa, ahora actualizamos el estado
            if (liked) {
                setLiked(false);
                setLikesCount(prevCount => prevCount - 1);
            } else {
                setLiked(true);
                setLikesCount(prevCount => prevCount + 1);
            }
        } else {
            // Manejamos el error de la API
            const errorData = await response.json();
            console.error("Error al dar like/dislike:", errorData.message);
            // Si hay un error, no actualizamos el estado local
            alert("Ocurrió un error. Intenta de nuevo."); 
        }
    } catch (error) {
        // Manejamos errores de red
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
        onDrawerToggle(true); // Notificar al padre que el drawer está abierto
    };

    const handleCloseDrawer = () => {
        setDrawerAbierto(false);
        onDrawerToggle(false); // Notificar al padre que el drawer está cerrado
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

        const opcionesFecha = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        };

        const opcionesHora = {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        };

        // Formatear la fecha a dd/mm/yyyy
        const fechaFormato = fecha.toLocaleDateString('es-ES', opcionesFecha as any);
        
        // Formatear la hora a hh:ss a. m./p. m.
        const horaFormato = fecha.toLocaleTimeString('es-ES', opcionesHora as any);

        // Unir la fecha y la hora
        return `${fechaFormato}, ${horaFormato}`;
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
                    {/* ... (código de likes y likesCount) */}
                    <ChatBubbleOutlineIcon
                        className="icono-accion icono-comentario azul-borde"
                        onClick={handleOpenDrawer}
                    />
                    {/* ¡Aquí se utiliza el nuevo estado! */}
                    <span className="conteo-comentarios">{comentariosCount}</span>

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
                {comentarios && comentarios.length > 0 ? (
                    comentarios.slice(0, 3).map((comentario, index) => (
                        <div key={comentario.id || index} className="item-comentario">
                            <ChatBubbleOutlineIcon className="icono-comentario-pequeno" />
                            <span className="autor-comentario">{comentario.usuario?.nombreUsuario }:</span> <span className="texto-comentario">{comentario.texto}</span>
                            <span className="tiempo-comentario">
                                • {formatoTiempoRelativo(comentario.fecha)}
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
                onClose={handleCloseDrawer}
                idReceta={receta.id}
                onComentarioAgregado={handleComentarioAgregado}
            />
        </div>
    );
};

export default Receta;