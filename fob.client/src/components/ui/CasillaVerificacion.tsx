// src/components/ui/CasillaVerificacion.tsx
import React from 'react';
import './CasillaVerificacion.css';

interface CasillaVerificacionProps {
  id: string;
  chequeado: boolean;
  manejarCambio: (e: React.ChangeEvent<HTMLInputElement>) => void;
  etiquetaInicio: string;
  textoNegrita: string;
  restoEtiqueta: string;
  requerido?: boolean;
  onTextoNegritaClick?: () => void;
}

const CasillaVerificacion: React.FC<CasillaVerificacionProps> = ({
  id,
  chequeado,
  manejarCambio,
  etiquetaInicio,
  textoNegrita,
  restoEtiqueta,
  requerido = false,
  onTextoNegritaClick,
}) => {
  return (
    <div className="grupo-casilla-verificacion">
      <input
        type="checkbox"
        id={id}
        checked={chequeado}
        onChange={manejarCambio}
        required={requerido}
      />
      <label htmlFor={id}>
        {etiquetaInicio}
        <span
          className="texto-negrita-clicable"
          onClick={onTextoNegritaClick}
        >
          {textoNegrita}
        </span>
        {restoEtiqueta}
      </label>
    </div>
  );
};

export default CasillaVerificacion;