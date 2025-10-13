import React, { useState, useEffect, useRef } from 'react';
import { useTendenciasService } from '../services/tendenciasService';
import Receta from 'components/Receta';
// Importamos Link ya que la galería del perfil lo usaba, pero en Tendencias lo usaremos sin navegación para abrir el Diálogo.
import { useNavigate } from 'react-router-dom'; 

// Importaciones de Material-UI
import Dialog from '@mui/material/Dialog';
import Slide from '@mui/material/Slide';
import LogoApp from '../assets/images/logo-blanco.png';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import type { Comentario } from 'components/DrawerComentarios';
import { Box } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import './Tendencias.css'; // Asegúrate de que los estilos 'galeria-item' y 'grilla-tendencias' estén definidos aquí o en otro CSS global.

// Puedes importar Usuario desde otro archivo si ya la tienes definida
import type  { RecetaType, Usuario } from '../types/Receta';

const Tendencias = () => {
    const [tendencias, setTendencias] = useState<RecetaType[]>([]);
    const [recetaSeleccionada, setRecetaSeleccionada] = useState<RecetaType | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { obtenerTendencias } = useTendenciasService();
    const { authData } = useAuth(); // Obtenemos los datos de autenticación
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

    // Nueva función para navegación al perfil
    const handleUsuarioClick = (userId: number) => {
        navigate(`/perfil/${userId}`);
    };

    // FUNCIÓN PARA RENDERIZAR LA GALERÍA (similar a la lógica extraída del Perfil)
    const renderGaleriaTendencias = () => {
        if (!tendencias || tendencias.length === 0) {
            return <div className="sin-recetas">No hay tendencias para mostrar.</div>;
        }

        return (
            <div className="grilla-tendencias">
                {tendencias.map((receta) => {
                    console.log("Receta en tendencias:", receta);
                    const imageData = `data:image/jpeg;base64,${receta.imagen}`;
                    return (
                        <div 
                            key={receta.id} 
                            className="galeria-item" 
                            onClick={() => handleRecetaClick(receta)}
                        >
                            {/* Usamos directamente la etiqueta img dentro del div/item, como en Perfil */}
                            <img
                                src={imageData}
                                alt={receta.titulo ?? `Receta-${receta.id}`}
                            />
                            {/* Opcionalmente podrías agregar un overlay o badge de tendencia aquí */}
                        </div>
                    );
                })}
            </div>
        );
    };
    // FIN DE LA FUNCIÓN DE RENDERIZADO

    if (cargando) {
        return <div className="cargando-tendencias">Cargando tendencias...</div>;
    }

    if (error) {
        return <div className="error-container">{error}</div>;
    }

    return (
        <>
            <div className="tendencias-container">
                {/* INVOCAMOS LA NUEVA FUNCIÓN DE RENDERIZADO DE GALERÍA */}
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
                            alignItems: 'center', '& .receta-container': {
                                width: '100%',
                                maxWidth: 500, // Limita el ancho máximo para pantallas grandes
                                margin: '0 auto', // Centra horizontalmente
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
                                mr: 1, // Margin to the right of the image
                            }}
                            />
                            <span>#Tendencias</span> 
                    </Box>
                </Box>

                {/* Contenido desplazable (scrollable) */}
                <Box
                    sx={{
                        flexGrow: 1, // Ocupa todo el espacio vertical disponible
                        overflowY: 'auto', // Habilita el scroll vertical
                        p: 2, // Espaciado interior opcional
                        backgroundColor: 'background.default', // Color de fondo si es necesario
                    }}
                >
                    {recetaSeleccionada && (
                    <div className="receta-contenido">
                        <Receta
                        receta={{
                            ...recetaSeleccionada,
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
                    p: 2, // padding
                }}>
                {/* Iconos de la imagen */}
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