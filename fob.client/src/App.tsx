import React, { useState, useMemo, useEffect } from "react";
import { 
    CssBaseline, 
    Box, 
    ThemeProvider, 
    useScrollTrigger, 
    Slide             
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

// --- HideOnScroll Helper ---
interface HideOnScrollProps {
  children: React.ReactElement;
}

function HideOnScroll(props: HideOnScrollProps) {
  const { children } = props;
  const trigger = useScrollTrigger();

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

// --- Main Component ---
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

  // Estado para controlar el Header Global
  const [isGlobalHeaderVisible, setIsGlobalHeaderVisible] = useState(true);

  useEffect(() => {
    const handleToggleHeader = (e: Event) => {
      const customEvent = e as CustomEvent; 
      setIsGlobalHeaderVisible(customEvent.detail);
    };

    window.addEventListener('toggleGlobalHeader', handleToggleHeader);

    return () => {
      window.removeEventListener('toggleGlobalHeader', handleToggleHeader);
    };
  }, []);

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
 
    {/* Header Global condicional */}
    {!isAuthPage && isLoggedIn && isGlobalHeaderVisible && (
        <HideOnScroll>
            <UpperAppBar toggleTheme={toggleTheme} mode={mode} />
        </HideOnScroll>
    )}

     <Box
     component="main"
     sx={{
     flexGrow: 1,
     py: isAuthPage ? 0 : 3,
     width: "100%",
     bgcolor: "background.default",          
     // Padding Top dinámico: Si el header global está oculto, quitamos el padding extra
     pt: { xs: isAuthPage ? 0 : (isGlobalHeaderVisible ? 7 : 0), sm: isAuthPage ? 0 : (isGlobalHeaderVisible ? 6 : 0) }, 
     }}
     >
     <AppRoutes onDrawerToggle={handleDrawerToggle} />
     </Box>

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
          minHeight: "100vh", 
          bgcolor: "background.default", 
          transition: "background-color 0.4s ease, color 0.4s ease",
          // CORRECCIÓN: Eliminado overflow: "hidden" para que funcionen los position: fixed hijos
          position: "relative" 
        }}>
          <ImagenRebotante imageSrc="src/assets/images/ronaldinho.jpg" />
          <MainApp toggleTheme={toggleTheme} mode={mode} />
        </Box>
      </ThemeProvider>
    </AuthProvider>
   );
}