import React, { useEffect, useState } from 'react';
import Receta from '../components/Receta';
import BarraBusqueda from '../components/ui/BarraBusqueda';
import { useAuth } from "../context/AuthContext";
import '../styles/Feed.css';
import type { Comentario } from 'components/DrawerComentarios';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import NewspaperOutlinedIcon from '@mui/icons-material/NewspaperOutlined';
import { Modal, Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface DatosReceta {
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
    tiempoPreparacion: string;
    ingredientes: Array<{ id: number; nombre: string; cantidad: number; unidadDeMedida: string; }>;
    categorias: Array<any>;
    pasos: Array<any>;
}

export interface Usuario {
    id: number;
    nombre: string;
    apellido: string;
    nombreUsuario: string;
    texto?: string;
    tiempo?: string;
    imagen?: string;
    isFollowing: boolean;
}

interface FeedProps {
    onDrawerToggle: (isOpen: boolean) => void;
}



const Feed: React.FC<FeedProps> = ({ onDrawerToggle }) => {
    const [recetas, setRecetas] = useState<DatosReceta[]>([]);
    const [recetasFiltradas, setRecetasFiltradas] = useState<DatosReceta[]>([]);
    const [usuariosFiltrados, setUsuariosFiltrados] = useState<Usuario[]>([]);
    const [cargando, setCargando] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [mensaje, setMensaje] = useState<string | null>(null);
    const { authData } = useAuth();
    const token = authData?.token;
    const currentUserId = authData?.id;
    const navigate = useNavigate();

    // Estados para el modal de confirmación
    const [modalOpen, setModalOpen] = useState(false);
    const [recetaAEliminarId, setRecetaAEliminarId] = useState<number | null>(null);

    useEffect(() => {
        if (!token) {
            setCargando(false);
            return;
        }

        const obtenerRecetas = async () => {
            try {
                const response = await fetch('https://localhost:7084/Recetas/Feed?pageSize=1', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                setMensaje(data.mensaje);
                const recetasObtenidas: DatosReceta[] = data.recetas;

                setRecetas(recetasObtenidas);
                setRecetasFiltradas(recetasObtenidas);
            } catch (err) {
                setError("Error al cargar las recetas. Por favor, intente de nuevo más tarde.");
                console.error("Error al obtener recetas:", err);
            } finally {
                setCargando(false);
            }
        };

        obtenerRecetas();
    }, [token]);

    // función para manejar la eliminación de recetas
    const handleDeleteReceta = async (recetaId: number) => {
        if (!token) {
            console.error("No hay token de autenticación para eliminar la receta.");
            return;
        }

        try {
            const response = await fetch(`https://localhost:7084/Recetas/${recetaId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.status === 204) {
                setRecetas(prevRecetas => prevRecetas.filter(receta => receta.id !== recetaId));
                setRecetasFiltradas(prevRecetas => prevRecetas.filter(receta => receta.id !== recetaId));
                console.log(`Receta con ID ${recetaId} eliminada exitosamente.`);
            } else {
                const errorData = await response.json();
                throw new Error(`Error al eliminar la receta: ${response.statusText} - ${JSON.stringify(errorData)}`);
            }
        } catch (error) {
            console.error('Error al eliminar la receta:', error);
            alert('Error al eliminar la receta. Por favor, inténtelo de nuevo.');
        } finally {
            handleCloseModal();
        }
    };

    // Manejadores del modal
    const handleOpenModal = async (recetaId: number) => {
        setRecetaAEliminarId(recetaId);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setRecetaAEliminarId(null);
    };

    const handleConfirmDelete = () => {
        if (recetaAEliminarId !== null) {
            handleDeleteReceta(recetaAEliminarId);
        }
    };

    const manejarBusqueda = async (termino: string) => {
        if (!token) {
            console.error("No hay token de autenticación para la búsqueda.");
            return;
        }

        if (termino.trim() === '') {
            setRecetasFiltradas(recetas);
            setUsuariosFiltrados([]);
            return;
        }

        const resultadosRecetas = recetas.filter(receta =>
            receta.descripcion.toLowerCase().includes(termino.toLowerCase()) ||
            receta.autor?.nombreUsuario.toLowerCase().includes(termino.toLowerCase()) ||
            receta.titulo.toLowerCase().includes(termino.toLowerCase())
        );
        setRecetasFiltradas(resultadosRecetas);

        try {
            const response = await fetch(`https://localhost:7084/Busqueda/usuarios?termino=${termino}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                let usuariosObtenidos: Usuario[] = await response.json();
                setUsuariosFiltrados(usuariosObtenidos);
            } else {
                try {
                    const errorData = await response.json();
                    console.error("Error al buscar usuarios:", errorData.message);
                } catch {
                    const errorText = await response.text();
                    console.error("Error al buscar usuarios:", errorText);
                }
                setUsuariosFiltrados([]);
            }
        } catch (error) {
            setUsuariosFiltrados([]);
            console.error("Error de red al buscar usuarios:", error);
        }
    };

    const manejarSeguirUsuario = async (followedId: number, isCurrentlyFollowing: boolean) => {
        if (!token) {
            console.error("No hay token de autenticación.");
            return;
        }

        const method = isCurrentlyFollowing ? 'DELETE' : 'POST';
        try {
            const response = await fetch(`https://localhost:7084/Follow/${followedId}`, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                try {
                    const successData = await response.json();
                    console.log(successData.message);
                } catch {
                    console.log(`Usuario ${isCurrentlyFollowing ? 'dejado de seguir' : 'seguido'} exitosamente.`);
                }
                setUsuariosFiltrados(prevUsuarios =>
                    prevUsuarios.map(u =>
                        u.id === followedId ? { ...u, isFollowing: !isCurrentlyFollowing } : u
                    )
                );
            } else {
                try {
                    const errorData = await response.json();
                    console.error(`Error al ${isCurrentlyFollowing ? 'dejar de seguir' : 'seguir'} al usuario:`, errorData.message);
                } catch {
                    const errorText = await response.text();
                    console.error(`Error al ${isCurrentlyFollowing ? 'dejar de seguir' : 'seguir'} al usuario:`, errorText);
                }
            }
        } catch (error) {
            console.error('Error de red al seguir/dejar de seguir:', error);
        }
    };

    // Nueva función para navegación al perfil
    const handleUsuarioClick = (userId: number) => {
        navigate(`/perfil/${userId}`);
    };

    if (cargando) {
        return <div className="feed-cargando">Cargando feed...</div>;
    }

    if (error) {
        return <div className="feed-error">{error}</div>;
    }

    return (
        <div className="feed-contenedor-principal">
            <BarraBusqueda
                onSearch={manejarBusqueda}
                usuarios={usuariosFiltrados}
                onFollow={manejarSeguirUsuario}
                currentUserId={currentUserId ?? null}
                onUsuarioClick={handleUsuarioClick}
            />
            <div className="feed-contenido">
                {recetasFiltradas.length === 0 && usuariosFiltrados.length === 0 && mensaje && (
                    <div className="mensaje-feed">
                        {mensaje.includes('Sigue a gente') && (
                            <PersonAddOutlinedIcon style={{ fontSize: 50, color: '#0b2553' }} />
                        )}
                        {mensaje.includes('No hay publicaciones') && (
                            <NewspaperOutlinedIcon style={{ fontSize: 50, color: '#0b2553' }} />
                        )}
                        <p>{mensaje}</p>
                    </div>
                )}
                {recetasFiltradas.length === 0 && usuariosFiltrados.length === 0 && !mensaje && !cargando && !error && (
                    <div className="no-resultados">No se encontraron recetas ni usuarios que coincidan con la búsqueda.</div>
                )}

                {recetasFiltradas.map(receta => {
                    const categoriasFormateadas = (receta.categorias || []).map(cat => {
                        if (typeof cat === 'object' && cat !== null && 'nombre' in cat) {
                            return cat.nombre;
                        }
                        return cat;
                    });

                    return (
                        <Receta
                            key={receta.id}
                            receta={{
                                ...receta,
                                categorias: categoriasFormateadas
                            }}
                            onDrawerToggle={onDrawerToggle}
                            currentUserId={currentUserId ?? null}
                            onDeleteReceta={handleOpenModal}
                            onUsuarioClick={handleUsuarioClick}
                        />
                    );
                })}
            </div>

            {/* Modal de confirmación de eliminación */}
            <Modal
                open={modalOpen}
                onClose={handleCloseModal}
                aria-labelledby="modal-eliminar-receta"
            >
                <Box className="modal-contenedor">   
                    <Typography id="modal-eliminar-receta" className="modal-titulo" component="h2">
                        Confirmar eliminación
                    </Typography>  
                    <Typography className="modal-descripcion" sx={{ mt: 2 }}>
                        ¿Estás seguro de que quieres eliminar esta receta? Esta acción no se puede deshacer.
                    </Typography>
                    <Box className="modal-acciones" sx={{ mt: 3 }}>
                        <Button onClick={handleCloseModal} variant="outlined" className="modal-btn-cancelar">
                            Cancelar
                        </Button>
                        <Button onClick={handleConfirmDelete} variant="contained" className="modal-btn-eliminar">
                            Eliminar
                        </Button>
                    </Box>
                </Box>
            </Modal>
        </div>
    );
};

export default Feed;