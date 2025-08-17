import React, { createContext, useState, useEffect, useContext } from "react";
import type { ReactNode }  from "react";
interface AuthContextType {
  email: string | null;  
  login: (authData: { email: string }) => void;
  clearAuthData: () => void;
}
interface AuthContextType {
  email: string | null;
  clearAuthData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    // Esta función solo se encarga de leer localStorage al inicio.
    const authDataString = localStorage.getItem("authData");
    if (authDataString) {
      try {
        const authData = JSON.parse(authDataString);
        setEmail(authData.email || null);
      } catch (error) {
        console.error("Error parsing authData:", error);
        setEmail(null);
      }
    } else {
      setEmail(null);
    }
    
    // Aquí puedes dejar la suscripción al evento 'storage' para sincronizar con otras pestañas
    // si lo deseas, pero el problema de F5 se resuelve con el siguiente paso.
  }, []);

    const login = (authData: { email: string }) => {
    localStorage.setItem("authData", JSON.stringify(authData));
    setEmail(authData.email); // Actualiza el estado de React inmediatamente
  };

  // La función que actualiza el estado y el localStorage
  const clearAuthData = () => {
    localStorage.removeItem("authData");
    setEmail(null); // <-- ¡Este es el paso crucial!
  };

const value = { email, login, clearAuthData };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
};