import { useNavigate } from "react-router-dom";
import { PatientForm } from "../components/PatientForm";

export function CreatePatientPage() {
  const navigate = useNavigate();

  return (
    <div className="card">
      <div className="card-header">
        <h2>Novo Cadastro</h2>
        <p>
          Preencha os dados do paciente. Campos marcados com{" "}
          <span style={{ color: "var(--erro)" }}>*</span> são obrigatórios.
        </p>
      </div>

      <PatientForm
        mode="create"
        onSaved={() => navigate("/pacientes")}
        onCancel={() => navigate("/pacientes")}
        cancelLabel="Cancelar"
      />
    </div>
  );
}
