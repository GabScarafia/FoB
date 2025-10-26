import React, { useRef } from 'react';
import './BarraBusqueda.css';
import LogoApp from '../../assets/images/logo-blanco.png';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack'; // <-- IMPORTAR ICONO

// ACTUALIZAR INTERFAZ
interface BarraBusquedaProps {
    searchTerm: string;
    onSearchChange: (termino: string) => void;
    onSearchSubmit: () => void;
    
    // --- NUEVAS PROPS ---
    isSearchActive: boolean;
    onFocus: () => void;
    onBackClick: () => void;
}

const BarraBusqueda: React.FC<BarraBusquedaProps> = ({ 
    searchTerm, 
    onSearchChange, 
    onSearchSubmit,
    isSearchActive,
    onFocus,
    onBackClick
}) => {
    
    const inputRef = useRef<HTMLInputElement>(null);

    const manejarCambioInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        onSearchChange(e.target.value);
    };

    const manejarEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            onSearchSubmit();
            inputRef.current?.blur();
        }
    };

    return (
        <div className="barra-busqueda-contenedor-principal">
            <div className="barra-busqueda-input-seccion">
            
                {/* LÓGICA CONDICIONAL PARA EL ICONO */}
                {isSearchActive ? (
                    <ArrowBackIcon className="icono-atras" onClick={onBackClick} />
                ) : (
                    <img src={LogoApp} alt="Logo de la App" className="logo-app" />
                )}

                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Buscar..."
                    className="input-busqueda"
                    value={searchTerm}
                    onChange={manejarCambioInput}
                    onKeyDown={manejarEnter}
                    onFocus={onFocus} // <-- ASIGNAR EL onFocus
                />
                <SearchIcon className="icono-busqueda" onClick={onSearchSubmit} />
            </div>
        </div>
    );
};

export default BarraBusqueda;