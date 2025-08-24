import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactElement;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { authData } = useAuth();
  const isLoggedIn = !!authData?.email;

  if (!isLoggedIn) {
    return <Navigate to="/iniciar-sesion" replace />;
  }

  if (isLoggedIn) {
    return <Navigate to="/iniciar-sesion" replace />;
  }

  return children;
}
