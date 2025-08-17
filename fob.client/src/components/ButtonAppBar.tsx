import React, { useEffect, useState } from "react";
import { AppBar, Toolbar, IconButton, Typography } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close"; // Import the CloseIcon

interface ButtonAppBarProps {
  handleDrawerToggle: () => void;
  drawerWidth: number;
}

export default function ButtonAppBar({ handleDrawerToggle, drawerWidth }: ButtonAppBarProps) {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const authDataString = localStorage.getItem("authData");
    if (authDataString) {
      try {
        const authData = JSON.parse(authDataString);
        setEmail(authData.email || null);
      } catch (error) {
        console.error("Error parsing authData:", error);
        setEmail(null);
      }
    } else {
      setEmail(null);
    }
  }, []);

  const handleClearAuthData = () => {
    localStorage.removeItem("authData");
    setEmail(null);
  };

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
          {email ? email : "FondoBlanco"}
        </Typography>
        {email && (
          <IconButton
            color="inherit"
            edge="end"
            onClick={handleClearAuthData}
            aria-label="clear auth data"
          >
            <CloseIcon />
          </IconButton>
        )}
      </Toolbar>
    </AppBar>
  );
}