// src/pages/Comentarios.tsx
import React, { useEffect, useState } from "react";

type Comentario = {
  id: number;
  texto: string;
  fecha: string;
  usuarioId: number;
  respuestaAComentarioId: number | null;
};

type ComentarioCreateDTO = {
  idReceta: number;
  texto: string;
  idComentario: number | null;
};

interface ComentariosProps {
  idReceta: number;
  token: string; // JWT si el endpoint lo requiere
}

const Comentarios: React.FC<ComentariosProps> = ({ idReceta, token }) => {
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [nuevoTexto, setNuevoTexto] = useState("");
  const [loading, setLoading] = useState(false);

  // Función para obtener los comentarios
  const fetchComentarios = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://localhost:62956/comentarios?idReceta=${idReceta}`,
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

  // Función para crear un comentario
  const crearComentario = async () => {
    if (!nuevoTexto.trim()) return;

    const payload: ComentarioCreateDTO = {
      idReceta,
      texto: nuevoTexto,
      idComentario: null, // aquí podrías poner el id del comentario padre si es respuesta
    };

    try {
      const response = await fetch("https://localhost:62956/comentarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Error al crear comentario");

      setNuevoTexto(""); // limpiar input
      fetchComentarios(); // recargar comentarios
    } catch (error) {
      console.error("Error al crear comentario:", error);
    }
  };

  useEffect(() => {
    fetchComentarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <h2>Comentarios</h2>
      {loading ? (
        <p>Cargando comentarios...</p>
      ) : comentarios.length === 0 ? (
        <p>No hay comentarios aún.</p>
      ) : (
        <ul>
          {comentarios.map((c) => (
            <li key={c.id}>
              <strong>Usuario {c.usuarioId}:</strong> {c.texto}{" "}
              <em>({new Date(c.fecha).toLocaleString()})</em>
            </li>
          ))}
        </ul>
      )}

      <div style={{ marginTop: "1rem" }}>
        <textarea
          placeholder="Escribe un comentario..."
          value={nuevoTexto}
          onChange={(e) => setNuevoTexto(e.target.value)}
        />
        <br />
        <button onClick={crearComentario}>Enviar</button>
      </div>
    </div>
  );
};

export default Comentarios;
