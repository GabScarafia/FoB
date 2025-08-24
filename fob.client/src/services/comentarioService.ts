// src/services/comentarioService.ts
import { useAuth } from "../context/AuthContext";

export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  nombreUsuario: string;
  isFollowing: boolean;
  imagen?: string;
}

export interface Comentario {
  id: number;
  texto: string;
  fecha: string;
  autor: Usuario;
  hora: string;
  imagen: string;
}

export interface ComentarioCreateDTO {
  texto: string;
  idReceta: number;
}

const API_URL = "https://localhost:5001/api/comentarios";

export const useComentariosService = () => {
  const { authData } = useAuth();

  const getComentarios = async (idReceta: number): Promise<Comentario[]> => {
    const token = authData?.token;
    const response = await fetch(`${API_URL}/receta/${idReceta}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) throw new Error("Error al obtener comentarios");
    const data = await response.json();

    const comentariosMapeados = data.map((c: any) => ({
      id: c.id,
      texto: c.texto,
      fecha: c.fechaCreacion,
      hora: new Date(c.fechaCreacion).toLocaleString(),
      imagen: c.usuario.fotoUrl,
      autor: {
        id: c.usuario.id,
        nombre: c.usuario.nombre,
        apellido: c.usuario.apellido,
        nombreUsuario: c.usuario.nombreUsuario,
        isFollowing: c.usuario.isFollowing,
        imagen: c.usuario.fotoUrl,
      },
    }));
    return comentariosMapeados;
  };

  const addComentario = async (comentario: ComentarioCreateDTO): Promise<Comentario> => {
    const token = authData?.token;
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(comentario),
    });

    if (!response.ok) throw new Error("Error al crear comentario");

    const responseData = await response.json();
    const nuevoComentario: Comentario = {
      id: responseData.id,
      texto: responseData.texto,
      fecha: responseData.fechaCreacion,
      hora: new Date(responseData.fechaCreacion).toLocaleString(),
      imagen: responseData.usuario.fotoUrl,
      autor: {
        id: responseData.usuario.id,
        nombre: responseData.usuario.nombre,
        apellido: responseData.usuario.apellido,
        nombreUsuario: responseData.usuario.nombreUsuario,
        isFollowing: responseData.usuario.isFollowing,
        imagen: responseData.usuario.fotoUrl,
      },
    };

    return nuevoComentario;
  };

  return { getComentarios, addComentario };
};