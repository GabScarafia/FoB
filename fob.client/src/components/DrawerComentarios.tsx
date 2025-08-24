// src/components/DrawerComentarios.tsx
import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import type { Usuario } from "../pages/Feed";
import { useAuth } from "../context/AuthContext";
import fotoPerfilLocal from '../assets/images/bicho-arabe.jpg'; // Importa la foto de perfil local
import { formatoTiempoRelativo } from '../utils/formateoDeTiempo';

import './DrawerComentarios.css';

export interface Comentario {
  id: number;
  usuario: Usuario; 
  texto: string;
  fecha: Date;
  imagen: string;
}

interface DrawerComentariosProps {
  open: boolean;
  onClose: () => void;
  idReceta: number;
  onComentarioAgregado: (nuevoComentario: Comentario) => void;
}

const DrawerComentarios: React.FC<DrawerComentariosProps> = ({
  open,
  onClose,
  idReceta,
  onComentarioAgregado,
}) => {
  const [nuevoTexto, setNuevoTexto] = useState("");
  const [comentariosCompletos, setComentariosCompletos] = useState<Comentario[]>([]);
  const [cargandoComentarios, setCargandoComentarios] = useState(true);
  const [errorComentarios, setErrorComentarios] = useState<string | null>(null);
  const { authData } = useAuth();
  const token = authData?.token;
  const currentUserId = authData?.id;

  // aca tuve que hacer una llamada a la api para traer todos los comentarios de la receta, xq en la propiedad comentarios
  // de la receta solo vienen 3 comentarios, y no me andaba el drawer xq no tenia todos los comentarios.

// me da miedo como autocompleta el vs code, xq se me hace comentarios q yo si haria de verdad jajajaj. Son las 2.40 am
//  y estoy re podrido, pero bueno, ahi va. ESO LO PUSO SOLO EL COSO ESTE MAN Q MIEDDO
  useEffect(() => {
    if (open && token) {
      const obtenerTodosLosComentarios = async () => {
        setCargandoComentarios(true);
        setErrorComentarios(null);
        try {
          const response = await fetch(`https://localhost:7084/api/Comentario/receta/${idReceta}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            throw new Error(`Error al cargar comentarios: ${response.status}`);
          }

          const data = await response.json();
          setComentariosCompletos(data); 
        } catch (error) {
          console.error("Error al obtener comentarios:", error);
          setErrorComentarios("No se pudieron cargar los comentarios.");
        } finally {
          setCargandoComentarios(false);
        }
      };
      
      obtenerTodosLosComentarios();
    }
  }, [open, idReceta, token]);

  const handleSubmit = async () => {
    if (!nuevoTexto || !token || !currentUserId) return;

    const comentarioACrear = {
      texto: nuevoTexto,
      idReceta: idReceta,
      idUsuario: currentUserId
    };

    try {
      const response = await fetch('https://localhost:7084/api/Comentario', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(comentarioACrear)
      });
  
      if (!response.ok) {
        throw new Error('Error al enviar el comentario.');
      }
  
      const nuevoComentario = await response.json();
  
      console.log("Nuevo comentario creado:", nuevoComentario);
      // Actualiza el estado local con el nuevo comentario
      setComentariosCompletos(prev => [...prev, nuevoComentario]);
      setNuevoTexto("");
      onComentarioAgregado(nuevoComentario);
      
    } catch (error) {
      console.error("Error al enviar comentario:", error);
    }
  };

  return (
    <Drawer anchor="bottom" open={open} onClose={onClose}>
      <Box sx={{ width: "100%", maxHeight: "60vh", display: "flex", flexDirection: "column" }}>
        {/* Header (Azul) */}
        <Box
          className="drawer-header" // <-- Aplica la clase del header aquí
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 2,
            bgcolor: "#1f46b2",
            color: "white",
          }}
        >
          <Typography variant="h6">Comentarios</Typography>
          <IconButton onClick={onClose} sx={{ color: "white" }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider className="drawer-divider" />

        {/* Lista de comentarios */}
        <Box className="drawer-content" sx={{ flex: 1, overflowY: "auto", p: 2 }}>
          {cargandoComentarios ? (
            <p>Cargando comentarios...</p>
          ) : errorComentarios ? (
            <p>{errorComentarios}</p>
          ) : (
            <List>
              {comentariosCompletos.map((c) => (
                <ListItem className="comment-list-item" alignItems="flex-start" key={c.id}>
                  <ListItemAvatar>
                    <Avatar 
                        src={c.usuario.imagen ? `data:image/jpeg;base64,${c.usuario.imagen}` : fotoPerfilLocal} 
                        alt={c.usuario.nombreUsuario}
                    >
                        {c.usuario.nombreUsuario}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle2" className="comment-text-primary">
                        {c.usuario?.nombreUsuario }
                        <span className="comment-time">
                          {formatoTiempoRelativo(c.fecha)}
                        </span>
                      </Typography>
                    }
                    secondary={<Typography variant="body2" className="comment-text-secondary">{c.texto}</Typography>}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        <Divider className="drawer-divider" />

        {/* Caja de nuevo comentario (Versión Azul) */}
        <Box
          className="comment-input-box" // <-- Aplica la clase del input aquí
          sx={{
            p: 0.3,
            display: "flex",
            alignItems: "center",
            gap: 1,
            bgcolor: "#1f46b2",
            borderTop: "1px solid #1f46b2",
            maxHeight: '90px'
          }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder="Dejar un comentario..."
            variant="outlined"
            value={nuevoTexto}
            onChange={(e) => setNuevoTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSubmit();
              }
            }}
            // Aplica la clase del input al TextField
            className="comment-input" 
          />
          <IconButton
            onClick={handleSubmit}
            disabled={!nuevoTexto}
            sx={{
              color: 'white', // Color del ícono en blanco
              "&:disabled": {
                color: "rgba(255, 255, 255, 0.26)",
              },
            }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Drawer>
  );
};

export default DrawerComentarios;