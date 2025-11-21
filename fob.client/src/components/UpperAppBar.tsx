import React from "react";
import { useNavigate } from "react-router-dom";
import { AppBar, Toolbar, IconButton, Typography, Box, Tooltip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button, Badge, Menu, MenuItem, Divider, Avatar, ListItemAvatar, ListItemText } from "@mui/material";
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
 if (resCount.status ===401) { clearAuthData(); navigate('/iniciar-sesion'); return; }
 }
 if (resCount.ok) {
 const data = await resCount.json();
 setUnreadCount(data.count ||0);
 }
 const res = await fetch(`${BASE_URL}/Notificacion`, { headers: { 'Authorization': `Bearer ${authData.token}` } });
 if (!res.ok) {
 if (res.status ===401) { clearAuthData(); navigate('/iniciar-sesion'); return; }
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
 const interval = setInterval(fetchNotifications,10000); // cada10s
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
 setUnreadCount(c => Math.max(0, c -1));
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
 if (!n.leida) markAsRead(n.id);
 handleCloseNotifications();

        if (n.url) {
            // Si la URL es del tipo /receta/32?comentario=108, la transformamos
            if (n.url.startsWith('/receta/')) {
                const urlParts = n.url.split('?');
                const recetaId = urlParts[0].split('/')[2];
                const params = new URLSearchParams(urlParts[1]);
                const comentarioId = params.get('comentario');

                // Navegamos a la ruta correcta que el router sí entiende
                navigate(`/perfil/${n.emisor?.id}/publicaciones?receta=${recetaId}${comentarioId ? `&comentario=${comentarioId}` : ''}`);
            } else {
                // Para todas las demás URLs, navegamos directamente
                navigate(n.url);
            }
        }
 };

 const formatDate = (iso?: string | null) => {
 if (!iso) return '';
 const d = new Date(iso);
 return d.toLocaleString();
 };

 const formatMessage = (n: NotificacionItem): string => {
    if (!n.emisor?.nombreUsuario || !n.mensaje) {
        return n.mensaje || '';
    }
    const pattern = new RegExp(`^${n.emisor.nombreUsuario}\\s*`);
    return n.mensaje.replace(pattern, '');
 };
 // Control visibility from other pages via window.dispatchEvent(new CustomEvent('setHeaderVisibility',{detail: boolean}))
 const [isVisible, setIsVisible] = React.useState<boolean>(true);
 React.useEffect(() => {
 const handler = (e: Event) => {
 try {
 // CustomEvent carries detail property
 const ce = e as CustomEvent<boolean>;
 if (typeof ce.detail === 'boolean') setIsVisible(ce.detail);
 } catch (err) {
 // ignore
 }
 };
 window.addEventListener('setHeaderVisibility', handler as EventListener);
 return () => window.removeEventListener('setHeaderVisibility', handler as EventListener);
 }, []);

 // Always render the AppBar (Slide expects a child); show/hide via CSS
 return (
 <AppBar position="fixed" ref={ref} sx={{ width: '100%', backgroundColor: 'transparent', boxShadow: 'none', display: isVisible ? undefined : 'none' }}>
 <Toolbar sx={{ gap:1 }}>
 <Typography variant="h6" noWrap component="div" sx={{ flexGrow:1, fontWeight:700 }}>
 Bienvenido {authData?.nombre}
 </Typography>

 {authData?.email && (
 <Box sx={{ display: 'flex', alignItems: 'center', gap:1 }}>
 {/* Notification button - slightly larger touch target */}
 <Tooltip title="Notificaciones">
 <IconButton color="inherit" onClick={handleOpenNotifications} aria-label="notificaciones" sx={{ p:1.1 }}>
 <Badge badgeContent={unreadCount} color="error" overlap="circular">
 <NotificationsIcon fontSize="medium" />
 </Badge>
 </IconButton>
 </Tooltip>

 <Menu
 anchorEl={anchorEl}
 open={open}
 onClose={handleCloseNotifications}
 PaperProps={{
 sx: {
 width:520,
 maxWidth: '95vw',
 maxHeight:520,
 borderRadius:2,
 p:1,
 boxShadow:6,
 }
 }}
 anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
 transformOrigin={{ vertical: 'top', horizontal: 'right' }}
 >
 <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb:1, px:1 }}>
 <Typography sx={{ fontWeight:800, fontSize:16 }}>Notificaciones</Typography>
 <Box sx={{ display: 'flex', gap:1 }}>
 <Button size="small" onClick={markAllRead} startIcon={<DoneIcon />} sx={{ textTransform: 'none' }}>
 Marcar todas
 </Button>
 <Button size="small" color="error" onClick={deleteAll} startIcon={<DeleteIcon />} sx={{ textTransform: 'none' }}>
 Eliminar todas
 </Button>
 </Box>
 </Box>
 <Divider sx={{ mb:1 }} />
 {notifications.length ===0 && (
 <Box sx={{ p:2, textAlign: 'center', color: 'text.secondary' }}>No hay notificaciones</Box>
 )}
 <Box sx={{ display: 'flex', flexDirection: 'column', gap:1, overflow: 'auto', maxHeight:420, pr:1 }}>
 {notifications.map(n => (
 <MenuItem
 key={n.id}
 onClick={() => handleNotificationClick(n)}
 // El onClick se mantiene en el contenedor principal para la navegación
 sx={{
 flexDirection: 'column', // 1. El item ahora es una columna
 alignItems: 'stretch', // Los hijos se estiran a lo ancho
 borderRadius:1,
 py:1,
 px:1.25,
 bgcolor: n.leida ? 'transparent' : (theme) => theme.palette.action.selected,
 '&:hover': { bgcolor: (theme) => theme.palette.action.hover },
 display: 'flex',
 gap: 1, // Espacio entre el contenido y los botones
 }}
 >
 <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
 <ListItemAvatar sx={{ minWidth:0, mt: 0.5 }}>
 <Avatar src={n.emisor?.imagenUrl ?? undefined} alt={n.emisor?.nombreUsuario ?? undefined} sx={{ width:44, height:44 }} />
 </ListItemAvatar>
 <ListItemText
 primary={
 <Box sx={{ display: 'flex', flexDirection: 'column', gap:0.3 }}>
 <Box sx={{ display: 'flex', alignItems: 'center', gap:1, flexWrap: 'wrap' }}>
 <Typography variant="subtitle2" sx={{ fontWeight:700, whiteSpace: 'nowrap' }}>{n.emisor ? `@${n.emisor.nombreUsuario}` : 'Sistema'}</Typography>
 <Typography variant="body2" sx={{ color: 'text.primary', flexShrink: 1, wordBreak: 'break-word' }}>{formatMessage(n)}</Typography>
 </Box>
 </Box>
 }
 secondary={<Typography variant="caption" color="text.secondary">{formatDate(n.fecha)}</Typography>}
 sx={{ my: 0, flex: '1 1 auto', minWidth: 0 }}
 />
 </Box>
 
 {/* 2. Contenedor para los botones, ahora horizontal y abajo */}
 <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
 {!n.leida && (
 <Tooltip title="Marcar como leída">
 <IconButton size="small" onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}>
 <DoneIcon fontSize="small" />
 </IconButton>
 </Tooltip>
 )}
 <Tooltip title="Abrir">
 <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleNotificationClick(n); }}>
 <OpenInNewIcon fontSize="small" />
 </IconButton>
 </Tooltip>
 <Tooltip title="Eliminar">
 <IconButton size="small" onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}>
 <DeleteIcon fontSize="small" color="error" />
 </IconButton>
 </Tooltip>
 </Box>
 </MenuItem>
 ))}
 </Box>
 </Menu>

 <Tooltip title={mode === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}>
 <IconButton color="inherit" onClick={toggleTheme} sx={{ ml:0.5, p:1 }}>
 {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
 </IconButton>
 </Tooltip>

 <IconButton color="inherit" onClick={handleOpenLogoutDialog} aria-label="clear auth data" sx={{ ml:0.5 }}>
 <CloseIcon />
 </IconButton>

 <Dialog open={openLogoutDialog} onClose={handleCloseLogoutDialog} aria-labelledby="logout-dialog-title" aria-describedby="logout-dialog-description">
 <DialogTitle id="logout-dialog-title">Confirmar cierre de sesión</DialogTitle>
 <DialogContent>
 <DialogContentText id="logout-dialog-description">¿Está seguro que quiere cerrar sesión?</DialogContentText>
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