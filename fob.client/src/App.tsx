// src/App.tsx
import React, { useState } from "react";
import { CssBaseline, Box } from "@mui/material";
import AppRoutes from "./components/AppRoutes";
import { AuthProvider } from "./context/AuthContext"
import ButtonAppBar from "./components/ButtonAppBar";
import ButtonBar from "./components/ButtonBar";
import { useLocation } from "react-router-dom";
import ImagenRebotante from './components/ImagenRebotante';
import logoImage from './assets/images/ronaldinho.jpg';
import { useAuth } from "./context/AuthContext"; // Importamos el hook
import './App.css';


// Creamos un nuevo componente que contendrá la lógica principal
const MainApp = () => {
  const location = useLocation();
  const { authData } = useAuth(); 
  const isLoggedIn = !!authData?.email;// Usamos el hook para acceder al estado global

  const isAuthPage =
  location.pathname === "/iniciar-sesion" ||
  location.pathname === "/registrarse";

  // Nuevo estado para controlar si el drawer de comentarios está abierto
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleDrawerToggle = (isOpen: boolean) => {
    setIsDrawerOpen(isOpen);
  };


  return (
    <Box sx={{ display: "flex", flexDirection: 'column', width: '100%', minHeight: '100vh' }}>
      <CssBaseline />
      <ImagenRebotante imageSrc={logoImage} size={70} speed={1.5} /> 
      {/* Barra superior solo si el usuario está logueado y no es página de login/registro */}
      {!isAuthPage && isLoggedIn && <ButtonAppBar />}

      {/* Contenido principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: isAuthPage ? 0 : 3,
          width:'100%',
          minHeight: '100vh',
          pt: { xs: isAuthPage ? 0 : 8, sm: isAuthPage ? 0 : 8 }, // deja espacio para AppBar
          pb: { xs: 9, sm: 0 } // espacio para BottomNavigation
        }}
      >
        {/* Pasamos la función a AppRoutes */}
        <AppRoutes onDrawerToggle={handleDrawerToggle} />
      </Box>
      {/* Ocultar la ButtonBar si el drawer está abierto */}
      {!isAuthPage && isLoggedIn && !isDrawerOpen && <ButtonBar />}
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