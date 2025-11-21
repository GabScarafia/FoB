import React from 'react';
import './RecetaPreview.css'; // Crea este archivo CSS
import { BASE_URL } from '../apiConfig';

interface Props {
  receta: {
    imagen?: string | null; // ahora puede ser URL o base64
    // ... otras propiedades que necesites
  };
  onClick: () => void;
}

const RecetaPreview: React.FC<Props> = ({ receta, onClick }) => {
  const imagen = receta.imagen ?? '';

  // Si es ruta relativa del API comienza con '/', la preparamos con BASE_URL
  const urlReceta = imagen
    ? (imagen.startsWith('/') ? `${BASE_URL}${imagen}` : (imagen.startsWith('data:') || imagen.startsWith('http') ? imagen : `data:image/jpeg;base64,${imagen}`))
    : 'https://via.placeholder.com/200';

  return (
    <div className="receta-preview-card" onClick={onClick}>
      <img src={urlReceta} alt="Receta en tendencia" className="receta-preview-imagen" />
      {/* Puedes agregar aquí un overlay para los tags o el logo de "Lobos por los tragos" */}
    </div>
  );
};

export default RecetaPreview;