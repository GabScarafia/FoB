import * as React from "react";
import {
    Dialog,
    DialogContent,
    TextField,
    Button,
    Box,
    Typography,
    AppBar,
    Toolbar,
    IconButton,
    Slide,
    MenuItem,
    Chip,
    Autocomplete,
    CircularProgress,
    alpha
} from "@mui/material";
import type { TransitionProps } from '@mui/material/transitions';
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import CloseIcon from '@mui/icons-material/CancelRounded';
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import logoImage from '../assets/images/logo-blanco.png';
import { useAuth } from "../context/AuthContext";
import type { etiquetaType } from "types/Etiqueta";
import type { utensilioType } from "types/Utensilio";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { BASE_URL } from "../apiConfig";


interface CreateRecetaDialogProps {
    open: boolean;
    onClose: () => void;
    onRecetaCreada?: () => void; // Opcional
    ingrediente?: string;
    desafioId?: number;
    recetaParaEditar?: any | null; // Nueva prop para la receta a editar
}

// ----------------------------------------------------
// TIPOS
// ----------------------------------------------------
type IngredienteType = { id: number; nombre: string };
type UnidadType = { id: number; nombre: string; simbolo: string };

interface IngredienteRecetaPayload {
    nombre: string;
    ingredienteId: number;
    cantidad: number;
    unidadDeMedida: string;
    unidadId: number;
}

interface NuevoIngredienteState {
    ingrediente: IngredienteType | null;
    cantidad: string;
    unidad: UnidadType | null;
}

// Estructura para Pasos (ya tiene contentType)
type PasoType = { titulo: string; descripcion: string; imagen: string | null, contentType: string | null };
// ----------------------------------------------------

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
        children: React.ReactElement;
    },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

// Hook de Debounce
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

    React.useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

