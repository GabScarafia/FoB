// src/routes/AppRoutes.tsx
import { Routes, Route } from "react-router-dom";
import Weather from "../pages/Weather";
import IniciarSesion from "../pages/IniciarSesion";
import Registrarse from "../pages/Registrarse";
import ProtectedRoute from "../routes/ProtectedRoute";
import Feed from "../pages/Feed";
import ComentariosPage from "../pages/Comentarios";

// 1. Define la interfaz de las props que AppRoutes debe recibir
interface AppRoutesProps {
  onDrawerToggle: (isOpen: boolean) => void;
}

// 2. Recibe la prop en el componente
export default function AppRoutes({ onDrawerToggle }: AppRoutesProps) {
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
                path="/comentarios/:recetaId"
                element={
                    <ProtectedRoute>
                        <ComentariosPage />
                    </ProtectedRoute>
                }
            />

            {/* Rutas públicas */}
            <Route path="/iniciar-sesion" element={<IniciarSesion />} />
            <Route path="/registrarse" element={<Registrarse />} />
            {/*Pasa la prop onDrawerToggle a la página Feed */}
            <Route path="/feed" element={<Feed onDrawerToggle={onDrawerToggle} />} />
        </Routes>
    );
}
