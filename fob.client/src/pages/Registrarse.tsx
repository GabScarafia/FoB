// src/pages/Registrarse.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import CampoEntrada from 'components/ui/CampoEntrada';
import Boton from 'components/ui/Boton';
import CasillaVerificacion from 'components/ui/CasillaVerificacion';
import '../styles/Registrarse.css';
import logoImage from '../assets/images/logo.png';
import TerminosYCondicionesModal from 'components/TerminosYCondicionesModal';

const Registrarse: React.FC = () => {
  const [nombreUsuario, setNombreUsuario] = useState<string>('');
  const [correoRegistro, setCorreoRegistro] = useState<string>('');
  const [contrasenaRegistro, setContrasenaRegistro] = useState<string>('');
  const [confirmarContrasena, setConfirmarContrasena] = useState<string>('');
  const [aceptarTerminos, setAceptarTerminos] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const manejarEnvioRegistro = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Datos de registro:', { nombreUsuario, correoRegistro, contrasenaRegistro, confirmarContrasena, aceptarTerminos });
    if (contrasenaRegistro !== confirmarContrasena) {
      alert('Las contraseñas no coinciden.');
      return;
    }
    if (!aceptarTerminos) {
      alert('Debes aceptar los términos y condiciones.');
      return;
    }
    alert('Usuario registrado (simulado).');
    // Aca iria llamada a la api de registro
  };

  const abrirModalTerminos = () => {
    setIsModalOpen(true);
  };

  const cerrarModalTerminos = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="contenedor-registrarse">
      <div className="header-autenticacion-curvo">
        <div className="seccion-logo">
          <img src={logoImage} alt="Fondo Blanco Logo" className="logo" />
        </div>
      </div>

      <div className="formulario-registrarse-caja">
        <h2>REGISTRATE</h2>
        <form onSubmit={manejarEnvioRegistro}>
          <CampoEntrada
            etiqueta="Nombre de usuario"
            tipo="text"
            id="nombre-usuario"
            valor={nombreUsuario}
            manejarCambio={(e) => setNombreUsuario(e.target.value)}
            requerido={true}
            mostrarAsteriscoRequerido={true}
          />
          <CampoEntrada
            etiqueta="Correo electrónico"
            tipo="email"
            id="correo-registro"
            valor={correoRegistro}
            manejarCambio={(e) => setCorreoRegistro(e.target.value)}
            requerido={true}
            mostrarAsteriscoRequerido={true}
          />
          <CampoEntrada
            etiqueta="Contraseña"
            tipo="password"
            id="contrasena-registro"
            valor={contrasenaRegistro}
            manejarCambio={(e) => setContrasenaRegistro(e.target.value)}
            requerido={true}
            mostrarAsteriscoRequerido={true}
            mostrarOcultarContrasena={true}
          />
          <CampoEntrada
            etiqueta="Confirmar contraseña"
            tipo="password"
            id="confirmar-contrasena"
            valor={confirmarContrasena}
            manejarCambio={(e) => setConfirmarContrasena(e.target.value)}
            requerido={true}
            mostrarAsteriscoRequerido={true}
            mostrarOcultarContrasena={true}
          />
          <CasillaVerificacion
            id="aceptar-terminos"
            chequeado={aceptarTerminos}
            manejarCambio={(e) => setAceptarTerminos(e.target.checked)}
            etiquetaInicio="Acepto los&nbsp;"
            textoNegrita="términos y condiciones"
            restoEtiqueta="&nbsp;de la aplicación"
            requerido={true}
            onTextoNegritaClick={abrirModalTerminos}
          />
          <Boton tipo="submit" className="boton-principal">REGISTRARTE</Boton>
        </form>
        <Link to="/iniciar-sesion" style={{ textDecoration: 'none', width: '100%' }}>
          <Boton className="boton-atras-a-inicio-sesion">ATRÁS</Boton>
        </Link>
      </div>

      {/* Renderiza el modal */}
      <TerminosYCondicionesModal isOpen={isModalOpen} onClose={cerrarModalTerminos} />
    </div>
  );
};

export default Registrarse;