import React from "react"; // <-- Importa 'React' completo
import { useNavigate } from "react-router-dom";
import { AppBar, Toolbar, IconButton, Typography, Box, Tooltip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useAuth } from "../context/AuthContext";

interface UpperAppBarProps {
    mode: "light" | "dark";
    toggleTheme: () => void;
}

// ================================================================
// 1. ENVUELVE EL COMPONENTE CON React.forwardRef
// ================================================================
const UpperAppBar = React.forwardRef<HTMLDivElement, UpperAppBarProps>(
    ({ mode, toggleTheme }, ref) => { // 2. EL 'ref' SE PASA AQUÍ
    
    const { authData, clearAuthData } = useAuth();
    const navigate = useNavigate();
    const [openLogoutDialog, setOpenLogoutDialog] = React.useState(false);

    const handleOpenLogoutDialog = () => {
        setOpenLogoutDialog(true);
    };

    const handleCloseLogoutDialog = () => {
        setOpenLogoutDialog(false);
    };

    const handleConfirmLogout = () => {
        clearAuthData(); 
        navigate("/iniciar-sesion"); 
        handleCloseLogoutDialog(); 
    };

    return (
        <AppBar 
            position="fixed" 
            ref={ref} // 3. PASA EL 'ref' AL AppBar DE MUI
            sx={{ 
                width: "100%",
                backgroundColor: 'transparent' , 
                boxShadow: 'none' 
            }}
        >
            <Toolbar>
                <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                    Bienvenido {authData?.nombre}
                </Typography>

                {authData?.email && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {/* Botón de alternar tema */}
                        <Tooltip title={mode === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}>
                            <IconButton color="inherit" onClick={toggleTheme}>
                                {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
                            </IconButton>
                        </Tooltip>
                        {/* Botón de cerrar sesión con margen */}
                        <IconButton color="inherit" onClick={handleOpenLogoutDialog} aria-label="clear auth data" >
                            <CloseIcon />
                        </IconButton>
                    </Box>
                )}

                <Dialog
                    open={openLogoutDialog}
                    onClose={handleCloseLogoutDialog}
                    aria-labelledby="logout-dialog-title"
                    aria-describedby="logout-dialog-description"
                >
                    <DialogTitle id="logout-dialog-title">Confirmar cierre de sesión</DialogTitle>
                    <DialogContent>
                        <DialogContentText id="logout-dialog-description">
                            ¿Está seguro que quiere cerrar sesión?
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseLogoutDialog}>Cancelar</Button>
                        <Button onClick={handleConfirmLogout} autoFocus>Cerrar Sesión</Button>
                    </DialogActions>
                </Dialog>
            </Toolbar>
        </AppBar>
    );
}); // 4. CIERRA EL forwardRef

export default UpperAppBar;