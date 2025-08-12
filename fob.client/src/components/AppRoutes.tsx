import { Routes, Route } from "react-router-dom";
import Weather from "../pages/Weather";

/**
 * Componente que define las rutas principales de la aplicación.
 * 
 * Aquí se configuran los paths y los componentes que se renderizan
 * cuando el usuario navega a dichas rutas.
 * 
 * Actualmente incluye:
 * - "/" que muestra el componente Weather.
 * 
 * Agregá nuevas rutas acá para ampliar la navegación.
 */
export default function AppRoutes() 
{
  return (
    <Routes>
      {/* <Route path="/" element={<Typography variant="h4">Página de inicio</Typography>} /> */}
      <Route path="/" element={<Weather />} />
    </Routes>
  );
}
