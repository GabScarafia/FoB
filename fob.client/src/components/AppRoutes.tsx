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

interface AppRoutesProps {
    onDrawerToggle: (isOpen: boolean) => void;
}

export default function AppRoutes({ onDrawerToggle }: AppRoutesProps) {
    const { authData } = useAuth();
    const isLoggedIn = !!authData;
    const currentUserId = authData?.id || null;


    const onDeleteReceta = async (recetaId: number) => {
        console.log(`Función de eliminar receta llamada para el ID: ${recetaId}`);
    };

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
                element={isLoggedIn ? <Navigate to="/feed" replace /> : <Navigate to="/iniciar-sesion" replace />}
            />
            {/* Rutas públicas */}
            <Route path="/iniciar-sesion" element={<IniciarSesion />} />
            <Route path="/registrarse" element={<Registrarse />} />
            <Route path="/tendencias" element={<Tendencias />} />
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