import React, { useState, useEffect, useRef } from 'react';
import { useTendenciasService } from '../services/tendenciasService';
import Receta from 'components/Receta';
import { useNavigate } from 'react-router-dom'; 

// Importaciones de Material-UI
import Dialog from '@mui/material/Dialog';
import Slide from '@mui/material/Slide';
import LogoApp from '../assets/images/logo-blanco.png';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import CircularProgress from '@mui/material/CircularProgress'; // Agregué el import de CircularProgress para la carga
import type { Comentario } from 'components/DrawerComentarios';
import { Box } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import './Tendencias.css'; 

import type { RecetaType, Usuario } from '../types/Receta';

const Tendencias = () => {
    const [tendencias, setTendencias] = useState<RecetaType[]>([]);
    const [recetaSeleccionada, setRecetaSeleccionada] = useState<RecetaType | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { obtenerTendencias } = useTendenciasService();
    const { authData } = useAuth(); 
    const [seEjecutoUnaVez, setSeEjecutoUnaVez] = useState(false);
    const navigate = useNavigate();
    
    // Estado para el diálogo
    const [openDialog, setOpenDialog] = useState(false);
    
    // Ref para el elemento main
    const mainRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        // Lógica para agregar y quitar la clase al elemento main
        const mainElement = document.querySelector('main');
        if (mainElement) {
            mainElement.classList.add('tendencias-page');
            mainRef.current = mainElement;
        }

        return () => {
            if (mainRef.current) {
                mainRef.current.classList.remove('tendencias-page');
            }
        };
    }, []);

    useEffect(() => {
        const fetchTendencias = async () => {
            if (!authData?.token || seEjecutoUnaVez) {
                if (!authData?.token) {
                    setCargando(false);
                }
                return;
            }
            try {
                setCargando(true);
                const data = await obtenerTendencias();
                setTendencias(Array.isArray(data) ? data : []);
                setError(null);
            } catch (err) {
                console.error("Error al cargar las tendencias:", err);
                setError("No se pudieron cargar las tendencias.");
                setTendencias([]);
            } finally {
                setCargando(false);
                setSeEjecutoUnaVez(true);
            }
        };
        fetchTendencias();
    }, [obtenerTendencias, authData, seEjecutoUnaVez]);

    const handleRecetaClick = (receta: RecetaType) => {
        setRecetaSeleccionada(receta);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setRecetaSeleccionada(null);
    };

    const handleUsuarioClick = (userId: number) => {
        navigate(`/perfil/${userId}`);
    };

    // FUNCIÓN PARA RENDERIZAR LA GALERÍA (se mantiene la cuadrícula)
    const renderGaleriaTendencias = () => {
        if (!tendencias || tendencias.length === 0) {
            return <div className="sin-recetas">No hay tendencias para mostrar.</div>;
        }

        return (
            <div className="grilla-tendencias">
                {tendencias.map((receta) => {
                    // console.log("Receta en tendencias:", receta);
                    const imageData = `data:image/jpeg;base64,${receta.imagen}`;
                    return (
                        <div 
                            key={receta.id} 
                            className="galeria-item" 
                            onClick={() => handleRecetaClick(receta)}
                        >
                            <img
                                src={imageData}
                                alt={receta.titulo ?? `Receta-${receta.id}`}
                            />
                        </div>
                    );
                })}
            </div>
        );
    };
    // FIN DE LA FUNCIÓN DE RENDERIZADO

    if (cargando) {
        return (
            <div className="cargando-tendencias">
                <CircularProgress color="primary" />
                <div>Cargando tendencias...</div>
            </div>
        );
    }

    if (error) {
        return <div className="error-container">{error}</div>;
    }

    return (
        <>
            <div className="tendencias-container">
                {/* La vista principal sigue siendo la cuadrícula */}
                {renderGaleriaTendencias()}
            </div>

            {/* Diálogo para mostrar la receta completa */}
            <Dialog
                fullScreen
                open={openDialog}
                onClose={handleCloseDialog}
                slots={{ transition: Slide }}
                slotProps={{
                    transition: {
                        direction: 'up',
                    },
                    paper: {
                        sx: {
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center', 
                            // Esta clase en el paper controla el ancho máximo del Dialog
                            '& .receta-container': { 
                                width: '100%',
                                maxWidth: 500, 
                                margin: '0 auto', 
                            },
                        },
                    },
                }}
            >

                {/* Encabezado fijo */}
                <Box className="header-contenedor-principal ">
                    <Box className="header-input-seccion ">
                        <Box
                            component="img"
                            src={LogoApp}
                            sx={{
                                width: 50,
                                height: 'auto',
                                mr: 1, 
                            }}
                        />
                        <span>#Tendencias</span> 
                    </Box>
                </Box>

                {/* Contenido desplazable (scrollable) */}
                <Box
                    sx={{
                        flexGrow: 1, 
                        overflowY: 'auto', 
                        p: 0, // ⬅️ CAMBIO CLAVE: Quitamos el padding para que la receta ocupe el 100% del ancho
                        backgroundColor: 'background.default', 
                    }}
                >
                    {recetaSeleccionada && (
                    <div className="receta-contenido">
                        <Receta
                        receta={{
                            ...recetaSeleccionada,
                            // Aseguramos que los booleanos tengan valores por defecto para el componente Receta
                            noMeGusta: recetaSeleccionada.noMeGusta ?? false,
                            esFavorito: recetaSeleccionada.esFavorito ?? false,
                            seguido: recetaSeleccionada.seguido ?? false,
                        }}
                        onDrawerToggle={() => {}}
                        currentUserId={authData?.id ?? null}
                        onDeleteReceta={async () => {}}
                        onUsuarioClick={handleUsuarioClick}
                        />
                    </div>
                    )}

                </Box>
                    
                {/* Pie de página fijo */}
                <Box sx={{
                    width: '100%',
                    height: 55,
                    background: 'linear-gradient(to right, #1f46b2, #1a2a6c, #002242)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2, 
                }}>
                <IconButton
                    edge="start"
                    color="inherit"
                    onClick={handleCloseDialog}
                    aria-label="close"
                    sx={{ color: '#ffffffff' }}
                >
                    <ArrowBackIcon />
                </IconButton>
                
                <WhatshotIcon sx={{ color: '#ffffffff' }}/> 
                
                <IconButton color="inherit" aria-label="spacer" sx={{ visibility: 'hidden' }}>
                    <ArrowBackIcon />
                </IconButton>
                </Box>
            </Dialog>
        </>
    );
};

export default Tendencias;