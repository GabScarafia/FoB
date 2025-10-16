import * as React from "react";
import { BottomNavigation, BottomNavigationAction, Paper, Dialog } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import WhatshotIcon from '@mui/icons-material/Whatshot';
import PersonIcon from "@mui/icons-material/Person";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate, useLocation } from "react-router-dom";
import CreateRecetaDialog from "./CreateRecetaDialog";
import { useAuth } from "../context/AuthContext";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";

export default function ButtonBar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { authData } = useAuth();
    const [openDialog, setOpenDialog] = React.useState(false);

    const routes = ["/feed", "", "/tendencias", "/perfil"];
    const [value, setValue] = React.useState(0);

    const isPublicacionesPage = location.pathname.includes('/publicaciones');
    const perfilId = isPublicacionesPage ? location.pathname.split('/')[2] : null;

    React.useEffect(() => {
        if (location.pathname.startsWith('/perfil/')) {
            setValue(3);
        } else {
            const index = routes.indexOf(location.pathname);
            setValue(index === -1 ? 0 : index);
        }
    }, [location.pathname, routes]);

    const handleChange = (_: React.SyntheticEvent, newValue: number) => {
        if (isPublicacionesPage) return;

        if (newValue === 3) {
            if (authData?.id) {
                navigate(`/perfil/${authData.id}`);
            } else {
                navigate("/iniciar-sesion");
            }
        } else if (newValue === 1) {
            setOpenDialog(true);
        } else {
            setValue(newValue);
            navigate(routes[newValue]);
        }
    };

    const handleGoBack = () => {
        navigate(`/perfil/${perfilId}`);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    const gradientStyle = {
        background: 'linear-gradient(to right, #1f46b2, #1a2a6c, #002242)'
    };

    const renderBottomBar = () => {
        if (isPublicacionesPage) {
            return (
                <Box sx={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    ...gradientStyle,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    height: 56,
                    paddingLeft: 4,
                    zIndex: 1300
                }}>
                    <IconButton
                        edge="start"
                        color="inherit"
                        onClick={handleGoBack}
                        aria-label="go back"
                        sx={{ color: 'white' }}
                    >
                        <ArrowBackIcon />
                    </IconButton>
                    <PersonIcon sx={{ color: 'white' }} />
                    <IconButton color="inherit" aria-label="spacer" sx={{ visibility: 'hidden' }}>
                        <ArrowBackIcon />
                    </IconButton>
                </Box>
            );
        } else {
            return (
                <BottomNavigation
                    value={value}
                    onChange={handleChange}
                    showLabels
                    sx={{ ...gradientStyle }}
                >
                    <BottomNavigationAction label="Inicio" icon={<HomeIcon />} sx={{ color: "white", "&.Mui-selected": { color: "white" } }} />
                    <BottomNavigationAction label="Nuevo" icon={<AddCircleOutlineOutlinedIcon />} sx={{ color: "white", "&.Mui-selected": { color: "white" } }} />
                    <BottomNavigationAction label="Tendencias" icon={<WhatshotIcon />} sx={{ color: "white", "&.Mui-selected": { color: "white" } }} />
                    <BottomNavigationAction label="Perfil" icon={<PersonIcon />} sx={{ color: "white", "&.Mui-selected": { color: "white" } }} />
                </BottomNavigation>
            );
        }
    };

    return (
        <>
            <Paper
                sx={{ position: "fixed", bottom: 0, left: 0, right: 0, ...gradientStyle, zIndex: 1300 }}
                elevation={3}
            >
                {renderBottomBar()}
            </Paper>
            <Dialog open={openDialog} onClose={handleCloseDialog} fullScreen>
                <CreateRecetaDialog open={openDialog} onClose={handleCloseDialog} />
            </Dialog>
        </>
    );
}