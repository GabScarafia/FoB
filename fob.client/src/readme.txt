
La estructura de archivos a respetar es:
src/
 ├─ assets/           # Imágenes, íconos, fuentes
 ├─ components/       # Componentes reutilizables
 │   ├─ layout/       # AppBar, Sidebar, Footer, etc.
 │   ├─ ui/           # Botones, inputs, loaders, etc.
 ├─ hooks/            # Custom hooks
 ├─ layouts/          # Estructuras de página con AppBar/Sidebar
 ├─ pages/            # Páginas (Home, About, etc.)
 ├─ routes/           # Configuración de rutas
 ├─ services/         # Llamadas a API, axios, etc.
 ├─ store/            # Estado global (Redux/Zustand)
 ├─ styles/           # Archivos CSS/Tailwind config
 ├─ types/            # Tipos y DTOs de TypeScript
 ├─ utils/            # Funciones utilitarias
 ├─ App.tsx
 ├─ main.tsx


 npm install @mui/icons-material @mui/material @emotion/styled @emotion/react