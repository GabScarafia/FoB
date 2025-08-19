import React from "react";
import { AppBar, Toolbar, IconButton, Typography, Box } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import HomeIcon from "@mui/icons-material/Home";
import StarIcon from "@mui/icons-material/Star";
import PersonIcon from "@mui/icons-material/Person";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";


export default function ButtonAppBar() {
  const { authData, clearAuthData } = useAuth(); // Obtiene la función del contexto
  const navigate = useNavigate();

  return (
  <AppBar position="fixed" sx={{width: "100%"}}>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          {authData?.email ? authData.email : "FondoBlanco"}
        </Typography>
        <Box sx={{ display: { xs: "none", sm: "flex" }, gap: 1, mr: 2 }}>
          <IconButton color="inherit" onClick={() => navigate("/")}>
            <HomeIcon />
          </IconButton>
          <IconButton color="inherit" onClick={() => navigate("/tendences")}>
            <StarIcon />
          </IconButton>
          <IconButton color="inherit" onClick={() => navigate("/profile")}>
            <PersonIcon />
          </IconButton>
          <IconButton color="inherit" onClick={() => navigate("/create")}>
            <AddCircleOutlineOutlinedIcon />
          </IconButton>
        </Box>
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