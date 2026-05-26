"use client";

import { createContext, useContext } from "react";
import type { Profile } from "@/types/domain";

type AuthContextType = {
  user: Profile | null;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
});

interface AuthProviderProps {
  children: React.ReactNode;
  user: Profile | null;
}

export function AuthProvider({
  children,
  user,
}: AuthProviderProps) {
  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}