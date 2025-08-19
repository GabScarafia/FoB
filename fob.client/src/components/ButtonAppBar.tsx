import React from "react";
import { AppBar, Toolbar, IconButton, Typography, Box } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useAuth } from "../context/AuthContext";


export default function ButtonAppBar() {
  const { authData, clearAuthData } = useAuth(); // Obtiene la función del contexto

  return (
  <AppBar position="fixed" sx={{width: "100%"}}>
      <Toolbar>
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