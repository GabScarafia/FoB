import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CreateRecetaDialog from '../components/CreateRecetaDialog';
import { useAuth } from '../context/AuthContext';
import { BASE_URL } from '../apiConfig';
import type { RecetaType } from '../types/Receta';
import { Box, CircularProgress, Typography } from '@mui/material';

const EditarReceta: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { authData } = useAuth();
    const [receta, setReceta] = useState<RecetaType | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchReceta = async () => {
            if (!id || !authData?.token) {
                setError("No se pudo cargar la receta para editar.");
                setCargando(false);
                return;
            }

            try {
                const response = await fetch(`${BASE_URL}/Recetas/${id}`, {
                    headers: { 'Authorization': `Bearer ${authData.token}` }
                });

                if (!response.ok) {
                    throw new Error('No se pudo obtener los datos de la receta.');
                }

                const data: RecetaType = await response.json();
                setReceta(data);
            } catch (err: any) {
                setError(err.message || 'Error al cargar la receta.');
            } finally {
                setCargando(false);
            }
        };

        fetchReceta();
    }, [id, authData?.token]);

    const handleClose = () => {
        navigate(-1); // Volver a la página anterior
    };

    if (cargando) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress /></Box>;
    }

    if (error) {
        return <Box sx={{ textAlign: 'center', mt: 4 }}><Typography color="error">{error}</Typography></Box>;
    }

    return (
        <CreateRecetaDialog open={true} onClose={handleClose} recetaParaEditar={receta} onRecetaCreada={handleClose} />
    );
};

export default EditarReceta;