import React from "react";
import { useNavigate } from "react-router-dom";
import {
    AppBar,
    Toolbar,
    IconButton,
    Typography,
    Box,
    Tooltip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Button,
    Badge,
    Menu,
    MenuItem,
    Avatar,
    ListItemAvatar
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DoneIcon from '@mui/icons-material/Done';
import DeleteIcon from '@mui/icons-material/Delete';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useAuth } from "../context/AuthContext";
import { BASE_URL } from '../apiConfig';

interface UpperAppBarProps {
    mode: "light" | "dark";
    toggleTheme: () => void;
}

interface NotificacionItem {
    id: number;
    fecha: string;
    leida: boolean;
    mensaje: string;
    tipo: string;
    url: string | null;
    emisor?: { id: number; nombreUsuario: string; nombre: string; imagenUrl: string | null } | null;
}

const UpperAppBar = React.forwardRef<HTMLDivElement, UpperAppBarProps>(({ mode, toggleTheme }, ref) => {
    const { authData, clearAuthData } = useAuth();
    const navigate = useNavigate();

    const [openLogoutDialog, setOpenLogoutDialog] = React.useState(false);

    // Notifications
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [notifications, setNotifications] = React.useState<NotificacionItem[]>([]);
    const [unreadCount, setUnreadCount] = React.useState<number>(0);
    const open = Boolean(anchorEl);

    const fetchNotifications = async () => {
        if (!authData?.token) return;
        try {
            const resCount = await fetch(`${BASE_URL}/Notificacion/unread-count`, { headers: { 'Authorization': `Bearer ${authData.token}` } });
            if (!resCount.ok) {
                if (resCount.status === 401) { clearAuthData(); navigate('/iniciar-sesion'); return; }
            }
            if (resCount.ok) {
                const data = await resCount.json();
                setUnreadCount(data.count || 0);
            }
            const res = await fetch(`${BASE_URL}/Notificacion`, { headers: { 'Authorization': `Bearer ${authData.token}` } });
            if (!res.ok) {
                if (res.status === 401) { clearAuthData(); navigate('/iniciar-sesion'); return; }
            }
            if (res.ok) {
                const list = await res.json();
                setNotifications(list);
            }
        } catch (err) {
            console.error('Error fetching notifications', err);
        }
    };

    React.useEffect(() => {
        if (authData?.token) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 10000); // cada 10s
            return () => clearInterval(interval);
        }
    }, [authData?.token]);

    const handleOpenLogoutDialog = () => setOpenLogoutDialog(true);
    const handleCloseLogoutDialog = () => setOpenLogoutDialog(false);
    const handleConfirmLogout = () => { clearAuthData(); navigate('/iniciar-sesion'); handleCloseLogoutDialog(); };

    const handleOpenNotifications = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
        fetchNotifications();
    };
    const handleCloseNotifications = () => setAnchorEl(null);

    const markAsRead = async (id: number) => {
        try {
            await fetch(`${BASE_URL}/Notificacion/mark-read/${id}`, { method: 'POST', headers: { 'Authorization': `Bearer ${authData?.token}` } });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
            setUnreadCount(c => Math.max(0, c - 1));
        } catch (err) { console.error(err); }
    };

    const markAllRead = async () => {
        try {
            await fetch(`${BASE_URL}/Notificacion/mark-read-all`, { method: 'POST', headers: { 'Authorization': `Bearer ${authData?.token}` } });
            setNotifications(prev => prev.map(n => ({ ...n, leida: true })));
            setUnreadCount(0);
        } catch (err) { console.error(err); }
    };

    const deleteNotification = async (id: number) => {
        try {
            await fetch(`${BASE_URL}/Notificacion/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${authData?.token}` } });
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (err) { console.error(err); }
    };

    const deleteAll = async () => {
        try {
            await fetch(`${BASE_URL}/Notificacion/all`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${authData?.token}` } });
            setNotifications([]);
            setUnreadCount(0);
        } catch (err) { console.error(err); }
    };

    const handleNotificationClick = async (n: NotificacionItem) => {
        if (!n.leida) {
            try { await markAsRead(n.id); } catch (e) { console.error(e); }
        }
        handleCloseNotifications();
        if (!n.url) return;

        if (n.url.startsWith('/receta/')) {
            const urlParts = n.url.split('?');
            const recetaId = urlParts[0].split('/')[2];
            const queryString = urlParts[1] ?? '';
            const params = new URLSearchParams(queryString);
            const comentarioId = params.get('comentarioId') || params.get('comentario');

            try {
                const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                if (authData?.token) headers['Authorization'] = `Bearer ${authData.token}`;
                const resp = await fetch(`${BASE_URL}/Recetas/${recetaId}`, { headers });
                if (resp.ok) {
                    const data = await resp.json();
                    const ownerId = data?.autor?.id ?? data?.autor?.Id ?? data?.Autor?.id ?? data?.Autor?.Id;
                    if (ownerId) {
                        navigate(`/perfil/${ownerId}/publicaciones?receta=${recetaId}${comentarioId ? `&comentario=${comentarioId}` : ''}`);
                        return;
                    }
                }
            } catch (err) { console.error(err); }

            const fallbackOwner = n.emisor?.id ?? authData?.id;
            if (fallbackOwner) {
                navigate(`/perfil/${fallbackOwner}/publicaciones?receta=${recetaId}${comentarioId ? `&comentario=${comentarioId}` : ''}`);
                return;
            }
            navigate('/feed');
            return;
        }
        navigate(n.url);
    };

    const formatDate = (iso?: string | null) => {
        if (!iso) return '';
        const d = new Date(iso);
        const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false };
        return d.toLocaleString('es-ES', options) + ' hs';
    };

    const formatMessage = (n: NotificacionItem): string => {
        if (!n.emisor?.nombreUsuario || !n.mensaje) return n.mensaje || '';
        const pattern = new RegExp(`^${n.emisor.nombreUsuario}\\s*`);
        return n.mensaje.replace(pattern, '');
    };

    const [isVisible, setIsVisible] = React.useState<boolean>(true);
    React.useEffect(() => {
        const handler = (e: Event) => {
            try {
                const ce = e as CustomEvent<boolean>;
                if (typeof ce.detail === 'boolean') setIsVisible(ce.detail);
            } catch (err) { }
        };
        window.addEventListener('setHeaderVisibility', handler as EventListener);
        return () => window.removeEventListener('setHeaderVisibility', handler as EventListener);
    }, []);

    return (
        <AppBar position="fixed" ref={ref} sx={{ width: '100%', backgroundColor: 'transparent', boxShadow: 'none', display: isVisible ? undefined : 'none' }}>
            <Toolbar sx={{ gap: 1 }}>
                <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
                    Bienvenido {authData?.nombre}
                </Typography>

                {authData?.email && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Tooltip title="Notificaciones">
                            <IconButton color="inherit" onClick={handleOpenNotifications} sx={{ p: 1.1 }}>
                                <Badge badgeContent={unreadCount} color="error" overlap="circular">
                                    <NotificationsIcon fontSize="medium" />
                                </Badge>
                            </IconButton>
                        </Tooltip>

                        <Menu
                            disableScrollLock={true}
                            anchorEl={anchorEl}
                            open={open}
                            onClose={handleCloseNotifications}
                            PaperProps={{
                                sx: {
                                    width: 450,
                                    maxWidth: '90vw',
                                    maxHeight: 520,
                                    borderRadius: 3,
                                    p: 0,
                                    boxShadow: 6,
                                    overflow: 'hidden'
                                }
                            }}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        >
                            {/* HEADER DEL MENU */}
                            <Box sx={{
                                p: 2,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                bgcolor: 'background.paper',
                                borderBottom: 1,
                                borderColor: 'divider'
                            }}>
                                <Typography sx={{ fontWeight: 800, fontSize: 16 }}>Notificaciones</Typography>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Tooltip title="Marcar todas como leídas">
                                        <IconButton size="small" onClick={markAllRead}>
                                            <DoneIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Eliminar todas">
                                        <IconButton size="small" onClick={deleteAll} color="error">
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </Box>

                            {notifications.length === 0 && (
                                <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                                    <NotificationsIcon sx={{ fontSize: 40, opacity: 0.2, mb: 1 }} />
                                    <Typography variant="body2">No tienes notificaciones nuevas</Typography>
                                </Box>
                            )}

                            {/* LISTA DE NOTIFICACIONES */}
                            <Box sx={{ overflowY: 'auto', maxHeight: 420 }}>
                                {notifications.map(n => (
                                    <MenuItem
                                        key={n.id}
                                        onClick={() => handleNotificationClick(n)}
                                        sx={{
                                            alignItems: 'flex-start',
                                            whiteSpace: 'normal',
                                            py: 1.5,
                                            px: 2,
                                            borderBottom: '1px solid',
                                            borderColor: 'divider',
                                            bgcolor: n.leida ? 'transparent' : (theme: Theme) => theme.palette.action.selected,
                                            transition: 'background-color 0.2s',
                                            '&:hover': {
                                                bgcolor: (theme: Theme) => theme.palette.action.hover,
                                            },
                                            gap: 2
                                        }}
                                    >
                                        <ListItemAvatar sx={{ minWidth: 0, mt: 0.5 }}>
                                            <Avatar
                                                src={n.emisor?.imagenUrl ?? undefined}
                                                alt={n.emisor?.nombreUsuario ?? undefined}
                                                sx={{ width: 48, height: 48 }}
                                            />
                                        </ListItemAvatar>

                                        {/* Contenedor principal del contenido */}
                                        <Box sx={{ flex: 1, minWidth: 0 }}>

                                            <Box sx={{
                                                mb: 0.5,
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                <Typography variant="subtitle2" component="span" sx={{ fontWeight: 700, mr: 0.5 }}>
                                                    {n.emisor ? `@${n.emisor.nombreUsuario}` : 'Sistema'}
                                                </Typography>
                                                {/* El mensaje ahora es un span simple sin flex/block propios */}
                                                <Typography variant="body2" component="span" color="text.primary">
                                                    {formatMessage(n)}
                                                </Typography>
                                            </Box>

                                            {/* Fila Inferior: Fecha (Izq) + Acciones (Der) */}
                                            <Box sx={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                mt: 0.5,
                                                flexWrap: 'wrap',
                                                gap: 1
                                            }}>
                                                <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                                                    {formatDate(n.fecha)}
                                                </Typography>

                                                {/* Grupo de botones de acción */}
                                                <Box sx={{ display: 'flex', gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
                                                    {!n.leida && (
                                                        <Tooltip title="Marcar como leída">
                                                            <IconButton size="small" onClick={() => markAsRead(n.id)} sx={{ p: 0.5 }}>
                                                                <DoneIcon fontSize="small" color="primary" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                    <Tooltip title="Abrir">
                                                        <IconButton size="small" onClick={() => { if (n.url) { handleCloseNotifications(); navigate(n.url); } }} sx={{ p: 0.5 }}>
                                                            <OpenInNewIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Eliminar">
                                                        <IconButton size="small" onClick={() => deleteNotification(n.id)} sx={{ p: 0.5 }}>
                                                            <DeleteIcon fontSize="small" color="error" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Box>
                        </Menu>

                        <Tooltip title={mode === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
                            <IconButton color="inherit" onClick={toggleTheme} sx={{ ml: 0.5 }}>
                                {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
                            </IconButton>
                        </Tooltip>

                        <IconButton color="inherit" onClick={handleOpenLogoutDialog} sx={{ ml: 0.5 }}>
                            <CloseIcon />
                        </IconButton>

                        <Dialog open={openLogoutDialog} onClose={handleCloseLogoutDialog}>
                            <DialogTitle>Confirmar cierre de sesión</DialogTitle>
                            <DialogContent>
                                <DialogContentText>¿Está seguro que quiere cerrar sesión?</DialogContentText>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={handleCloseLogoutDialog}>Cancelar</Button>
                                <Button onClick={handleConfirmLogout} autoFocus>Cerrar Sesión</Button>
                            </DialogActions>
                        </Dialog>
                    </Box>
                )}
            </Toolbar>
        </AppBar>
    );
});

export default UpperAppBar;