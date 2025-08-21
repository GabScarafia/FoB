import React, { useEffect, useState } from 'react';
import Receta from '../components/Receta';
import BarraBusqueda from '../components/ui/BarraBusqueda';
import { useAuth } from "../context/AuthContext"; // Asegúrate de la ruta
import '../styles/Feed.css';
import type { Comentario } from 'components/DrawerComentarios';

// Definimos la interfaz para los datos de una receta
interface DatosReceta {
    id: number;
    autor: Usuario;
    tiempoPublicacion: string;
    tipoContenido: string; // Por ejemplo, 'Imagen', 'Video'
    calificacion: number; // 1-3 estrellas
    imagen: string; 
    cantidadVotos: number;
    meGusta: boolean;
    cantidadComentarios: number;
    titulo: string;
    descripcion: string;
    //vistaPreviaComentarios?: { autor: Usuario; texto: string; tiempo: string; }[];
    vistaPreviaComentarios?:Comentario[];
}

export interface Usuario {
    nombreUsuario: string;
    texto: string;
    tiempo: string;    
    imagen: string; 
}
const Feed: React.FC = () => {
    const [recetas, setRecetas] = useState<DatosReceta[]>([]); // Almacena todas las recetas
    const [recetasFiltradas, setRecetasFiltradas] = useState<DatosReceta[]>([]); // Almacena las recetas despu�s de aplicar el filtro
    const [cargando, setCargando] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { authData } = useAuth(); // Lee el email del contexto
    const token = authData?.token;
    console.log(token);

    useEffect(() => {
        const obtenerRecetas = async () => {
            try {
                // Realizar la llamada a la API
                // ...dentro de la función obtenerRecetas
                const response = await fetch('https://localhost:7084/Recetas/Feed?pageSize=1', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json' // Opcional, dependiendo de los requerimientos de la API
                    }
                });
                console.log(response.headers)
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                // Parsear la respuesta JSON
                const datosRecetas: DatosReceta[] = await response.json();

                //datosRecetas.forEach(x=>x.urlImagen ='https://via.placeholder.com/600x400/FF5733/FFFFFF?text=Imagen+de+Receta+1')
                // Actualizar los estados con los datos de la API
                setRecetas(datosRecetas);
                setRecetasFiltradas(datosRecetas);
            } catch (err) {
                setError("Error al cargar las recetas. Por favor, intente de nuevo más tarde.");
                console.error("Error al obtener recetas:", err);
            } finally {
                setCargando(false);
            }
            // try {
            //     // Simular una llamada a la API
            //     await new Promise(resolve => setTimeout(resolve, 500)); // Simula un retraso de red

            //     const recetasEjemplo: DatosReceta[] = [
            //         {
            //             id: 1,
            //             autor: 'Tomas Sbert',
            //             tiempoPublicacion: 'domingo 08:10AM',
            //             tipoContenido: 'Imagen',
            //             calificacion: 2,
            //             urlImagen: 'https://via.placeholder.com/600x400/FF5733/FFFFFF?text=Imagen+de+Receta+1',
            //             meGusta: 90,
            //             cantidadComentarios: 5,
            //             titulo: 'Fanta Loca',
            //             descripcion: 'En un vaso de 500cc agregar hielos hasta colmar el vaso, 125cc de Fernet Branca, 300cc de Coca Cola',
            //             vistaPreviaComentarios: [
            //                 { autor: 'Manuel Morrullo', texto: 'Invitame uno compa', tiempo: '2m, 20:43hs' },
            //                 { autor: 'Gabriel Scarafia', texto: 'A donde salimos hoy??', tiempo: '2m, 20:43hs' }
            //             ]
            //         },
            //         {
            //             id: 2,
            //             autor: 'Matias Russo',
            //             tiempoPublicacion: 'lunes 10:00AM',
            //             tipoContenido: 'Imagen',
            //             calificacion: 3,
            //             urlImagen: 'https://via.placeholder.com/600x400/3366FF/FFFFFF?text=Imagen+de+Receta+2',
            //             meGusta: 150,
            //             cantidadComentarios: 10,
            //             titulo: 'Fanta Loca',
            //             descripcion: 'Receta de otro trago, muy refrescante para el verano. Pruebenla!',
            //             vistaPreviaComentarios: []
            //         }
            //         // Aca se agregan mas recetas de ejemplo
            //     ];
            //     setRecetas(recetasEjemplo);
            //     setRecetasFiltradas(recetasEjemplo); // Al inicio, las recetas filtradas son todas las recetas
            // } catch (err) {
            //     setError("Error al cargar las recetas.");
            //     console.error("Error al obtener recetas:", err);
            // } finally {
            //     setCargando(false);
            // }
        };

        obtenerRecetas();
    }, []);

    // Funci�n que se pasa al componente BarraBusqueda para manejar la b�squeda
    const manejarBusqueda = (termino: string) => {
        if (termino.trim() === '') {
            setRecetasFiltradas(recetas); // Si el t�rmino de b�squeda est� vac�o, muestra todas las recetas
        } else {
            const resultados = recetas.filter(receta =>
                receta.descripcion.toLowerCase().includes(termino.toLowerCase()) ||
                receta.autor?.nombreUsuario.includes(termino.toLowerCase()) ||
                receta.tipoContenido.toLowerCase().includes(termino.toLowerCase()) // Ejemplo: buscar por tipo de contenido
                // Puedes a�adir m�s campos a buscar aqu�
            );
            setRecetasFiltradas(resultados);
        }
    };

    if (cargando) {
        return <div className="feed-cargando">Cargando feed...</div>;
    }

    if (error) {
        return <div className="feed-error">{error}</div>;
    }

    return (
        <div className="feed-contenedor-principal"> {/* contenedor principal para incluir la barra y el contenido */}
            <BarraBusqueda
                onSearch={manejarBusqueda}
                //logoUrl="https://via.placeholder.com/100x30/007bff/FFFFFF?text=FOB"
            />
            <div className="feed-contenido"> {/* Contenedor para el contenido del feed (las recetas) */}
                {recetasFiltradas.length === 0 && !cargando && !error && (
                    <div className="no-resultados">No se encontraron recetas que coincidan con la b�squeda.</div>
                )}
                {recetasFiltradas.map(receta => (
                    <Receta
                        key={receta.id}
                        receta={{
                            ...receta,
                            autor: receta.autor,
                            vistaPreviaComentarios: receta.vistaPreviaComentarios?.map((comentario, idx) => ({
                                id: idx,
                                autor: comentario.autor,
                                texto: comentario.texto,
                                hora: comentario.hora, // mantenemos como string
                                imagen: '', // puedes agregar URL si la tienes
                            }))
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

export default Feed;