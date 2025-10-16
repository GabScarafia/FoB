import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CampoEntrada from 'components/ui/CampoEntrada';
import Boton from 'components/ui/Boton';
import CasillaVerificacion from 'components/ui/CasillaVerificacion';
import '../styles/Registrarse.css';
import logoImage from '../assets/images/logo.png';
import TerminosYCondicionesModal from 'components/Modal/TerminosYCondicionesModal';
import { BASE_URL } from 'apiConfig';

const Registrarse: React.FC = () => {
    const [nombre, setNombre] = useState<string>('');
    const [apellido, setApellido] = useState<string>('');
    const [nombreUsuario, setNombreUsuario] = useState<string>('');
    const [correoRegistro, setCorreoRegistro] = useState<string>('');
    const [contrasenaRegistro, setContrasenaRegistro] = useState<string>('');
    const [confirmarContrasena, setConfirmarContrasena] = useState<string>('');
    const [aceptarTerminos, setAceptarTerminos] = useState<boolean>(false);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [mensajeError, setMensajeError] = useState<string>('');
    const navigate = useNavigate();

    const manejarEnvioRegistro = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMensajeError('');

        if (contrasenaRegistro !== confirmarContrasena) {
            setMensajeError('Las contraseñas no coinciden.');
            return;
        }
        if (!aceptarTerminos) {
            setMensajeError('Debes aceptar los términos y condiciones.');
            return;
        }


        const API_URL = `${BASE_URL}/Register`;

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    Nombre: nombre,
                    Apellido: apellido,
                    NombreUsuario: nombreUsuario,
                    Email: correoRegistro,
                    Password: contrasenaRegistro,
                    ConfirmPassword: confirmarContrasena,
                }),
            });

            if (response.ok) {
                alert('¡Registro exitoso! Por favor, inicia sesión.');
                navigate('/iniciar-sesion');
            } else {
                const errorData = await response.json();
                if (response.status === 400 && errorData.errors) {
                    const validationErrors = Object.values(errorData.errors).flat().join(' ');
                    setMensajeError(`Errores de validación: ${validationErrors}`);
                } else {
                    setMensajeError(errorData.message || 'Error en el registro. Por favor, inténtalo de nuevo.');
                }
                console.error('Error al registrar usuario:', errorData);
            }
        } catch (error) {
            setMensajeError('No se pudo conectar con el servidor. Por favor, verifica tu conexión.');
            console.error('Error de red o inesperado:', error);
        }
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
                        etiqueta="Nombre"
                        tipo="text"
                        id="nombre"
                        valor={nombre}
                        manejarCambio={(e) => setNombre(e.target.value)}
                        requerido={true}
                        mostrarAsteriscoRequerido={true}
                    />
                    <CampoEntrada
                        etiqueta="Apellido"
                        tipo="text"
                        id="apellido"
                        valor={apellido}
                        manejarCambio={(e) => setApellido(e.target.value)}
                        requerido={true}
                        mostrarAsteriscoRequerido={true}
                    />
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

                    {mensajeError && <p className="mensaje-error">{mensajeError}</p>}

                    <Boton tipo="submit" className="boton-principal">REGISTRARTE</Boton>
                </form>
                <Link to="/iniciar-sesion" style={{ textDecoration: 'none', width: '100%' }}>
                    <Boton className="boton-atras-a-inicio-sesion">ATRÁS</Boton>
                </Link>
            </div>

            <TerminosYCondicionesModal isOpen={isModalOpen} onClose={cerrarModalTerminos} />
        </div>
    );
};

export default Registrarse;