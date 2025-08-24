import { useAuth } from '../context/AuthContext'; // Importamos el hook de autenticación

export const useTendenciasService = () => {
    // Usamos el hook useAuth para obtener el token directamente
    const { authData } = useAuth();

    // Función para obtener las recetas en tendencia, ya no necesita recibir el token
    const obtenerTendencias = async () => {
        // Obtenemos el token del estado de autenticación
        const token = authData?.token;
        
        // Verificamos si el token existe. Si no, lanzamos un error o devolvemos un array vacío.
        if (!token) {
            console.error("No se encontró el token de autenticación.");
            throw new Error("Usuario no autenticado.");
        }

        try {
            const response = await fetch('https://localhost:7084/Recetas/Tendencias', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;

        } catch (error) {
            throw error;
        }
    };
    
    return {
        obtenerTendencias,
    };
};