import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Paciente, StatusPaciente } from "../types/patient";
import { SEED_FLAG, STORAGE_KEY } from "../lib/constants";
import { uid } from "../lib/format";
import { seedMockData } from "../lib/seed";
import { PatientsContext, type PatientsContextValue } from "./patientsContext";

const loadFromStorage = (): Paciente[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Paciente[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const persist = (list: Paciente[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
};

export function PatientsProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<Paciente[]>(() => {
    if (typeof window === "undefined") return [];
    let list = loadFromStorage();
    if (!localStorage.getItem(SEED_FLAG)) {
      list = seedMockData();
      persist(list);
      localStorage.setItem(SEED_FLAG, "1");
    }
    return list;
  });

  useEffect(() => {
    persist(patients);
  }, [patients]);

  const getById = useCallback(
    (id: string) => patients.find((p) => p.id === id),
    [patients]
  );

  const create = useCallback<PatientsContextValue["create"]>((data) => {
    const novo: Paciente = {
      ...data,
      id: uid(),
      criadoEm: new Date().toISOString(),
    };
    setPatients((prev) => [...prev, novo]);
    return novo;
  }, []);

  const update = useCallback<PatientsContextValue["update"]>((id, data) => {
    let updated: Paciente | undefined;
    setPatients((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx === -1) return prev;
      updated = {
        ...prev[idx],
        ...data,
        atualizadoEm: new Date().toISOString(),
      };
      const next = prev.slice();
      next[idx] = updated;
      return next;
    });
    return updated;
  }, []);

  const remove = useCallback<PatientsContextValue["remove"]>((id) => {
    setPatients((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const toggleStatus = useCallback<PatientsContextValue["toggleStatus"]>((id) => {
    let novoStatus: StatusPaciente | undefined;
    setPatients((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx === -1) return prev;
      novoStatus = prev[idx].status === "Ativo" ? "Inativo" : "Ativo";
      const next = prev.slice();
      next[idx] = {
        ...prev[idx],
        status: novoStatus,
        atualizadoEm: new Date().toISOString(),
      };
      return next;
    });
    return novoStatus;
  }, []);

  const value = useMemo<PatientsContextValue>(
    () => ({ patients, getById, create, update, remove, toggleStatus }),
    [patients, getById, create, update, remove, toggleStatus]
  );

  return (
    <PatientsContext.Provider value={value}>{children}</PatientsContext.Provider>
  );
}
