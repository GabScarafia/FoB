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

interface AuthContextType {
  authData: AuthData | null;
  login: (authData: AuthData) => void;
  clearAuthData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [authData, setAuthData] = useState<AuthData | null>(null);

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
  }, []);

  const login = (newAuthData: AuthData) => {
    localStorage.setItem("authData", JSON.stringify(newAuthData));
    setAuthData(newAuthData);
  };

  const clearAuthData = () => {
    localStorage.removeItem("authData");
    setAuthData(null);
  };

  const value = { authData, login, clearAuthData };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
};