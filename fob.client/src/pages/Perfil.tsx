import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import '../styles/Perfil.css';
import { useAuth } from '../context/AuthContext';
import { Box, Typography, Button, Divider } from '@mui/material';

// Íconos
import AppsIcon from '@mui/icons-material/Apps';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import StarIcon from '@mui/icons-material/Star';

// Foto por defecto
import fotoPerfilDefault from '../assets/images/avatar.png';
import { BASE_URL } from '../apiConfig';

// --- INTERFACES ---
interface AutorDto {
    id: number;
    nombreUsuario: string;
    nombre: string | null;
    apellido: string | null;
    imagenUrl?: string | null; 
}

interface RecetaDto {
    id: number;
    titulo?: string;
    imagenPrincipalUrl?: string | null; 
    imagenUrl?: string | null; 
    contentType?: string | null;
    autor?: AutorDto;
}

interface UsuarioPerfilDto {
    id: number;
    nombre: string | null;
    apellido: string | null;
    email: string | null;
    nombreUsuario: string | null;
    biografia: string | null;
    fotoPerfilUrl?: string | null;
    cantidadPublicaciones: number;
    cantidadSeguidores: number;
    cantidadSeguidos: number;
    publicaciones: RecetaDto[];
    esSeguido: boolean;
}

// --- HELPERS ---
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
    // Si es ruta relativa
    if (mediaStr.startsWith('/')) return `${BASE_URL}${mediaStr}`;
    
    const type = contentType || 'image/jpeg';
    return `data:${type};base64,${mediaStr}`;
}

// --- COMPONENTE INTELIGENTE PARA LA GALERIA ---
// Este es el único agregado importante: detecta si la imagen falla y pone video
const MediaItem = ({ url, initialType, alt }: { url: string, initialType: 'image' | 'video', alt: string }) => {
    const [esVideo, setEsVideo] = useState(initialType === 'video');

    // Reiniciamos el estado si cambia la URL (por si se reusa el componente)
    useEffect(() => {
        setEsVideo(initialType === 'video');
    }, [url, initialType]);

    if (esVideo) {
        return (
            <video
                src={url}
                muted
                playsInline
                preload="metadata"
            />
        );
    }

    return (
        <img
            src={url}
            alt={alt}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={() => {
                // AQUI ESTA LA MAGIA: Si falla la imagen, probamos renderizar video
                setEsVideo(true);
            }}
        />
    );
};


