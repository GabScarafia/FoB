// src/pages/Perfil.tsx

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom'; // Importamos 'Link'
import '../styles/Perfil.css';
import { useAuth } from '../context/AuthContext';

// Íconos de Material UI
import AppsIcon from '@mui/icons-material/Apps';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';

// Foto por defecto
import fotoPerfilDefault from '../assets/images/bicho-arabe.jpg';

// Solo las interfaces necesarias para Perfil.tsx
interface RecetaDto {
    id: number;
    titulo?: string;
    imagenPrincipalBase64?: string | null;
    imagen?: string | null;
}

interface UsuarioPerfilDto {
    id: number;
    nombreUsuario: string | null;
    nombreCompleto: string | null;
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

    useEffect(() => {
        const perfilId = id ? Number(id) : currentUserId;

        if (!perfilId) {
            setError('Debes iniciar sesión para ver tu perfil.');
            setCargando(false);
            return;
        }

        const controller = new AbortController();
        const signal = controller.signal;

        const fetchDatosPerfil = async () => {
            setCargando(true);
            setError(null);
            try {
                const headers: Record<string, string> = {};
                if (token) headers['Authorization'] = `Bearer ${token}`;

                const response = await fetch(`https://localhost:7084/Usuario/${perfilId}`, {
                    headers,
                    signal,
                });

                if (response.status === 401) {
                    setError('La sesión ha expirado o el token no es válido.');
                    setDatosPerfil(null);
                    return;
                }

                if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

                const data: UsuarioPerfilDto = await response.json();
                setDatosPerfil(data);
            } catch (err: any) {
                if (err.name === 'AbortError') return;
                console.error('Error al cargar el perfil:', err);
                setError('Ocurrió un error al cargar tu perfil.');
                setDatosPerfil(null);
            } finally {
                setCargando(false);
            }
        };

        fetchDatosPerfil();
        return () => controller.abort();
    }, [id, token, currentUserId]);



    if (cargando) return <div className="cargando-perfil">Cargando perfil...</div>;
    if (error) return <div className="error-perfil">{error}</div>;
    if (!datosPerfil) return <div className="error-perfil">No se encontraron datos de perfil.</div>;

    const {
        nombreCompleto,
        biografia,
        fotoPerfilBase64,
        cantidadPublicaciones,
        cantidadSeguidores,
        cantidadSeguidos,
        publicaciones
    } = datosPerfil;


    const tienePublicaciones = publicaciones && publicaciones.length > 0;
    const esPerfilPropio = currentUserId === datosPerfil.id;

    return (
        <div className="perfil-contenedor">
            <header className="perfil-header">
                <div className="perfil-imagen-circular">
                    <img
                        src={fotoPerfilBase64 ? `data:image/jpeg;base64,${fotoPerfilBase64}` : fotoPerfilDefault}
                        alt="Foto de perfil"
                    />
                </div>
                <div className="perfil-info-principal">
                    <div className="perfil-stats">
                        <span>
                            <span className="perfil-stats-label">Publicaciones</span>
                            <span className="perfil-stats-numero">{cantidadPublicaciones}</span>
                           
                        </span>
                        <span>
                            
                            <span className="perfil-stats-label">Seguidores</span>
                            <span className="perfil-stats-numero">{cantidadSeguidores}</span>
                        </span>
                        <span>
                            
                            <span className="perfil-stats-label">Seguidos</span>
                            <span className="perfil-stats-numero">{cantidadSeguidos}</span>
                        </span>
                    </div>
                    <div className="perfil-info"> 
                        <div className="perfil-nombre-completo">{nombreCompleto}</div>
                        <div className="perfil-bio">{biografia}</div>
                    </div>
                </div>
            </header>

            {esPerfilPropio && (
                <div className="perfil-botones">
                    <button className="perfil-boton">Editar perfil</button>
                    <button className="perfil-boton">Compartir perfil</button>
                </div>
            )}

            <hr className="perfil-separador" />

            <nav className="perfil-navegacion">
                <div className="perfil-navegacion-item activo">
                    <AppsIcon className="perfil-navegacion-icono" />
                </div>
                <div className="perfil-navegacion-item">
                    <VideoLibraryIcon className="perfil-navegacion-icono" />
                </div>
            </nav>

            <div className="perfil-galeria">
                {!tienePublicaciones ? (
                    <div className="sin-recetas">Aún no has publicado ninguna receta.</div>
                ) : (
                    publicaciones.map((receta) => {
                        const imagen = receta.imagenPrincipalBase64 ?? receta.imagen ?? null;
                        if (!imagen) return null;
                        return (
                            <div key={receta.id} className="galeria-item">
                                {/* CAMBIO CLAVE AQUÍ: se usa la ruta completa con los dos parámetros */}
                                <Link to={`/perfil/${datosPerfil.id}/publicaciones?receta=${receta.id}`}>
                                    <img
                                        src={`data:image/jpeg;base64,${imagen}`}
                                        alt={receta.titulo ?? `Receta-${receta.id}`}
                                    />
                                </Link>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default Perfil;