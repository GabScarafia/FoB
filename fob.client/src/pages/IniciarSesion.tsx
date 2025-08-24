// src/pages/IniciarSesion.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import CampoEntrada from '../components/ui/CampoEntrada';
import Boton from '../components/ui/Boton';
import '../styles/IniciarSesion.css';
import logoImage from '../assets/images/logo.png';
import { useAuth } from '../context/AuthContext';

const IniciarSesion: React.FC = () => {
  const { login } = useAuth();
  const [correoInicioSesion, setCorreoInicioSesion] = useState<string>('');
  const [contrasenaInicioSesion, setContrasenaInicioSesion] = useState<string>('');
  const [cargando, setCargando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { authData } = useAuth();  
  const isLoggedIn = !!authData; 
  console.log("isLogged", isLoggedIn);
    if(isLoggedIn === true){
      navigate('/feed');
    }

  const manejarEnvioInicioSesion = async (e: React.FormEvent<HTMLFormElement>) => {
    
    e.preventDefault();
    setCargando(true);
    setError(null);

   

    try {
      const response = await fetch("https://localhost:7084/Authentication", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: correoInicioSesion,
          password: contrasenaInicioSesion,
        }),
      });

      if (!response.ok) {
        throw new Error("Error en la autenticación. Verifica tus credenciales.");
      }

      const data = await response.json();
      console.log("Respuesta API:", data);

      // Guardar en appStorage (puede ser localStorage o sessionStorage)
      localStorage.setItem("authData", JSON.stringify(data));   
      login(data);

      navigate('/feed');

      // Redirigir a otra página si querés, por ejemplo /dashboard
      // navigate("/dashboard");

    } 
    catch (err: any) {
      setError(err.message || "Ocurrió un error inesperado.");
    } 
    finally {
      setCargando(false);
    }
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