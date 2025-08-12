import React, { useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { CssBaseline, Box } from "@mui/material";
import AppRoutes from "components/AppRoutes";
import ButtonAppBar from "components/ButtonAppBar";
import DrawerMenu from "components/DrawerMenu";

const drawerWidth = 240;

export default function App() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <BrowserRouter>
      <Box sx={{ display: "flex" }}>
        <CssBaseline />
        <ButtonAppBar handleDrawerToggle={handleDrawerToggle} drawerWidth={drawerWidth} />
        <DrawerMenu mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} drawerWidth={drawerWidth} />

        {/* Contenido principal */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            mt: 8,
          }}
        >
          <AppRoutes />
        </Box>
      </Box>
    </BrowserRouter>
  );
}
