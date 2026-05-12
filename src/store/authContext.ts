import { createContext } from "react";
import type { Session, SessionMode } from "../lib/auth";

export interface AuthContextValue {
  session: Session | null;
  signIn: (mode: SessionMode) => void;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
