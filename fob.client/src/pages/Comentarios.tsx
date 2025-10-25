// src/pages/Comentarios.tsx
import React, { useState, useEffect } from "react";
import { BASE_URL } from '../apiConfig';

interface Comentario {
  id: number;
  texto: string;
  recetaId: number;
  respuestaAComentarioId?: number;
  fecha: string;
}

interface NuevoComentario {
  texto: string;
  recetaId: number;
  respuestaAComentarioId?: number;
}

const ComentariosPage: React.FC = () => {
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [nuevoTexto, setNuevoTexto] = useState("");
  const recetaId = 1; // ejemplo, se puede pasar como prop o desde ruta

  useEffect(() => {
    const token = JSON.parse(localStorage.getItem("AuthData") || "{}")?.token;

    fetch(`${BASE_URL}/api/comentarios/${recetaId}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => setComentarios(data))
      .catch((err) => console.error(err));
  }, [recetaId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = JSON.parse(localStorage.getItem("AuthData") || "{}")?.token;

    const nuevo: NuevoComentario = {
      texto: nuevoTexto,
      recetaId,
    };

    try {
      const res = await fetch(`${BASE_URL}/api/comentarios`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(nuevo),
      });

      if (res.ok) {
        const created = await res.json();
        setComentarios([...comentarios, created]);
        setNuevoTexto("");
      } else {
        console.error("Error al crear comentario");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Comentarios de la receta {recetaId}</h2>
      <ul>
        {comentarios.map((c) => (
          <li key={c.id}>
            {c.texto} - <em>{new Date(c.fecha).toLocaleString()}</em>
          </li>
        ))}
      </ul>

      <form onSubmit={handleSubmit}>
        <textarea
          value={nuevoTexto}
          onChange={(e) => setNuevoTexto(e.target.value)}
          placeholder="Escribe un comentario..."
          required
          rows={3}
          style={{ width: "100%", marginBottom: "0.5rem" }}
        />
        <button type="submit">Enviar</button>
      </form>
    </div>
  );
};

export default ComentariosPage;
