// src/components/TerminosYCondicionesModal.tsx
import React from 'react';
import './TerminosYCondicionesModal.css';

interface TerminosYCondicionesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TerminosYCondicionesModal: React.FC<TerminosYCondicionesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>X</button>
        <h3>Términos y Condiciones de Uso</h3>
        <p>Bienvenido/a a nuestra aplicación. Al utilizar nuestros servicios, aceptas los siguientes términos y condiciones:</p>
        <ol>
          <li>**Aceptación de Términos:** El acceso y uso de la aplicación están sujetos a la aceptación de estos términos. Si no estás de acuerdo, no utilices la aplicación.</li>
          <li>**Uso Adecuado:** Te comprometes a utilizar la aplicación de manera responsable y legal, sin infringir los derechos de terceros ni realizar actividades ilícitas.</li>
          <li>**Privacidad:** Tu información personal será tratada de acuerdo con nuestra Política de Privacidad, la cual puedes consultar en [enlace a política de privacidad].</li>
          <li>**Contenido del Usuario:** Eres el único responsable del contenido que publiques en la aplicación. Nos reservamos el derecho de eliminar cualquier contenido que consideremos inapropiado.</li>
          <li>**Modificaciones:** Nos reservamos el derecho de modificar estos términos en cualquier momento. Las modificaciones entrarán en vigor al ser publicadas en la aplicación.</li>
          <li>**Limitación de Responsabilidad:** La aplicación se proporciona "tal cual". No garantizamos que sea ininterrumpida o libre de errores. No seremos responsables por daños derivados del uso de la aplicación.</li>
          <li>**Ley Aplicable:** Estos términos se rigen por las leyes de Argentina.</li>
        </ol>
        <p>Al continuar utilizando esta aplicación, confirmas que has leído, entendido y aceptado estos términos y condiciones.</p>
      </div>
    </div>
  );
};

export default TerminosYCondicionesModal;