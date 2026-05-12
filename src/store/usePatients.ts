import { useContext } from "react";
import { PatientsContext, type PatientsContextValue } from "./patientsContext";

export function usePatients(): PatientsContextValue {
  const ctx = useContext(PatientsContext);
  if (!ctx) {
    throw new Error("usePatients must be used within a PatientsProvider");
  }
  return ctx;
}
