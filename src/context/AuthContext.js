"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { logoutUser } from "../services/auth.service";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ---------------- INIT FROM LOCAL STORAGE ---------------- */
  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    setLoading(false);
  }, []);

  /* ---------------- LOGIN ---------------- */
  const login = (userData) => {
    setUser(userData);
  };

  /* ---------------- LOGOUT ---------------- */
  const logout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      // Even if API fails, clear local
    }

    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
