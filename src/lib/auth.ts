export type SessionMode = "mock" | "guest";

export interface Session {
  mode: SessionMode;
  startedAt: string;
}

export const SESSION_STORAGE_KEY = "lume_session_v1";

/**
 * Storage keys e seed flags isolados por modo de sess\u00e3o.
 * Em produ\u00e7\u00e3o, isso seria substitu\u00eddo por um backend por usu\u00e1rio.
 */
export function getStorageKey(mode: SessionMode): string {
  return mode === "mock" ? "pacientes_v1" : "pacientes_guest_v1";
}

export function getSeedFlag(mode: SessionMode): string | null {
  return mode === "mock" ? "mock_seeded_v4" : null;
}

export function readSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    if (parsed?.mode === "mock" || parsed?.mode === "guest") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function writeSession(session: Session | null): void {
  if (typeof window === "undefined") return;
  if (session === null) {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export const SESSION_MODE_LABEL: Record<SessionMode, string> = {
  mock: "Modo demonstra\u00e7\u00e3o",
  guest: "Modo convidado",
};
