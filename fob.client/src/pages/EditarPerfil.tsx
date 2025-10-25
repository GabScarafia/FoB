import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CameraAltIcon from '@mui/icons-material/CameraAlt'; 
import { Paper, Box, Typography, TextField, Button, Avatar, CircularProgress, Alert, IconButton } from '@mui/material';
// Nota: Revisa que la ruta a tu CSS y la imagen sea correcta
import '../styles/EditarPerfil.css';

import fotoPerfilDefault from '../assets/images/avatar.png'; 
import { BASE_URL } from '../apiConfig';

const API_URL = BASE_URL;

interface UsuarioUpdateDto {
    id: number;
    nombre: string;
    apellido: string;
    nombreUsuario: string;
    biografia: string;
    email: string;
    contrasena?: string;
    fotoPerfilBase64?: string | null; 
}

const EditarPerfil: React.FC = () => {
    // Se agrega clearAuthData al hook
    const { authData, updateAuthData, clearAuthData } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState<Omit<UsuarioUpdateDto, 'id' | 'fotoPerfilBase64'> & { fotoPerfilBase64: string | null }>({
        nombre: '',
        apellido: '',
        nombreUsuario: '',
        biografia: '',
        email: '',
        contrasena: '',
        fotoPerfilBase64: null,
    });
    
    const [confirmarContrasena, setConfirmarContrasena] = useState(''); 

    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [exito, setExito] = useState<string | null>(null);
    const [nuevaImagenFile, setNuevaImagenFile] = useState<File | null>(null);
    const [formKey, setFormKey] = useState(0); 

    const userId = authData?.id;
    const token = authData?.token;

    useEffect(() => {
        if (!userId || !token) {
            setError('No tienes permiso para editar este perfil.');
            setCargando(false);
            return;
        }

        const fetchDatosUsuario = async () => {
            setCargando(true);
            setError(null);
            try {
                // Implementación de retroceso exponencial para reintentos
                const maxRetries = 3;
                let attempt = 0;
                let response;

                while (attempt < maxRetries) {
                    try {
                        response = await fetch(`${API_URL}/Usuario/${userId}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        break; // Salir del bucle si la llamada es exitosa
                    } catch (err) {
                        attempt++;
                        if (attempt >= maxRetries) throw err;
                        await new Promise(resolve => setTimeout(resolve, 2 ** attempt * 1000)); // Espera exponencial
                    }
                }

                if (!response) return; // Si no hay respuesta después de los reintentos

                if (response.status === 401) {
                    setError('Tu sesión ha expirado.');
                    return;
                }

                if (!response.ok) {
                    throw new Error('Error al cargar los datos del usuario.');
                }

                const data = await response.json();
                
                setFormData({
                    nombre: data.nombre || '',
                    apellido: data.apellido || '',
                    nombreUsuario: data.nombreUsuario || '',
                    biografia: data.biografia || '',
                    email: data.email || '',
                    contrasena: '', 
                    fotoPerfilBase64: data.fotoPerfilBase64 || null, 
                });
                
                setFormKey(prev => prev + 1); 
                
            } catch (err: any) {
                console.error("Error fetching user data:", err);
                setError(err.message || 'Ocurrió un error al cargar el perfil.');
            } finally {
                setCargando(false);
            }
        };

        fetchDatosUsuario();
    }, [userId, token]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
        setExito(null);
        setError(null);
    };

    const handleConfirmarContrasenaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setConfirmarContrasena(e.target.value);
        setExito(null);
        setError(null);
    };
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        setExito(null);
        const file = e.target.files?.[0];

        if (file) {
            if (!file.type.match('image.*')) {
                setError('El archivo seleccionado no es una imagen.');
                return;
            }

            setNuevaImagenFile(file);
            
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64StringWithPrefix = event.target?.result as string;
                const base64Only = base64StringWithPrefix.split(',')[1]; 
                
                setFormData(prev => ({ ...prev, fotoPerfilBase64: base64Only }));
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleVolverClick = () => {
        navigate(-1);
    };
    
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (!userId || !token) {
            setError('No estás autenticado.');
            return;
        }
        if (!formData.nombreUsuario || !formData.email) {
            setError('Nombre de usuario y email son campos obligatorios.');
            return;
        }

        const contrasenaFueCambiada = !!formData.contrasena;

        if (contrasenaFueCambiada) {
            if (formData.contrasena!.length < 6) {
                setError('La nueva contraseña debe tener al menos 6 caracteres.');
                return;
            }
            if (formData.contrasena !== confirmarContrasena) {
                setError('La nueva contraseña y su confirmación no coinciden.');
                return;
            }
        }
        
        setCargando(true);
        setError(null);
        setExito(null);

        const datosActualizar: UsuarioUpdateDto = {
            id: userId,
            nombre: formData.nombre,
            apellido: formData.apellido,
            nombreUsuario: formData.nombreUsuario,
            biografia: formData.biografia,
            email: formData.email,
            contrasena: contrasenaFueCambiada ? formData.contrasena : undefined,
            // Solo se envía fotoPerfilBase64 si se cargó un nuevo archivo
            fotoPerfilBase64: nuevaImagenFile ? formData.fotoPerfilBase64 : undefined,
        };

        try {
            const response = await fetch(`${API_URL}/Usuario/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(datosActualizar)
            });

            if (response.status === 401) {
                setError('Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.');
                return;
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al actualizar el perfil.');
            }
            
            const dataActualizada = await response.json(); 

            // 1. Actualizar el AuthContext con la nueva data del perfil
            updateAuthData(dataActualizada);
            
            if (contrasenaFueCambiada) {
                // 2. si la contraseña cambió Cierre de sesión forzado
                setExito('Contraseña actualizada exitosamente. Por favor, vuelve a iniciar sesión.');
                clearAuthData(); // Cierra la sesión
                // Redirección
                setTimeout(() => {
                    navigate('/iniciar-sesion'); 
                }, 3000);
            } else {
                // 3. Manejo si solo se actualizaron datos de perfil
                setExito('Perfil actualizado exitosamente.');
                // Redirección al perfil
                setTimeout(() => {
                    navigate(`/perfil/${userId}`);
                }, 2000);
            }
            
        } catch (err: any) {
            console.error("Error updating profile:", err);
            setError(err.message || 'Ocurrió un error al actualizar el perfil.');
        } finally {
            setCargando(false);
            setNuevaImagenFile(null);
        }
    };
 
    const imagenSrc = formData.fotoPerfilBase64
        ? `data:image/jpeg;base64,${formData.fotoPerfilBase64}`
        : fotoPerfilDefault;
        
    // Mostrar un loader si está cargando y aún no tiene datos iniciales
    if (cargando && !formData.nombreUsuario) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: 2 }}>
                <CircularProgress />
                <Typography color="text.secondary">Cargando datos del perfil...</Typography>
            </Box>
        );
    }

    return (
        <Paper component="main" sx={{ maxWidth: '600px', mx: 'auto', p: { xs: 2, sm: 3 }, mt: 2 }}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ textAlign: 'center', fontWeight: 'bold' }}>
                Editar Perfil
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {exito && <Alert severity="success" sx={{ mb: 2 }}>{exito}</Alert>}

            <Box component="form" onSubmit={handleSubmit} key={formKey} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                <Box sx={{ position: 'relative', alignSelf: 'center', mb: 2 }}>
                    <Avatar
                        src={imagenSrc}
                        alt="Foto de perfil actual"
                        sx={{ width: 120, height: 120, border: '3px solid', borderColor: 'primary.main' }}
                    />
                    <IconButton
                        component="label"
                        htmlFor="foto-upload"
                        title="Cambiar foto"
                        sx={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            bgcolor: 'background.paper',
                            border: '2px solid',
                            borderColor: 'primary.main',
                            '&:hover': { bgcolor: 'action.hover' }
                        }}
                    >
                        <CameraAltIcon color="primary" />
                        <input
                            type="file"
                            id="foto-upload"
                            accept="image/*"
                            onChange={handleImageChange}
                            hidden
                        />
                    </IconButton>
                </Box>

                <TextField
                    label="Nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    autoComplete="given-name"
                    fullWidth
                />
                <TextField
                    label="Apellido"
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleChange}
                    autoComplete="family-name"
                    fullWidth
                />
                <TextField
                    label="Nombre de usuario"
                    name="nombreUsuario"
                    value={formData.nombreUsuario}
                    onChange={handleChange}
                    required
                    autoComplete="username"
                    fullWidth
                />
                <TextField
                    label="Biografía"
                    name="biografia"
                    value={formData.biografia}
                    onChange={handleChange}
                    autoComplete="off"
                    multiline
                    rows={3}
                    fullWidth
                />
                <TextField
                    label="Email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    autoComplete="email"
                    fullWidth
                />

                <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 'bold' }}>Cambiar Contraseña (opcional)</Typography>
                <TextField
                    label="Nueva contraseña"
                    type="password"
                    name="contrasena"
                    value={formData.contrasena}
                    onChange={handleChange}
                    autoComplete="new-password"
                    fullWidth
                />
                <TextField
                    label="Repetir nueva contraseña"
                    type="password"
                    name="confirmarContrasena"
                    value={confirmarContrasena}
                    onChange={handleConfirmarContrasenaChange}
                    autoComplete="new-password"
                    fullWidth
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mt: 3 }}>
                    <Button
                        variant="outlined"
                        onClick={handleVolverClick}
                        disabled={cargando}
                        sx={{ flex: 1 }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={cargando}
                        sx={{ flex: 1 }}
                    >
                        {cargando ? <CircularProgress size={24} /> : 'Guardar cambios'}
                    </Button>
                </Box>
            </Box>
        </Paper>
    );
};

export default EditarPerfil;
