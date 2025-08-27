// src/routes/AppRoutes.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import React from "react";
import IniciarSesion from "../pages/IniciarSesion";
import Registrarse from "../pages/Registrarse";
import Tendencias from "../pages/Tendencias";
import ProtectedRoute from "../routes/ProtectedRoute";
import Feed from "../pages/Feed";
import ComentariosPage from "../pages/Comentarios";
import { useAuth } from "../context/AuthContext";

// 1. Define la interfaz de las props que AppRoutes debe recibir
interface AppRoutesProps {
  onDrawerToggle: (isOpen: boolean) => void;
}

// 2. Recibe la prop en el componente
export default function AppRoutes({ onDrawerToggle }: AppRoutesProps) {
    const { authData, isLoading } = useAuth();
    const isLoggedIn = !!authData;
    
    // Si aún está cargando, muestra un mensaje de carga para evitar el parpadeo
    if (isLoading) {
        return <div>Cargando...</div>; 
    }
    
    return (
        <Routes>
            {/* Rutas públicas que no requieren autenticación */}
            <Route path="/iniciar-sesion" element={<IniciarSesion />} />
            <Route path="/registrarse" element={<Registrarse />} />
            <Route path="/tendencias" element={<Tendencias />} />

            {/*
                Lógica para la ruta raíz:
                - Si el usuario está logueado, lo redirige a /feed.
                - Si no está logueado, lo redirige a /iniciar-sesion.
            */}
            <Route
                path="/"
                element={isLoggedIn ? <Navigate to="/feed" replace /> : <Navigate to="/iniciar-sesion" replace />}
            />

            {/*
                Rutas protegidas que SIEMPRE requieren autenticación.
                Cualquier intento de acceder a ellas sin estar logueado
                redirigirá al usuario a la página de inicio de sesión.
            */}
            <Route
                path="/feed"
                element={
                    <ProtectedRoute>
                        <Feed onDrawerToggle={onDrawerToggle} />
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
        </Routes>
    );
}