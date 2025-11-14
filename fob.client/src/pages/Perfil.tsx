import React, { useState, useEffect, useMemo } from 'react'; // Importar useMemo
import { useParams, Link, useNavigate } from 'react-router-dom';
import '../styles/Perfil.css';
import { useAuth } from '../context/AuthContext';
import { Box, Typography, Button, Divider } from '@mui/material';

// Íconos
import AppsIcon from '@mui/icons-material/Apps';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';

// Foto por defecto
import fotoPerfilDefault from '../assets/images/avatar.png';
import { BASE_URL } from '../apiConfig';

// --- INTERFACES (Asegúrate que contentType pueda ser null) ---
interface RecetaDto {
    id: number;
    titulo?: string;
    imagenPrincipalBase64?: string | null;
    imagen?: string | null;
    contentType: string | null; // <-- Marcado como opcional/nullable
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
    esSeguido: boolean;
}

// --- HELPERS DE MEDIA (Robustos) ---
const getMediaTypeFromContentType = (contentType: string | null | undefined): 'image' | 'video' => {
    if (contentType && contentType.startsWith('video/')) {
        return 'video';
    }
    return 'image';
};

const getNormalizedUrl = (
    mediaStr: string | undefined | null, 
    contentType: string | null | undefined, 
): string => {
    if (!mediaStr || mediaStr === '') return '';
    if (mediaStr.startsWith('data:') || mediaStr.startsWith('http')) {
        return mediaStr;
    }
    const type = contentType || 'image/jpeg'; // Fallback a imagen si no hay contentType
    return `data:${type};base64,${mediaStr}`;
}

