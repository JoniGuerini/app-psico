import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  readSession,
  writeSession,
  type Session,
  type SessionMode,
} from "../lib/auth";
import { AuthContext, type AuthContextValue } from "./authContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => readSession());

  const signIn = useCallback((mode: SessionMode) => {
    const next: Session = {
      mode,
      startedAt: new Date().toISOString(),
    };
    writeSession(next);
    setSession(next);
  }, []);

  const signOut = useCallback(() => {
    writeSession(null);
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ session, signIn, signOut }),
    [session, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
