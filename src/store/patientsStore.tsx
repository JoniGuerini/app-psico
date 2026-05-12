import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Paciente, StatusPaciente } from "../types/patient";
import { uid } from "../lib/format";
import { seedMockData } from "../lib/seed";
import {
  getSeedFlag,
  getStorageKey,
  type SessionMode,
} from "../lib/auth";
import { PatientsContext, type PatientsContextValue } from "./patientsContext";

const loadFromStorage = (storageKey: string): Paciente[] => {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Paciente[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const persist = (storageKey: string, list: Paciente[]) => {
  localStorage.setItem(storageKey, JSON.stringify(list));
};

export function PatientsProvider({
  children,
  mode,
}: {
  children: ReactNode;
  mode: SessionMode;
}) {
  const storageKey = getStorageKey(mode);
  const seedFlag = getSeedFlag(mode);

  const [patients, setPatients] = useState<Paciente[]>(() => {
    if (typeof window === "undefined") return [];
    let list = loadFromStorage(storageKey);
    if (seedFlag && !localStorage.getItem(seedFlag)) {
      list = seedMockData();
      persist(storageKey, list);
      localStorage.setItem(seedFlag, "1");
    }
    return list;
  });

  useEffect(() => {
    persist(storageKey, patients);
  }, [patients, storageKey]);

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

  const upsertPagamento = useCallback<PatientsContextValue["upsertPagamento"]>(
    (patientId, pagamento) => {
      setPatients((prev) => {
        const idx = prev.findIndex((p) => p.id === patientId);
        if (idx === -1) return prev;
        const paciente = prev[idx];
        const lista = paciente.pagamentos ?? [];
        const key = `${pagamento.data}-${pagamento.horario}`;
        const existingIdx = lista.findIndex(
          (p) => `${p.data}-${p.horario}` === key
        );
        const nextLista =
          existingIdx === -1
            ? [...lista, pagamento]
            : lista.map((p, i) =>
                i === existingIdx ? { ...p, ...pagamento, id: p.id } : p
              );
        const next = prev.slice();
        next[idx] = {
          ...paciente,
          pagamentos: nextLista,
          atualizadoEm: new Date().toISOString(),
        };
        return next;
      });
    },
    []
  );

  const removePagamento = useCallback<PatientsContextValue["removePagamento"]>(
    (patientId, pagamentoId) => {
      setPatients((prev) => {
        const idx = prev.findIndex((p) => p.id === patientId);
        if (idx === -1) return prev;
        const paciente = prev[idx];
        const lista = paciente.pagamentos ?? [];
        const nextLista = lista.filter((p) => p.id !== pagamentoId);
        if (nextLista.length === lista.length) return prev;
        const next = prev.slice();
        next[idx] = {
          ...paciente,
          pagamentos: nextLista,
          atualizadoEm: new Date().toISOString(),
        };
        return next;
      });
    },
    []
  );

  const value = useMemo<PatientsContextValue>(
    () => ({
      patients,
      getById,
      create,
      update,
      remove,
      toggleStatus,
      upsertPagamento,
      removePagamento,
    }),
    [
      patients,
      getById,
      create,
      update,
      remove,
      toggleStatus,
      upsertPagamento,
      removePagamento,
    ]
  );

  return (
    <PatientsContext.Provider value={value}>{children}</PatientsContext.Provider>
  );
}
