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
  Link,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import ReplyIcon from "@mui/icons-material/Reply";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";


import type { Usuario } from "../pages/Feed";
import { useAuth } from "../context/AuthContext";
import fotoPerfilLocal from "../assets/images/avatar.png";
import { formatoTiempoRelativo } from "../utils/formateoDeTiempo";
import "./DrawerComentarios.css";
import { BASE_URL } from "../apiConfig";

// Interfaz para un solo comentario, incluyendo las respuestas anidadas.
export interface Comentario {
  id: number;
  usuario: Usuario;
  texto: string;
  fecha: Date | string;
  respuestaAComentarioId: number | null;
  respuestas?: Comentario[];
}

interface DrawerComentariosProps {
  open: boolean;
  onClose: () => void;
  idReceta: number;
  onComentarioAgregado: (nuevoComentario: Comentario) => void;
}

// Interfaz para las propiedades del componente ComentarioAnidado.
interface ComentarioAnidadoProps {
  comentario: Comentario;
  handleReplyClick: (comentario: Comentario) => void;
  fotoPerfilLocal: string;
  onDeleteRequest?: (comentario: Comentario) => void;
  onEditRequest?: (comentario: Comentario) => void;
}

// Este es el componente recursivo que muestra un comentario y sus respuestas.
const ComentarioAnidado: React.FC<ComentarioAnidadoProps> = ({
  comentario,
  handleReplyClick,
  fotoPerfilLocal,
  onDeleteRequest,
  onEditRequest,
}) => {
  // Nota: evitamos hook de auth dentro de este componente porque lo maneja el padre.
  return (
    <List key={comentario.id} sx={{ p: 0 }}>
      <ListItem
        className="comment-list-item"
        alignItems="flex-start"
        sx={{
          marginLeft: comentario.respuestaAComentarioId ? "20px" : "0",
        }}
      >
        <ListItemAvatar>
          <Avatar
            src={
              // Usa encadenamiento opcional para evitar errores si la imagen es nula
              comentario.usuario?.imagen
                ? `data:image/jpeg;base64,${comentario.usuario.imagen}`
                : fotoPerfilLocal
            }
            // Usa encadenamiento opcional para evitar errores si el nombre de usuario es nulo
            alt={comentario.usuario?.nombreUsuario}
          />
        </ListItemAvatar>
        <ListItemText
          primary={
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
              <Typography variant="subtitle2" className="comment-text-primary" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <span>
                  {comentario.usuario?.nombreUsuario || "Usuario Desconocido"}
                </span>
                <span className="comment-time">
                  {formatoTiempoRelativo(comentario.fecha)}
                </span>
                {onDeleteRequest && comentario.texto !== "Comentario eliminado" && (
                  <IconButton
                    size="small"
                    sx={{ ml: 1, color: "white", position: "relative", top: "-2px" }}
                    onClick={() => onDeleteRequest(comentario)}
                    aria-label={`Eliminar comentario ${comentario.id}`}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
                {onEditRequest && comentario.texto !== "Comentario eliminado" && (
                  <IconButton
                    size="small"
                    sx={{ ml: 1, color: "white", position: "relative", top: "-2px" }}
                    onClick={() => onEditRequest(comentario)}
                    aria-label={`Editar comentario ${comentario.id}`}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                )}

              </Typography>

              {/* El icono de borrar lo maneja el padre (se le pasa la función onDeleteRequest).
                  Aquí solo mostramos el boton si el comentario no está ya marcado como eliminado.
                  La verificación de autor (si el usuario logeado es el dueño) se hace en el padre
                  antes de pasar la función o puede compararse en el padre. */}
              {/* Nota: el botón será visible/oculto desde el padre comparando ids. */}
            </Box>
          }
          secondary={
            <React.Fragment>
              <Typography variant="body2" className="comment-text-secondary">
                {comentario.texto}
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => handleReplyClick(comentario)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    color: "gray",
                    textDecoration: "none",
                    "&:hover": {
                      textDecoration: "underline",
                    },
                  }}
                >
                  <ReplyIcon sx={{ fontSize: "1rem", color: "gray" }} />
                  Responder
                </Link>
              </Box>
            </React.Fragment>
          }
        />
        {/* Nota: se deja el espacio del boton en el ListItem (a la derecha). 
            El padre decide si pasa onDeleteRequest (si el usuario es el autor). */}
        {/** Si el padre pasa onDeleteRequest y el comentario no está ya eliminado, mostramos el tachito aquí. */}
      </ListItem>

      {comentario.respuestas && comentario.respuestas.length > 0 && (
        <List sx={{ pl: 4 }}>
          {comentario.respuestas.map((reply) => (
            <ComentarioAnidado
              key={reply.id}
              comentario={reply}
              handleReplyClick={handleReplyClick}
              fotoPerfilLocal={fotoPerfilLocal}
              onDeleteRequest={onDeleteRequest}
            />
          ))}
        </List>
      )}
    </List>
  );
};

