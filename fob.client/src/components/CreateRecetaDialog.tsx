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
    Chip, // Importamos Chip para las etiquetas
    Autocomplete, // Importamos Autocomplete para el debounce con búsqueda
    CircularProgress, // Importamos CircularProgress para el indicador de carga (Faltaba en tu snippet)
    alpha
} from "@mui/material";
import type { TransitionProps } from '@mui/material/transitions';
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import CloseIcon from '@mui/icons-material/CancelRounded';
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AddCircleIcon from "@mui/icons-material/AddCircle"; // <-- Import AddCircleIcon
import logoImage from '../assets/images/logo-blanco.png';
import { useAuth } from "../context/AuthContext";
import type { etiquetaType } from "types/Etiqueta";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { BASE_URL } from "../apiConfig";


interface CreateRecetaDialogProps {
    open: boolean;
    onClose: () => void;
    ingrediente?: string;
    desafioId?: number;
}

// ----------------------------------------------------
// TIPOS ACTUALIZADOS
// ----------------------------------------------------
type IngredienteType = { id: number; nombre: string };
type UnidadType = { id: number; nombre: string; simbolo: string };

// Estructura que almacenamos en la lista 'ingredientes'
interface IngredienteRecetaPayload {
    nombre: string;
    ingredienteId: number; // ID del Ingrediente
    cantidad: number;
    unidadDeMedida: string; // Para el display (ej: "gr")
    unidadId: number; // ID de la Unidad (Para enviar al backend)
}

// Estructura de Ingrediente temporal para el Autocomplete
interface NuevoIngredienteState {
    ingrediente: IngredienteType | null;
    cantidad: string;
    unidad: UnidadType | null;
}

// Estructura para Pasos
type PasoType = { titulo: string; descripcion: string; imagen: string | null };
// ----------------------------------------------------

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
        children: React.ReactElement;
    },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

// Implementación simple de un hook de debounce
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

