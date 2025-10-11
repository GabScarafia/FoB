import { Routes, Route, Navigate} from "react-router-dom";
import IniciarSesion from "../pages/IniciarSesion";
import Registrarse from "../pages/Registrarse";
import Tendencias from "../pages/Tendencias";
import ProtectedRoute from "../routes/ProtectedRoute";
import Feed from "../pages/Feed";
import Perfil from "../pages/Perfil";
import PublicacionScrollablePage from '../pages/PublicacionScrollablePage';
import ComentariosPage from "../pages/Comentarios";
import { useAuth } from "../context/AuthContext";
import EditarPerfil from "../pages/EditarPerfil"; 

interface AppRoutesProps {
    onDrawerToggle: (isOpen: boolean) => void;
}

export default function AppRoutes({ onDrawerToggle }: AppRoutesProps) {

    const { authData, isLoading } = useAuth();  
    const isLoggedIn = !!authData; 
    const currentUserId = authData?.id || null;

    const onDeleteReceta = async (recetaId: number) => {
        console.log(`Función de eliminar receta llamada para el ID: ${recetaId}`);
    };

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
                path="/editar-perfil" 
                element={
                    <ProtectedRoute>
                        <EditarPerfil />
                    </ProtectedRoute>
                }
            />

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
            <Route path="/perfil/:id" element={<Perfil />} />

            <Route
                path="/perfil/:id/publicaciones"
                element={
                    <PublicacionScrollablePage
                        onDrawerToggle={onDrawerToggle}
                        currentUserId={currentUserId}
                        onDeleteReceta={onDeleteReceta}
                    />
                }
            />
        </Routes>
    );
}