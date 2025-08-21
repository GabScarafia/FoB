// src/routes/AppRoutes.tsx
import { Routes, Route } from "react-router-dom";
import Weather from "../pages/Weather";
import IniciarSesion from "../pages/IniciarSesion";
import Registrarse from "../pages/Registrarse";
import ProtectedRoute from "../routes/ProtectedRoute";
import Feed from "../pages/Feed";
import ComentariosPage from "../pages/Comentarios";

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
            {/* Rutas protegidas */}
            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <Weather />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/comentarios/:recetaId"  // <-- nueva ruta con parámetro
                element={
                    <ProtectedRoute>
                        <ComentariosPage />
                    </ProtectedRoute>
                }
            />

            {/* Rutas públicas */}
            <Route path="/iniciar-sesion" element={<IniciarSesion />} />
            <Route path="/registrarse" element={<Registrarse />} />
            <Route path="/feed" element={<Feed />} />

        </Routes>
    );
}