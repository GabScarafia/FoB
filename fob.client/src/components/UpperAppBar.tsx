import React from "react";
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

export default function UpperAppBar({ mode, toggleTheme }: UpperAppBarProps) {
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
        clearAuthData(); // Limpia los datos de autenticación del contexto
        navigate("/iniciar-sesion"); // Redirige al usuario
        handleCloseLogoutDialog(); // Cierra el diálogo
    };

    return (
        <AppBar position="fixed" sx={{ width: "100%" }}>
            <Toolbar>
                <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                    {authData?.email ? authData.email : "FondoBlanco"}
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
                        <IconButton color="inherit" onClick={handleOpenLogoutDialog} aria-label="clear auth data" sx={{ ml: '3px' }}>
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
}