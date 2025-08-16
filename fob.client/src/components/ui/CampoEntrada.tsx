// src/components/ui/CampoEntrada.tsx
import React, { useState } from 'react';
import './CampoEntrada.css';

interface CampoEntradaProps {
  etiqueta: string;
  tipo: 'text' | 'email' | 'password';
  id: string;
  valor: string;
  manejarCambio: (e: React.ChangeEvent<HTMLInputElement>) => void;
  requerido?: boolean;
  mostrarAsteriscoRequerido?: boolean;
  mostrarOcultarContrasena?: boolean;
}

const CampoEntrada: React.FC<CampoEntradaProps> = ({
  etiqueta,
  tipo,
  id,
  valor,
  manejarCambio,
  requerido = false,
  mostrarAsteriscoRequerido = false,
  mostrarOcultarContrasena = false,
}) => {
  const [tipoCampo, setTipoCampo] = useState<CampoEntradaProps['tipo']>(tipo);

  const alternarVisibilidadContrasena = () => {
    setTipoCampo((prevTipo) => (prevTipo === 'password' ? 'text' : 'password'));
  };

  return (
    <div className="grupo-entrada">
      <label htmlFor={id}>
        {etiqueta}
        {mostrarAsteriscoRequerido && <span className="asterisco-requerido">*</span>}
      </label>
      <div className="contenedor-input-icono">
        <input
          type={tipoCampo}
          id={id}
          value={valor}
          onChange={manejarCambio}
          required={requerido}
        />
        {mostrarOcultarContrasena && (
          <span className="alternar-contrasena" onClick={alternarVisibilidadContrasena}>
            {/* Ícono SVG para ojo abierto/cerrado */}
            {tipoCampo === 'password' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-eye-off"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-eye"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>              
            )}
          </span>
        )}
      </div>
    </div>
  );
};

export default CampoEntrada;