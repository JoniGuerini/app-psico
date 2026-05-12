import { createContext } from "react";
import type {
  Paciente,
  PacienteInput,
  Pagamento,
  StatusPaciente,
} from "../types/patient";

export interface PatientsContextValue {
  patients: Paciente[];
  getById: (id: string) => Paciente | undefined;
  create: (data: PacienteInput) => Paciente;
  update: (id: string, data: PacienteInput) => Paciente | undefined;
  remove: (id: string) => void;
  toggleStatus: (id: string) => StatusPaciente | undefined;
  /** Upsert: identifica por `data + horario`; cria se não existir, atualiza senão. */
  upsertPagamento: (patientId: string, pagamento: Pagamento) => void;
  removePagamento: (patientId: string, pagamentoId: string) => void;
}

export const PatientsContext = createContext<PatientsContextValue | null>(null);