const DrawerComentarios: React.FC<DrawerComentariosProps> = ({
  open,
  onClose,
  idReceta,
  onComentarioAgregado,
}) => {
  const [nuevoTexto, setNuevoTexto] = useState("");
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [cargandoComentarios, setCargandoComentarios] = useState(true);
  const [errorComentarios, setErrorComentarios] = useState<string | null>(null);
  const [comentarioPadre, setComentarioPadre] = useState<{ id: number; usuario: string } | null>(null);

  const { authData } = useAuth();
  const token = authData?.token;
  const currentUserId = authData?.id;

  // Estados y lógica para borrado
  const [comentarioAEliminar, setComentarioAEliminar] = useState<Comentario | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Para edición
  const [comentarioEnEdicion, setComentarioEnEdicion] = useState<Comentario | null>(null);


  // Lógica de anidamiento de comentarios en el frontend (solo para el POST)
  const findAndAddReply = (comments: Comentario[], newReply: Comentario): boolean => {
    for (const comment of comments) {
      if (comment.id === comentarioPadre?.id) {
        if (!comment.respuestas) {
          comment.respuestas = [];
        }
        comment.respuestas.push(newReply);
        return true;
      }
      if (comment.respuestas && findAndAddReply(comment.respuestas, newReply)) {
        return true;
      }
    }
    return false;
  };

  const obtenerTodosLosComentarios = async () => {
    setCargandoComentarios(true);
    setErrorComentarios(null);
    try {
      // El backend ahora devuelve una lista anidada, por lo que no es necesario procesarla aquí
      const response = await fetch(`${BASE_URL}/api/Comentario/receta/${idReceta}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error al cargar comentarios: ${response.status}`);
      }

      const data: Comentario[] = await response.json();
      const comentariosConFecha = data.map(c => ({
          ...c,
          fecha: new Date(c.fecha)
      }));
      setComentarios(comentariosConFecha);
    } catch (error) {
      console.error("Error al obtener comentarios:", error);
      setErrorComentarios("No se pudieron cargar los comentarios.");
    } finally {
      setCargandoComentarios(false);
    }
  };

  useEffect(() => {
    if (open && token) {
      obtenerTodosLosComentarios();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, idReceta, token]);

  const handleReplyClick = (comentario: Comentario) => {
    setComentarioPadre({ id: comentario.id, usuario: comentario.usuario.nombreUsuario });
    console.log("Comentario padre seleccionado:", comentario);
    setNuevoTexto("");
  };

  const handleCancelReply = () => {
    setComentarioPadre(null);
    setNuevoTexto("");
  };

  const handleSubmit = async () => {
    if (!nuevoTexto || !token || !currentUserId) return;

    if (comentarioEnEdicion) {
      // Estamos editando un comentario existente
      try {
        const response = await fetch(`${BASE_URL}/api/Comentario/${comentarioEnEdicion.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ texto: nuevoTexto })
        });
        if (!response.ok) throw new Error("Error al modificar comentario");

        // Actualizar comentario local
        const actualizarComentario = (comments: Comentario[]): Comentario[] => {
          return comments.map(c => {
            if (c.id === comentarioEnEdicion.id) {
              return { ...c, texto: nuevoTexto, fecha: new Date()};
            }
            if (c.respuestas && c.respuestas.length > 0) {
              return { ...c, respuestas: actualizarComentario(c.respuestas) };
            }
            return c;
          });
        };

        setComentarios(prev => actualizarComentario(prev));
        setComentarioEnEdicion(null);
        setNuevoTexto("");
      } catch (error) {
        console.error(error);
      } 
    }else {
      // Estamos creando un nuevo comentario o una respuesta
        const comentarioACrear = {
          texto: nuevoTexto,
          idReceta: idReceta,
          idUsuario: currentUserId,
          idComentario: comentarioPadre?.id
        };
        console.log("Enviando comentario:", comentarioACrear);
        console.log("Comentario padre:", comentarioPadre);
        try {
          const response = await fetch('${BASE_URL}/api/Comentario', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(comentarioACrear)
          });

          if (!response.ok) {
            throw new Error("Error al enviar el comentario.");
          }

          const nuevaRespuesta: Comentario = await response.json();
          nuevaRespuesta.fecha = new Date(nuevaRespuesta.fecha);

          if (comentarioPadre) {
            const comentariosCopia = [...comentarios];
            findAndAddReply(comentariosCopia, nuevaRespuesta);
            setComentarios(comentariosCopia);
          } else {
            setComentarios(prev => [...prev, nuevaRespuesta]);
          }

          setNuevoTexto("");
          setComentarioPadre(null);
          onComentarioAgregado(nuevaRespuesta);

        } catch (error) {
          console.error("Error al enviar comentario:", error);
        }
      };
    }

    

  // El padre maneja la solicitud de borrar: abre el dialog y guarda el comentario seleccionado
  const handleDeleteRequest = (comentario: Comentario) => {
    setComentarioAEliminar(comentario);
    setDeleteError(null);
    setConfirmOpen(true);
  };

  // Marca un comentario como eliminado recursivamente en el estado
  const markCommentAsDeleted = (comments: Comentario[], idToDelete: number): Comentario[] => {
    return comments.map(c => {
      if (c.id === idToDelete) {
        return { ...c, texto: "Comentario eliminado" };
      }
      if (c.respuestas && c.respuestas.length > 0) {
        return { ...c, respuestas: markCommentAsDeleted(c.respuestas, idToDelete) };
      }
      return c;
    });
  };

  const handleConfirmDelete = async () => {
    if (!comentarioAEliminar || !token) {
      setConfirmOpen(false);
      setComentarioAEliminar(null);
      return;
    }

    setEliminando(true);
    setDeleteError(null);

    try {
      const response = await fetch(`${BASE_URL}/api/Comentario/${comentarioAEliminar.id}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // Intentamos leer el error si viene en JSON
        let errText = `Error ${response.status}`;
        try {
          const errJson = await response.json();
          errText = errJson?.detail || JSON.stringify(errJson);
        } catch { /* ignore */ }
        throw new Error(errText);
      }

      // Actualizamos la lista local marcando el comentario como eliminado
      setComentarios(prev => markCommentAsDeleted(prev, comentarioAEliminar.id));

      setConfirmOpen(false);
      setComentarioAEliminar(null);
    } catch (err: any) {
      console.error("Error al eliminar comentario:", err);
      setDeleteError(typeof err === "string" ? err : err?.message || "Error al eliminar comentario");
    } finally {
      setEliminando(false);
    }
  };

  const handleEditClick = (comentario: Comentario) => {
    setComentarioEnEdicion(comentario);
    setNuevoTexto(comentario.texto);
  };

  const handleCancelEdit = () => {
    setComentarioEnEdicion(null);
    setNuevoTexto("");
  };

  // (Eliminado handleSaveEdit porque no se usa y causaba el error de retorno)

  return (
    <Drawer anchor="bottom" open={open} onClose={onClose} sx={{ zIndex: (theme) => theme.zIndex.modal + 3 }}>
      <Box sx={{ width: "100%", maxHeight: "60vh", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <Box
          className="drawer-header"
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
            <List sx={{ p: 0 }}>
              {comentarios.map((comentario) => (
                <Box key={comentario.id} sx={{ position: "relative" }}>
                  {/* Pasamos onDeleteRequest solo si el comentario pertenece al usuario actual */}
                  <ComentarioAnidado
                    comentario={comentario}
                    handleReplyClick={handleReplyClick}
                    fotoPerfilLocal={fotoPerfilLocal}
                    onDeleteRequest={String(comentario.usuario?.id) === String(currentUserId) ? handleDeleteRequest : undefined}
                    onEditRequest={String(comentario.usuario?.id) === String(currentUserId) ? handleEditClick : undefined}
                  />
                </Box>
              ))}
            </List>
          )}
        </Box>

        <Divider className="drawer-divider" />

        {/* Caja de nuevo comentario */}
        <Box
          className="comment-input-box"
          sx={{
            p: 0.3,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
            bgcolor: "#1f46b2",
            borderTop: "1px solid #1f46b2",
            maxHeight: '90px'
          }}
        >
          {comentarioPadre && (
            <Box sx={{ width: '100%', px: 1, py: 0.5 }}>
              <Typography variant="caption" sx={{ color: 'white', fontStyle: 'italic' }}>
                Respondiendo a "{comentarioPadre.usuario}"
              </Typography>
              <IconButton onClick={handleCancelReply} size="small" sx={{ color: 'white' }}>
                <CloseIcon fontSize="inherit" />
              </IconButton>
            </Box>
          )}
          <Box sx={{ display: 'flex', width: '100%', gap: 1, px: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder={
                comentarioEnEdicion ? `Modificando el Comentario: "${comentarioEnEdicion.texto}"`
                                    : "Dejar un comentario..."}
              variant="outlined"
              value={nuevoTexto}
              onChange={(e) => setNuevoTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSubmit();
                }
              }}
              className="comment-input"
            />
            <IconButton
              onClick={handleSubmit}
              disabled={!nuevoTexto}
              sx={{
                color: 'white',
                "&:disabled": {
                  color: "rgba(255, 255, 255, 0.26)",
                },
              }}
            >
              <SendIcon />
            </IconButton>
          </Box>
          {comentarioEnEdicion && (
            <Box sx={{ width: '100%', px: 1, py: 0.5, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button onClick={handleCancelEdit} size="small" color="inherit" sx={{ color: 'white' }}>
                Cancelar
              </Button>
            </Box>
          )}
        </Box>

        {/* Dialog de confirmación de borrado */}
        <Dialog
          open={confirmOpen}
          onClose={() => {
            if (!eliminando) {
              setConfirmOpen(false);
              setComentarioAEliminar(null);
              setDeleteError(null);
            }
          }}
        >
          <DialogTitle>Confirmar eliminación</DialogTitle>
          <DialogContent>
            <DialogContentText>
              ¿Estás seguro de que querés eliminar este comentario? Se marcará como "Comentario eliminado" para mantener el hilo de la conversación.
            </DialogContentText>
            {deleteError && (
              <Typography color="error" sx={{ mt: 1 }}>
                {deleteError}
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setConfirmOpen(false); setComentarioAEliminar(null); setDeleteError(null); }} disabled={eliminando}>
              Cancelar
            </Button>
            <Button color="error" onClick={handleConfirmDelete} disabled={eliminando}>
              {eliminando ? "Eliminando..." : "Sí, eliminar"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Drawer>
  );
};

export default DrawerComentarios;