import React from "react";
import { AppBar, Toolbar, IconButton, Typography } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import { useAuth } from "../context/AuthContext";

interface ButtonAppBarProps {
  handleDrawerToggle: () => void;
  drawerWidth: number;
}

export default function ButtonAppBar({ handleDrawerToggle, drawerWidth }: ButtonAppBarProps) {
  const { authData, clearAuthData } = useAuth(); // Obtiene la función del contexto

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { sm: `calc(100% - ${drawerWidth}px)` },
        ml: { sm: `${drawerWidth}px` },
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ mr: 2, display: { sm: "none" } }}
          aria-label="open drawer"
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          {authData?.email ? authData.email : "FondoBlanco"}
        </Typography>
        {authData?.email  && (
          <IconButton
            color="inherit"
            edge="end"
            onClick={clearAuthData} // Llama a la función del contexto
            aria-label="clear auth data"
          >
            <CloseIcon />
          </IconButton>
        )}
      </Toolbar>
    </AppBar>
  );
}