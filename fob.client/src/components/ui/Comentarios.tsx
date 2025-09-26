import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  IconButton,
  Modal,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

interface Comentario {
  id: number;
  texto: string;
  user_id: string;
  lead_id: number;
  parent_id: number | null;
  created_at: string;
  respuestas: Comentario[];
}

interface ComentariosProps {
  leadId: number;
}

const Comentarios: React.FC<ComentariosProps> = ({ leadId }) => {
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [nuevoComentario, setNuevoComentario] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [comentarioAEliminar, setComentarioAEliminar] = useState<number | null>(
    null
  );

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    setCurrentUserId(storedUserId);

    const fetchComentarios = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/api/comentarios/${leadId}/`
        );
        if (!response.ok) throw new Error("Error al obtener comentarios");
        const data = await response.json();
        setComentarios(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchComentarios();
  }, [leadId]);

  const handleAgregarComentario = async (
    parentId: number | null = null,
    textoPersonalizado?: string
  ) => {
    if (!nuevoComentario.trim() && !textoPersonalizado) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/comentarios/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          texto: textoPersonalizado || nuevoComentario,
          user_id: currentUserId,
          lead_id: leadId,
          parent_id: parentId,
        }),
      });

      if (!response.ok) throw new Error("Error al agregar comentario");
      const nuevo = await response.json();

      setComentarios((prev) =>
        parentId
          ? prev.map((comentario) =>
              comentario.id === parentId
                ? { ...comentario, respuestas: [...comentario.respuestas, nuevo] }
                : comentario
            )
          : [...prev, nuevo]
      );
      setNuevoComentario("");
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteClick = (comentarioId: number) => {
    setComentarioAEliminar(comentarioId);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!comentarioAEliminar) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8000/api/comentarios/${comentarioAEliminar}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Error al eliminar comentario");

      setComentarios((prev) =>
        prev.map((comentario) =>
          comentario.id === comentarioAEliminar
            ? { ...comentario, texto: "Comentario eliminado" }
            : comentario
        )
      );
    } catch (error) {
      console.error(error);
    } finally {
      setDeleteConfirmOpen(false);
      setComentarioAEliminar(null);
    }
  };

  const renderComentarios = (comentarios: Comentario[]) =>
    comentarios.map((comentario) => (
      <ComentarioItem
        key={comentario.id}
        comentario={comentario}
        currentUserId={currentUserId}
        handleDeleteClick={handleDeleteClick}
      />
    ));

  if (loading) return <CircularProgress />;

  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h6">Comentarios</Typography>
      {renderComentarios(comentarios)}
      <Box sx={{ display: "flex", gap: 1, marginTop: 2 }}>
        <TextField
          label="Escribe un comentario"
          fullWidth
          value={nuevoComentario}
          onChange={(e) => setNuevoComentario(e.target.value)}
        />
        <Button
          variant="contained"
          onClick={() => handleAgregarComentario()}
        >
          Agregar
        </Button>
      </Box>

      <Modal open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <Box
          sx={{
            backgroundColor: "white",
            padding: 4,
            maxWidth: 400,
            margin: "100px auto",
            borderRadius: 2,
            textAlign: "center",
          }}
        >
          <Typography variant="h6">
            ¿Seguro que deseas borrar este comentario?
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
            <Button
              variant="contained"
              color="error"
              onClick={handleConfirmDelete}
            >
              Sí, borrar
            </Button>
            <Button
              variant="outlined"
              sx={{ ml: 2 }}
              onClick={() => setDeleteConfirmOpen(false)}
            >
              Cancelar
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

interface ComentarioItemProps {
  comentario: Comentario;
  currentUserId: string | null;
  handleDeleteClick: (id: number) => void;
}

const ComentarioItem: React.FC<ComentarioItemProps> = ({
  comentario,
  currentUserId,
  handleDeleteClick,
}) => {
  return (
    <Box sx={{ marginLeft: comentario.parent_id ? 4 : 0, marginTop: 2 }}>
      <Typography variant="body2">
        {comentario.texto}
        {String(currentUserId) === String(comentario.user_id) &&
          comentario.texto !== "Comentario eliminado" && (
            <IconButton
              onClick={() => handleDeleteClick(comentario.id)}
              size="small"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
      </Typography>
      {comentario.respuestas.length > 0 &&
        comentario.respuestas.map((respuesta) => (
          <ComentarioItem
            key={respuesta.id}
            comentario={respuesta}
            currentUserId={currentUserId}
            handleDeleteClick={handleDeleteClick}
          />
        ))}
    </Box>
  );
};

export default Comentarios;
