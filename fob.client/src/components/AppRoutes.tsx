// src/routes/AppRoutes.tsx
import { Routes, Route } from "react-router-dom";
import Weather from "../pages/Weather";
import IniciarSesion from "../pages/IniciarSesion";
import Registrarse from "../pages/Registrarse";
import Feed from "../pages/Feed";

/**
 * Componente que define las rutas principales de la aplicación.
 *
 * Aquí se configuran los paths y los componentes que se renderizan
 * cuando el usuario navega a dichas rutas.
 *
 */
export default function AppRoutes() {
    return (
        <Routes>
            {/* Ruta para la página de Weather */}
            <Route path="/" element={<Weather />} />

            {/* Rutas para la autenticación */}
            <Route path="/iniciar-sesion" element={<IniciarSesion />} />
            <Route path="/registrarse" element={<Registrarse />} />
            <Route path="/feed" element={<Feed />} />

        </Routes>
    );
}