// --- COMPONENTE PRINCIPAL ---
const Perfil: React.FC = () => {
    const { id } = useParams<{ id?: string }>();
    const { authData } = useAuth();
    const token = authData?.token ?? null;
    const currentUserId = authData?.id ?? null;

    const [datosPerfil, setDatosPerfil] = useState<UsuarioPerfilDto | null>(null);
    const [favoritos, setFavoritos] = useState<RecetaDto[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fetchAttempted, setFetchAttempted] = useState(false);
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<'imagenes' | 'videos' | 'favoritos'>('imagenes');
    const [isFollowing, setIsFollowing] = useState(false);
    const [isProcessingFollow, setIsProcessingFollow] = useState(false);

    // Separar publicaciones en imágenes y videos
    const { publicacionesImagen, publicacionesVideo } = useMemo(() => {
        if (!datosPerfil?.publicaciones) {
            return { publicacionesImagen: [], publicacionesVideo: [] };
        }

        const imagenes: RecetaDto[] = [];
        const videos: RecetaDto[] = [];

        datosPerfil.publicaciones.forEach(pub => {
            const mediaType = getMediaTypeFromContentType(pub.contentType as string);
            if (mediaType === 'video') {
                videos.push(pub);
            } else {
                imagenes.push(pub);
            }
        });

        return { publicacionesImagen: imagenes, publicacionesVideo: videos };

    }, [datosPerfil?.publicaciones]);

    // Cargar datos
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

        const fetchDatosCompletos = async () => {
            setFetchAttempted(true);
            setCargando(true);
            setError(null);
            
            try {
                const headers: Record<string, string> = {};
                if (token) headers['Authorization'] = `Bearer ${token}`;

                // 1. Fetch Datos Perfil
                const responsePerfil = await fetch(`${BASE_URL}/Usuario/${perfilId}`, {
                    headers,
                    signal,
                });

                if (!isMounted) return;

                if (responsePerfil.status === 401) {
                    setError('La sesión ha expirado o el token no es válido.');
                    setDatosPerfil(null);
                    return;
                }
                if (!responsePerfil.ok) throw new Error(`Error HTTP Perfil: ${responsePerfil.status}`);
                
                const dataPerfil: UsuarioPerfilDto = await responsePerfil.json();

                // 2. Fetch Favoritos
                const responseFavs = await fetch(`${BASE_URL}/Recetas/Favoritos?userId=${perfilId}`, {
                    headers,
                    signal
                });
                
                let dataFavs: RecetaDto[] = [];
                if (responseFavs.ok) {
                    const jsonFavs = await responseFavs.json();
                    if (Array.isArray(jsonFavs)) {
                        dataFavs = jsonFavs;
                    } else {
                        console.warn("Formato de favoritos inesperado (no es array)", jsonFavs);
                        dataFavs = [];
                    }
                }

                if (!isMounted) return;
                setIsFollowing(dataPerfil.esSeguido);
                setDatosPerfil(dataPerfil);
                setFavoritos(dataFavs);

            } catch (err: any) {
                if (err?.name === 'AbortError') return;
                console.error('Error al cargar datos:', err);
                if (!isMounted) return;
                setError('Ocurrió un error al cargar el perfil.');
                setDatosPerfil(null);
            } finally {
                if (!isMounted) return;
                setCargando(false);
            }
        };

        fetchDatosCompletos();
        return () => { isMounted = false; controller.abort(); };
    }, [id, token, currentUserId]);

    const handleFollowClick = async () => {
        if (!datosPerfil || !currentUserId || isProcessingFollow) return;
        setIsProcessingFollow(true);
        const usuarioId = datosPerfil.id;
        const previousIsFollowing = isFollowing;
        const newFollowerCount = isFollowing ? datosPerfil.cantidadSeguidores - 1 : datosPerfil.cantidadSeguidores + 1;

        setIsFollowing(!previousIsFollowing);
        setDatosPerfil(prev => prev ? ({ ...prev, cantidadSeguidores: newFollowerCount, esSeguido: !previousIsFollowing }) : null);

        try {
            const response = await fetch(`${BASE_URL}/Follow/${usuarioId}`, {
                method: previousIsFollowing ? 'DELETE' : 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Error en follow');
        } catch (error) {
            console.error(error);
            setIsFollowing(previousIsFollowing);
            setDatosPerfil(prev => prev ? ({ ...prev, cantidadSeguidores: previousIsFollowing ? prev.cantidadSeguidores + 1 : prev.cantidadSeguidores - 1, esSeguido: previousIsFollowing }) : null);
        } finally {
            setIsProcessingFollow(false);
        }
    };

    const handleShareProfileClick = async () => {
        if (!datosPerfil) return;
        const profileUrl = `${window.location.origin}/perfil/${datosPerfil.id}`;
        try { await navigator.clipboard.writeText(profileUrl); alert('Enlace copiado'); } catch (e) {}
    };

    const handleEditarPerfilClick = () => navigate('/editar-perfil');

    // --- RENDERIZADO GALERIA CORREGIDO ---
    const renderGaleria = () => {
        let listaAMostrar: RecetaDto[] = [];
        let tabName = '';

        if (activeTab === 'imagenes') {
            listaAMostrar = publicacionesImagen;
            tabName = 'publicaciones';
        } else if (activeTab === 'videos') {
            listaAMostrar = publicacionesVideo;
            tabName = 'videos';
        } else if (activeTab === 'favoritos') {
            listaAMostrar = favoritos;
            tabName = 'favoritos';
        }

        if (!Array.isArray(listaAMostrar)) return null;

        if (listaAMostrar.length === 0) {
            return (
                <Typography className="sin-recetas" sx={{ color: 'text.secondary', textAlign: 'center', mt: 4 }}>
                    {esPerfilPropio ? `Aún no tienes ${tabName}.` : `Este usuario no tiene ${tabName}.`}
                </Typography>
            );
        }
        
        return listaAMostrar.map((receta) => {
            const imagen = receta.imagenPrincipalUrl || receta.imagenUrl;
            if (!imagen) return null;

            const mediaUrl = getNormalizedUrl(imagen, receta.contentType ?? undefined);
            const mediaType = getMediaTypeFromContentType(receta.contentType ?? undefined);
            const targetUserId = receta.autor?.id ?? datosPerfil?.id;

            return (
                <div key={receta.id} className="galeria-item" style={{ backgroundColor: '#1e1e1e' }}> 
                    {/* Icono de video si el contentType lo dice explicito */}
                    {mediaType === 'video' && <VideoLibraryIcon className="video-watermark-icon" />}
                    
                    {/* Aseguramos que el Link ocupe todo el espacio y sea bloque */}
                    <Link 
                        to={`/perfil/${targetUserId}/publicaciones?receta=${receta.id}`}
                        style={{ display: 'block', width: '100%', height: '100%' }}
                    >
                        {/* Usamos el componente MediaItem para manejar el fallback */}
                        <MediaItem 
                            url={mediaUrl} 
                            initialType={mediaType} 
                            alt={receta.titulo ?? `Receta-${receta.id}`}
                        />
                    </Link>
                </div>
            );
        });
    };

    if (cargando) return <Box className="cargando-perfil" sx={{ color: 'text.secondary' }}>Cargando perfil...</Box>;
    if (error) return <Box className="error-perfil" sx={{ color: 'error.main', mt: 4, textAlign: 'center' }}>{error}</Box>;
    if (!datosPerfil) return null;

    const { nombre, apellido, nombreUsuario, biografia, fotoPerfilUrl, cantidadPublicaciones, cantidadSeguidores, cantidadSeguidos } = datosPerfil;
    const nombreCompletoDisplay = `${nombre || ''} ${apellido || ''}`.trim();
    const esPerfilPropio = currentUserId === datosPerfil.id;
    const perfilFotoSrc = fotoPerfilUrl ? getNormalizedUrl(fotoPerfilUrl, 'image/jpeg') : fotoPerfilDefault;

    return (
        <Box className="perfil-contenedor">
            <Box component="header" className="perfil-header">
                <div className="perfil-imagen-circular">
                    <img src={perfilFotoSrc} alt="Foto de perfil" />
                </div>
                <Box className="perfil-info-principal">
                  
                    <Box className="perfil-info">
                        <Typography variant="h6" className="perfil-nombre-usuario">@{nombreUsuario}</Typography>
                        <Typography variant="body1" className="perfil-nombre-completo" fontWeight="bold">{nombreCompletoDisplay}</Typography>
                        <Typography variant="body2" className="perfil-bio" color="text.secondary">{biografia}</Typography>
                    </Box>
                </Box>
              
            </Box>
            <div>
                <Box className="perfil-stats">
                    <span>
                        <Typography component="span" className="perfil-stats-label" color="text.secondary" sx={{ mr: 0.5 }}>Publicaciones</Typography>
                        <Typography component="span" className="perfil-stats-numero" fontWeight="bold" >{cantidadPublicaciones}</Typography>
                    </span>
                    <span >
                        <Typography component="span" className="perfil-stats-label" color="text.secondary">Seguidores</Typography>
                        <Typography component="span" className="perfil-stats-numero" fontWeight="bold">{cantidadSeguidores}</Typography>
                    </span>
                    <span>
                        <Typography component="span" className="perfil-stats-label" color="text.secondary" sx={{ ml: 0.5 }}>Seguidos</Typography>
                        <Typography component="span" className="perfil-stats-numero" fontWeight="bold">{cantidadSeguidos}</Typography>
                    </span>
                </Box>
            </div>
            <Box className="perfil-botones">
                {esPerfilPropio ? (
                    <>
                        <Button variant="contained" className="perfil-boton" onClick={handleEditarPerfilClick} sx={{ mr:1 }}>
                            Editar Perfil
                        </Button>
                        <Button 
                            variant="outlined" 
                            className="perfil-boton" 
                            color="primary"
                            onClick={handleShareProfileClick} 
                        >
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
                            backgroundColor: !isFollowing ? 'rgb(31, 69, 176)' : 'transparent',
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

                    <Button 
                        variant="outlined" 
                        className="perfil-boton" 
                        onClick={handleShareProfileClick} 
                        color="primary"
                        sx={{ minWidth:140 }}>
                        Compartir perfil
                    </Button>
                    </Box>
                )}
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box component="nav" className="perfil-navegacion">
                <Box className="perfil-navegacion-item" onClick={() => setActiveTab('imagenes')} sx={{ cursor: 'pointer', borderBottom: '2px solid', borderColor: activeTab === 'imagenes' ? 'primary.main' : 'transparent' }}>
                    <AppsIcon className="perfil-navegacion-icono" color={activeTab === 'imagenes' ? 'primary' : 'disabled'} />
                </Box>
                <Box className="perfil-navegacion-item" onClick={() => setActiveTab('videos')} sx={{ cursor: 'pointer', borderBottom: '2px solid', borderColor: activeTab === 'videos' ? 'primary.main' : 'transparent' }}>
                    <VideoLibraryIcon className="perfil-navegacion-icono" color={activeTab === 'videos' ? 'primary' : 'disabled'} />
                </Box>
                <Box className="perfil-navegacion-item" onClick={() => setActiveTab('favoritos')} sx={{ cursor: 'pointer', borderBottom: '2px solid', borderColor: activeTab === 'favoritos' ? 'primary.main' : 'transparent' }}>
                    <StarIcon className="perfil-navegacion-icono" color={activeTab === 'favoritos' ? 'primary' : 'disabled'} />
                </Box>
            </Box>

            <div className="perfil-galeria">
                {renderGaleria()}
            </div>
        </Box>
    );
};

export default Perfil;