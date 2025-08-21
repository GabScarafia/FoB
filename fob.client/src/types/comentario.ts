export interface ComentarioDTO {
  id: number;
  idReceta: number;
  texto: string;
  fechaCreacion: string;
  usuarioNombre?: string; // opcional si el backend lo devuelve
}

export interface ComentarioCreateDTO {
  idReceta: number;
  texto: string;
}
