// src/components/ImagenRebotante.tsx
import React, { useEffect, useRef, useState } from 'react';
import './ImagenRebotante.css';

interface ImagenRebotanteProps {
  imageSrc: string; // Prop para la ruta de la imagen
  size?: number; // Tamaño de la imagen en px (ej. 50)
  speed?: number; // Velocidad de la animación (ej. 2)
}

const ImagenRebotante: React.FC<ImagenRebotanteProps> = ({ imageSrc, size = 50, speed = 2 }) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [direction, setDirection] = useState({ dx: 1, dy: 1 }); // 1 para derecha/abajo, -1 para izquierda/arriba

  useEffect(() => {
    const bounce = () => {
      if (!imageRef.current) return;

      const img = imageRef.current;
      const containerWidth = window.innerWidth;
      const containerHeight = window.innerHeight;

      // Calcular la nueva posición
      let newX = position.x + direction.dx * speed;
      let newY = position.y + direction.dy * speed;

      let newDx = direction.dx;
      let newDy = direction.dy;

      // Rebotar en los bordes horizontales
      if (newX + size > containerWidth || newX < 0) {
        newDx *= -1; // Invertir dirección X
        newX = Math.max(0, Math.min(newX, containerWidth - size)); // se segura que no se salga del contenedor
      }

      // Rebotar en los bordes verticales
      if (newY + size > containerHeight || newY < 0) {
        newDy *= -1; // Invertir dirección Y
        newY = Math.max(0, Math.min(newY, containerHeight - size)); // se segura que no se salga del contenedor
      }

      setPosition({ x: newX, y: newY });
      setDirection({ dx: newDx, dy: newDy });
    };

    // animcaión
    let animationFrameId: number;
    const animate = () => {
      bounce();
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    // Limpieza al desmontar el componente
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [position, direction, size, speed]); // Dependencias del useEffect

  return (
    <img
      ref={imageRef}
      src={imageSrc}
      alt="Bouncing Image"
      className="imagen-rebotante"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    />
  );
};

export default ImagenRebotante;