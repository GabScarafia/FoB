// src/App.tsx
import React, { useState } from "react";
import { CssBaseline, Box } from "@mui/material";
import AppRoutes from "./components/AppRoutes";
import { AuthProvider } from "./context/AuthContext"
import ButtonAppBar from "./components/ButtonAppBar";
import DrawerMenu from "./components/DrawerMenu";
import { useLocation } from "react-router-dom";
import ImagenRebotante from './components/ImagenRebotante';
import logoImage from './assets/images/ronaldinho.jpg';
import { useAuth } from "./context/AuthContext"; // Importamos el hook

const drawerWidth = 240;

// Creamos un nuevo componente que contendrá la lógica principal
const MainApp = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { email } = useAuth(); // Usamos el hook para acceder al estado global

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const isAuthPage = location.pathname === '/iniciar-sesion' || location.pathname === '/registrarse';
  const isLoggedIn = !!email;

  return (
    <Box sx={{ display: "flex", width: '100%', minHeight: '100vh' }}>
      <CssBaseline />
      <ImagenRebotante imageSrc={logoImage} size={70} speed={1.5} /> 
      {/* Renderizamos el AppBar y el Drawer si el usuario está logueado y no está en una página de auth */}
      {!isAuthPage && (
        <>
          <ButtonAppBar handleDrawerToggle={handleDrawerToggle} drawerWidth={drawerWidth} />
          <DrawerMenu
            mobileOpen={mobileOpen}
            handleDrawerToggle={handleDrawerToggle}
            drawerWidth={drawerWidth}
          />
        </>
      )}

      {/* Contenido principal que contendrá las rutas */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: isAuthPage ? 0 : 3,
          width: { sm: isAuthPage ? '100%' : `calc(100% - ${drawerWidth}px)` },
          mt: isAuthPage ? 0 : 8,
          ml: isAuthPage ? 0 : { sm: `${drawerWidth}px` },
          minHeight: '100vh'
        }}
      >
        <AppRoutes />
      </Box>
    </Box>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Box sx={{ display: "flex", width: '100%', minHeight: '100vh', flexDirection: 'column' }}>
        <ImagenRebotante imageSrc={logoImage} size={70} speed={1.5} />
        <MainApp /> {/* 👈 Renderiza el nuevo componente dentro del Provider */}
      </Box>
    </AuthProvider>
  );
}