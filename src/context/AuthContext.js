"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { logoutUser } from "../services/auth.service";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewRole, setViewRole] = useState(null);

  /* ---------------- INIT FROM LOCAL STORAGE ---------------- */
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedViewRole = localStorage.getItem("viewRole");

    if (storedViewRole) {
      setViewRole(storedViewRole);
    }

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
    localStorage.removeItem("viewRole");

    setUser(null);
    setViewRole(null);
  };

  /* ---------------- SWITCH ROLE (Director) ---------------- */
  const switchUserRole = (newRole, originalRole) => {
    setUser((prev) => {
      const updated = {
        ...prev,
        role: newRole,
        originalRole: originalRole || prev.originalRole || prev.role,
      };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  };

  /* ---------------- RESTORE ROLE (Back to Director) ---------------- */
  const restoreUserRole = () => {
    setUser((prev) => {
      const updated = {
        ...prev,
        role: prev.originalRole || "director",
      };
      delete updated.originalRole;
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, viewRole, setViewRole, switchUserRole, restoreUserRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
