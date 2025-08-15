// src/pages/IniciarSesion.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import CampoEntrada from '../components/ui/CampoEntrada';
import Boton from '../components/ui/Boton';
import '../styles/IniciarSesion.css';
import logoImage from '../assets/images/logo.png';

const IniciarSesion: React.FC = () => {
  const [correoInicioSesion, setCorreoInicioSesion] = useState<string>('');
  const [contrasenaInicioSesion, setContrasenaInicioSesion] = useState<string>('');

  const manejarEnvioInicioSesion = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Datos de inicio de sesión:', { correoInicioSesion, contrasenaInicioSesion });
    alert('Inicio de sesión (simulado).');
    // llamada a la api de inicio de sesion
  };

  return (
    <div className="contenedor-inicio-sesion">
      <div className="header-autenticacion-curvo">
        <div className="seccion-logo">
          <img src={logoImage} alt="Fondo Blanco Logo" className="logo" />         </div>
      </div>

      <div className="formulario-inicio-sesion-caja">
        <h2>INICIAR SESIÓN</h2>
        <form onSubmit={manejarEnvioInicioSesion}>
          <CampoEntrada
            etiqueta="Correo electrónico"
            tipo="email"
            id="correo-inicio-sesion"
            valor={correoInicioSesion}
            manejarCambio={(e) => setCorreoInicioSesion(e.target.value)}
            requerido={true}
            mostrarAsteriscoRequerido={true}
          />
          <CampoEntrada
            etiqueta="Contraseña"
            tipo="password"
            id="contrasena-inicio-sesion"
            valor={contrasenaInicioSesion}
            manejarCambio={(e) => setContrasenaInicioSesion(e.target.value)}
            requerido={true}
            mostrarAsteriscoRequerido={true}
            mostrarOcultarContrasena={true}
          />
          <Boton tipo="submit" className="boton-principal">INICIAR SESIÓN</Boton>
        </form>
        <Link to="/registrarse" style={{ textDecoration: 'none', width: '100%' }}>
          <Boton className="boton-ir-a-registro">REGISTRARSE</Boton>
        </Link>
      </div>
    </div>
  );
};

export default IniciarSesion;