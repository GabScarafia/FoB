import React, { useState, useRef } from 'react';
import './BarraBusqueda.css';
import LogoApp from '../../assets/images/logo-blanco.png';
import SearchIcon from '@mui/icons-material/Search';
import type { Usuario } from '../../pages/Feed';
import { useNavigate } from 'react-router-dom';

// Interfaz para las propiedades (props) del componente BarraBusqueda
interface BarraBusquedaProps {
    onSearch: (termino: string) => Promise<void>;
    usuarios?: Usuario[];
    onFollow: (userId: number, isFollowing: boolean) => Promise<void>;
    currentUserId: number | null | undefined;  // ID del usuario actual para no mostrar el botón de seguir a sí mismo
}

const BarraBusqueda: React.FC<BarraBusquedaProps> = ({ onSearch, usuarios, onFollow, currentUserId }) => {
    const [terminoBusqueda, setTerminoBusqueda] = useState<string>('');
    const [cargandoBusqueda, setCargandoBusqueda] = useState<boolean>(false);
    const [mostrarResultados, setMostrarResultados] = useState<boolean>(false);
    const [usuariosLocal, setUsuariosLocal] = useState<Usuario[]>(usuarios || []);
    const navigate = useNavigate();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        setUsuariosLocal(usuarios || []);
    }, [usuarios]);

    const manejarCambioInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const nuevoTermino = e.target.value;
        setTerminoBusqueda(nuevoTermino);
        if (nuevoTermino.trim() !== '') {
            setCargandoBusqueda(true);
            setMostrarResultados(true);
            await onSearch(nuevoTermino);
            setCargandoBusqueda(false);
        } else {
            setMostrarResultados(false);
            setCargandoBusqueda(false);
            onSearch('');
        }
    };

    const manejarBusquedaCompleta = async () => {
        setCargandoBusqueda(true);
        setMostrarResultados(true);
        await onSearch(terminoBusqueda);
        setCargandoBusqueda(false);
    };

    const manejarEnter = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            await manejarBusquedaCompleta();
        }
    };

    // Actualiza el estado local de usuarios para reflejar el cambio de seguimiento en tiempo real
    const handleFollowClick = async (usuarioId: number, isCurrentlyFollowing: boolean) => {
        await onFollow(usuarioId, isCurrentlyFollowing);
        setUsuariosLocal(prevUsuarios =>
            prevUsuarios.map(u =>
                u.id === usuarioId ? { ...u, isFollowing: !isCurrentlyFollowing } : u
            )
        );
    };

    // Prevent navigation when clicking the follow button
    const handleUsuarioContainerClick = (e: React.MouseEvent, userId: number) => {
        // If the click originated from a button, do not navigate
        if ((e.target as HTMLElement).tagName.toLowerCase() === 'button') return;
        navigate(`/perfil/${userId}`);
    };

    // Evita cerrar el dropdown si el foco va a un elemento dentro del dropdown
    const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        setTimeout(() => {
            const active = document.activeElement;
            if (
                dropdownRef.current &&
                dropdownRef.current.contains(active)
            ) {
                // El foco está en el dropdown, no cerrar
                return;
            }
            setMostrarResultados(false);
        }, 100);
    };

    return (
        <div className="barra-busqueda-contenedor-principal">
            <div className="barra-busqueda-input-seccion">
                <img src={LogoApp} alt="Logo de la App" className="logo-app" />
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Buscar..."
                    className="input-busqueda"
                    value={terminoBusqueda}
                    onChange={manejarCambioInput}
                    onKeyDown={manejarEnter}
                    onFocus={() => terminoBusqueda.trim() !== '' && setMostrarResultados(true)}
                    onBlur={handleInputBlur}
                />
                <SearchIcon className="icono-busqueda" onClick={manejarBusquedaCompleta} />
            </div>

            {mostrarResultados && (terminoBusqueda.trim() !== '' || cargandoBusqueda) && (
                <div className="resultados-dropdown" ref={dropdownRef}>
                    {cargandoBusqueda ? (
                        <div className="cargando-busqueda">Cargando resultados...</div>
                    ) : (
                        usuariosLocal && usuariosLocal.length > 0 ? (
                            usuariosLocal.map(usuario => (
                                <div
                                    key={usuario.id}
                                    className="resultado-usuario"
                                    onClick={e => handleUsuarioContainerClick(e, usuario.id)}
                                    style={{cursor: 'pointer'}}
                                >
                                    <span className="usuario-nombre">{usuario.nombreUsuario}</span>
                                    <span className="usuario-nombre-completo">{usuario.nombre} {usuario.apellido}</span>
                                    {currentUserId !== usuario.id && (
                                        <button
                                            className={`boton-seguir ${usuario.isFollowing ? 'siguiendo' : ''}`}
                                            tabIndex={0}
                                            onClick={e => {
                                                e.stopPropagation();
                                                handleFollowClick(usuario.id, usuario.isFollowing || false);
                                            }}
                                        >
                                            {usuario.isFollowing ? 'Siguiendo' : 'Seguir'}
                                        </button>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="no-resultados-mensaje">No se encontraron usuarios.</div>
                        )
                    )}
                </div>
            )}
        </div>
    );
};

export default BarraBusqueda;