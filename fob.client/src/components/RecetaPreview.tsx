import React from 'react';
import './RecetaPreview.css'; // Crea este archivo CSS

interface Props {
  receta: {
    imagen: string;
    // ... otras propiedades que necesites
  };
  onClick: () => void;
}

const RecetaPreview: React.FC<Props> = ({ receta, onClick }) => {
  // Construye la URL de la imagen de la receta desde la cadena Base64
  const urlReceta = receta.imagen 
    ? `data:image/jpeg;base64,${receta.imagen}` 
    : 'https://via.placeholder.com/200';

  return (
    <div className="receta-preview-card" onClick={onClick}>
      <img src={urlReceta} alt="Receta en tendencia" className="receta-preview-imagen" />
      {/* Puedes agregar aquí un overlay para los tags o el logo de "Lobos por los tragos" */}
    </div>
  );
};

export default RecetaPreview;