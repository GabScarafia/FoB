import React, { createContext, useState, useEffect, useContext } from "react";
import type { ReactNode } from "react";

interface AuthData {
  id: number | null | undefined;
  token: string;
  expDate: string;
  nombre: string;
  email: string;
  roles: string[];
}

// Tipos para el contexto
interface AuthContextType {
  authData: AuthData | null;
  login: (authData: AuthData) => void;
  updateAuthData: (updates: Partial<AuthData>) => void;
  clearAuthData: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [authData, setAuthData] = useState<AuthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Efecto para cargar los datos de autenticación desde localStorage al inicio
  useEffect(() => {
    const authDataString = localStorage.getItem("authData");
    if (authDataString) {
      try {
        const storedAuthData: AuthData = JSON.parse(authDataString);
        setAuthData(storedAuthData);
      } catch (error) {
        console.error("Error parsing authData:", error);
        setAuthData(null);
      }
    } else {
      setAuthData(null);
    }
    setIsLoading(false);
  }, []);

  // Función para iniciar sesión (guardar datos y persistir)
  const login = (newAuthData: AuthData) => {
    localStorage.setItem("authData", JSON.stringify(newAuthData));
    setAuthData(newAuthData);
  };

  // Función para actualizar parcialmente los datos (ej: nombre, foto)
  const updateAuthData = (updates: Partial<AuthData>) => {
    setAuthData(prev => {
      if (!prev) return null;
        
      // Fusiona los datos anteriores con las actualizaciones, manteniendo el token si no se actualiza.
      const newAuthData = { ...prev, ...updates };
      localStorage.setItem("authData", JSON.stringify(newAuthData));
      return newAuthData;
    });
  };

  // Función para cerrar sesión
  const clearAuthData = () => {
    localStorage.removeItem("authData");
    setAuthData(null);
  };

  const value = { authData, login, updateAuthData, clearAuthData, isLoading };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
};