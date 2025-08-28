// src/routes/ProtectedRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactElement;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { authData, isLoading } = useAuth(); // Agregamos isLoading para mayor seguridad
  const isLoggedIn = !!authData?.email;

  // Si aún está cargando el estado de autenticación, no hacer nada
  if (isLoading) {
    return null; 
  }

  // Lógica principal: si NO está logueado, redirige
  if (!isLoggedIn) {
    return <Navigate to="/iniciar-sesion" replace />;
  }

  // Si está logueado, permite el acceso a la ruta
  return children;
}