export default function CreateRecetaDialog({ open, onClose, ingrediente, desafioId }: CreateRecetaDialogProps) {
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [dificultad, setDificultad] = React.useState('');
    const [previewImage, setPreviewImage] = React.useState<string | null>(null);
    const [minutes, setMinutes] = React.useState<string>('');
    const [titulo, setTitulo] = React.useState('');
    const [descripcion, setDescripcion] = React.useState('');

    // 🍎 Ingredientes (Lista final que incluye los IDs)
    const [ingredientes, setIngredientes] = React.useState<IngredienteRecetaPayload[]>([]);
    
    // 🥑 Nuevo Ingrediente (Estado temporal para el Autocomplete)
    const [nuevoIngrediente, setNuevoIngrediente] = React.useState<NuevoIngredienteState>({
        ingrediente: null,
        cantidad: '',
        unidad: null
    });

    // ----------------------------------------------------
    // ESTADOS Y DEBOUNCE PARA INGREDIENTES Y UNIDADES
    // ----------------------------------------------------
    // Ingredientes
    const [inputIngrediente, setInputIngrediente] = React.useState('');
    const debouncedInputIngrediente = useDebounce(inputIngrediente, 500);
    const [ingredienteOptions, setIngredienteOptions] = React.useState<IngredienteType[]>([]);
    const [cargandoIngredientes, setCargandoIngredientes] = React.useState(false);

    // Unidades
    const [inputUnidad, setInputUnidad] = React.useState('');
    const debouncedInputUnidad = useDebounce(inputUnidad, 500);
    const [unidadOptions, setUnidadOptions] = React.useState<UnidadType[]>([]);
    const [cargandoUnidades, setCargandoUnidades] = React.useState(false);
    // ----------------------------------------------------


    // 🏷 Etiquetas
    const [etiquetas, setEtiquetas] = React.useState<etiquetaType[]>([]);
    const [inputEtiqueta, setInputEtiqueta] = React.useState('');
    const [etiquetaOptions, setEtiquetaOptions] = React.useState<etiquetaType[]>([]);
    const debouncedInputEtiqueta = useDebounce(inputEtiqueta, 500);

    // Estado para los pasos
    const [pasos, setPasos] = React.useState<PasoType[]>([{ titulo: '', descripcion: '', imagen: null }]);
    const [pasoActualIndex, setPasoActualIndex] = React.useState(0);

    const { authData } = useAuth();

    // ----------------------------------------------------
    // EFECTO PARA BÚSQUEDA DE INGREDIENTES (DEBOUNCE)
    // ----------------------------------------------------
    React.useEffect(() => {
        const fetchIngredientes = async () => {
            const texto = debouncedInputIngrediente.trim();

            if (texto.length >= 2) {
                setCargandoIngredientes(true);
                try {
                    const response = await fetch(`${BASE_URL}/Dominio/Ingredientes?texto=${encodeURIComponent(texto)}`, {
                        headers: {
                            "Authorization": `Bearer ${authData?.token}`
                        }
                    });

                    if (response.ok) {
                        const data: IngredienteType[] = await response.json();
                        setIngredienteOptions(data);
                    } else {
                        console.error('Error al buscar ingredientes:', response.statusText);
                        setIngredienteOptions([]);
                    }
                } catch (error) {
                    console.error('Error de red al buscar ingredientes:', error);
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

    // ----------------------------------------------------
    // EFECTO PARA BÚSQUEDA DE UNIDADES (DEBOUNCE)
    // ----------------------------------------------------
    React.useEffect(() => {
        const fetchUnidades = async () => {
            const texto = debouncedInputUnidad.trim();

            if (texto.length >= 1) { 
                setCargandoUnidades(true);
                try {
                    const response = await fetch(`${BASE_URL}/Dominio/Unidades?texto=${encodeURIComponent(texto)}`, {
                        headers: {
                            "Authorization": `Bearer ${authData?.token}`
                        }
                    });

                    if (response.ok) {
                        const data: UnidadType[] = await response.json();
                        setUnidadOptions(data);
                    } else {
                        console.error('Error al buscar unidades:', response.statusText);
                        setUnidadOptions([]);
                    }
                } catch (error) {
                    console.error('Error de red al buscar unidades:', error);
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


    // 🚀 Efecto para la búsqueda de etiquetas con debounce (se mantiene)
    React.useEffect(() => {
        const fetchEtiquetas = async () => {
            const texto = debouncedInputEtiqueta.trim();

            if (texto.length >= 2) {
                try {
                    const response = await fetch(`${BASE_URL}/Dominio/Etiquetas?texto=${encodeURIComponent(texto)}`, {
                        headers: {
                            "Authorization": `Bearer ${authData?.token}`
                        }
                    });

                    if (response.ok) {
                        const data: etiquetaType[] = await response.json();
                        const newOptions = data.filter(opt =>
                            !etiquetas.some(selected => selected.id === opt.id)
                        );
                        setEtiquetaOptions(newOptions);
                    } else {
                        console.error('Error al buscar etiquetas:', response.statusText);
                        setEtiquetaOptions([]);
                    }
                } catch (error) {
                    console.error('Error de red al buscar etiquetas:', error);
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


    // Efecto para auto-agregar ingrediente/desafío como etiqueta (se mantiene)
    React.useEffect(() => {
        const autoAgregarIngredienteComoEtiqueta = async () => {
            if (!ingrediente) return;
            const texto = ingrediente.trim();
            if (texto.length < 2) return;
            if (!authData?.token) return;
            if (etiquetas.some(e => e.nombre.toLowerCase() === texto.toLowerCase())) return;

            try {
                const response = await fetch(`${BASE_URL}/Dominio/Etiquetas?texto=${encodeURIComponent(texto)}`, {
                    headers: {
                        "Authorization": `Bearer ${authData?.token}`
                    }
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

            try {
                const desafioTexto = 'desafio';
                if (!etiquetas.some(e => e.nombre.toLowerCase() === desafioTexto)) {
                    const respDesafio = await fetch(`${BASE_URL}/Dominio/Etiquetas?texto=${encodeURIComponent(desafioTexto)}`, {
                        headers: {
                            "Authorization": `Bearer ${authData?.token}`
                        }
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

    // 5. Lógica de adición de ingrediente actualizada para guardar IDs
    const handleAddIngrediente = () => {
        if (nuevoIngrediente.ingrediente && nuevoIngrediente.cantidad && nuevoIngrediente.unidad) {
            setIngredientes([...ingredientes, {
                nombre: nuevoIngrediente.ingrediente.nombre,
                ingredienteId: nuevoIngrediente.ingrediente.id, // ID del Ingrediente
                cantidad: parseFloat(nuevoIngrediente.cantidad),
                unidadDeMedida: nuevoIngrediente.unidad.simbolo || nuevoIngrediente.unidad.nombre, // String para Display
                unidadId: nuevoIngrediente.unidad.id // ID de la Unidad (Para API)
            }]);
            
            // Reseteamos el estado para el siguiente ingrediente
            setNuevoIngrediente({ ingrediente: null, cantidad: '', unidad: null });
            // Reseteamos el input text de búsqueda
            setInputIngrediente('');
            setInputUnidad('');
            setIngredienteOptions([]); // Limpiar opciones para la siguiente búsqueda
            setUnidadOptions([]);
        }
    };

    const handleRemoveIngrediente = (index: number) => {
        setIngredientes(ingredientes.filter((_, i) => i !== index));
    };

    // ... (otras funciones para pasos y manejo de archivos se mantienen sin cambios)

    const handleBoxClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setPreviewImage(null);
        }
    };

    const handleAddPaso = () => {
        const nuevoPaso = { titulo: '', descripcion: '', imagen: null };
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

    const handlePasoImagenChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const nuevosPasos = [...pasos];
                nuevosPasos[index].imagen = reader.result as string;
                setPasos(nuevosPasos);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemovePasoImagen = (index: number) => {
        const nuevosPasos = [...pasos];
        nuevosPasos[index].imagen = null;
        setPasos(nuevosPasos);
    };

    const handleAddEtiqueta = (etiqueta: etiquetaType | null) => {
        if (etiqueta && !etiquetas.some(e => e.id === etiqueta.id)) {
            setEtiquetas([...etiquetas, etiqueta]);
            setInputEtiqueta('');
            setEtiquetaOptions([]);
        }
    };

    const handleRemoveEtiqueta = (etiquetaId: number) => {
        setEtiquetas(etiquetas.filter(et => et.id !== etiquetaId));
    };

    const [isPublicando, setIsPublicando] = React.useState(false);

    // 7. FUNCIÓN SUBMIT MODIFICADA PARA ENVIAR unidadId e ingredienteId
    const handleSubmit = async () => {

        if (isPublicando) return;
        setIsPublicando(true);

        if (!authData?.token) {
            console.error("No hay token de autenticación.");
            setIsPublicando(false);
            return;
        }

        const pasosValidos = pasos.filter(paso => {
            const tituloValido = paso.titulo && paso.titulo.trim() !== '';
            const descripcionValida = paso.descripcion && paso.descripcion.trim() !== '';
            return tituloValido || descripcionValida;
        }).map(paso => ({
            ...paso,
            imagen: paso.imagen ? paso.imagen.split(',')[1] : null
        }));

        let imagenBase64 = null;
        if (previewImage) {
            imagenBase64 = previewImage.split(',')[1];
        }
        const totalMinutes = parseInt(minutes);
        const tiempoEnMinutos = isNaN(totalMinutes) ? 0 : totalMinutes;

        const data = {
            titulo,
            descripcion,
            imagen: imagenBase64,
            dificultad: dificultad === 'Facil' ? 0 : dificultad === 'Medio' ? 1 : dificultad === 'Dificil' ? 2 : 3,
            tiempoPreparacion: tiempoEnMinutos,
            // LOS INGREDIENTES AHORA MAPEAN unidadId y el id del ingrediente
            ingredientes: ingredientes.map(ing => ({
                nombre: ing.nombre, 
                cantidad: ing.cantidad,
                unidadId: ing.unidadId, // ⬅️ CAMBIO SOLICITADO
                id: ing.ingredienteId, // ⬅️ Enviamos el ID del ingrediente
                descripcion: ''
            })),
            etiquetas: etiquetas.map(et => ({ nombre: et.nombre, id: et.id })),
            pasos: pasosValidos,
            ...(desafioId && { desafioId })
        };

        try {
            const response = await fetch("${BASE_URL}/Recetas", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authData.token}`
                },
                body: JSON.stringify(data),
            });

            let responseBody: any;
            const text = await response.text();
            try {
                responseBody = JSON.parse(text);
            } catch {
                responseBody = text;
            }

            if (!response.ok) {
                throw new Error(`Error en la solicitud: ${response.status} ${response.statusText} - ${JSON.stringify(responseBody)}`);
            }

            console.log('Receta creada:', responseBody);
            onClose();
        } catch (error) {
            console.error('Error al crear la receta:', error);
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
                    label="Título del post"
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

                {previewImage && (
                    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mb: 2 }}>
                        <img src={previewImage} alt="Vista previa" style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain' }} />
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
                        ...(previewImage && { border: 'none', backgroundColor: '#f0f0f0' }),
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

                {/* Sección de Pasos */}
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
                    {/* Círculo del siguiente paso (agregar nuevo) */}
                    <Box
                    onClick={() => {
                        const nuevoPaso: PasoType = { titulo: '', descripcion: '', imagen: null };
                        setPasos((prev) => [...prev, nuevoPaso]);
                        setPasoActualIndex(pasos.length); // mover foco al nuevo paso
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
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    id={`paso-imagen-input-${pasoActualIndex}`}
                                    onChange={e => handlePasoImagenChange(e, pasoActualIndex)}
                                />
                                <label htmlFor={`paso-imagen-input-${pasoActualIndex}`}>
                                    <Button variant="outlined" component="span" sx={{ mr: 2 }}>
                                        {pasos[pasoActualIndex].imagen ? 'Cambiar imagen' : 'Agregar imagen'}
                                    </Button>
                                </label>
                                {pasos[pasoActualIndex].imagen && (
                                    <Box sx={{ display: 'inline-block', position: 'relative', verticalAlign: 'middle' }}>
                                        <img
                                            src={pasos[pasoActualIndex].imagen as string}
                                            alt={`Paso ${pasoActualIndex + 1}`}
                                            style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid #ccc' }}
                                        />
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

                    {/* Visualización de Etiquetas seleccionadas */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                        {etiquetas.map((et) => (
                            <Chip
                                key={et.id}
                                label={et.nombre}
                                onDelete={() => handleRemoveEtiqueta(et.id)}
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

                {/* Dificultad y minutos */}
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

                {/* Ingredientes (SECCIÓN MODIFICADA) */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        Ingredientes
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        
                        {/* CAMPO INGREDIENTE (Autocomplete con Debounce) */}
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

                        {/* Campo Cantidad */}
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

                        {/* CAMPO UNIDAD (Autocomplete con Debounce) */}
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
                        
                        {/* Botón de añadir */}
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
                                {/* Usamos unidadDeMedida para el display, que es el string (ej: "gr") */}
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
                    {isPublicando ? "Publicando..." : "Publicar Receta"}
                </Button>
            </DialogContent>

            {/* Pie de página para estandarizar el estilo */}
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