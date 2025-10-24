// src/theme.ts
import { createTheme } from "@mui/material/styles";

export const getTheme = (mode: "light" | "dark") =>
  createTheme({
    palette: {
      mode,
      ...(mode === "light"
        ? {
            primary: { main: "#1a2a6c" },
            secondary: { main: "#ff5722" },
            background: {
              default: "#f5f5f5", // fondo claro
              paper: "#ffffff",
            },
            text: {
              primary: "#1a1a1a",
              secondary: "#555555",
            },
          }
        : {
            primary: { main: "#90caf9" },
            secondary: { main: "#ff9800" },
            background: {
              default: "#1e1f22", // 💡 gris oscuro como ChatGPT
              paper: "#2a2b31",   // un tono ligeramente más claro para tarjetas
            },
            text: {
              primary: "#e6e6e6",
              secondary: "#b0b0b0",
            },
          }),
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: "none",
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
        },
      },
    },
  });
