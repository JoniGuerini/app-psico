import { createContext } from "react";
import type { Paciente, PacienteInput, StatusPaciente } from "../types/patient";

export interface PatientsContextValue {
  patients: Paciente[];
  getById: (id: string) => Paciente | undefined;
  create: (data: PacienteInput) => Paciente;
  update: (id: string, data: PacienteInput) => Paciente | undefined;
  remove: (id: string) => void;
  toggleStatus: (id: string) => StatusPaciente | undefined;
}

export const PatientsContext = createContext<PatientsContextValue | null>(null);
