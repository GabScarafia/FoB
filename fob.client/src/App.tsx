import React, { useState, useMemo, useEffect } from "react";
// 1. IMPORTACIONES AÑADIDAS
import { 
    CssBaseline, 
    Box, 
    ThemeProvider, 
    useScrollTrigger, // <-- AÑADIDO
    Slide             // <-- AÑADIDO
} from "@mui/material"; 
import { getTheme } from "./theme";
import AppRoutes from "./components/AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import UpperAppBar from "./components/UpperAppBar";
import ButtonBar from "./components/ButtonBar";
import { useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import "./App.css"; 
import ImagenRebotante from "components/ImagenRebotante";

// ================================================================
// 2. 🌙 NUEVO COMPONENTE HELPER "HideOnScroll"
// ================================================================
interface HideOnScrollProps {
  children: React.ReactElement;
}

/**
 * Componente que envuelve a otro y lo oculta 
 * con una animación 'Slide' cuando el usuario hace scroll.
 */
function HideOnScroll(props: HideOnScrollProps) {
  const { children } = props;
  // 'trigger' será true si el usuario ha hecho scroll hacia abajo
  const trigger = useScrollTrigger();

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}


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
        // 3. APPBAR ENVUELTO EN EL COMPONENTE
        <HideOnScroll>
            <UpperAppBar toggleTheme={toggleTheme} mode={mode} />
        </HideOnScroll>
      )}

      {/* Contenido principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          py: isAuthPage ? 0 : 3,
          width: "100%",
          bgcolor: "background.default", 
          // 4. PADDING-TOP AJUSTADO (asumiendo 56px móvil, 48px desktop)
          pt: { xs: isAuthPage ? 0 : 7, sm: isAuthPage ? 0 : 6 }, 
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
        <Box sx={{
          width: "100%",
          bgcolor: "background.default", 
          transition: "background-color 0.4s ease, color 0.4s ease",
        }}>
          {/* Pequeña corrección: usa / en lugar de \ para paths */}
          <ImagenRebotante imageSrc="src/assets/images/ronaldinho.jpg" />
          <MainApp toggleTheme={toggleTheme} mode={mode} />
        </Box>
      </ThemeProvider>
    </AuthProvider>
  );
}