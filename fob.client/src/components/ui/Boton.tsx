// src/components/ui/Boton.tsx
import React from 'react';
import './Boton.css';

// interfaz para las props del componente Boton
interface BotonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  tipo?: 'button' | 'submit' | 'reset';
  className?: string;
}

// Componente funcional Boton
const Boton: React.FC<BotonProps> = ({ children, onClick, tipo = 'button', className }) => {
  return (
    <button type={tipo} onClick={onClick} className={`boton ${className || ''}`}>
      {children}
    </button>
  );
};

export default Boton;