// --- INICIO DEL COMPONENTE ---

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

    const [activeTab, setActiveTab] = useState<'imagenes' | 'videos'>('imagenes');
    const [isFollowing, setIsFollowing] = useState(false);
    const [isProcessingFollow, setIsProcessingFollow] = useState(false);

    // --- HOOK MOVIDO AQUÍ ---
    // Movemos el useMemo al inicio, junto con los otros Hooks.
    // Ahora se llamará en CADA render, cumpliendo las reglas.
    const { publicacionesImagen, publicacionesVideo } = useMemo(() => {
        if (!datosPerfil?.publicaciones) {
            return { publicacionesImagen: [], publicacionesVideo: [] };
        }

        const imagenes: RecetaDto[] = [];
        const videos: RecetaDto[] = [];

        datosPerfil.publicaciones.forEach(pub => {
            const mediaType = getMediaTypeFromContentType(pub.contentType);
            
            if (mediaType === 'video') {
                videos.push(pub);
            } else {
                imagenes.push(pub);
            }
        });

        return { publicacionesImagen: imagenes, publicacionesVideo: videos };

    }, [datosPerfil?.publicaciones]);
    // --- FIN DEL BLOQUE MOVIDO ---


    // ... (Tu useEffect de fetch no cambia) ...
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
                setIsFollowing(data.esSeguido);
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

    // ... (Tus handlers no cambian) ...
    const handleFollowClick = async () => {
        if (!datosPerfil || !currentUserId || isProcessingFollow) return;
        setIsProcessingFollow(true);
        const usuarioId = datosPerfil.id;
        const apiUrl = `${BASE_URL}/Follow/${usuarioId}`;
        const method = isFollowing ? 'DELETE' : 'POST';
        const previousIsFollowing = isFollowing;
        const newFollowerCount = isFollowing ? datosPerfil.cantidadSeguidores - 1 : datosPerfil.cantidadSeguidores + 1;
        setIsFollowing(prev => !prev);
        setDatosPerfil(prev => {
            if (!prev) return null;
            return {
                ...prev,
                cantidadSeguidores: newFollowerCount,
                esSeguido: !previousIsFollowing,
            };
        });
        try {
            const response = await fetch(apiUrl, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                alert(`Ocurrió un error al intentar ${previousIsFollowing ? 'dejar de seguir' : 'seguir'}. Se revertirá el cambio.`);
                setIsFollowing(previousIsFollowing);
                setDatosPerfil(prev => {
                    if (!prev) return null;
                    const originalCount = previousIsFollowing ? prev.cantidadSeguidores + 1 : prev.cantidadSeguidores - 1;
                    return {
                        ...prev,
                        cantidadSeguidores: originalCount,
                        esSeguido: previousIsFollowing,
                    };
                });
                throw new Error(`Error: ${response.status}`);
            }
        } catch (error) {
            console.error("Fallo al ejecutar la acción de seguir/dejar de seguir:", error);
        } finally {
            setIsProcessingFollow(false);
        }
    };

    const handleShareProfileClick = async () => {
        if (!datosPerfil) return;
        const profileUrl = `${window.location.origin}/perfil/${datosPerfil.id}`;
        const shareText = `¡Mira el perfil de @${datosPerfil.nombreUsuario} en mi app de recetas!`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Compartir Perfil',
                    text: shareText,
                    url: profileUrl,
                });
                return;
            } catch (error) {
                if (error instanceof Error && error.name !== 'AbortError') {
                    console.error('Error al usar la API de compartir:', error);
                }
            }
        }
        try {
            await navigator.clipboard.writeText(profileUrl);
            alert('¡Enlace copiado al portapapeles!');
        } catch (err) {
            console.error('Fallo al copiar el portapapeles:', err);
            alert('Fallo al copiar el enlace. Por favor, cópialo manualmente.');
        }
    };
    
    const handleEditarPerfilClick = () => {
        navigate('/editar-perfil');
    };

    // --- LÓGICA DE RENDERIZADO ---
    // Ahora los 'if' de retorno temprano pueden ir aquí,
    // después de que TODOS los hooks se hayan llamado.
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
    if (!cargando && !datosPerfil && fetchAttempted) {
        return (
            <Box className="error-perfil" sx={{ color: 'text.secondary', textAlign: 'center', mt: 4 }}>
                No se encontraron datos de perfil.
            </Box>
        );
    }
    if (!datosPerfil) {
        return null; // O un estado de 'no encontrado' si prefieres
    }

    // --- El useMemo ya no está aquí ---

    const {
        nombre,
        apellido,
        nombreUsuario,
        biografia,
        fotoPerfilBase64,
        cantidadPublicaciones,
        cantidadSeguidores,
        cantidadSeguidos,
    } = datosPerfil;

    const nombreCompletoDisplay = `${nombre || ''} ${apellido || ''}`.trim();
    const esPerfilPropio = currentUserId === datosPerfil.id;

    // ... (Tu renderGaleria no cambia) ...
    const renderGaleria = () => {
        const listaAMostrar = activeTab === 'imagenes' ? publicacionesImagen : publicacionesVideo;
        const tabName = activeTab === 'imagenes' ? 'publicaciones' : 'videos';

        if (listaAMostrar.length === 0) {
            return (
                <Typography className="sin-recetas" sx={{ color: 'text.secondary', textAlign: 'center', mt: 4 }}>
                    {esPerfilPropio 
                        ? `Aún no tienes ${tabName}.`
                        : `Este usuario no tiene ${tabName}.`
                    }
                </Typography>
            );
        }
        
        return listaAMostrar.map((receta) => {
            const imagen = receta.imagenPrincipalBase64 ?? receta.imagen ?? null;
            
            if (!imagen) {
                 return null;
            }

            const mediaUrl = getNormalizedUrl(imagen, receta.contentType);
            const mediaType = getMediaTypeFromContentType(receta.contentType);

            return (
                <div key={receta.id} className="galeria-item">
                    <Link to={`/perfil/${datosPerfil.id}/publicaciones?receta=${receta.id}`}>
                        {mediaType === 'image' ? (
                            <img
                                src={mediaUrl}
                                alt={receta.titulo ?? `Receta-${receta.id}`}
                            />
                        ) : (
                            <video
                                src={mediaUrl}
                                muted
                                playsInline
                                preload="metadata" 
                            >
                              Tu navegador no soporta videos.
                            </video>
                        )}
                    </Link>
                </div>
            );
        });
    };

    // ... (El JSX de retorno no cambia) ...
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

            <Box className="perfil-botones">
                {esPerfilPropio ? (
                    <>
                        <Button variant="contained" className="perfil-boton" onClick={handleEditarPerfilClick} sx={{ mr:1 }}>
                            Editar Perfil
                        </Button>
                        <Button variant="outlined" className="perfil-boton" onClick={handleShareProfileClick}>
                            Compartir perfil
                        </Button>
                    </>
                ) : (
                    <Box sx={{ display: 'flex', gap:1, width: '100%' }}>
                     <Button
                        variant={isFollowing ? 'outlined' : 'contained'}
                        color={isFollowing ? 'primary' : 'primary'}
                        className={`perfil-boton ${isFollowing ? 'siguiendo' : ''}`}
                        onClick={handleFollowClick}
                        disabled={!token || isProcessingFollow}
                        sx={{
                            flexGrow:1,
                            backgroundColor: !isFollowing ? 'rgb(3169176)' : 'transparent',
                            color: !isFollowing ? 'white' : undefined,
                            '&:hover': {
                                backgroundColor: isFollowing ? 'rgba(31,69,176,0.08)' : 'rgb(2455139)',
                            },
                            ...(isFollowing && {
                                borderColor: 'rgb(3169176)',
                                '&:hover': {
                                    borderColor: 'rgb(3169176)',
                                }
                            })
                        }}
                    >
                        {isFollowing ? 'Siguiendo' : 'Seguir'}
                    </Button>

                    <Button variant="outlined" className="perfil-boton" onClick={handleShareProfileClick} sx={{ minWidth:140 }}>
                        Compartir perfil
                    </Button>
                    </Box>
                )}
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box component="nav" className="perfil-navegacion">
                <Box 
                    className="perfil-navegacion-item"
                    onClick={() => setActiveTab('imagenes')}
                    sx={{
                        cursor: 'pointer',
                        borderBottom: '2px solid',
                        borderColor: activeTab === 'imagenes' ? 'primary.main' : 'transparent'
                    }}>
                    <AppsIcon 
                        className="perfil-navegacion-icono" 
                        color={activeTab === 'imagenes' ? 'primary' : 'disabled'} 
                    />
                </Box>
                <Box 
                    className="perfil-navegacion-item" 
                    onClick={() => setActiveTab('videos')}
                    sx={{ 
                        cursor: 'pointer',
                        borderBottom: '2px solid',
                        borderColor: activeTab === 'videos' ? 'primary.main' : 'transparent'
                    }}>
                    <VideoLibraryIcon 
                        className="perfil-navegacion-icono" 
                        color={activeTab === 'videos' ? 'primary' : 'disabled'} 
                    />
                </Box>
            </Box>

            <div className="perfil-galeria">
                {renderGaleria()}
            </div>
        </Box>
    );
};

export default Perfil;