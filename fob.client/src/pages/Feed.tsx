import React, { useEffect, useState } from 'react';
import Receta from '../components/Receta';
import BarraBusqueda from '../components/ui/BarraBusqueda';
import '../styles/Feed.css';

// Definimos la interfaz para los datos de una receta
interface DatosReceta {
    id: number;
    autor: string;
    tiempoPublicacion: string;
    tipoContenido: string; // Por ejemplo, 'Imagen', 'Video'
    calificacion: number; // 1-3 estrellas
    urlImagen: string;
    meGusta: number;
    cantidadComentarios: number;
    titulo: string;
    descripcion: string;
    vistaPreviaComentarios?: { autor: string; texto: string; tiempo: string; }[];
}

const Feed: React.FC = () => {
    const [recetas, setRecetas] = useState<DatosReceta[]>([]); // Almacena todas las recetas
    const [recetasFiltradas, setRecetasFiltradas] = useState<DatosReceta[]>([]); // Almacena las recetas después de aplicar el filtro
    const [cargando, setCargando] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const obtenerRecetas = async () => {
            try {
                // Simular una llamada a la API
                await new Promise(resolve => setTimeout(resolve, 500)); // Simula un retraso de red

                const recetasEjemplo: DatosReceta[] = [
                    {
                        id: 1,
                        autor: 'Tomas Sbert',
                        tiempoPublicacion: 'domingo 08:10AM',
                        tipoContenido: 'Imagen',
                        calificacion: 2,
                        urlImagen: 'https://via.placeholder.com/600x400/FF5733/FFFFFF?text=Imagen+de+Receta+1',
                        meGusta: 90,
                        cantidadComentarios: 5,
                        titulo: 'Fanta Loca',
                        descripcion: 'En un vaso de 500cc agregar hielos hasta colmar el vaso, 125cc de Fernet Branca, 300cc de Coca Cola',
                        vistaPreviaComentarios: [
                            { autor: 'Manuel Morrullo', texto: 'Invitame uno compa', tiempo: '2m, 20:43hs' },
                            { autor: 'Gabriel Scarafia', texto: 'A donde salimos hoy??', tiempo: '2m, 20:43hs' }
                        ]
                    },
                    {
                        id: 2,
                        autor: 'Matias Russo',
                        tiempoPublicacion: 'lunes 10:00AM',
                        tipoContenido: 'Imagen',
                        calificacion: 3,
                        urlImagen: 'https://via.placeholder.com/600x400/3366FF/FFFFFF?text=Imagen+de+Receta+2',
                        meGusta: 150,
                        cantidadComentarios: 10,
                        titulo: 'Fanta Loca',
                        descripcion: 'Receta de otro trago, muy refrescante para el verano. Pruebenla!',
                        vistaPreviaComentarios: []
                    }
                    // Aca se agregan mas recetas de ejemplo
                ];
                setRecetas(recetasEjemplo);
                setRecetasFiltradas(recetasEjemplo); // Al inicio, las recetas filtradas son todas las recetas
            } catch (err) {
                setError("Error al cargar las recetas.");
                console.error("Error al obtener recetas:", err);
            } finally {
                setCargando(false);
            }
        };

        obtenerRecetas();
    }, []);

    // Función que se pasa al componente BarraBusqueda para manejar la búsqueda
    const manejarBusqueda = (termino: string) => {
        if (termino.trim() === '') {
            setRecetasFiltradas(recetas); // Si el término de búsqueda está vacío, muestra todas las recetas
        } else {
            const resultados = recetas.filter(receta =>
                receta.descripcion.toLowerCase().includes(termino.toLowerCase()) ||
                receta.autor.toLowerCase().includes(termino.toLowerCase()) ||
                receta.tipoContenido.toLowerCase().includes(termino.toLowerCase()) // Ejemplo: buscar por tipo de contenido
                // Puedes añadir más campos a buscar aquí
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
                logoUrl="https://via.placeholder.com/100x30/007bff/FFFFFF?text=FOB"
            />
            <div className="feed-contenido"> {/* Contenedor para el contenido del feed (las recetas) */}
                {recetasFiltradas.length === 0 && !cargando && !error && (
                    <div className="no-resultados">No se encontraron recetas que coincidan con la búsqueda.</div>
                )}
                {recetasFiltradas.map(receta => (
                    <Receta key={receta.id} receta={receta} />
                ))}
            </div>
        </div>
    );
};

export default Feed;