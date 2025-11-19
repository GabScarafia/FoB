// src/components/ui/Boton.tsx
import React from 'react';
import './Boton.css';

// interfaz para las props del componente Boton
interface BotonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  tipo?: 'button' | 'submit' | 'reset';
  className?: string;
  deshabilitado?: boolean;
}

// Componente funcional Boton
const Boton: React.FC<BotonProps> = ({ children, onClick, tipo = 'button', className, deshabilitado = false }) => {
  return (
    <button type={tipo} onClick={onClick} className={`boton ${className || ''}`} disabled={deshabilitado}>
      {children}
    </button>
  );
};

export default Boton;