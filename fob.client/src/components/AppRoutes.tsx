// src/routes/AppRoutes.tsx
import { Routes, Route, Navigate } from "react-router-dom";
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

    const { authData } = useAuth();  
    const isLoggedIn = !!authData; 
    
    return (
        <Routes>
            {/* Rutas protegidas */}
            
            <Route
                path="/comentarios/:recetaId"
                element={
                    <ProtectedRoute>
                        <ComentariosPage />
                    </ProtectedRoute>
                }
            />
            <Route
                    path="/"
                    element={isLoggedIn ? <Navigate to="/feed" replace />: <Navigate to="/iniciar-sesion" replace />}
            />
            {/* Rutas públicas */}
            <Route path="/iniciar-sesion" element={<IniciarSesion />} />
            <Route path="/registrarse" element={<Registrarse />} />
            <Route path="/tendencias" element={<Tendencias />} />
            {/*Pasa la prop onDrawerToggle a la página Feed */}
            <Route path="/feed" element={<Feed onDrawerToggle={onDrawerToggle} />} />
        </Routes>
    );
}
