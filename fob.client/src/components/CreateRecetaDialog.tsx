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
    Autocomplete // Importamos Autocomplete para el debounce con búsqueda
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

interface CreateRecetaDialogProps {
    open: boolean;
    onClose: () => void;
    ingrediente?: string;
    desafioId?: number;
}

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

    const [ingredientes, setIngredientes] = React.useState<any[]>([]);
    const [nuevoIngrediente, setNuevoIngrediente] = React.useState({
        nombre: '',
        cantidad: '',
        unidad: ''
    });

    // 🏷 Etiquetas (Almacena el objeto completo de etiqueta)
    const [etiquetas, setEtiquetas] = React.useState<etiquetaType[]>([]);
    // Texto para el input de búsqueda/creación
    const [inputEtiqueta, setInputEtiqueta] = React.useState('');
    // Opciones de sugerencias del backend
    const [etiquetaOptions, setEtiquetaOptions] = React.useState<etiquetaType[]>([]);

    // Hook de Debounce: Espera 500ms después de que inputEtiqueta cambie
    const debouncedInputEtiqueta = useDebounce(inputEtiqueta, 500);

    // Estado para los pasos
    type PasoType = { titulo: string; descripcion: string; imagen: string | null };
    const [pasos, setPasos] = React.useState<PasoType[]>([{ titulo: '', descripcion: '', imagen: null }]);
    const [pasoActualIndex, setPasoActualIndex] = React.useState(0);

    const { authData } = useAuth();

    // 🚀 Efecto para la búsqueda de etiquetas con debounce (manteniendo exactamente tu lógica)
    React.useEffect(() => {
        const fetchEtiquetas = async () => {
            const texto = debouncedInputEtiqueta.trim();

            if (texto.length >= 2) {
                try {
                    // Usamos el token de autenticación para la petición
                    const response = await fetch(`https://localhost:7084/Etiquetas?texto=${encodeURIComponent(texto)}`, {
                        headers: {
                            "Authorization": `Bearer ${authData?.token}`
                        }
                    });

                    if (response.ok) {
                        const data: etiquetaType[] = await response.json();
                        // Filtramos las etiquetas ya seleccionadas
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

        // Sólo buscar si hay token
        if (authData?.token) {
            fetchEtiquetas();
        }

    }, [debouncedInputEtiqueta, authData?.token, etiquetas]); // Dependencia de 'etiquetas' para filtrar las ya seleccionadas


    React.useEffect(() => {
        // Reglas:
        // - solo si viene ingrediente, dialog está abierto y no existe ya en etiquetas
        const autoAgregarIngredienteComoEtiqueta = async () => {
            if (!ingrediente) return;
            const texto = ingrediente.trim();
            if (texto.length < 2) return; //  mínimo de 2 caracteres
            if (!authData?.token) return;
            // Evitar duplicados por nombre
            if (etiquetas.some(e => e.nombre.toLowerCase() === texto.toLowerCase())) return;

            try {
                const response = await fetch(`https://localhost:7084/Etiquetas?texto=${encodeURIComponent(texto)}`, {
                    headers: {
                        "Authorization": `Bearer ${authData?.token}`
                    }
                });

                if (!response.ok) {
                    // Si falla no rompemos nada, solo log
                    console.error('Error al buscar etiqueta por ingrediente:', response.statusText);
                } else {
                    const data: etiquetaType[] = await response.json();
                    // Buscamos coincidencia exacta por nombre (case-insensitive)
                    const match = data.find(opt => opt.nombre.toLowerCase() === texto.toLowerCase());
                    if (match && !etiquetas.some(e => e.id === match.id)) {
                        setEtiquetas(prev => [...prev, match]);
                        // limpiamos input y opciones para que no interfiera con la UI
                        setInputEtiqueta('');
                        setEtiquetaOptions([]);
                    }
                }

            } catch (err) {
                console.error('Error de red al autocompletar etiqueta desde ingrediente:', err);
            }

            // ---- Ahora intentamos agregar también la etiqueta "desafio" ----
            // Solo si no está ya presente
            try {
                const desafioTexto = 'desafio';
                if (!etiquetas.some(e => e.nombre.toLowerCase() === desafioTexto)) {
                    const respDesafio = await fetch(`https://localhost:7084/Etiquetas?texto=${encodeURIComponent(desafioTexto)}`, {
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
                    } else {
                        // no hacemos nada si no existe / no se puede obtener
                        // console.info('Etiqueta "desafio" no encontrada o error al buscarla:', respDesafio.statusText);
                    }
                }
            } catch (err) {
                console.error('Error de red al intentar agregar etiqueta "desafio":', err);
            }
        };

        // Ejecutar solo cuando el diálogo está abierto (evita llamadas cuando componente está montado pero diálogo cerrado)
        if (open) {
            autoAgregarIngredienteComoEtiqueta();
        }
    }, [ingrediente, authData?.token, etiquetas, open]);



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

    const handleAddIngrediente = () => {
        if (nuevoIngrediente.nombre && nuevoIngrediente.cantidad && nuevoIngrediente.unidad) {
            setIngredientes([...ingredientes, {
                nombre: nuevoIngrediente.nombre,
                cantidad: parseFloat(nuevoIngrediente.cantidad),
                unidadDeMedida: nuevoIngrediente.unidad
            }]);
            setNuevoIngrediente({ nombre: '', cantidad: '', unidad: '' });
        }
    };

    const handleRemoveIngrediente = (index: number) => {
        setIngredientes(ingredientes.filter((_, i) => i !== index));
    };

    // 🆕 Agregar paso
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

    // 🏷 Manejador de selección de Autocomplete para agregar la etiqueta
    const handleAddEtiqueta = (etiqueta: etiquetaType | null) => {
        if (etiqueta && !etiquetas.some(e => e.id === etiqueta.id)) {
            setEtiquetas([...etiquetas, etiqueta]);
            setInputEtiqueta(''); // Limpia el input
            setEtiquetaOptions([]); // Limpia las opciones
        }
    };

    // Manejador para eliminar la etiqueta (usando el ID para asegurar)
    const handleRemoveEtiqueta = (etiquetaId: number) => {
        setEtiquetas(etiquetas.filter(et => et.id !== etiquetaId));
    };

    const [isPublicando, setIsPublicando] = React.useState(false);

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
            ingredientes: ingredientes.map(ing => ({
                ...ing,
                id: 0,
                descripcion: ''
            })),
            etiquetas: etiquetas.map(et => ({ nombre: et.nombre, id: et.id })),
            pasos: pasosValidos,
            ...(desafioId && { desafioId })
        };

        try {
            const response = await fetch("https://localhost:7084/Recetas", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authData.token}`
                },
                body: JSON.stringify(data),
            });

            // Lógica para leer el cuerpo de la respuesta y manejar errores
            let responseBody: any;
            const text = await response.text();
            try {
                responseBody = JSON.parse(text);
            } catch {
                responseBody = text; // Si no es JSON, lo dejamos como texto
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
                    <IconButton
                        edge="end"
                        color="inherit"
                        onClick={onClose}
                        aria-label="close"
                    >
                        <CloseIcon />
                    </IconButton>
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
                            <AddPhotoAlternateIcon sx={{ fontSize: 60, color: '#182969' }} />
                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#182969' }}>
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
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
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
                        <IconButton color="primary" onClick={handleAddPaso} sx={{ color: "#182969" }}>
                          
                        </IconButton>
                        <IconButton color="primary" sx={{ color: "#182969" }} onClick={() => handleRemovePaso(pasoActualIndex)}>
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
                                            sx={{ position: 'absolute', top: 0, right: 0, background: 'rgba(255,255,255,0.7)' }}
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
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'black' }}>
                        Etiquetas
                    </Typography>
                    <Autocomplete
                        options={etiquetaOptions}
                        getOptionLabel={(option) => option.nombre}
                        value={null} // Es nulo porque solo se usa para seleccionar y limpiar
                        onChange={(_, newValue) => {
                            handleAddEtiqueta(newValue);
                        }}
                        inputValue={inputEtiqueta}
                        onInputChange={(_, newInputValue) => {
                            setInputEtiqueta(newInputValue);
                        }}
                        filterOptions={(x) => x} // Deshabilita el filtro interno de MUI
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
                                onDelete={() => handleRemoveEtiqueta(et.id)} // Usamos el ID para eliminar
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

                {/* Ingredientes */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        Ingredientes
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <TextField
                            label="Ingrediente..."
                            variant="outlined"
                            size="small"
                            value={nuevoIngrediente.nombre}
                            onChange={(e) => setNuevoIngrediente({ ...nuevoIngrediente, nombre: e.target.value })}
                            sx={{ flex: 1.5 }}
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
                        <TextField
                            label="Unidad"
                            variant="outlined"
                            size="small"
                            value={nuevoIngrediente.unidad}
                            onChange={(e) => setNuevoIngrediente({ ...nuevoIngrediente, unidad: e.target.value })}
                            sx={{ flex: 0.8 }}
                        />
                        <IconButton onClick={handleAddIngrediente} color="primary" sx={{ p: 0 }}>
                            <AddCircleIcon sx={{ fontSize: 40, color: '#182969' }} />
                        </IconButton>
                    </Box>
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
        </Dialog>
    );
}