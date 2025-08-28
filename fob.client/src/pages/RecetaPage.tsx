import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Receta from '../components/Receta';
import { useAuth } from '../context/AuthContext';
import type { PropsReceta } from '../components/Receta';

interface RecetaPageProps {
    onDrawerToggle: PropsReceta['onDrawerToggle'];
    onDeleteReceta: PropsReceta['onDeleteReceta'];
}

const RecetaPage: React.FC<RecetaPageProps> = ({
    onDrawerToggle,
    onDeleteReceta,
}) => {
    const { authData } = useAuth();
    const token = authData?.token ?? null;
    const currentUserId = authData?.id ?? null;

    // Obtiene el ID de la receta de la URL usando useParams
    const { recetaId: urlRecetaId } = useParams<{ recetaId: string }>();

    const [receta, setReceta] = useState<PropsReceta['receta'] | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchReceta = async () => {
            if (!urlRecetaId) {
                setError('ID de receta no proporcionado en la URL.');
                setCargando(false);
                return;
            }

            const idReceta = Number(urlRecetaId);
            if (isNaN(idReceta)) {
                setError('ID de receta no válido.');
                setCargando(false);
                return;
            }

            try {
                const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                if (token) headers['Authorization'] = `Bearer ${token}`;

                const res = await fetch(`https://localhost:7084/Recetas/${idReceta}`, { headers });

                if (!res.ok) {
                    if (res.status === 404) {
                        setError('Receta no encontrada.');
                    } else {
                        setError(`Error al cargar la receta: ${res.statusText}`);
                    }
                    setReceta(null);
                    return;
                }

                const data = await res.json();
                data.imagen = data.imagen ?? data.imagenBase64 ?? data.ImagenPrincipalBase64 ?? null;
                setReceta(data);
                setError(null);
            } catch (err) {
                console.error('Error fetching receta:', err);
                setError('Ocurrió un error al conectar con el servidor.');
                setReceta(null);
            } finally {
                setCargando(false);
            }
        };

        fetchReceta();
    }, [urlRecetaId, token]);

    if (cargando) {
        return <div className="loading-message">Cargando receta...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    if (!receta) {
        return <div className="no-data-message">Receta no disponible.</div>;
    }

    return (
        <div className="receta-page-container">
            <Receta
                receta={receta}
                onDrawerToggle={onDrawerToggle}
                currentUserId={currentUserId}
                onDeleteReceta={onDeleteReceta}
            />
        </div>
    );
};

export default RecetaPage;