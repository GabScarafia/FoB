import type { Comentario } from 'components/DrawerComentarios';

export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  nombreUsuario: string;
  texto?: string;
  tiempo?: string;
  imagenUrl?: string;
  imagen?: string;
  isFollowing: boolean;
}

export interface RecetaType {
  id: number;
  autor: Usuario;
  fechaCreacion: string;
  tipoContenido: string;
  dificultad: string;
  imagenUrl: string;
  contentType: string;
  cantidadVotos: number;
  meGusta: boolean;
  noMeGusta: boolean;
  esFavorito: boolean;
  seguido: boolean;
  cantidadComentarios: number;
  titulo: string;
  descripcion: string;
  vistaPreviaComentarios?: Comentario[];
  tiempoPreparacion: string;
  ingredientes: Array<{ id: number; nombre: string; cantidad: number; unidadDeMedida: string; }>;
  etiquetas: Array<any>;
  pasos: Array<any>;
  desafioId?: number;
}
