import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import Receta from '../components/Receta';
import { useAuth } from '../context/AuthContext';
import '../styles/PublicacionScrollablePage.css';
import type { PropsReceta } from '../components/Receta';

// Importaciones de Material-UI para el modal y la navegación
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';


interface RecetaDto {
    id: number;
    titulo?: string;
    imagenPrincipalBase64?: string | null;
    imagen?: string | null;
}

interface RecetaCompleta extends RecetaDto {
    autor: {
        Id: number;
        Nombre: string;
        NombreUsuario: string;
        Apellido: string | null;
        Imagen: string | null;
    };
    fechaCreacion: string;
    tipoContenido: string;
    dificultad: string;
    imagen: string;
    cantidadVotos: number;
    meGusta: boolean;
    cantidadComentarios: number;
    titulo: string;
    descripcion: string;
    vistaPreviaComentarios?: any[];
    isSavedInitially?: boolean;
    tiempoPreparacion: string;
    ingredientes: any[];
    etiquetas: string[];
    pasos: any[];
}

interface PublicacionScrollablePageProps {
    onDrawerToggle: PropsReceta['onDrawerToggle'];
    currentUserId: PropsReceta['currentUserId'];
    onDeleteReceta: PropsReceta['onDeleteReceta'];
}

const PublicacionScrollablePage: React.FC<PublicacionScrollablePageProps> = ({
    onDrawerToggle,
    currentUserId,
}) => {
    const { id: perfilId } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const recetaIdInicial = searchParams.get('receta');

    const { authData } = useAuth();
    const token = authData?.token ?? null;

    const [publicaciones, setPublicaciones] = useState<RecetaDto[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [recetasCargadas, setRecetasCargadas] = useState<Map<number, RecetaCompleta>>(new Map());
    const recetasCargadasRef = useRef(recetasCargadas);

    // ESTADOS PARA EL MODAL DE CONFIRMACIÓN
    const [modalAbierto, setModalAbierto] = useState(false);
    const [recetaIdAEliminar, setRecetaIdAEliminar] = useState<number | null>(null);

    // Lógica para abrir y cerrar el modal
    const handleOpenModal = async (recetaId: number) => {
        setRecetaIdAEliminar(recetaId);
        setModalAbierto(true);
    };

    const handleCloseModal = () => {
        setModalAbierto(false);
        setRecetaIdAEliminar(null);
    };



    // FUNCIÓN DE ELIMINACIÓN
    const confirmarEliminacion = async () => {
        if (!recetaIdAEliminar || !token) {
            console.error("No se puede eliminar la receta: ID o token faltante.");
            handleCloseModal();
            return;
        }

        try {
            const response = await fetch(`https://localhost:7084/Recetas/${recetaIdAEliminar}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setPublicaciones(prevPublicaciones =>
                    prevPublicaciones.filter(pub => pub.id !== recetaIdAEliminar)
                );
                console.log(`Receta con ID ${recetaIdAEliminar} eliminada exitosamente.`);
            } else {
                console.error(`Error al eliminar la receta: ${response.statusText}`);
            }
        } catch (error) {
            console.error("Error en la llamada de API para eliminar la receta:", error);
        } finally {
            handleCloseModal();
        }
    };

    // Sincroniza el ref con el estado
    useEffect(() => {
        recetasCargadasRef.current = recetasCargadas;
    }, [recetasCargadas]);

    // Función para obtener los detalles completos de una receta
    const fetchRecetaDetalle = async (recetaId: number) => {
        if (!recetaId) return null;
        if (recetasCargadasRef.current.has(recetaId)) {
            return recetasCargadasRef.current.get(recetaId);
        }

        try {
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`https://localhost:7084/Recetas/${recetaId}`, { headers });
            if (!res.ok) {
                console.error(`Error al cargar receta ${recetaId}: ${res.statusText}`);
                return null;
            }

            const data: RecetaCompleta = await res.json();
            data.imagen = data.imagen ?? data.imagenPrincipalBase64 ?? null;
            return data;
        } catch (err) {
            console.error('Error fetching receta detalle:', err);
            return null;
        }
    };

    // Función para actualizar el mapa de recetas
    const aplicarDetalleEnMap = (recetaId: number, detalle: RecetaCompleta) => {
        setRecetasCargadas(prev => {
            const newMap = new Map(prev);
            newMap.set(recetaId, detalle);
            return newMap;
        });
    };

    // 1. Carga inicial de todas las publicaciones del usuario (vista previa)
    useEffect(() => {
        const fetchPublicaciones = async () => {
            if (!perfilId) {
                setError('ID de perfil no proporcionado.');
                setCargando(false);
                return;
            }
            setCargando(true);
            try {
                const headers: Record<string, string> = {};
                if (token) headers['Authorization'] = `Bearer ${token}`;
                const response = await fetch(`https://localhost:7084/Usuario/${perfilId}`, { headers });

                if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
                const data = await response.json();

                const publicacionesPrevias: RecetaDto[] = data.publicaciones.map((p: any) => ({
                    ...p,
                    imagen: p.imagenPrincipalBase64 ?? p.imagen ?? null,
                }));
                setPublicaciones(publicacionesPrevias);
            } catch (err) {
                console.error('Error al cargar publicaciones:', err);
                setError('Error al cargar las publicaciones.');
            } finally {
                setCargando(false);
            }
        };

        fetchPublicaciones();
    }, [perfilId, token]);

    // 2. Lógica para precargar y manejar el scroll
    useEffect(() => {
        if (!scrollRef.current || publicaciones.length === 0) return;

        let mounted = true;
        const initialElementId = `receta-${recetaIdInicial}`;
        const initialElement = document.getElementById(initialElementId);

        if (initialElement) {
            initialElement.scrollIntoView({ behavior: 'auto' });
        }

        const options = { root: null, rootMargin: '200px', threshold: 0.1 };
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = Number(entry.target.id.replace('receta-', ''));
                    if (!recetasCargadasRef.current.has(id)) {
                        fetchRecetaDetalle(id).then(detalle => {
                            if (mounted && detalle) {
                                aplicarDetalleEnMap(id, detalle);
                            }
                        });
                    }
                }
            });
        }, options);

        const elementos = scrollRef.current.querySelectorAll('.tarjeta-receta-completa');
        elementos.forEach(el => observer.observe(el));

        if (recetaIdInicial) {
            fetchRecetaDetalle(Number(recetaIdInicial)).then(detalle => {
                if (mounted && detalle) {
                    aplicarDetalleEnMap(Number(recetaIdInicial), detalle);
                }
            });
        }

        return () => {
            mounted = false;
            observer.disconnect();
        };
    }, [publicaciones, recetaIdInicial, token]);

    if (cargando) return <div className="loading-message">Cargando publicaciones...</div>;
    if (error) return <div className="error-message">{error}</div>;
    if (publicaciones.length === 0) return <div className="no-data-message">No hay publicaciones para mostrar.</div>;

    return (
        <div className="publicacion-scrollable-page" ref={scrollRef}>
            {publicaciones.map(receta => {
                const recetaDetalle = recetasCargadas.get(receta.id);
                return (
                    <div key={receta.id} id={`receta-${receta.id}`} className="tarjeta-receta-completa">
                        {recetaDetalle ? (
                            <Receta
                                receta={recetaDetalle}
                                onDrawerToggle={onDrawerToggle}
                                currentUserId={currentUserId}
                                onDeleteReceta={handleOpenModal}
                            />
                        ) : (
                            <div className="loading-placeholder">
                                <img
                                    src={`data:image/jpeg;base64,${receta.imagen ?? ''}`}
                                    alt={receta.titulo ?? `Receta-${receta.id}`}
                                />
                                <p>Cargando detalles...</p>
                            </div>
                        )}
                    </div>
                );
            })}

            {/* MODAL DE CONFIRMACIÓN */}
            <Modal
                open={modalAbierto}
                onClose={handleCloseModal}
                aria-labelledby="modal-title"
                aria-describedby="modal-description"
            >
                <Box sx={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    width: 400, bgcolor: 'background.paper', boxShadow: 24, p: 4, borderRadius: '8px'
                }}>
                    <Typography id="modal-title" variant="h6" component="h2" sx={{ textAlign: 'center' }}>
                        ¿Estás seguro de que quieres eliminar esta receta?
                    </Typography>
                    <Typography id="modal-description" sx={{ mt: 2, textAlign: 'center' }}>
                        Esta acción no se puede deshacer.
                    </Typography>
                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: '16px' }}>
                        <Button variant="outlined" onClick={handleCloseModal}>
                            Cancelar
                        </Button>
                        <Button variant="contained" color="error" onClick={confirmarEliminacion}>
                            Eliminar
                        </Button>
                    </Box>
                </Box>
            </Modal>

           
        </div>
    );
};

export default PublicacionScrollablePage;