"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import type { AuthUser } from "@/lib/domain/auth/types";

type AuthContextValue = {
  user: AuthUser;
  updateCurrentUser: (user: AuthUser) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  initialUser,
}: {
  children: ReactNode;
  initialUser: AuthUser;
}) {
  const [user, setUser] = useState(initialUser);
  const updateCurrentUser = useCallback((updatedUser: AuthUser) => {
    setUser(updatedUser);
  }, []);
  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "X-Dispatcher-Request": "same-origin" },
    });
    window.location.reload();
  }, []);
  const value = useMemo(() => ({ user, updateCurrentUser, logout }), [logout, updateCurrentUser, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("AuthProvider is required");

  return value;
}
