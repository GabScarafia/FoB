import * as React from "react";
import { BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import StarIcon from "@mui/icons-material/Star";
import PersonIcon from "@mui/icons-material/Person";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import { useNavigate, useLocation } from "react-router-dom";

export default function ButtonBar() {
  const navigate = useNavigate();
  const location = useLocation();

  // Mapeo de rutas
  const routes = ["/", "/profile", "/tendences", "/create"];
  const currentIndex = routes.indexOf(location.pathname);
  const [value, setValue] = React.useState(currentIndex === -1 ? 0 : currentIndex);

  React.useEffect(() => {
  const index = routes.indexOf(location.pathname);
  setValue(index === -1 ? 0 : index);
}, [location.pathname]);

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    navigate(routes[newValue]);
  };

  return (
    <Paper
      sx={{ position: "fixed", bottom: 0, left: 0, right: 0, bgcolor: "primary.main", zIndex:1300 }}
      elevation={3}
    >
      <BottomNavigation value={value} onChange={handleChange} showLabels sx={{ bgcolor: "primary.main" }}>
        <BottomNavigationAction label="Inicio" icon={<HomeIcon />} sx={{ color: "white" , "&.Mui-selected": { color: "white" },}} />
        <BottomNavigationAction label="Perfil" icon={<PersonIcon />} sx={{ color: "white" , "&.Mui-selected": { color: "white" }, }}/>
        <BottomNavigationAction label="Tendencias" icon={<StarIcon />} sx={{ color: "white" , "&.Mui-selected": { color: "white" }, }}/>
        <BottomNavigationAction label="Nuevo" icon={<AddCircleOutlineOutlinedIcon />} sx={{ color: "white" , "&.Mui-selected": { color: "white" }, }}/>
      </BottomNavigation>
    </Paper>
  );
}
