import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import '../styles/Perfil.css';
import { useAuth } from '../context/AuthContext';
import { Box, Typography, Button, Divider } from '@mui/material';

// Íconos de Material UI
import AppsIcon from '@mui/icons-material/Apps';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';

// Foto por defecto
import fotoPerfilDefault from '../assets/images/avatar.png';
import { BASE_URL } from '../apiConfig';

interface RecetaDto {
    id: number;
    titulo?: string;
    imagenPrincipalBase64?: string | null;
    imagen?: string | null;
}

interface UsuarioPerfilDto {
    id: number;
    nombre: string | null;
    apellido: string | null;
    email: string | null;
    nombreUsuario: string | null;
    biografia: string | null;
    fotoPerfilBase64: string | null;
    cantidadPublicaciones: number;
    cantidadSeguidores: number;
    cantidadSeguidos: number;
    publicaciones: RecetaDto[];
}

const Perfil: React.FC = () => {
    const { id } = useParams<{ id?: string }>();
    const { authData } = useAuth();
    const token = authData?.token ?? null;
    const currentUserId = authData?.id ?? null;

    const [datosPerfil, setDatosPerfil] = useState<UsuarioPerfilDto | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fetchAttempted, setFetchAttempted] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (id === undefined && currentUserId == null) return;

        const perfilId = id ? Number(id) : currentUserId;

        if (!perfilId) {
            setError('Debes iniciar sesión para ver tu perfil.');
            setDatosPerfil(null);
            setCargando(false);
            setFetchAttempted(true);
            return;
        }

        const controller = new AbortController();
        const signal = controller.signal;
        let isMounted = true;

        const fetchDatosPerfil = async () => {
            setFetchAttempted(true);
            setCargando(true);
            setError(null);

            try {
                const headers: Record<string, string> = {};
                if (token) headers['Authorization'] = `Bearer ${token}`;

                const response = await fetch(`${BASE_URL}/Usuario/${perfilId}`, {
                    headers,
                    signal,
                });

                if (!isMounted) return;

                if (response.status === 401) {
                    setError('La sesión ha expirado o el token no es válido.');
                    setDatosPerfil(null);
                    return;
                }

                if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

                const data: UsuarioPerfilDto = await response.json();
                if (!isMounted) return;
                setDatosPerfil(data);
            } catch (err: any) {
                if (err?.name === 'AbortError') return;

                console.error('Error al cargar el perfil:', err);
                if (!isMounted) return;
                setError('Ocurrió un error al cargar tu perfil.');
                setDatosPerfil(null);
            } finally {
                if (!isMounted) return;
                setCargando(false);
            }
        };

        fetchDatosPerfil();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [id, token, currentUserId]);

    // Renderizado según estado
    if (cargando) {
        return <Box className="cargando-perfil" sx={{ color: 'text.secondary' }}>Cargando perfil...</Box>;
    }

    if (error) {
        return (
            <Box className="error-perfil" sx={{ color: 'error.main', textAlign: 'center', mt: 4 }}>
                <Typography variant="h6">Error</Typography>
                <Typography>{error}</Typography>
            </Box>
        );
    }

    // Solo mostramos "No se encontraron..." si ya intentamos hacer el fetch
    if (!cargando && !datosPerfil && fetchAttempted) {
        return (
            <Box className="error-perfil" sx={{ color: 'text.secondary', textAlign: 'center', mt: 4 }}>
                No se encontraron datos de perfil.
            </Box>
        );
    }

    if (!datosPerfil) {
        return null;
    }

    const {
        nombre,
        apellido,
        nombreUsuario,
        biografia,
        fotoPerfilBase64,
        cantidadPublicaciones,
        cantidadSeguidores,
        cantidadSeguidos,
        publicaciones
    } = datosPerfil;

    const nombreCompletoDisplay = `${nombre || ''} ${apellido || ''}`.trim();
    

    const handleEditarPerfilClick = () => {
        navigate('/editar-perfil');
    };


    const tienePublicaciones = publicaciones && publicaciones.length > 0;
    const esPerfilPropio = currentUserId === datosPerfil.id;

    const renderGaleria = () => {
        if (!tienePublicaciones) {
            // Si es el propio perfil, el texto puede ser diferente; acá dejo el original
            return (
                <Typography className="sin-recetas" sx={{ color: 'text.secondary', textAlign: 'center', mt: 4 }}>
                    Aún no has publicado ninguna receta.
                </Typography>
            );
        }
        return publicaciones.map((receta) => {
            const imagen = receta.imagenPrincipalBase64 ?? receta.imagen ?? null;
            if (!imagen) return null;
            return (
                <div key={receta.id} className="galeria-item">
                    <Link to={`/perfil/${datosPerfil.id}/publicaciones?receta=${receta.id}`}>
                        <img
                            src={`data:image/jpeg;base64,${imagen}`}
                            alt={receta.titulo ?? `Receta-${receta.id}`}
                        />
                    </Link>
                </div>
            );
        });
    };

    return (
        <Box className="perfil-contenedor">
            <Box component="header" className="perfil-header">
                <div className="perfil-imagen-circular">
                    <img
                        src={fotoPerfilBase64 ? `data:image/jpeg;base64,${fotoPerfilBase64}` : fotoPerfilDefault}
                        alt="Foto de perfil"
                    />
                </div>
                <Box className="perfil-info-principal">
                    <Box className="perfil-stats">
                        <span>
                            <Typography component="span" className="perfil-stats-label" color="text.secondary">Publicaciones</Typography>
                            <Typography component="span" className="perfil-stats-numero" fontWeight="bold">{cantidadPublicaciones}</Typography>
                        </span>
                        <span>
                            <Typography component="span" className="perfil-stats-label" color="text.secondary">Seguidores</Typography>
                            <Typography component="span" className="perfil-stats-numero" fontWeight="bold">{cantidadSeguidores}</Typography>
                        </span>
                        <span>
                            <Typography component="span" className="perfil-stats-label" color="text.secondary">Seguidos</Typography>
                            <Typography component="span" className="perfil-stats-numero" fontWeight="bold">{cantidadSeguidos}</Typography>
                        </span>
                    </Box>
                    <Box className="perfil-info">
                        <Typography variant="h6" className="perfil-nombre-usuario">@{nombreUsuario}</Typography>
                        
                        <Typography variant="body1" className="perfil-nombre-completo" fontWeight="bold">{nombreCompletoDisplay}</Typography>
                        
                        <Typography variant="body2" className="perfil-bio" color="text.secondary">{biografia}</Typography>
                    </Box>
                </Box>
            </Box>

            {esPerfilPropio && (
                <Box className="perfil-botones">
                    <Button variant="contained" className="perfil-boton" onClick={handleEditarPerfilClick}>Editar Perfil</Button>
                    <Button variant="outlined" className="perfil-boton">Compartir perfil</Button>
                </Box>
            )}

            <Divider sx={{ my: 2 }} />

            <Box component="nav" className="perfil-navegacion">
                <Box className="perfil-navegacion-item" sx={{ 
                    cursor: 'pointer', 
                    borderBottom: '2px solid', 
                    borderColor: 'primary.main' 
                }}>
                    <AppsIcon className="perfil-navegacion-icono" color="primary" />
                </Box>
                <Box className="perfil-navegacion-item" sx={{ cursor: 'pointer' }}>
                    <VideoLibraryIcon className="perfil-navegacion-icono" sx={{ color: 'text.secondary' }} />
                </Box>
            </Box>

            <div className="perfil-galeria">
                {renderGaleria()}
            </div>
        </Box>
    );
};

export default Perfil;