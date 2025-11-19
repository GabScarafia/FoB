// src/components/DrawerComentarios.tsx
import React, { useState, useEffect } from "react";
import { useSwipeable } from "react-swipeable"; // 1. IMPORTAR useSwipeable

import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  InputBase, // Usamos InputBase para mayor control visual que TextField
  Link,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Divider,
} from "@mui/material";

// Iconos
import CloseIcon from "@mui/icons-material/Close"; // Se usa para cancelar reply/edit
import SendIcon from "@mui/icons-material/Send"; // Usar Telegram icon si tienes, si no Send
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import FavoriteIcon from "@mui/icons-material/Favorite"; // Corazón lleno
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder"; // Corazón borde

import type { Usuario } from "../pages/Feed";
import { useAuth } from "../context/AuthContext";
import fotoPerfilLocal from "../assets/images/avatar.png";
import { formatoTiempoRelativo } from "../utils/formateoDeTiempo";
import "./DrawerComentarios.css";
import { BASE_URL } from "../apiConfig";

export interface Comentario {
  id: number;
  usuario: Usuario;
  texto: string;
  fecha: Date | string;
  respuestaAComentarioId: number | null;
  respuestas?: Comentario[];
  cantidadLikes: number;
  leGustaAlUsuario: boolean;
}

interface DrawerComentariosProps {
  open: boolean;
  onClose: () => void;
  idReceta: number;
  onComentarioAgregado: (nuevoComentario: Comentario) => void;
}

interface ComentarioAnidadoProps {
  comentario: Comentario;
  handleReplyClick: (comentario: Comentario) => void;
  fotoPerfilLocal: string;
  onDeleteRequest?: (comentario: Comentario) => void;
  onEditRequest?: (comentario: Comentario) => void;
  onLikeChange: (comentarioId: number, isLiked: boolean, newLikeCount: number) => void;
}

