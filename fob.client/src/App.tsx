// src/App.tsx
import React, { useState } from "react";
import { CssBaseline, Box } from "@mui/material";
import AppRoutes from "./components/AppRoutes";
import ButtonAppBar from "./components/ButtonAppBar";
import DrawerMenu from "./components/DrawerMenu";
import { useLocation } from "react-router-dom";
import ImagenRebotante from './components/ImagenRebotante';
import logoImage from './assets/images/ronaldinho.jpg';

const drawerWidth = 240;

export default function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Determina si la ruta actual es una de las páginas de autenticación
  const isAuthPage = location.pathname === '/iniciar-sesion' || location.pathname === '/registrarse';

  return (
    <Box sx={{ display: "flex", width: '100%', minHeight: '100vh' }}>
      <CssBaseline />
      <ImagenRebotante imageSrc={logoImage} size={70} speed={1.5} /> 
      {/* Renderiza el AppBar y el Drawer SÓLO si NO es una página de autenticación */}
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
        <AppRoutes /> {/* Aca se renderizan las paginas */}
      </Box>
    </Box>
  );
}