// src/App.tsx
import React, { useState, useMemo, useEffect } from "react";
import { CssBaseline, Box, ThemeProvider } from "@mui/material";
import { getTheme } from "./theme";
import AppRoutes from "./components/AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import UpperAppBar from "./components/UpperAppBar";
import ButtonBar from "./components/ButtonBar";
import { useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext"; // Importamos el hook
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
    <Box sx={{ display: "flex", flexDirection: "column", width: "100%", minHeight: "100vh" }}>
      <CssBaseline />
      {/* Barra superior solo si el usuario está logueado y no es página de login/registro */}
      {!isAuthPage && isLoggedIn && (
        <UpperAppBar toggleTheme={toggleTheme} mode={mode} />
      )}

      {/* Contenido principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: isAuthPage ? 0 : 3,
          width: "100%",
          minHeight: "100vh",
          bgcolor: "background.default", // <-- AÑADIMOS ESTA LÍNEA
          pt: { xs: isAuthPage ? 0 : 8, sm: isAuthPage ? 0 : 8 }, // espacio para AppBar
          pb: { xs: 9, sm: 0 }, // espacio para BottomNavigation
        }}
      >
        <AppRoutes onDrawerToggle={handleDrawerToggle} />
      </Box>

      {/* Ocultar la ButtonBar si el drawer está abierto */}
      {!isAuthPage && isLoggedIn && !isDrawerOpen && <ButtonBar />}
    </Box>
  );
};

// ================================================================
// 🌗 App principal con manejo del tema claro/oscuro
// ================================================================
export default function App() {
  // Guardar y restaurar modo en localStorage
  const storedMode = (localStorage.getItem("themeMode") as "light" | "dark") || "light";
  const [mode, setMode] = useState<"light" | "dark">(storedMode);

  const theme = useMemo(() => getTheme(mode), [mode]);

  const toggleTheme = () => {
    const newMode = mode === "light" ? "dark" : "light";
    setMode(newMode);
    localStorage.setItem("themeMode", newMode);
  };

  // Detectar preferencia del sistema al cargar (solo si no hay valor guardado)
  useEffect(() => {
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (!localStorage.getItem("themeMode")) {
      setMode(systemPrefersDark ? "dark" : "light");
    }
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <Box sx={{
          display: "flex",
          width: "100%",
          minHeight: "100vh",
          flexDirection: "column",
          bgcolor: "background.default",   // 💡 usa el fondo del theme
          transition: "background-color 0.4s ease, color 0.4s ease",
        }}>
          <MainApp toggleTheme={toggleTheme} mode={mode} />
        </Box>
      </ThemeProvider>
    </AuthProvider>
  );
}
