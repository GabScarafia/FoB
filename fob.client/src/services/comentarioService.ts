// src/services/comentarioService.ts
import { useAuth } from "../context/AuthContext";

const { authData } = useAuth(); 

export interface Comentario {
  id: number;
  texto: string;
  fecha: string;
}

export interface ComentarioCreateDTO {
  texto: string;
}

const API_URL = "https://localhost:5001/api/comentario"; // ajusta el puerto si tu backend usa otro

export const getComentarios = async (): Promise<Comentario[]> => {
  const response = await fetch(API_URL, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) throw new Error("Error al obtener comentarios");
  return response.json();
};

export const addComentario = async (comentario: ComentarioCreateDTO): Promise<Comentario> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      ...(authData?.token ? { "Authorization": `Bearer ${authData.token}` } : {}),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(comentario),
  });

  if (!response.ok) throw new Error("Error al crear comentario");
  return response.json();
};
