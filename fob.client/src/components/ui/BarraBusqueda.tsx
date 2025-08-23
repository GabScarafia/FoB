import React, { useState } from 'react';
import './BarraBusqueda.css';
import LogoApp from '../../assets/images/logo-blanco.png';
import SearchIcon from '@mui/icons-material/Search';
import type { Usuario } from '../../pages/Feed';

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

    // Función para manejar el clic en el botón de seguir/dejar de seguir
    const handleFollowClick = async (usuarioId: number, isCurrentlyFollowing: boolean) => {
        await onFollow(usuarioId, isCurrentlyFollowing);
    };

    return (
        <div className="barra-busqueda-contenedor-principal">
            <div className="barra-busqueda-input-seccion">
                <img src={LogoApp} alt="Logo de la App" className="logo-app" />
                <input
                    type="text"
                    placeholder="Buscar..."
                    className="input-busqueda"
                    value={terminoBusqueda}
                    onChange={manejarCambioInput}
                    onKeyDown={manejarEnter}
                    onFocus={() => terminoBusqueda.trim() !== '' && setMostrarResultados(true)}
                    onBlur={() => setTimeout(() => setMostrarResultados(false), 100)}
                />
                <SearchIcon className="icono-busqueda" onClick={manejarBusquedaCompleta} />
            </div>

            {mostrarResultados && (terminoBusqueda.trim() !== '' || cargandoBusqueda) && (
                <div className="resultados-dropdown">
                    {cargandoBusqueda ? (
                        <div className="cargando-busqueda">Cargando resultados...</div>
                    ) : (
                        usuarios && usuarios.length > 0 ? (
                            usuarios.map(usuario => (
                                <div key={usuario.id} className="resultado-usuario">
                                    <span className="usuario-nombre">{usuario.nombreUsuario}</span>
                                    <span className="usuario-nombre-completo">{usuario.nombre} {usuario.apellido}</span>
                                    {currentUserId !== usuario.id && ( // No mostrar el botón si es el usuario actual
                                        <button
                                            className={`boton-seguir ${usuario.isFollowing ? 'siguiendo' : ''}`}
                                            onClick={() => handleFollowClick(usuario.id, usuario.isFollowing || false)}
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