export default function CreateRecetaDialog({ open, onClose, onRecetaCreada, ingrediente, desafioId, recetaParaEditar }: CreateRecetaDialogProps) {
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [dificultad, setDificultad] = React.useState('');
    const [previewImage, setPreviewImage] = React.useState<string | null>(null);

    // --- 1. ESTADO NUEVO ---
    // Guardamos el "image/jpeg" o "video/mp4" de la portada
    const [mainContentType, setMainContentType] = React.useState<string | null>(null);

    const [minutes, setMinutes] = React.useState<string>('');
    const [titulo, setTitulo] = React.useState('');
    const [descripcion, setDescripcion] = React.useState('');

    const [ingredientes, setIngredientes] = React.useState<IngredienteRecetaPayload[]>([]);

    const [nuevoIngrediente, setNuevoIngrediente] = React.useState<NuevoIngredienteState>({
        ingrediente: null,
        cantidad: '',
        unidad: null
    });

    // Ingredientes Debounce
    const [inputIngrediente, setInputIngrediente] = React.useState('');
    const debouncedInputIngrediente = useDebounce(inputIngrediente, 500);
    const [ingredienteOptions, setIngredienteOptions] = React.useState<IngredienteType[]>([]);
    const [cargandoIngredientes, setCargandoIngredientes] = React.useState(false);

    // Unidades Debounce
    const [inputUnidad, setInputUnidad] = React.useState('');
    const debouncedInputUnidad = useDebounce(inputUnidad, 500);
    const [unidadOptions, setUnidadOptions] = React.useState<UnidadType[]>([]);
    const [cargandoUnidades, setCargandoUnidades] = React.useState(false);

    // Etiquetas Debounce
    const [etiquetas, setEtiquetas] = React.useState<etiquetaType[]>([]);
    const [inputEtiqueta, setInputEtiqueta] = React.useState('');
    const [etiquetaOptions, setEtiquetaOptions] = React.useState<etiquetaType[]>([]);
    const debouncedInputEtiqueta = useDebounce(inputEtiqueta, 500);

    // Utencilios Debounce
    const [utencilios, setUtencilios] = React.useState<utensilioType[]>([]);
    const [inputUtencilio, setInputUtencilio] = React.useState('');
    const [utencilioOptions, setUtencilioOptions] = React.useState<utensilioType[]>([]);
    const debouncedInputUtencilio = useDebounce(inputUtencilio, 500);

    // Pasos
    const [pasos, setPasos] = React.useState<PasoType[]>([{ titulo: '', descripcion: '', imagen: null, contentType: null }]);
    const [pasoActualIndex, setPasoActualIndex] = React.useState(0);

    const { authData } = useAuth();

    // --- EFECTO PARA PRECARGAR DATOS SI ES EDICIÓN ---
    React.useEffect(() => {
        if (recetaParaEditar && open) {
            setTitulo(recetaParaEditar.titulo || '');
            setDescripcion(recetaParaEditar.descripcion || '');

            if (recetaParaEditar.imagenUrl) {
                const fullUrl = recetaParaEditar.imagenUrl.startsWith('/') ? `${BASE_URL}${recetaParaEditar.imagenUrl}` : recetaParaEditar.imagenUrl;
                setPreviewImage(fullUrl);
                setMainContentType(recetaParaEditar.contentType || 'image/jpeg');
            } else {
                setPreviewImage(null);
            }

            // Handle difficulty - can be either numeric index or string name
            const dificultades = ['Facil', 'Medio', 'Dificil', 'Experto'];
            if (typeof recetaParaEditar.dificultad === 'number') {
                setDificultad(dificultades[recetaParaEditar.dificultad] || '');
            } else if (typeof recetaParaEditar.dificultad === 'string') {
                setDificultad(recetaParaEditar.dificultad);
            }

            if (recetaParaEditar.tiempoPreparacion) {
                // Handle TimeSpan format (HH:MM:SS) or numeric minutes
                const timeValue = String(recetaParaEditar.tiempoPreparacion);
                if (timeValue.includes(':')) {
                    const timeParts = timeValue.split(':');
                    const totalMinutes = (+timeParts[0]) * 60 + (+timeParts[1]);
                    setMinutes(String(totalMinutes));
                } else {
                    setMinutes(timeValue);
                }
            } else {
                setMinutes('');
            }

            setIngredientes(recetaParaEditar.ingredientes?.map((ing: any) => ({
                nombre: ing.nombre,
                ingredienteId: ing.id, // Ojo: verificar si id viene como 'id' o 'ingredienteId'
                cantidad: ing.cantidad,
                unidadDeMedida: ing.unidadDeMedida,
                unidadId: ing.unidadId,
            })) || []);

            setEtiquetas(recetaParaEditar.etiquetas?.map((et: any) => typeof et === 'string' ? { id: null, nombre: et } : et) || []);
            setUtencilios(recetaParaEditar.utensilios?.map((ut: any) => typeof ut === 'string' ? { id: null, nombre: ut } : ut) || []);

            setPasos(recetaParaEditar.pasos?.map((paso: any) => ({
                titulo: paso.titulo || '',
                descripcion: paso.descripcion || '',
                imagen: paso.imagenUrl ? (paso.imagenUrl.startsWith('/') ? `${BASE_URL}${paso.imagenUrl}` : paso.imagenUrl) : null,
                contentType: paso.contentType || null
            })) || [{ titulo: '', descripcion: '', imagen: null, contentType: null }]);
        }
    }, [recetaParaEditar, open]);


    // EFECTO PARA BÚSQUEDA DE INGREDIENTES
    React.useEffect(() => {
        const fetchIngredientes = async () => {
            const texto = debouncedInputIngrediente.trim();
            if (texto.length >= 2) {
                setCargandoIngredientes(true);
                try {
                    const response = await fetch(`${BASE_URL}/Dominio/Ingredientes?texto=${encodeURIComponent(texto)}`, {
                        headers: { "Authorization": `Bearer ${authData?.token}` }
                    });
                    if (response.ok) {
                        const data: IngredienteType[] = await response.json();
                        setIngredienteOptions(data);
                    } else {
                        setIngredienteOptions([]);
                    }
                } catch (error) {
                    setIngredienteOptions([]);
                } finally {
                    setCargandoIngredientes(false);
                }
            } else {
                setIngredienteOptions([]);
            }
        };
        if (authData?.token) {
            fetchIngredientes();
        }
    }, [debouncedInputIngrediente, authData?.token]);

    // EFECTO PARA BÚSQUEDA DE UNIDADES
    React.useEffect(() => {
        const fetchUnidades = async () => {
            const texto = debouncedInputUnidad.trim();
            if (texto.length >= 1) {
                setCargandoUnidades(true);
                try {
                    const response = await fetch(`${BASE_URL}/Dominio/Unidades?texto=${encodeURIComponent(texto)}`, {
                        headers: { "Authorization": `Bearer ${authData?.token}` }
                    });
                    if (response.ok) {
                        const data: UnidadType[] = await response.json();
                        setUnidadOptions(data);
                    } else {
                        setUnidadOptions([]);
                    }
                } catch (error) {
                    setUnidadOptions([]);
                } finally {
                    setCargandoUnidades(false);
                }
            } else {
                setUnidadOptions([]);
            }
        };
        if (authData?.token) {
            fetchUnidades();
        }
    }, [debouncedInputUnidad, authData?.token]);

    // EFECTO PARA BÚSQUEDA DE ETIQUETAS
    React.useEffect(() => {
        const fetchEtiquetas = async () => {
            const texto = debouncedInputEtiqueta.trim();
            if (texto.length >= 2) {
                try {
                    const response = await fetch(`${BASE_URL}/Dominio/Etiquetas?texto=${encodeURIComponent(texto)}`, {
                        headers: { "Authorization": `Bearer ${authData?.token}` }
                    });
                    if (response.ok) {
                        const data: etiquetaType[] = await response.json();
                        const newOptions = data.filter(opt =>
                            !etiquetas.some(selected => selected.id === opt.id)
                        );
                        setEtiquetaOptions(newOptions);
                    } else {
                        setEtiquetaOptions([]);
                    }
                } catch (error) {
                    setEtiquetaOptions([]);
                }
            } else {
                setEtiquetaOptions([]);
            }
        };
        if (authData?.token) {
            fetchEtiquetas();
        }
    }, [debouncedInputEtiqueta, authData?.token, etiquetas]);

    // EFECTO PARA AUTO-AGREGAR ETIQUETAS
    React.useEffect(() => {
        const autoAgregarIngredienteComoEtiqueta = async () => {
            if (!ingrediente) return;
            const texto = ingrediente.trim();
            if (texto.length < 2) return;
            if (!authData?.token) return;
            if (etiquetas.some(e => e.nombre.toLowerCase() === texto.toLowerCase())) return;

            try {
                // Agregar etiqueta del ingrediente
                const response = await fetch(`${BASE_URL}/Dominio/Etiquetas?texto=${encodeURIComponent(texto)}`, {
                    headers: { "Authorization": `Bearer ${authData?.token}` }
                });
                if (response.ok) {
                    const data: etiquetaType[] = await response.json();
                    const match = data.find(opt => opt.nombre.toLowerCase() === texto.toLowerCase());
                    if (match && !etiquetas.some(e => e.id === match.id)) {
                        setEtiquetas(prev => [...prev, match]);
                        setInputEtiqueta('');
                        setEtiquetaOptions([]);
                    }
                }
            } catch (err) {
                console.error('Error de red al autocompletar etiqueta desde ingrediente:', err);
            }

            // Agregar etiqueta "desafio"
            try {
                const desafioTexto = 'desafio';
                if (!etiquetas.some(e => e.nombre.toLowerCase() === desafioTexto)) {
                    const respDesafio = await fetch(`${BASE_URL}/Dominio/Etiquetas?texto=${encodeURIComponent(desafioTexto)}`, {
                        headers: { "Authorization": `Bearer ${authData?.token}` }
                    });
                    if (respDesafio.ok) {
                        const dataDesafio: etiquetaType[] = await respDesafio.json();
                        const matchDesafio = dataDesafio.find(opt => opt.nombre.toLowerCase() === desafioTexto);
                        if (matchDesafio && !etiquetas.some(e => e.id === matchDesafio.id)) {
                            setEtiquetas(prev => [...prev, matchDesafio]);
                        }
                    }
                }
            } catch (err) {
                console.error('Error de red al intentar agregar etiqueta "desafio":', err);
            }
        };

        if (open) {
            autoAgregarIngredienteComoEtiqueta();
        }
    }, [ingrediente, authData?.token, etiquetas, open]);

    // EFECTO PARA BÚSQUEDA DE UTENCILLOS
    React.useEffect(() => {
        const fetchUtencilios = async () => {
            const texto = debouncedInputUtencilio.trim();
            if (texto.length >= 2) {
                try {
                    const response = await fetch(`${BASE_URL}/Dominio/Utensilios?texto=${encodeURIComponent(texto)}`, {
                        headers: { "Authorization": `Bearer ${authData?.token}` }
                    });
                    if (response.ok) {
                        const data: utensilioType[] = await response.json();
                        const newOptions = data.filter(opt =>
                            !utencilios.some(selected => selected.id === opt.id)
                        );
                        setUtencilioOptions(newOptions);
                    } else {
                        setUtencilioOptions([]);
                    }
                } catch (error) {
                    setUtencilioOptions([]);
                }
            } else {
                setUtencilioOptions([]);
            }
        };

        if (authData?.token) {
            fetchUtencilios();
        }
    }, [debouncedInputUtencilio, authData?.token, utencilios]);


    const handleAddIngrediente = () => {
        if (nuevoIngrediente.ingrediente && nuevoIngrediente.cantidad && nuevoIngrediente.unidad) {
            setIngredientes([...ingredientes, {
                nombre: nuevoIngrediente.ingrediente.nombre,
                ingredienteId: nuevoIngrediente.ingrediente.id,
                cantidad: parseFloat(nuevoIngrediente.cantidad),
                unidadDeMedida: nuevoIngrediente.unidad.simbolo || nuevoIngrediente.unidad.nombre,
                unidadId: nuevoIngrediente.unidad.id
            }]);
            setNuevoIngrediente({ ingrediente: null, cantidad: '', unidad: null });
            setInputIngrediente('');
            setInputUnidad('');
            setIngredienteOptions([]);
            setUnidadOptions([]);
        }
    };

    const handleRemoveIngrediente = (index: number) => {
        setIngredientes(ingredientes.filter((_, i) => i !== index));
    };

    const handleAddEtiqueta = (etiqueta: etiquetaType | null) => {
        if (etiqueta && !etiquetas.some(e => e.id === etiqueta.id)) {
            setEtiquetas([...etiquetas, etiqueta]);
            setInputEtiqueta('');
            setEtiquetaOptions([]);
            const matchingIngredient = ingredienteOptions.find(
                (ing) => ing.nombre.toLowerCase() === etiqueta.nombre.toLowerCase()
            );
            if (matchingIngredient) {
                setNuevoIngrediente((prev) => ({
                    ...prev,
                    ingrediente: matchingIngredient,
                }));
                setInputIngrediente(matchingIngredient.nombre);
            }
        }
    };

    const handleRemoveEtiqueta = (nombreEtiqueta: string) => {
        setEtiquetas(etiquetas.filter(et => et.nombre !== nombreEtiqueta));
    };

    const handleAddUtencilio = (utencillo: utensilioType | null) => {
        if (utencillo && !utencilios.some(u => u.id === utencillo.id)) {
            setUtencilios([...utencilios, utencillo]);
            setInputUtencilio('');
            setUtencilioOptions([]);
        }
    };

    const handleRemoveUtencilio = (nombreUtensilio: string) => {
        setUtencilios(utencilios.filter(ut => ut.nombre !== nombreUtensilio));
    };

    const handleBoxClick = () => {
        fileInputRef.current?.click();
    };

    // --- MANEJADOR DE IMAGEN/VIDEO PRINCIPAL ---
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setMainContentType(file.type);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            // Si cancela, no borramos necesariamente lo que ya había, a menos que quieras
            // setPreviewImage(null);
            // setMainContentType(null);
        }
    };

    // --- MANEJADORES DE PASOS ---
    const handleAddPaso = () => {
        const nuevoPaso = { titulo: '', descripcion: '', imagen: null, contentType: null };
        setPasos([...pasos, nuevoPaso]);
        setPasoActualIndex(pasos.length);
    };

    const handleRemovePaso = (index: number) => {
        if (pasos.length <= 1) return;
        const nuevosPasos = pasos.filter((_, i) => i !== index);
        setPasos(nuevosPasos);
        setPasoActualIndex(Math.max(0, pasoActualIndex - 1));
    };

    const handlePasoClick = (index: number) => {
        setPasoActualIndex(index);
    };

    const handlePasoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const nuevosPasos = [...pasos];
        nuevosPasos[pasoActualIndex] = {
            ...nuevosPasos[pasoActualIndex],
            [name]: value
        };
        setPasos(nuevosPasos);
    };

    // --- MANEJADOR IMAGEN/VIDEO DE PASOS ---
    const handlePasoImagenChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const nuevosPasos = [...pasos];
                nuevosPasos[index].imagen = reader.result as string;
                nuevosPasos[index].contentType = file.type;
                setPasos(nuevosPasos);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemovePasoImagen = (index: number) => {
        const nuevosPasos = [...pasos];
        nuevosPasos[index].imagen = null;
        nuevosPasos[index].contentType = null;
        setPasos(nuevosPasos);
    };


    const [isPublicando, setIsPublicando] = React.useState(false);

    // ----------------------------------------------------------------------
    // SUBMIT REFACTORIZADO
    // ----------------------------------------------------------------------
    const handleSubmit = async () => {
        const isEditing = !!recetaParaEditar;

        if (isPublicando) return;
        setIsPublicando(true);

        if (!authData?.token) {
            console.error("No hay token de autenticación.");
            setIsPublicando(false);
            return;
        }

        // Helper: Data URL -> Base64
        const getBase64FromDataUrl = (dataUrl: string | null) => {
            if (!dataUrl) return null;
            if (dataUrl.startsWith('data:')) {
                return dataUrl.split(',')[1];
            }
            return null; // Es una URL existente, no enviar.
        }

        const totalMinutes = parseInt(minutes);
        const tiempoEnMinutos = isNaN(totalMinutes) ? 0 : totalMinutes;

        // Filtramos pasos vacíos
        const pasosValidos = pasos.filter(paso => {
            const tituloValido = paso.titulo && paso.titulo.trim() !== '';
            const descripcionValida = paso.descripcion && paso.descripcion.trim() !== '';
            return tituloValido || descripcionValida;
        }).map(paso => ({
            titulo: paso.titulo,
            descripcion: paso.descripcion,
            // Solo enviamos base64 si es nueva imagen
            imagen: getBase64FromDataUrl(paso.imagen),
            contentType: paso.contentType // Se envía si existe
        }));

        const imagenBase64 = getBase64FromDataUrl(previewImage);

        // Construimos el Payload COMPLETO (Tanto para Create como Update)
        // Esto asegura que el Backend (RecetaUpdateRequest) reciba todas las listas.
        const payloadToSend: any = {
            titulo,
            descripcion,
            dificultad: dificultad === 'Facil' ? 0 : dificultad === 'Medio' ? 1 : dificultad === 'Dificil' ? 2 : 3,
            tiempoPreparacion: tiempoEnMinutos,
            // Importante: Enviar listas completas. Usar 0 en ID si es nuevo/nulo para evitar errores de int
            ingredientes: ingredientes.map(ing => ({
                id: ing.ingredienteId ?? 0,
                cantidad: ing.cantidad,
                unidadId: ing.unidadId,
                nombre: ing.nombre,
                descripcion: '' // Campo extra si el DTO lo pide
            })),
            etiquetas: etiquetas.map(et => ({
                id: et.id ?? 0,
                nombre: et.nombre
            })),
            utensilios: utencilios.map(ut => ({
                id: ut.id ?? 0,
                nombre: ut.nombre
            })),
            pasos: pasosValidos
        };

        // Lógica condicional para campos opcionales
        if (imagenBase64) {
            payloadToSend.imagen = imagenBase64;
            payloadToSend.contentType = mainContentType;
        }

        // Si es CREATE y hay desafio
        if (!isEditing && desafioId) {
            payloadToSend.desafioId = desafioId;
        }

        console.log('Payload to send:', payloadToSend);

        try {
            const url = isEditing ? `${BASE_URL}/Recetas/${recetaParaEditar.id}` : `${BASE_URL}/Recetas`;
            const method = isEditing ? "PUT" : "POST";

            const response = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authData.token}`
                },
                body: JSON.stringify(payloadToSend),
            });

            // Manejo de respuesta seguro
            let responseBody: any;
            const text = await response.text();
            try {
                if (text) responseBody = JSON.parse(text);
            } catch {
                responseBody = text;
            }

            if (!response.ok) {
                // Log mejorado para depuración
                console.error("Error Backend:", responseBody);
                throw new Error(`Error en la solicitud: ${response.status} ${response.statusText}`);
            }

            console.log(`Receta ${isEditing ? 'actualizada' : 'creada'}:`, responseBody);

            const eventName = isEditing ? 'recetaActualizada' : 'recetaCreada';
            window.dispatchEvent(new CustomEvent(eventName));

            if (onRecetaCreada) {
                onRecetaCreada();
            }

            onClose();

        } catch (error) {
            console.error('Error al guardar la receta:', error);
            alert("Hubo un error al guardar la receta. Revisa la consola para más detalles.");
        } finally {
            setIsPublicando(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullScreen
            TransitionComponent={Transition}
        >
            <AppBar sx={{ position: 'relative', bgcolor: 'primary.main' }}>
                <Toolbar sx={{ justifyContent: 'space-between' }}>
                    <Box
                        component="img"
                        src={logoImage}
                        alt="Logo"
                        sx={{ height: 40, width: 'auto' }}
                    />
                </Toolbar>
            </AppBar>

            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2, pb: 10 }}>

                <TextField
                    label={recetaParaEditar ? "Editar título" : "Título del post"}
                    variant="outlined"
                    fullWidth
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                />

                <input
                    type="file"
                    accept="image/*,video/*"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                />

                {/* --- VISTA PREVIA PRINCIPAL (Soporta Video) --- */}
                {previewImage && (
                    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mb: 2 }}>
                        {mainContentType && mainContentType.startsWith('video/') ? (
                            <video
                                src={previewImage}
                                style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 8 }}
                                controls
                                autoPlay
                                muted
                                loop
                                playsInline
                                controlsList="nodownload"
                            />
                        ) : (
                            <img
                                src={previewImage}
                                alt="Vista previa"
                                style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 8 }}
                            />
                        )}
                    </Box>
                )}

                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                        border: '2px dashed #999',
                        borderRadius: 2,
                        p: 3,
                        cursor: 'pointer',
                        ...(previewImage && {
                            border: 'none',
                            backgroundColor: 'action.hover'
                        }),
                    }}
                    onClick={handleBoxClick}
                >
                    {!previewImage && (
                        <>
                            <AddPhotoAlternateIcon sx={{ fontSize: 60, color: 'primary.main' }} />
                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                                SUBIR FOTO/VIDEO
                            </Typography>
                        </>
                    )}
                    {previewImage && (
                        <Typography variant="subtitle2" color="textSecondary">
                            Cambiar foto/video
                        </Typography>
                    )}
                </Box>

                <TextField
                    label="Descripción"
                    variant="outlined"
                    multiline
                    rows={4}
                    fullWidth
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                />

                {/* --- SECCIÓN DE PASOS --- */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 0.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        Pasos de preparación
                    </Typography>

                    {/* Navegación de pasos */}
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        {pasos.map((_, index) => (
                            <Box
                                key={index}
                                onClick={() => handlePasoClick(index)}
                                sx={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    bgcolor: pasoActualIndex === index ? '#182969' : 'grey.400',
                                    color: 'white',
                                    fontWeight: 'bold',
                                }}
                            >
                                {index + 1}
                            </Box>
                        ))}
                        {/* Botón Añadir Paso */}
                        <Box
                            onClick={() => {
                                const nuevoPaso: PasoType = { titulo: '', descripcion: '', imagen: null, contentType: null };
                                setPasos((prev) => [...prev, nuevoPaso]);
                                setPasoActualIndex(pasos.length);
                            }}
                            sx={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                bgcolor: 'grey.300',
                                color: 'white',
                                fontWeight: 'bold',
                                transition: '0.2s',
                                '&:hover': {
                                    bgcolor: 'grey.400',
                                    transform: 'scale(1.1)',
                                },
                            }}
                        >
                            {pasos.length + 1}
                        </Box>
                        <IconButton color="error" onClick={() => handleRemovePaso(pasoActualIndex)}>
                            <CloseIcon sx={{ fontSize: 30 }} />
                        </IconButton>
                    </Box>

                    {/* Campos de paso */}
                    {pasos.length > 0 && (
                        <>
                            <TextField
                                label={`Título del paso ${pasoActualIndex + 1} (opcional)`}
                                variant="outlined"
                                fullWidth
                                name="titulo"
                                value={pasos[pasoActualIndex].titulo}
                                onChange={handlePasoChange}
                            />
                            <TextField
                                label={`Descripción del paso ${pasoActualIndex + 1}`}
                                variant="outlined"
                                multiline
                                rows={4}
                                fullWidth
                                name="descripcion"
                                value={pasos[pasoActualIndex].descripcion}
                                onChange={handlePasoChange}
                            />
                            <Box sx={{ mt: 1, mb: 2 }}>
                                <input
                                    type="file"
                                    accept="image/*,video/*"
                                    style={{ display: 'none' }}
                                    id={`paso-imagen-input-${pasoActualIndex}`}
                                    onChange={e => handlePasoImagenChange(e, pasoActualIndex)}
                                />
                                <label htmlFor={`paso-imagen-input-${pasoActualIndex}`}>
                                    <Button variant="outlined" component="span" sx={{ mr: 2 }}>
                                        {pasos[pasoActualIndex].imagen ? 'Cambiar media' : 'Agregar foto/video'}
                                    </Button>
                                </label>

                                {/* --- VISTA PREVIA DEL PASO (Soporta Video) --- */}
                                {pasos[pasoActualIndex].imagen && (
                                    <Box sx={{ display: 'inline-block', position: 'relative', verticalAlign: 'middle' }}>

                                        {pasos[pasoActualIndex].contentType && pasos[pasoActualIndex].contentType!.startsWith('video/') ? (
                                            <video
                                                src={pasos[pasoActualIndex].imagen as string}
                                                style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid #ccc' }}
                                                muted
                                                autoPlay
                                                loop
                                                playsInline
                                            />
                                        ) : (
                                            <img
                                                src={pasos[pasoActualIndex].imagen as string}
                                                alt={`Paso ${pasoActualIndex + 1}`}
                                                style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid #ccc' }}
                                            />
                                        )}

                                        <IconButton
                                            size="small"
                                            sx={{ position: 'absolute', top: 0, right: 0, background: (theme) => alpha(theme.palette.background.paper, 0.7) }}
                                            onClick={() => handleRemovePasoImagen(pasoActualIndex)}
                                        >
                                            <CloseIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                )}
                            </Box>
                        </>
                    )}
                </Box>

                {/* --- SECCIÓN DE INGREDIENTES --- */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        Ingredientes
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>

                        <Autocomplete
                            options={ingredienteOptions}
                            getOptionLabel={(option) => option.nombre}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            value={nuevoIngrediente.ingrediente}
                            onChange={(_, newValue) => {
                                setNuevoIngrediente({ ...nuevoIngrediente, ingrediente: newValue });
                            }}
                            inputValue={inputIngrediente}
                            onInputChange={(_, newInputValue) => {
                                setInputIngrediente(newInputValue);
                            }}
                            filterOptions={(x) => x}
                            loading={cargandoIngredientes}
                            noOptionsText={inputIngrediente.length >= 2 ? "No hay coincidencias" : "Escribe al menos 2 letras"}
                            sx={{ flex: 1.5 }}
                            size="small"
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Ingrediente..."
                                    variant="outlined"
                                    InputProps={{
                                        ...params.InputProps,
                                        endAdornment: (
                                            <>
                                                {cargandoIngredientes ? <CircularProgress color="inherit" size={20} /> : null}
                                                {params.InputProps.endAdornment}
                                            </>
                                        ),
                                    }}
                                />
                            )}
                        />

                        <TextField
                            label="Cantidad..."
                            variant="outlined"
                            size="small"
                            type="number"
                            value={nuevoIngrediente.cantidad}
                            onChange={(e) => setNuevoIngrediente({ ...nuevoIngrediente, cantidad: e.target.value })}
                            inputProps={{ min: 0 }}
                            sx={{ flex: 0.7 }}
                        />

                        <Autocomplete
                            options={unidadOptions}
                            getOptionLabel={(option) => option.simbolo || option.nombre}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            value={nuevoIngrediente.unidad}
                            onChange={(_, newValue) => {
                                setNuevoIngrediente({ ...nuevoIngrediente, unidad: newValue });
                            }}
                            inputValue={inputUnidad}
                            onInputChange={(_, newInputValue) => {
                                setInputUnidad(newInputValue);
                            }}
                            filterOptions={(x) => x}
                            loading={cargandoUnidades}
                            noOptionsText={inputUnidad.length >= 1 ? "No hay coincidencias" : "Escribe para buscar"}
                            sx={{ flex: 0.8 }}
                            size="small"
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Unidad"
                                    variant="outlined"
                                    InputProps={{
                                        ...params.InputProps,
                                        endAdornment: (
                                            <>
                                                {cargandoUnidades ? <CircularProgress color="inherit" size={20} /> : null}
                                                {params.InputProps.endAdornment}
                                            </>
                                        ),
                                    }}
                                />
                            )}
                        />

                        <IconButton
                            onClick={handleAddIngrediente}
                            color="primary"
                            sx={{ p: 0.5 }}
                            disabled={!nuevoIngrediente.ingrediente || !nuevoIngrediente.cantidad || !nuevoIngrediente.unidad}
                        >
                            <AddCircleIcon sx={{ fontSize: 40 }} />
                        </IconButton>
                    </Box>

                    {/* Lista de ingredientes agregados */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {ingredientes.map((ing, index) => (
                            <Box
                                key={index}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    bgcolor: '#182969',
                                    color: 'white',
                                    borderRadius: '16px',
                                    pr: 1,
                                    pl: 2,
                                    py: 0.5,
                                    fontSize: '0.875rem',
                                    fontWeight: 'bold',
                                }}
                            >
                                {`${ing.nombre} ${ing.cantidad} ${ing.unidadDeMedida}`}
                                <IconButton
                                    size="small"
                                    onClick={() => handleRemoveIngrediente(index)}
                                    sx={{ color: 'white' }}
                                >
                                    <CloseIcon sx={{ fontSize: '1rem' }} />
                                </IconButton>
                            </Box>
                        ))}
                    </Box>
                </Box>

                {/* --- SECCIÓN DE UTENSILIOS --- */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        Utensilios Necesarios
                    </Typography>
                    <Autocomplete
                        options={utencilioOptions}
                        getOptionLabel={(option) => option.nombre}
                        value={null}
                        onChange={(_, newValue) => {
                            handleAddUtencilio(newValue);
                        }}
                        inputValue={inputUtencilio}
                        onInputChange={(_, newInputValue) => {
                            setInputUtencilio(newInputValue);
                        }}
                        filterOptions={(x) => x}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Buscar o agregar utensilio..."
                                variant="outlined"
                                size="small"
                            />
                        )}
                        noOptionsText={inputUtencilio.length >= 2 ? "No hay coincidencias" : "Escribe al menos 2 letras para buscar"}
                        sx={{ width: '100%' }}
                    />
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                        {utencilios.map((ut) => (
                            <Chip
                                key={ut.id || ut.nombre}
                                label={ut.nombre}
                                onDelete={() => handleRemoveUtencilio(ut.nombre)}
                                sx={{
                                    bgcolor: '#182969',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    '& .MuiChip-deleteIcon': {
                                        color: 'white',
                                    }
                                }}
                            />
                        ))}
                    </Box>
                </Box>

                {/* --- SECCIÓN DE ETIQUETAS --- */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        Etiquetas
                    </Typography>
                    <Autocomplete
                        options={etiquetaOptions}
                        getOptionLabel={(option) => option.nombre}
                        value={null}
                        onChange={(_, newValue) => {
                            handleAddEtiqueta(newValue);
                        }}
                        inputValue={inputEtiqueta}
                        onInputChange={(_, newInputValue) => {
                            setInputEtiqueta(newInputValue);
                        }}
                        filterOptions={(x) => x}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Buscar o agregar etiqueta..."
                                variant="outlined"
                                size="small"
                            />
                        )}
                        noOptionsText={inputEtiqueta.length >= 2 ? "No hay coincidencias" : "Escribe al menos 2 letras para buscar"}
                        sx={{ width: '100%' }}
                    />
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                        {etiquetas.map((et) => {
                            const isDesafio = et.nombre.toLowerCase() === 'desafio';
                            return (
                                <Chip
                                    key={et.id || et.nombre}
                                    label={et.nombre}
                                    onDelete={() => handleRemoveEtiqueta(et.nombre)}
                                    sx={{
                                        bgcolor: '#182969',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        '& .MuiChip-deleteIcon': {
                                            color: 'white',
                                        },
                                        ...(isDesafio && {
                                            background: 'linear-gradient(to right, #FF7B00, #FFD700)',
                                            color: 'white',
                                            fontWeight: 'bold',
                                            '&:hover': {
                                                opacity: 0.9
                                            }
                                        }),
                                    }}
                                />
                            );
                        })}
                    </Box>
                </Box>

                {/* --- DIFICULTAD Y MINUTOS --- */}
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                        sx={{ flexGrow: 5 }}
                        label="Dificultad"
                        variant="outlined"
                        select
                        value={dificultad}
                        onChange={(e) => setDificultad(e.target.value)}
                        SelectProps={{
                            IconComponent: ArrowDropDownIcon
                        }}
                    >
                        <MenuItem value="Facil">Fácil</MenuItem>
                        <MenuItem value="Medio">Medio</MenuItem>
                        <MenuItem value="Dificil">Difícil</MenuItem>
                        <MenuItem value="Experto">Experto</MenuItem>
                    </TextField>

                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexGrow: 1 }}>
                        <AccessTimeIcon sx={{ color: 'text.secondary' }} />
                        <TextField
                            label="Minutos"
                            variant="outlined"
                            type="number"
                            value={minutes}
                            onChange={(e) => setMinutes(e.target.value)}
                            inputProps={{ min: 0, max: 59 }}
                            sx={{ width: '100%' }}
                        />
                    </Box>
                </Box>

                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubmit}
                    disabled={isPublicando}
                    sx={{
                        mt: 3,
                        background: "linear-gradient(to right, #1f46b2, #1a2a6c, #002242)",
                        color: "white",
                        '&:hover': {
                            background: "linear-gradient(to right, #1a2a6c, #1f46b2, #002242)"
                        }
                    }}
                >
                    {isPublicando ? <CircularProgress size={24} sx={{ color: 'white' }} /> : (recetaParaEditar ? "Guardar Cambios" : "Publicar Receta")}
                </Button>
            </DialogContent>

            {/* Pie de página fijo */}
            <Box sx={{
                width: '100%',
                height: 55,
                background: 'linear-gradient(to right, #1f46b2, #1a2a6c, #002242)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 2,
                position: 'fixed',
                bottom: 0,
                left: 0,
                zIndex: 1201
            }}>
                <IconButton
                    edge="start"
                    color="inherit"
                    onClick={onClose}
                    aria-label="close"
                    sx={{ color: '#ffffffff' }}
                >
                    <ArrowBackIcon />
                </IconButton>

                <AddCircleIcon sx={{ color: '#ffffffff' }} />

                <IconButton color="inherit" aria-label="spacer" sx={{ visibility: 'hidden' }}>
                    <ArrowBackIcon />
                </IconButton>
            </Box>
        </Dialog>
    );
}