import React from "react";
import { useNavigate } from "react-router-dom";
import { AppBar, Toolbar, IconButton, Typography, Box } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useAuth } from "../context/AuthContext";

export default function UpperAppBar() {
    const { authData, clearAuthData } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        clearAuthData(); // Limpia los datos de autenticación del contexto
        navigate("/iniciar-sesion"); // Redirige al usuario
    };

    return (
        <AppBar position="fixed" sx={{ width: "100%" }}>
            <Toolbar>
                <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                    {authData?.email ? authData.email : "FondoBlanco"}
                </Typography>
                {authData?.email && (
                    <IconButton
                        color="inherit"
                        edge="end"
                        onClick={handleLogout}
                        aria-label="clear auth data"
                    >
                        <CloseIcon />
                    </IconButton>
                )}
            </Toolbar>
        </AppBar>
    );
}