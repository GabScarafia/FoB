import React from "react";
import { Drawer, Toolbar, List, ListItemButton, ListItemText, Box } from "@mui/material";
import { Link } from "react-router-dom";

interface DrawerMenuProps {
  mobileOpen: boolean;
  handleDrawerToggle: () => void;
  drawerWidth: number;
}

export default function DrawerMenu({ mobileOpen, handleDrawerToggle, drawerWidth }: DrawerMenuProps) {
  const drawer = (
    <div>
      <Toolbar />
      <List>
        <ListItemButton component={Link} to="/" onClick={handleDrawerToggle}>
          <ListItemText primary="Inicio" />
        </ListItemButton>
        <ListItemButton component={Link} to="/weather" onClick={handleDrawerToggle}>
          <ListItemText primary="Sexo" />
        </ListItemButton>
      </List>
    </div>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      aria-label="menu lateral"
    >
      {/* Drawer temporal (móvil) */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: "block", sm: "none" },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
        }}
      >
        {drawer}
      </Drawer>

      {/* Drawer permanente (escritorio) */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", sm: "block" },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
}