// --- Componente Recursivo ---
const ComentarioAnidado: React.FC<ComentarioAnidadoProps> = ({
  comentario,
  handleReplyClick,
  fotoPerfilLocal,
  onDeleteRequest,
  onEditRequest,
  onLikeChange,
}) => {
  const { authData } = useAuth();
  const [liked, setLiked] = useState(comentario.leGustaAlUsuario);
  const [likeCount, setLikeCount] = useState(comentario.cantidadLikes);
  const [isProcessingLike, setIsProcessingLike] = useState(false);
  const isDeleted = comentario.texto === "Comentario eliminado";

  useEffect(() => {
    setLiked(comentario.leGustaAlUsuario);
    setLikeCount(comentario.cantidadLikes);
  }, [comentario.leGustaAlUsuario, comentario.cantidadLikes]);

  const handleLikeClick = async () => {
    // No permitir likes en comentarios eliminados
    if (isProcessingLike || !authData?.token || isDeleted) return;
    setIsProcessingLike(true);
  
    const oldLiked = liked;
    const oldCount = likeCount;
  
    const newLiked = !oldLiked;
    const newCount = oldCount + (newLiked ? 1 : -1);
  
    // UI inmediata
    setLiked(newLiked);
    setLikeCount(newCount);
  
    try {
      const response = await fetch(`${BASE_URL}/api/Comentario/Interaccion`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authData.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idComentario: comentario.id,
          tipo: 0, // 0 para 'Me Gusta'
          accion: oldLiked ? 1 : 0,
        }),
      });
  
      if (!response.ok) {
        setLiked(oldLiked);
        setLikeCount(oldCount);
      }
    } catch {
      setLiked(oldLiked);
      setLikeCount(oldCount);
    }
  
    setIsProcessingLike(false);
  };


  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <div id={`comentario-${comentario.id}`}>
        <ListItem
          className="comment-list-item"
          alignItems="flex-start"
          sx={{
            marginLeft: comentario.respuestaAComentarioId ? "20px" : "0",
          }}
        >
          <ListItemAvatar sx={{ minWidth: 50 }}>
            <Avatar
              sx={{ width: 36, height: 36 }}
              src={
                comentario.usuario?.imagen
                  ? `data:image/jpeg;base64,${comentario.usuario.imagen}`
                  : fotoPerfilLocal
              }
              alt={comentario.usuario?.nombreUsuario}
            />
          </ListItemAvatar>
          
          {/* Contenido Central: Nombre y Texto */}
          <ListItemText
            primary={
              <Typography component="span" className="comment-user-name">
                {comentario.usuario?.nombreUsuario || "Usuario"}
              </Typography>
            }
            secondary={
              <React.Fragment>
                <Typography component="span" className="comment-text-body">
                  {comentario.texto}
                </Typography>
                
                {/* Boton Responder (Link) debajo del texto */}
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Link
                    component="button"
                    variant="body2"
                    className="comment-reply-link"
                    onClick={() => handleReplyClick(comentario)}
                    >
                    Responder
                    </Link>
                    
                    {/* Botones de acción (Editar/Borrar) discretos si es el dueño */}
                    {onEditRequest && comentario.texto !== "Comentario eliminado" && (
                        <EditIcon 
                            sx={{ fontSize: 14, color: '#aaa', cursor: 'pointer' }} 
                            onClick={() => onEditRequest(comentario)}
                        />
                    )}
                    {onDeleteRequest && comentario.texto !== "Comentario eliminado" && (
                        <DeleteIcon 
                            sx={{ fontSize: 14, color: '#aaa', cursor: 'pointer' }} 
                            onClick={() => onDeleteRequest(comentario)}
                        />
                    )}
                </Box>
              </React.Fragment>
            }
            sx={{ margin: 0 }}
          />

          {/* Columna Derecha: Like y Hora (Como en la foto) */}
          <Box className="comment-meta-right">
            {!isDeleted && (
              <>
                <IconButton size="small" onClick={handleLikeClick} disabled={isProcessingLike} sx={{ p: 0.5 }}>
                  {liked ? (
                    <FavoriteIcon fontSize="small" sx={{ color: 'primary.main' }} />
                  ) : (
                    <FavoriteBorderIcon fontSize="small" className="like-icon" />
                  )}
                </IconButton>
                {likeCount > 0 && <span className="comment-likes-count">{likeCount}</span>}
              </>
            )}
            <span className="comment-time">
               {/* Formateo simple para imitar "Dom. 23:45hs" o usar relativo */}
               {formatoTiempoRelativo(comentario.fecha)}
            </span>
          </Box>
        </ListItem>
      </div>

      {/* Renderizado recursivo de respuestas */}
      {comentario.respuestas && comentario.respuestas.length > 0 && (
        <Box sx={{ pl: 2 }}> 
          {comentario.respuestas.map((reply) => (
            <ComentarioAnidado
              key={reply.id}
              comentario={reply}
              handleReplyClick={handleReplyClick}
              fotoPerfilLocal={fotoPerfilLocal}
              onDeleteRequest={onDeleteRequest}
              onEditRequest={onEditRequest}
              onLikeChange={onLikeChange}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

// --- Componente Principal ---
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

  // Estados de borrado/edición
  const [comentarioAEliminar, setComentarioAEliminar] = useState<Comentario | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [comentarioEnEdicion, setComentarioEnEdicion] = useState<Comentario | null>(null);
  

  // 2. CONFIGURAR EL HOOK useSwipeable
  const swipeHandlers = useSwipeable({
    // Se activa al deslizar hacia abajo
    onSwipedDown: () => onClose(), // Llama a la función para cerrar el drawer
    // Opcional: previene que la página haga scroll mientras se desliza el drawer
    preventScrollOnSwipe: true,
    // Permite que funcione también con el ratón en escritorio
    trackMouse: true,
  });

  // ... (Lógica de findAndAddReply igual) ...
  const findAndAddReply = (comments: Comentario[], newReply: Comentario): boolean => {
    for (const comment of comments) {
      if (comment.id === comentarioPadre?.id) {
        if (!comment.respuestas) comment.respuestas = [];
        comment.respuestas.push(newReply);
        return true;
      }
      if (comment.respuestas && findAndAddReply(comment.respuestas, newReply)) return true;
    }
    return false;
  };

  // ... (Lógica de obtenerTodosLosComentarios igual) ...
  const obtenerTodosLosComentarios = async () => {
    setCargandoComentarios(true);
    setErrorComentarios(null);
    try {
      const response = await fetch(`${BASE_URL}/api/Comentario/receta/${idReceta}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error(`Error al cargar comentarios`);
      const data: Comentario[] = await response.json();
      setComentarios(data.map(c => ({ ...c, fecha: new Date(c.fecha) })));
    } catch (error) {
      console.error(error);
      setErrorComentarios("No se pudieron cargar los comentarios.");
    } finally {
      setCargandoComentarios(false);
    }
  };

  useEffect(() => { if (open && token) obtenerTodosLosComentarios(); }, [open, idReceta, token]);

  const handleReplyClick = (comentario: Comentario) => {
    setComentarioPadre({ id: comentario.id, usuario: comentario.usuario.nombreUsuario });
    // Enfocamos input si se desea (opcional)
  };

  const handleCancelReply = () => {
    setComentarioPadre(null);
    setNuevoTexto("");
  };

  // ... (handleSubmit logic igual, resumida aquí) ...
  const handleSubmit = async () => {
    if (!nuevoTexto.trim() || !token) return;

    if (comentarioEnEdicion) {
        // Lógica Editar
        try {
            const response = await fetch(`${BASE_URL}/api/Comentario/${comentarioEnEdicion.id}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ texto: nuevoTexto })
            });
            if(!response.ok) throw new Error("Error edit");
            
            // Update local simple
            const updateRec = (list: Comentario[]): Comentario[] => list.map(c => {
                if(c.id === comentarioEnEdicion.id) return { ...c, texto: nuevoTexto };
                if(c.respuestas) return { ...c, respuestas: updateRec(c.respuestas) };
                return c;
            });
            setComentarios(prev => updateRec(prev));
            setComentarioEnEdicion(null);
            setNuevoTexto("");
        } catch(e) { console.error(e); }
    } else {
        // Lógica Crear
        const payload = {
            texto: nuevoTexto,
            idReceta,
            idUsuario: currentUserId,
            idComentario: comentarioPadre?.id
        };
        try {
            const response = await fetch(`${BASE_URL}/api/Comentario`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error("Error post");
            const nueva: Comentario = await response.json();
            nueva.fecha = new Date(nueva.fecha);

            if (comentarioPadre) {
                const copy = [...comentarios];
                findAndAddReply(copy, nueva);
                setComentarios(copy);
            } else {
                setComentarios(prev => [...prev, nueva]);
            }
            setNuevoTexto("");
            setComentarioPadre(null);
            onComentarioAgregado(nueva);
        } catch (e) { console.error(e); }
    }
  };

  const handleDeleteRequest = (c: Comentario) => {
    setComentarioAEliminar(c);
    setConfirmOpen(true);
  };

  const markCommentAsDeleted = (comments: Comentario[], idToDelete: number): Comentario[] => {
      return comments.map(c => {
        if (c.id === idToDelete) return { ...c, texto: "Comentario eliminado" };
        if (c.respuestas) return { ...c, respuestas: markCommentAsDeleted(c.respuestas, idToDelete) };
        return c;
      });
  };

  const handleConfirmDelete = async () => {
      if(!comentarioAEliminar || !token) return;
      setEliminando(true);
      try {
          const res = await fetch(`${BASE_URL}/api/Comentario/${comentarioAEliminar.id}`, {
             method: "DELETE",
             headers: { 'Authorization': `Bearer ${token}` } 
          });
          if(!res.ok) throw new Error("Error delete");
          setComentarios(prev => markCommentAsDeleted(prev, comentarioAEliminar.id));
          setConfirmOpen(false);
      } catch(e) { console.error(e); setDeleteError("Error al eliminar"); }
      finally { setEliminando(false); }
  };

  const handleEditClick = (c: Comentario) => {
      setComentarioEnEdicion(c);
      setNuevoTexto(c.texto);
  };

  const handleLikeChange = (comentarioId: number, isLiked: boolean, newLikeCount: number) => {
    const updateLikesRecursively = (list: Comentario[]): Comentario[] => {
        return list.map(c => {
            if (c.id === comentarioId) {
                return { ...c, leGustaAlUsuario: isLiked, cantidadLikes: newLikeCount };
            }
            if (c.respuestas) {
                return { ...c, respuestas: updateLikesRecursively(c.respuestas) };
            }
            return c;
        });
    };
    setComentarios(prev => updateLikesRecursively(prev));
  };

  return (
    <Drawer 
        anchor="bottom" 
        open={open} 
        onClose={onClose} 
        sx={{ zIndex: (theme) => theme.zIndex.modal + 3 }}
        PaperProps={{
            sx: { height: '50vh', background: 'transparent' } // Altura reducida
        }}
    >
      {/* 3. APLICAR LOS HANDLERS AL CONTENEDOR PRINCIPAL */}
      <Box className="drawer-container">

        {/* Contenedor solo para la zona de arrastre */}
        <Box {...swipeHandlers} sx={{ cursor: 'grab' }}>
          <div className="drawer-handle-bar" />
          <Box className="drawer-header">
              <Typography variant="h6">Comentarios</Typography>
              <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', width: '90%', mx: 'auto', mt: 1.5 }} />
          </Box>
        </Box>

        {/* Lista scrollable */}
        <Box className="drawer-content">
          {cargandoComentarios ? (
             <Typography sx={{color:'white', textAlign:'center', mt:4}}>Cargando...</Typography>
          ) : errorComentarios ? (
             <Typography sx={{color:'white', textAlign:'center', mt:4}}>{errorComentarios}</Typography>
          ) : (
            <List sx={{ p: 0 }}>
              {comentarios.map((comentario) => (
                <ComentarioAnidado
                  key={comentario.id}
                  comentario={comentario}
                  handleReplyClick={handleReplyClick}
                  fotoPerfilLocal={fotoPerfilLocal}
                  onDeleteRequest={String(comentario.usuario?.id) === String(currentUserId) ? handleDeleteRequest : undefined}
                  onEditRequest={String(comentario.usuario?.id) === String(currentUserId) ? handleEditClick : undefined}
                  onLikeChange={handleLikeChange}
                />
              ))}
            </List>
          )}
        </Box>

        {/* Input Flotante (Capsula) */}
        <Box className="input-area-wrapper">
             {/* Feedback visual de reply/edit encima del input */}
            {(comentarioPadre || comentarioEnEdicion) && (
                <Box sx={{ pl: 2, mb: 1, display: 'flex', justifyContent: 'space-between', color: '#ccc' }}>
                    <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                        {comentarioEnEdicion ? "Editando comentario..." : `Respondiendo a ${comentarioPadre?.usuario}`}
                    </Typography>
                    <CloseIcon fontSize="small" onClick={() => { setComentarioPadre(null); setComentarioEnEdicion(null); setNuevoTexto(""); }} sx={{ cursor: 'pointer'}}/>
                </Box>
            )}

            <div className="comment-input-capsule">
                 {/* Avatar del usuario logueado dentro del input? La foto no lo muestra, pero es comun. La foto solo muestra texto. */}
                 <InputBase
                    fullWidth
                    placeholder="Dejar un comentario..."
                    value={nuevoTexto}
                    onChange={(e) => setNuevoTexto(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    className="comment-input-clean"
                 />
                 <IconButton 
                    onClick={handleSubmit} 
                    disabled={!nuevoTexto}
                    sx={{ 
                        color: 'white', 
                        bgcolor: nuevoTexto ? 'primary.main' : 'transparent',
                        width: 32, height: 32,
                        ml: 1
                    }}
                >
                    <SendIcon fontSize="small" />
                 </IconButton>
            </div>
        </Box>
      </Box>

      {/* Dialog de Confirmación (sin cambios visuales mayores, funcional) */}
      <Dialog 
        open={confirmOpen} 
        onClose={() => setConfirmOpen(false)}
        // Solución: Aumentar el zIndex para que aparezca sobre el Drawer
        sx={{ zIndex: (theme) => theme.zIndex.modal + 4 }}
      >
        <DialogTitle>Borrar comentario</DialogTitle>
        <DialogContent><DialogContentText>¿Confirmas eliminar este comentario?</DialogContentText></DialogContent>
        <DialogActions>
            <Button onClick={() => setConfirmOpen(false)}>Cancelar</Button>
            <Button onClick={handleConfirmDelete} color="error" autoFocus>Eliminar</Button>
        </DialogActions>
      </Dialog>

    </Drawer>
  );
};

export default DrawerComentarios;