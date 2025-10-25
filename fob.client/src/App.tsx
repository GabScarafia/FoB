// src/App.tsx
import React, { useState, useMemo, useEffect } from "react";
// 1. QUITA la importación de GlobalStyles
import { CssBaseline, Box, ThemeProvider } from "@mui/material"; 
import { getTheme } from "./theme";
import AppRoutes from "./components/AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import UpperAppBar from "./components/UpperAppBar";
import ButtonBar from "./components/ButtonBar";
import { useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import "./App.css"; 

// ================================================================
// 🌙 Componente principal que contiene la lógica del layout
// ================================================================
const MainApp = ({
  toggleTheme,
  mode,
}: {
  toggleTheme: () => void;
  mode: "light" | "dark";
}) => {
  const location = useLocation();
  const { authData } = useAuth();
  const isLoggedIn = !!authData?.email;

  const isAuthPage =
    location.pathname === "/iniciar-sesion" ||
    location.pathname === "/registrarse";

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleDrawerToggle = (isOpen: boolean) => {
    setIsDrawerOpen(isOpen);
  };

  return (
    <Box sx={{ 
        display: "flex", 
        flexDirection: "column", 
        width: "100%",
        minHeight: '100vh' 
    }}>
      
      <CssBaseline /> 
      
      {!isAuthPage && isLoggedIn && (
        <UpperAppBar toggleTheme={toggleTheme} mode={mode} />
      )}

      {/* Contenido principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          py: isAuthPage ? 0 : 3,
          width: "100%",
          bgcolor: "background.default", 
          pt: { xs: isAuthPage ? 0 : 8, sm: isAuthPage ? 0 : 8 }, 
        }}
      >
        <AppRoutes onDrawerToggle={handleDrawerToggle} />
      </Box>

      {/* Ocultar la ButtonBar si el drawer está abierto */}
      {!isAuthPage && isLoggedIn && !isDrawerOpen && <ButtonBar />}
    </Box>
  );
};

export default function App() {
  const storedMode = (localStorage.getItem("themeMode") as "light" | "dark") || "light";
  const [mode, setMode] = useState<"light" | "dark">(storedMode);

  const theme = useMemo(() => getTheme(mode), [mode]);

  const toggleTheme = () => {
    const newMode = mode === "light" ? "dark" : "light";
    setMode(newMode);
    localStorage.setItem("themeMode", newMode);
  };

  useEffect(() => {
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (!localStorage.getItem("themeMode")) {
      setMode(systemPrefersDark ? "dark" : "light");
    }
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        {/* 6. QUITA 'height: "100%"' y 'display: "flex"' */}
        <Box sx={{
          width: "100%",
          bgcolor: "background.default", 
          transition: "background-color 0.4s ease, color 0.4s ease",
        }}>
          <MainApp toggleTheme={toggleTheme} mode={mode} />
        </Box>
      </ThemeProvider>
    </AuthProvider>
  );
}