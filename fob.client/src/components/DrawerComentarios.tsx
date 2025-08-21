import React from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  TextField,
  Button,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { Usuario } from "../pages/Feed"

export interface Comentario {
  id: number;
  autor: Usuario;
  texto: string;
  hora: Date | string;
  imagen: string;
}

interface DrawerComentariosProps {
  open: boolean;
  onClose: () => void;
  comentarios: Comentario[];
}

const DrawerComentarios: React.FC<DrawerComentariosProps> = ({ open, onClose, comentarios }) => {
    if (!open) return null;


   return (
    <Drawer anchor="bottom" open={open} onClose={onClose}>
      <Box sx={{ width: '100%', maxHeight: '60vh', display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 2,
            bgcolor: "primary.main",
            color: "white",
          }}
        >
          <Typography variant="h6">Comentarios</Typography>
          <IconButton onClick={onClose} sx={{ color: "white" }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider />

        {/* Lista de comentarios */}
        <Box sx={{ flex: 1, overflowY: "auto" }}>
          <List>
            {comentarios.map((c) => (
              <ListItem alignItems="flex-start" key={c.id}>
                <ListItemAvatar>
                  <Avatar src={c.imagen} alt={c.autor.nombreUsuario}>
                    {c.autor.nombreUsuario[0]}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                      {c.autor.nombreUsuario} •{" "}
                      <span style={{ color: "gray" }}>
                        {typeof c.hora === 'string' ? c.hora : c.hora?.toLocaleString() || ''}
                      </span>
                    </Typography>
                  }
                  secondary={<Typography variant="body2">{c.texto}</Typography>}
                />
              </ListItem>
            ))}
          </List>
        </Box>

        <Divider />

        {/* Caja de nuevo comentario */}
        <Box sx={{ p: 2, display: "flex", gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Dejar un comentario..."
            variant="outlined"
          />
          <Button variant="contained" color="primary">
            Enviar
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default DrawerComentarios;