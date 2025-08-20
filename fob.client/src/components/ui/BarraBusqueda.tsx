import React, { useState } from 'react';
import './BarraBusqueda.css';
import LogoApp from '../../assets/images/logo-blanco.png';
import SearchIcon from '@mui/icons-material/Search';

// Interfaz para las propiedades (props) del componente BarraBusqueda
interface BarraBusquedaProps {
    onSearch: (termino: string) => void; // Función que se llama al buscar
}

const BarraBusqueda: React.FC<BarraBusquedaProps> = ({ onSearch }) => {
    const [terminoBusqueda, setTerminoBusqueda] = useState<string>('');

    const manejarCambioInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTerminoBusqueda(e.target.value);
    };

    const manejarBusqueda = () => {
        onSearch(terminoBusqueda);
    };

    const manejarEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            manejarBusqueda();
        }
    };

    return (
        <div className="barra-busqueda-contenedor">
            <img src={LogoApp} alt="Logo de la App" className="logo-app" />
            <input
                type="text"
                placeholder="Buscar..."
                className="input-busqueda"
                value={terminoBusqueda}
                onChange={manejarCambioInput}
                onKeyDown={manejarEnter}
            />
            <SearchIcon className="icono-busqueda" onClick={manejarBusqueda} />
        </div>
    );
};

export default BarraBusqueda;