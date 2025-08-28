// src/components/ui/Comentarios.tsx
import React, { useEffect, useState } from "react";
import { Box, Link, ListItem, ListItemAvatar, ListItemText, Typography, Avatar } from '@mui/material';
import ReplyIcon from '@mui/icons-material/Reply';

type UsuarioComentarioDTO = {
  nombre: string;
  apellido: string;
  nombreUsuario: string;
  imagen: string;
};

type Comentario = {
  id: number;
  texto: string;
  fecha: string;
  usuario: UsuarioComentarioDTO;
  respuestaAComentarioId: number | null;
  respuestas: Comentario[];
};

type ComentarioCreateDTO = {
  idReceta: number;
  texto: string;
  respuestaAComentarioId: number | null;
};


interface ComentariosProps {
  idReceta: number;
}

const API_BASE_URL = "https://localhost:62956/api";

const ComentarioItem: React.FC<{ comentario: Comentario; onReply: (id: number) => void }> = ({ comentario, onReply }) => {
  const handleReplyClick = () => {
    onReply(comentario.id);
  };

  return (
    <>
      <ListItem alignItems="flex-start" sx={{ marginLeft: comentario.respuestaAComentarioId ? "2rem" : "0" }}>
        <ListItemAvatar>
          <Avatar src={comentario.usuario.imagen} alt={comentario.usuario.nombreUsuario} />
        </ListItemAvatar>
        <ListItemText
          primary={
            <Typography variant="subtitle1" component="span">
              {comentario.usuario.nombreUsuario}: {comentario.texto}
            </Typography>
          }
          secondary={
            <React.Fragment>
              <Typography variant="body2" color="textSecondary" component="span">
                {new Date(comentario.fecha).toLocaleString()}
              </Typography>
              <Box component="span" sx={{ ml: 1 }}>
                <Link
                  component="button"
                  variant="body2"
                  onClick={handleReplyClick}
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
      </ListItem>
      {comentario.respuestas && comentario.respuestas.length > 0 && (
        <ul style={{ listStyleType: "none", paddingLeft: 0, marginTop: 0, width: '100%' }}>
          {comentario.respuestas.map(respuesta => (
            <ComentarioItem key={respuesta.id} comentario={respuesta} onReply={onReply} />
          ))}
        </ul>
      )}
    </>
  );
};

const Comentarios: React.FC<ComentariosProps> = ({ idReceta }) => {
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [nuevoTexto, setNuevoTexto] = useState("");
  const [loading, setLoading] = useState(false);
  const [idComentarioPadre, setIdComentarioPadre] = useState<number | null>(null);

  const token = JSON.parse(localStorage.getItem("AuthData") || "{}")?.token;

  const fetchComentarios = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/Comentario/receta/${idReceta}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      setComentarios(data);
    } catch (error) {
      console.error("Error al obtener comentarios:", error);
    } finally {
      setLoading(false);
    }
  };

  const crearComentario = async () => {
    if (!nuevoTexto.trim()) return;

    console.log("ID del comentario padre antes de enviar:", idComentarioPadre);

    // Aquí nos aseguramos de que el ID del comentario padre esté en el payload.
  const payload: ComentarioCreateDTO = {
    idReceta,
    texto: nuevoTexto,
    respuestaAComentarioId: idComentarioPadre,
  };

    
    // Para depurar, agrega un console.log aquí y verifica el valor de idComentarioPadre
    console.log("ID del comentario padre enviado:", idComentarioPadre);

    try {
      const response = await fetch(`${API_BASE_URL}/Comentario`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Error al crear comentario");

      const nuevoComentario: Comentario = await response.json();
      
      setComentarios(prev => {
        const addCommentRecursively = (comments: Comentario[], newComment: Comentario): Comentario[] => {
          return comments.map(c => {
            if (c.id === newComment.respuestaAComentarioId) {
              return {
                ...c,
                respuestas: [...(c.respuestas || []), newComment]
              };
            }
            if (c.respuestas && c.respuestas.length > 0) {
              return {
                ...c,
                respuestas: addCommentRecursively(c.respuestas, newComment)
              };
            }
            return c;
          });
        };

        if (idComentarioPadre) {
          return addCommentRecursively(prev, nuevoComentario);
        } else {
          return [...prev, nuevoComentario];
        }
      });
      
      setNuevoTexto("");
      setIdComentarioPadre(null);
    } catch (error) {
      console.error("Error al crear comentario:", error);
    }
  };

  useEffect(() => {
    fetchComentarios();
  }, [idReceta, token]);

  return (
    <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Comentarios</Typography>
      {loading ? (
        <Typography>Cargando comentarios...</Typography>
      ) : (
        <ul style={{ listStyleType: "none", padding: 0 }}>
          {comentarios.length === 0 ? (
            <Typography>No hay comentarios aún.</Typography>
          ) : (
            comentarios.map((c) => (
              <ComentarioItem key={c.id} comentario={c} onReply={setIdComentarioPadre} />
            ))
          )}
        </ul>
      )}

      <Box sx={{ mt: 3, border: '1px solid #ccc', p: 2, borderRadius: '4px' }}>
        <textarea
          placeholder={idComentarioPadre ? "Escribe tu respuesta..." : "Escribe un comentario..."}
          value={nuevoTexto}
          onChange={(e) => setNuevoTexto(e.target.value)}
          style={{ width: '100%', minHeight: '80px', border: 'none', resize: 'vertical' }}
        />
        <br />
        <button onClick={crearComentario}>
          {idComentarioPadre ? "Responder" : "Enviar"}
        </button>
      </Box>
    </Box>
  );
};

export default Comentarios;